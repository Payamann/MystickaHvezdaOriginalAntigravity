# Partnerská shoda — pravdivé chyby výpočtu, 28. 10. 2026

## Rozsah

Klient js/synastry.js už při chybě nebo neplatné odpovědi výpočtu nepoužívá náhradní procenta odvozená z hashování jmen a dat. Výsledek vyžaduje pět číselných, konečných hodnot v rozsahu 0–100 ze serveru. Výpočet na serveru, ceny, přístupy ani AI model se nemění.

Každý nový pokus skryje předchozí výsledek a navazující nabídku, odstraní tlačítko sdílení a vymaže jeho data, zastaví animace skóre. Chyba zachová vstupy, oznámí neúspěch a znovu povolí tlačítko. Pokud selže pouze slovní výklad po platném výpočtu, skutečné skóre zůstane s informací o nedostupnosti výkladu; nevytváří se náhradní hodnotící verdikt. Animace procent končí i pro desetinné hodnoty.

## Ověření

Syntaxe, cílený ESLint a diff check prošly. Pět cílených Chromium E2E na skutečném sestaveném skriptu prošlo (45,8 s): běžný výpočet s časem/místem, výpadek a úspěšný retry, chybějící/neplatná skóre, úspěch následovaný chybou včetně neplatnosti starého tlačítka sdílení, nedostupný slovní výklad při platném skóre.

Mock server NODE_ENV=test, MOCK_AI/MOCK_SUPABASE; žádná živá AI, platba ani zákaznický e-mail. Pokus o test původního sestavení se zastavil před spuštěním testů, protože první lokální server nebyl zdravý; netvrdí se reprodukce selhávajícího assertionu. Následný server a cílené testy fungovaly.

Sol připravil pouze regresní scénáře, hlavní agent upravil zdroj, sestavil a ověřil výsledek. Nesouvisející generované odchylky byly odstraněny, historie veřejných assetů aktualizována. Toto je checkpoint před nasazením; produkční stav se ověřuje samostatně.
