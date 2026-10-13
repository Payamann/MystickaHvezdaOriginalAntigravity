# Návratová cesta po kartě dne — kontrola 13. 10. 2026

## Výsledek

Na `/tarot-karta-dne.html` byl ranní horoskopový odběr viditelný už v počátečním stavu `waiting`, před otočením karty. Nabídka tak předcházela slíbenému bezplatnému výsledku. Most je nyní skrytý atributem `hidden` a `js/tarot-karta-dne.js` jej zobrazí až v `revealCard()` po vykreslení karty. Stejnou změnu obsahuje načítaný `js/dist/tarot-karta-dne.js`. Zobrazení měří stávající observer `horoscope_bridge_viewed`, který skrytý element nezapočte, dokud se po odhalení nestane viditelným.

Upravený existující mock E2E scénář nyní ověřuje počáteční skrytí, otočení karty, zobrazení nabídky, chybovou odpověď API se zachováním e-mailu a znamení a následný mock úspěch. Nezakládá druhý widget.

## Ověřené stávající chování

- Formulář žádá e-mail a znamení, přičemž text popisuje denní ranní e-mail, bezplatnost a možnost odhlášení. Tlačítko „Chci ranní horoskop“ je výslovná akce k odběru; checkbox není použit.
- `POST /api/subscribe/horoscope` validuje e-mail a znamení, zapíše/aktivuje záznam v `horoscope_subscriptions` a vrátí `{ success: true }`. Úspěch znamená aktivní odběr v databázi; samo o sobě nepotvrzuje doručení e-mailu. Odeslání potvrzení běží neblokujícím způsobem a může selhat.
- Sdílený klient při chybě API nebo sítě obnoví tlačítko a zachová hodnoty formuláře. Při úspěchu skryje formulář přes lokální `mh_horoscope_subscribed` stav. Tento záznam je jen stav prohlížeče, není důkazem doručení ani pozdější návštěvy.
- Existují události `horoscope_bridge_viewed` a `horoscope_subscribe_submitted`; první je svázána se skutečnou viditelností. `MH_ANALYTICS.trackAction()` vede do `queueBackendEvent()`, která bez preference analytiky událost neposílá.
- Odhlášení je realizované přes token v odběrovém záznamu. GET odkaz zobrazí výsledek a deaktivuje aktivní odběr; POST endpoint podporuje one-click odhlášení bez přihlášení.
- Profilové uložení a sdílení karty zůstaly beze změny.

## Souhlas a hranice evidence

Souhlas s odběrem je vyjádřen tlačítkem a vedle něj je popsán druh a četnost e-mailu i možnost odhlášení. Tato kontrola nepotvrdila samostatný auditní záznam textu/verze souhlasu nebo zdroje formuláře. Stávající DB schéma obsahuje `subscribed_at`, ale žádná pole verze textu, způsobu či stránky původu. API je navíc sdílené mnoha stránkami; jeho kontrakt nebyl změněn. Bez migrace mimo rozsah nelze tvrdit, že se ukládá úplný důkaz toho, s jakým zněním a odkud člověk odběr potvrdil.

## Kontroly

- `node --check js/tarot-karta-dne.js`, `node --check js/dist/tarot-karta-dne.js` a `node --check tests/e2e/content-pages.spec.js` — prošly.
- `git diff --check` pro dotčené soubory — prošel.
- První sandboxové spuštění cíleného Playwright testu `tests/e2e/content-pages.spec.js` pro `chromium` i `mobile-chrome` nastartovalo server v `NODE_ENV=test`, `MOCK_SUPABASE=true`, `MOCK_AI=true`, ale runner přes 90 sekund nevydal výsledek; tyto běhy byly ručně přerušeny a samy o sobě nejsou pass.
- Následné cílené spuštění hlavním agentem mimo sandbox dokončilo stejný mock scénář pro `chromium` i `mobile-chrome`: **2 passed za 25,8 s**. To je finální výsledek ověření změněné cesty.
- `tests/e2e/newsletter-popup.spec.js` kontroluje jinou stránku (`horoskopy.html`) a neaktuální `#horoscope-subscribe-form`; není důkazem chování cesty po denní kartě.

## Rozsah

Změny jsou lokální v izolovaném checkoutu `release-20261012` na základu `12ba756f6b22db07c01ec35e44bb83a8dd55b80d`. Produkce nebyla kontrolována ani měněna; žádné skutečné e-maily nebo zákaznická data nebyly použity.
