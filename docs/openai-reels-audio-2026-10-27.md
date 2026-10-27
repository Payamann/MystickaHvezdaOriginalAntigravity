# Hlas Reels na OpenAI — 27. 10. 2026

Pavel výslovně schválil převod hlasu Reels z ElevenLabs na OpenAI, včetně změny dosavadního vlastního hlasu. Změna navazuje na lokální commit `8ad4a722` s migrací webových textů a překladů. Nejde o nasazení produkce ani aktivaci publikování.

## Volba rozhraní

Výchozí hlas je `marin`, model `gpt-realtime-2.1-mini`. Luna zůstává pro textové úlohy; hlasové výstupy vyžadují samostatný zvukový model. Používá se Realtime WebSocket a PCM audio uložené do WAV. Nevytváří se nová integrace na starých Speech API modelech: podle dokumentace OpenAI se mají vypnout 6. 1. 2027. Nový Realtime model nelze pouze vložit do `/audio/speech`.

Časování slov pro Daily Reel 2 používá OpenAI `whisper-1`, `verbose_json` a word timestamps. Je to přepis vytvořeného audia, nikoli služba forced alignment. Shoda se scénářem se musí ověřit; nesmí vzniknout titulky jiné věty jen proto, že API vrátilo nějaké časy. Přibližné titulky zůstávají výslovně označenou volbou. Starší `reel_factory.py` zachovává původní přibližné časování.

Režijní tagy a SSML pauzy ze starších scénářů nejsou syntaxí OpenAI audio API. Z mluveného textu se odstraní a přednes se řídí samostatnými pokyny. Přesná délka původních SSML pauz není garantovaná.

## Rozsah a provoz

Oba vstupy (`scripts/auto_daily_reel2_video.py` a `social-media-agent/reel_factory.py`) používají společný OpenAI audio adaptér. Převod nepřenáší původní klonovaný hlas ani automaticky neexportuje existující nahrávky do jiného účtu. Vlastní dodané audio lze dál použít jako soubor.

Lokální konfigurace používá pouze `OPENAI_API_KEY` a explicitní OpenAI audio volby. Žádné nové klíče, skutečné `.env`, produkční proměnné ani plánované úlohy se nemění. Síťové pokusy a délka výstupu jsou omezené; není automatický retry ani fallback k jinému poskytovateli. Dry-run nevyžaduje klíč a nesmí volat API.

Živé generování, poslech českého přednesu a přístup účtu k audio modelu nejsou zatím ověřené. Zkoušky používají mockovanou síť a syntetické audio. Žádné video nebylo publikováno.

## Primární zdroje

- [Text to speech a ukončení staršího Speech API](https://developers.openai.com/api/docs/guides/text-to-speech)
- [GPT-Realtime-2.1 Mini](https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini)
- [Realtime WebSocket](https://developers.openai.com/api/docs/guides/voice-websockets?voice-api=realtime)
- [Transcription API a časové značky slov](https://developers.openai.com/api/reference/python/resources/audio/subresources/transcriptions/methods/create)

## Ověření checkpointu

- 22 mockovaných testů prošlo při nezávislém spuštění hlavním agentem: dokončený PCM/WAV, identita odpovědi, serverová chyba, neúplná odpověď, timeout, odmítnutí nesouladu přepisu i časů, dry-run bez klíče/sítě a zákaz placeného generátoru v dry-run.
- Oba skutečné CLI vstupy prošly lokálním dry-run s testovací šablonou; nevzniklo audio ani video. Výstupní text neobsahuje režijní tagy. CLI help a kompilace čtyř zasažených Python modulů prošly.
- Exportované popisky obsahují označení AI hlasu při novém generování. Dodanému souboru se původ hlasu nevymýšlí. Daily Reel 2 exportuje `social_caption.txt`, druhý nástroj `facebook_caption.txt`.
- Kontrola aktivních Python skriptů a vzorové konfigurace nenašla ElevenLabs endpoint ani požadavek na jeho klíč/voice ID. Historické soubory a produkční tajemství se nemažou.

Delegace: Sol implementoval společný audio adaptér, oba vstupy a testy. Hlavní agent nezávisle spustil 22 testů i oba CLI dry-runy, zkontroloval kontrakt podle oficiální dokumentace a uložil rozhodnutí do existující paměti. Neopakovala se nesouvisející celá serverová sada.
