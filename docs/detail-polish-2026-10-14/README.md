# Jemné detaily · 14. 10. 2026

Lokální kandidát `.codex-tmp/release-20261012`, výchozí commit `ecd4bd69`. Nenahráváno na produkci.

## Dokončeno

- Přihlášení: vlastní zlatý SVG symbol; zobrazení hesla vycentrované vůči vstupu.
- Profil: společné symboly statistik, záložek, výchozího avataru a prázdných/chybových stavů. Osobní avatar i načítání dat zachovány.
- Navigace: odstraněn překryv šipek; odkaz na profil skryt před ověřením přihlášení pomocí stejného `hidden` kontraktu, který používá auth-client.
- Slovníkové detaily: navy čtecí plocha, decentní zlatý rámeček a štítky podle atlasového stylu.
- Sprite rozšířen z 51 na 55 symbolů; sestavené JS, service worker a archiv verzí aktualizovány.

## Ověření a hranice

Ruční náhled kandidáta: desktop 1280 a 1024, mobil 390. Mobilní menu lze otevřít/zavřít a rozbalit Astrologii; profilový odkaz hosta zůstává skryt. Na mobilním přihlášení scrollWidth 382 při viewportu 390. Heslo lze přepnout text/password; tlačítko a pole mají společný střed. Nebyly zadány přihlašovací údaje ani vytvořen účet. Profilové screenshoty jsou výslovně označené modely skutečných komponent, nejsou ověřením účtu zákazníka. Zdrojové JS prošly syntax check a build.

Změny bezpečně sloučeny do pracovního kořene proti výchozí verzi. Tři konflikty vyřešeny jednotlivě, přirozené tykání z kořene zachováno. Kořen obsahuje další dřívější změny, proto nejde o kopii kandidáta. Kandidát drží 861, kořen 957 obsahově adresovaných verzí JS/CSS.

Pomocník gpt-5.6-luna/medium provedl omezený souborový průzkum. Dva původní podezřelé motivy (globální mlhovina a symboly znamení) nebyly označeny za chybu bez kontroly přepisujících stylů a JS. Následný celkový audit funkcí a zaměření je samostatný krok v `docs/product-function-review-2026-10-14/`.
