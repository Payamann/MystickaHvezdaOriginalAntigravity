import base64
import importlib.util
import json
import sys
import wave
from pathlib import Path
from unittest.mock import Mock

import pytest

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
import openai_reel_audio as audio


class Socket:
    def __init__(self, events):
        self.events = iter(events)
        self.sent = []
        self.closed = False
    def send(self, data): self.sent.append(json.loads(data))
    def recv(self):
        event = next(self.events)
        if isinstance(event, Exception): raise event
        return json.dumps(event)
    def settimeout(self, value): pass
    def close(self): self.closed = True


def connect(monkeypatch, events):
    import websocket
    socket = Socket(events)
    factory = Mock(return_value=socket)
    monkeypatch.setattr(websocket, 'create_connection', factory)
    monkeypatch.setenv('OPENAI_API_KEY', 'test-placeholder')
    return socket, factory


def success():
    return [{'type': 'session.created'}, {'type': 'session.updated'},
            {'type': 'response.created', 'response': {'id': 'resp_1'}},
            {'type': 'response.output_audio.delta', 'response_id': 'resp_1', 'delta': base64.b64encode(b'\0\0' * 24).decode()},
            {'type': 'response.done', 'response': {'status': 'completed', 'id': 'resp_1'}}]


def test_realtime_pcm_wav_and_ack(monkeypatch, tmp_path):
    socket, factory = connect(monkeypatch, success())
    path = tmp_path / 'voice.wav'
    audio.synthesize_narration('Ahoj světe.', path)
    with wave.open(str(path)) as wav:
        assert (wav.getframerate(), wav.getnchannels(), wav.getsampwidth(), wav.getnframes()) == (24000, 1, 2, 24)
    assert socket.closed
    assert [e['type'] for e in socket.sent] == ['session.update', 'response.create']
    assert socket.sent[0]['session']['audio']['output']['voice'] == 'marin'
    assert socket.sent[1]['response']['max_output_tokens'] == 4096
    assert 'gpt-realtime-2.1-mini' in factory.call_args.args[0]
    factory.assert_called_once()


@pytest.mark.parametrize('events', [
    [{'type': 'error'}],
    [{'type': 'session.updated'}, {'type': 'response.done', 'response': {'status': 'incomplete'}}],
    [{'type': 'session.updated'}, {'type': 'response.done', 'response': {'status': 'completed', 'id': 'resp_1'}}],
    [TimeoutError('socket deadline')],
    [{'type': 'session.updated'}, {'type': 'response.output_audio.delta', 'delta': 'bad!'}],
])
def test_realtime_failure_no_partial_or_retry(monkeypatch, tmp_path, events):
    socket, factory = connect(monkeypatch, events)
    path = tmp_path / 'voice.wav'
    with pytest.raises(Exception): audio.synthesize_narration('Ahoj.', path)
    assert not path.exists()
    assert socket.closed
    factory.assert_called_once()


def test_dryrun_without_key_or_network(monkeypatch, tmp_path):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    monkeypatch.setattr(audio, '_key', Mock(side_effect=AssertionError('credentials loaded')))
    audio.synthesize_narration('Ahoj.', tmp_path / 'voice.wav', dry_run=True)
    assert not list(tmp_path.iterdir())


def test_total_deadline(monkeypatch, tmp_path):
    socket, factory = connect(monkeypatch, [])
    clock = iter([0, 181])
    monkeypatch.setattr(audio.time, 'monotonic', lambda: next(clock))
    with pytest.raises(TimeoutError): audio.synthesize_narration('Ahoj.', tmp_path / 'a.wav')
    assert socket.closed


def test_directions_not_spoken():
    text, instructions = audio.prepare_narration('[warm] Ahoj. <break time="1s"/> [soft] Světe.')
    assert text == 'Ahoj. Světe.'
    assert 'warm; soft' in instructions
    assert '[' not in text and '<break' not in text


def payload():
    return {'text': 'Ahoj, světe!', 'words': [{'word': 'Ahoj', 'start': 0., 'end': .5},
                                            {'word': 'světe', 'start': .6, 'end': 1.}]}


def test_transcribe_request_and_validation(monkeypatch, tmp_path):
    monkeypatch.setenv('OPENAI_API_KEY', 'placeholder')
    post = Mock(return_value=Mock(json=Mock(return_value=payload())))
    monkeypatch.setattr(audio.requests, 'post', post)
    src = tmp_path / 'in.wav'; src.write_bytes(b'fake-local')
    out = tmp_path / 'words.json'
    result = audio.transcribe_word_timing(src, 'Ahoj světe.', out, duration=1.)
    assert result['words'][0]['text'] == 'Ahoj'
    assert post.call_args.kwargs['data'] == {'model': 'whisper-1', 'response_format': 'verbose_json',
                                           'timestamp_granularities[]': 'word', 'language': 'cs'}
    post.assert_called_once()
    assert out.exists()


@pytest.mark.parametrize('change', ['text', 'words', 'nan', 'overlap', 'outside', 'empty'])
def test_bad_transcription_refused(change):
    data = payload()
    if change == 'text': data['text'] = 'Jiný text'
    if change == 'words': data['words'][0]['word'] = 'Jiný'
    if change == 'nan': data['words'][0]['start'] = float('nan')
    if change == 'overlap': data['words'][1]['start'] = .4
    if change == 'outside': data['words'][1]['end'] = 9
    if change == 'empty': data['words'] = []
    with pytest.raises(ValueError): audio.validate_word_timing(data, 'Ahoj světe.', duration=1.)


def test_http_error_not_retried_or_saved(monkeypatch, tmp_path):
    monkeypatch.setenv('OPENAI_API_KEY', 'placeholder')
    post = Mock(return_value=Mock(raise_for_status=Mock(side_effect=RuntimeError('HTTP 429'))))
    monkeypatch.setattr(audio.requests, 'post', post)
    src = tmp_path / 'in.wav'; src.write_bytes(b'local')
    out = tmp_path / 'words.json'
    with pytest.raises(RuntimeError): audio.transcribe_word_timing(src, 'Ahoj.', out, duration=1)
    post.assert_called_once()
    assert not out.exists()

def load_entry(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize('entry', ['daily', 'factory'])
def test_entry_dryrun_no_credentials_or_network(monkeypatch, tmp_path, entry):
    monkeypatch.delenv('OPENAI_API_KEY', raising=False)
    monkeypatch.setattr(audio.requests, 'post', Mock(side_effect=AssertionError('network')))
    import websocket
    monkeypatch.setattr(websocket, 'create_connection', Mock(side_effect=AssertionError('network')))
    if entry == 'daily':
        module = load_entry('reel_daily_test', SCRIPTS / 'auto_daily_reel2_video.py')
        src = tmp_path / 'script.json'
        src.write_text(json.dumps({'date': '2026-10-27', 'sign': 'Lev', 'outputs': {
            'voiceover': '[warm] Ahoj světe.', 'facebook_description': 'Text příspěvku.'}}), encoding='utf-8')
        argv = ['daily', '--script-json', str(src), '--out-root', str(tmp_path / 'out'), '--dry-run']
        monkeypatch.setattr(module, 'find_template_video', lambda *a: tmp_path / 'base.mp4')
        monkeypatch.setattr(module, 'ffprobe_has_audio', Mock(side_effect=AssertionError('ffprobe')))
    else:
        module = load_entry('reel_factory_test', SCRIPTS.parent / 'social-media-agent' / 'reel_factory.py')
        monkeypatch.setattr(module, 'OUTPUT_ROOT', tmp_path / 'out')
        argv = ['factory', '--base-video', str(tmp_path / 'base.mp4'), '--dry-run']
    monkeypatch.setattr(module, 'load_env', lambda: None)
    monkeypatch.setattr(sys, 'argv', argv)
    assert module.main() == 0
    metadata = list((tmp_path / 'out').rglob('*metadata.json'))
    assert len(metadata) == 1
    data = json.loads(metadata[0].read_text(encoding='utf-8'))
    assert data['voice'] == 'marin' and data['audio_model'] == audio.DEFAULT_MODEL
    assert not list((tmp_path / 'out').rglob('*.wav'))


def test_unexpected_response_rejected(monkeypatch, tmp_path):
    events = success()
    events[3]['response_id'] = 'other'
    socket, _ = connect(monkeypatch, events)
    with pytest.raises(RuntimeError, match='response stream'):
        audio.synthesize_narration('Ahoj.', tmp_path / 'voice.wav')
    assert socket.closed


def test_transcript_mismatch_not_saved(monkeypatch, tmp_path):
    monkeypatch.setenv('OPENAI_API_KEY', 'placeholder')
    monkeypatch.setattr(audio.requests, 'post', Mock(return_value=Mock(json=Mock(return_value=payload()))))
    src = tmp_path / 'in.mp3'; src.write_bytes(b'local')
    out = tmp_path / 'words.json'
    with pytest.raises(ValueError): audio.transcribe_word_timing(src, 'Jiný text.', out, duration=1)
    assert not out.exists()


def test_dryrun_rejects_generator(monkeypatch):
    module = load_entry('reel_daily_guard_test', SCRIPTS / 'auto_daily_reel2_video.py')
    monkeypatch.setattr(module, 'load_env', lambda: None)
    monkeypatch.setattr(module, 'run_daily_reel2_generator', Mock(side_effect=AssertionError('paid generation')))
    monkeypatch.setattr(sys, 'argv', ['daily', '--date', '2026-10-27', '--run-generator', '--dry-run'])
    with pytest.raises(SystemExit, match='cannot be combined'): module.main()
