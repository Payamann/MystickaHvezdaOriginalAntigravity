# Opravy z auditu — checkpoint 30. 10. 2026

Stav: lokální pracovní větev `codex/analytics-source-fix`; tento dokument nepotvrzuje nasazení.

- **M03:** `server/payment.js` zachovává `amount_paid: 0` pomocí `?? null` v příjmové i recovery události. Podepsaný webhookový test před opravou selhal: očekávána 0, získáno null. Po opravě prošlo 16 testů webhooku a příjmového souhrnu; lint prošel. Nulová faktura je samostatná kategorie, nikoli kladná tržba. Chybějící částka zůstává neznámá. Testy používají místní mocky, žádnou skutečnou platbu.
- **F03/F04:** horoskop zapisuje marker až po potvrzeném ID historie a váže ho na účet. Horoskop i koule chrání rozpracované odpovědi revizí a vlastníkem včetně A→B→A. Změna účtu maže předchozí výsledek a související akce; koule také historii otázek. Ukládání předává očekávaný účet. Selhání historie neskrývá hotovou odpověď.
- **F01:** odstraněno místní počítadlo a blokace tří anonymních odpovědí. Neodpovídaly serverové anonymní ukázce a kvótám účtu. Server nadále rozhoduje o dostupnosti; `REGISTRATION_REQUIRED` vede na bezplatnou registraci, nikoli do checkoutu. Starý localStorage čítač už přístup neovlivňuje. Číselný zůstatek se nezobrazuje, protože jej klient nemá ověřený.
- **F02 — dílčí:** náhradní text koule i horoskopu je výslovně označen v CS/SK/PL/EN a při uložení nese `fallback: true`. Serverová spotřeba kvóty není touto změnou přepsána: koule dosud započítává i náhradní odpověď, anonymní cookie také. Zbývá rozhodnout a ověřit případnou úpravu účtování náhradní odpovědi; celý F02 proto není uzavřený.
- **L01:** lokalizovaný natál vysvětluje všechny čtyři skutečné stupně přesnosti serveru: čas a rozpoznané pásmo, místní poledne, zadaný čas v UTC, poledne UTC. Nedostupný ascendent se nevykreslí. Výpočty se neměnily. Prošlo 12 scénářů ve třech jazycích a existující anglický test po doplnění reálného `houses.available` do fixture.

Ověření klientů: 34 testů v pěti sadách horoskopu, koule a anglických interakcí; dalších 12 scénářů přesnosti. ESLint změněných klientů prošel. Pro samotné úpravy textu nepřidáváme plošný audit webu.

Delegace: pomocník `gpt-6-astra` implementoval izolaci horoskopu a koule; hlavní agent zkontroloval diff a cílené testy. Žádné tvrzení o konkrétním úniku dat v produkci ani o obchodním zlepšení z těchto testů neplyne.

**B02:** návrat Osobní mapy po ověřené platbě a browser proof čte pouze navázanou objednávku (ID, session, produkt a typ). Vrací pouze stav doručení, nikoli jméno, otázku, e-mail nebo interní chybu. Rozlišuje přípravu, převzetí e-mailovou službou, vyčerpané pokusy a neznámý stav. Běžná opakovatelná chyba není terminální selhání. Obnova stavu neodesílá další nákupní událost; výpadek databáze nezneplatňuje již ověřenou platbu. Prošlo 25 serverových a 8 klientských testů, lint a kontrola wiring routy. Pomocník Astra implementoval tuto samostatnou část; hlavní agent zkontroloval diff a znovu ověřil klientskou sadu. Lokální socketové serverové testy vyžadovaly eskalaci kvůli sandbox EACCES; nevytvářely externí platbu ani e-mail.

Veřejné soubory horoskopu, koule, lokalizovaného natálu a Osobní mapy sestaveny stejným esbuild nastavením jako klasické vstupy projektu. Cache `mysticka-hvezda-05c85eb2de1f`; asset history zachovává 2793 verzí. Offline render existující překladové cache prošel bez volání AI. M03 uložen v commitu `dfe06427`.

Další krok: uložit ověřené klientské a doručovací změny; produkční stav ověřovat samostatně pro konkrétní vydání. Neuzavřené položky zůstávají v `web-todo.md`, zejména pokrytí nákupního měření, kvóta náhradních odpovědí a obsahové SEO příležitosti.
