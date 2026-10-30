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

## Navazující obsahový krok

Klientské a doručovací změny uloženy v `ed6627c2`. Kompletní `scripts/build-js.mjs` prošel včetně offline sestavení překladové cache. Dva nesouvisející, nedeterministicky přepsané bundly (`astro-map`, `relationship-tarot-bridge`) byly vráceny; žádný jejich zdroj se neměnil.

**S02:** andělské FAQ už neslibuje ochranu nebeskou silou a numerologické FAQ nepřisuzuje číslu léčivý dar. Změněny vždy obě podoby — viditelný text i JSON-LD; syntaktická a obsahová shoda potvrzena parserem. Ve statických párových stránkách odstraněna nepodložená procenta a ukazatel skóre, upraven slib „přesnějšího výpočtu“. Čtyři dříve redakčně upravené úvody zůstaly zachované. Všech 144 stránek má platné JSON-LD, zachovaný canonical a jediný H1; opakované spuštění aktualizačního skriptu nemění obsah. Skript zohledňuje již odstraněnou legacy složku `kompatibilita` a ostatní I/O chyby nezamlčuje. Není to plošná revize veškerého textu těchto stránek.

**L02:** do jazykového řádku české homepage doplněn English → `/en/`. Cíl existuje a má odpovídající jazyk, canonical i hreflang.

Omezení: pokus o lokální vizuální náhled `127.0.0.1:8188/partnerska-shoda/aries-taurus.html` v IAB skončil `ERR_CONNECTION_TIMED_OUT`. Kontrola nového rozložení v prohlížeči proto není hotová. Žádná změna firewallu, zabezpečení ani veřejné zpřístupnění lokálního serveru nebyly provedeny. Tyto obsahové změny zůstávají lokální a nejsou označeny jako produkční vydání.

## Pokračování: uzavření náhledu a kvóty

Obsahové změny výše jsou v `f6e76f52`. Dřívější omezení náhledu bylo vyřešeno spuštěním dočasného statického serveru s povoleným lokálním socketem pouze na `127.0.0.1:8188`. IAB pak úspěšně zobrazil upravenou stránku Beran–Býk. Desktop i mobil (390×844) byly vizuálně prohlédnuté; text a obsah jsou čitelné, `innerWidth=390` a šířka dokumentu 382 px, bez horizontálního přetékání. CTA vedlo na `partnerska-shoda.html?source=seo_partner_pair&feature=compatibility&pair=aries-taurus#form` se zobrazeným formulářem. Žádný astrologický výpočet nebyl odeslán. Dočasná velikost prohlížeče obnovena a karta zavřena. S02 je tím připraveno lokálně; nejde o vizuální průchod všech 144 obsahově odlišných stránek.

**F02 dokončení:** v kouli obecná náhradní odpověď již nespotřebuje anonymní osobní ukázku a rezervace kvóty účtu se uvolňuje. První regresní běh doložil obě chyby: fallback nastavoval `mh_cb_free_uses=1` a čtvrtý fallback účtu vracel 402. Po opravě prošlo 24 testů fallbacků a anonymního gate, včetně tří běžných osobních odpovědí a odmítnutí čtvrté. Další cílený test potvrdil dva pokusy o release při chybě DB a zachování započtené rezervace, pokud nelze uvolnění potvrdit. AI/rate/cost ochrany ani kvóta běžných odpovědí se neobcházejí. Horoskop nemá stejnou denní rezervaci; jeho omezení AI/rate zůstává. ESLint prošel. Veškerá generace a databáze v těchto testech jsou mockované.

**M02 analýza pokrytí:** samostatný [dokument](purchase-measurement-coverage-2026-10-30.md) potvrzuje existující purchase pro vztahový produkt, Osobní mapu a placený checkout členství. Rozlišuje proof, skutečnou částku, ID `cs_`/`pi_`/`in_`, souhlas, návrat do prohlížeče a backendové obnovy. Nezavádí další producer. Read-only zdrojovou kontrolu provedl pomocník Astra; hlavní agent dokument zkontroloval. Živý rozdíl GA a Stripe zůstává nevysvětlen bez průniku transakcí za shodné období; absence browser eventu sama neprokazuje nezaplacenou objednávku.
