import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const source = fs.readFileSync(new URL('../../js/mentor.js', import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
    const messages = [];
    const window = { Auth: { user: { id: 'a' }, isLoggedIn() { return Boolean(this.user); }, isPremium: () => false } };
    const fetch = jest.fn(async () => ({ ok: true, json: async () => ({ success: true, history: [] }) }));
    const input = { value: '', rows: 1 };
    const context = vm.createContext({ window, fetch, input, messages, console, API_CONFIG: { BASE_URL: '/api' },
        document: { addEventListener() {} }, sessionStorage: { removeItem() {}, getItem() { return null; } } });
    vm.runInContext(source + `
        chatInput = input; sendBtn = {}; typingIndicator = {};
        messagesContainer = { querySelectorAll: () => messages.map(() => ({ remove() { messages.shift(); } })) };
        mentorHistoryStatus = {}; showTyping = () => {}; scrollToBottom = () => {};
        addMessage = (text) => messages.push(text); syncMentorAccount();`, context);
    return { window, fetch, input, messages,
        run: code => vm.runInContext(code, context),
        change: id => { window.Auth.user = { id }; vm.runInContext('syncMentorAccount()', context); } };
}

test.each(['history', 'chat', 'csrf'])('mentor ignores A → B → A stale %s completion', async stage => {
    const app = fixture();
    await flush();
    let resolve;
    const pending = new Promise(done => { resolve = done; });
    app.input.value = 'Private old question';
    let request;
    if (stage === 'history') {
        app.fetch.mockImplementationOnce(() => pending);
        request = app.run('loadHistory(mentorOwner, mentorRevision)');
    } else {
        if (stage === 'csrf') app.window.getCSRFToken = () => pending;
        else app.fetch.mockImplementationOnce(() => pending);
        request = app.run('sendMessage()');
    }
    await flush();
    app.change('b'); app.change('a');
    await flush();
    const count = app.fetch.mock.calls.length;
    resolve(stage === 'csrf' ? 'token' : { ok: true, json: async () => ({ success: true, history: [{ role: 'mentor', content: 'Private old history' }], reply: 'Private old reply' }) });
    await request;
    expect(app.messages).toEqual([]);
    expect(app.input.value).toBe('');
    if (stage === 'csrf') expect(app.fetch.mock.calls.length).toBe(count);
});

test('mentor keeps completed reply when persistence fails and sends the owner', async () => {
    const app = fixture();
    await flush();
    app.fetch.mockResolvedValue({ ok: true, json: async () => ({ reply: 'Completed reply', historySaved: false }) });
    app.input.value = 'Question';
    await app.run('sendMessage()');
    expect(app.messages).toEqual(['Question', 'Completed reply']);
    expect(app.run('mentorHistoryStatus.textContent')).toContain('nepodařilo se ji uložit');
    expect(JSON.parse(app.fetch.mock.calls.at(-1)[1].body).expectedUserId).toBe('a');
});
