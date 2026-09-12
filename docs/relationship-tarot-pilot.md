# Osobní vztahový výklad — pilot

## Rozsah

Jeden osobní AI tarotový výklad jedné vztahové otázky za **149 Kč jednorázově**. Tři náhodně vybrané různé karty; česká souvislá interpretace, jeden praktický krok a tři otázky k zamyšlení. Doručení celého textu v e-mailu čitelném na mobilu. Bez registrace, předplatného nebo PDF závazku.

Vstupy jsou pouze otázka, doručovací e-mail a souhlas s okamžitým dodáním. Karty se losují na serveru při objednávce a ukládají k ní, opakované doručení je nemění. Zpracování používá stávající Anthropic vrstvu s limity a profilem `relationship_tarot`. Tento produkt má vlastní `ANTHROPIC_RELATIONSHIP_MODEL`, výchozí `claude-sonnet-4-6`; ostatní funkce model nemění. Požadujeme strukturovaný JSON s jednotlivými povinnými poli pro každou kartu a otázku, následně jej lokálně validujeme. Ukázka na stránce je redakční, výslovně označená jako modelová.

Vizuál používá pozadí `#050510`, fialové světlo, zlaté akcenty, logo a lokální písmo Cinzel ze stávající značky. Na přání zadavatele prodejní text zdůrazňuje spojení tarotové tradice s moderní technologií. FAQ stále jasně uvádí, že se text vytváří automaticky podle zadání; nabídka neslibuje ručně psanou konzultaci. Doručovací e-mail má tmavou hlavičku, tři skutečně vytažené karty, světlou plochu pro čtení a zvýrazněný praktický krok. Rozložení tvoří prezentační tabulky do 640 px s inline styly. Obrázky karet se převádějí z vlastního katalogu do malých JPEGů a posílají jako vložené CID přílohy; e-mail není závislý na externím načítání obrázků.

## Výchozí data a hypotéza

Search Console, 9. 6.–8. 9. 2026: 3 187 prokliků celkem, 1 293 na český tarot ano/ne, 285 na tarot na lásku. Nejde o unikátní uživatele ani o doložený zájem platit. Hypotéza: jednorázové pokračování vztahové otázky bude pro část těchto návštěvníků srozumitelnější než členství.

## Implementace a vypínač

- Stránka `/vztahovy-vyklad.html`, prozatím `noindex,follow`.
- API `/api/vztahovy-vyklad/product`, `/checkout`, `/checkout-result`.
- `RELATIONSHIP_TAROT_ENABLED=true` zapne objednávky i nabídky na dvou tarotových stránkách. Bez něj je jen náhled s vypnutou platbou. Dostupnost také vyžaduje Stripe, Anthropic a Resend klíče.
- Při vypnutí zůstává původní nabídka členství na ano/ne dostupná. Po zapnutí ji na výsledku nahrazuje jednorázový vztahový výklad. Bezplatný výsledek zůstává celý dostupný.
- Nový `productType` i `productId`: `relationship_tarot`. Částka 14900 haléřů je určena serverem. Žádný recurring plán ani nový Stripe katalogový produkt se předem nezakládá.
- Migrace `supabase/migrations/20260912101332_relationship_tarot_launch.sql` je aplikovaná v produkčním projektu `dybfmdtmmocrjbdfbxbb`. Rozšiřuje povolený typ objednávky a omezuje dvě interní AI účetní RPC na `service_role`.
- Stripe metadata a události neobsahují otázku. Dotaz a vygenerovaný výklad jsou v existující serverové tabulce s RLS. Formulář se krátkodobě obnovuje pouze ve stejném okně pomocí sessionStorage (platnost 30 minut); po ověřené platbě se odstraní.
- Návratová stránka ověřuje platbu podle náhodného HttpOnly cookie důkazu; samotný parametr `status=success` není potvrzení.
- Doručení spouští podepsaný webhook. Později potvrzené platby pokrývá `checkout.session.async_payment_succeeded` a existující reconciliation job. Výklad se před e-mailem uloží; opakované doručení používá stejný obsah a idempotency key Resendu. Stejný proces slučuje souběžné požadavky, mezi procesy rozhoduje podmíněný zápis uloženého výkladu.
- Nevkládá se obecný náhradní text při chybě AI. Selhání se uloží a řeší přes existující retry/operational alert mechanismus. Při vyčerpaném denním AI limitu může být nutný zásah podpory.

## Co se měří

Události v existujícím `funnel_events`: `one_time_offer_viewed` (skutečně viditelná nabídka na vstupní stránce), `one_time_product_cta_clicked`, `one_time_product_viewed`, `one_time_form_started`, `one_time_form_submitted`, `checkout_session_created`, `one_time_purchase_completed`, `one_time_reading_delivered`. Filtrovat `feature=relationship_tarot`, zdroje `tarot_yes_no_result`, `tarot_love_landing`, `relationship_tarot_page`.

K počtu skutečných nákupů používat unikátní `stripe_session_id` v `one_time_purchases` a kontrolu Stripe; události jsou počty událostí, ne návštěvníci, a mohou se opakovat. Při výpadku webhooku reconciliation potvrzuje a doručuje objednávku, ale společný stávající job nezapisuje stejné nákupní události; pro úplnost porovnat také doručené `one_time_order_inputs` a Stripe. Zpětná vazba přichází odpovědí na doručovací e-mail, není předstíranou anonymní automatickou metrikou.

Po 4 týdnech zhodnotit relevantní zobrazení nabídky, unikátní nákupy, náklady a skutečné odpovědi zákazníků. Deset nákupů je milník pro učení, nikoliv důkaz rentability. Při malém vzorku nerozhodovat podle samotného uplynutí času. Nezvyšovat propagaci, pokud zákazníci popisují výsledek jako obecný nebo neodpovídající zadání.

## Postup aktivace

1. Ověřit aplikovanou migraci a zachování RLS (hotovo, viz audit).
2. Ověřit testovací Stripe platbu a doručení do vlastní testovací schránky (hotovo, viz audit).
3. Spustit `npm run test:verify`, nasadit kód podle `railway-deploy-guard` a vyžadovat `DEPLOY OK` pro nasazovaný commit.
4. Zapnout `RELATIONSHIP_TAROT_ENABLED=true`, ověřit úspěšný Railway deploy a skutečné `/api/vztahovy-vyklad/product` i oba vstupy z tarotu. Při potížích přepínač vypnout; již zaplacené objednávky se dál doručují.

Produkční databázová migrace a konfigurace Stripe webhooku jsou hotové. Nasazení a skutečné zkušební doručení mají samostatné ověření níže; objednávky zapnout až po celé kontrole.

## Audit 12. 9. 2026

- Produkční Supabase: migrace rozšířila CHECK `product_type` o `relationship_tarot`. Zkušební INSERT v transakci s ROLLBACK prošel, neukládal testovací objednávku. RLS a zákaz přímého přístupu zůstávají. `one_time_purchases` má unikátní Stripe session ID, oba záznamové systémy (`one_time_purchases`, `funnel_events`) mají RLS. AI rozpočet a účetnictví mohou volat pouze serverové klíče, nikoliv veřejní a přihlášení uživatelé; oprávnění byla po migraci ověřena. [Supabase vysvětlení oprávnění RPC](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
- Railway: názvy proměnných potvrzují přítomnost Stripe, Resend, Anthropic, Supabase a APP_URL. Konektor jejich hodnoty skrývá, takže toto není ověření platnosti klíčů ani provozních limitů. Přepínač nového produktu v produkci zatím není.
- Živý Stripe účet `mystickahvezda.cz`: stávající endpoint `/webhook/stripe` původně nepřijímal mimo jiné změny a zrušení předplatného. Doplněny `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_action_required`, `checkout.session.expired`, `refund.created` a `checkout.session.async_payment_succeeded`; původních osm událostí zachováno. Následný GET potvrdil aktivní endpoint a všech 14 událostí. Nejde o zpětné přehrání dříve zmeškaných událostí.
- Kompletní `test:verify` prošlo i po dokončení e-mailové šablony: 80 serverových sad (750 testů), 14 frontendových sad (72 testů) a všechny statické kontroly. Cílená kontrola e-mailu zahrnuje skutečnou přípravu JPEGů a vazby mezi CID a přílohami. Mobilní a desktopová cesta prošla znovu v 10 E2E testech.
- Lint, kontrola kódování, AI limitů, struktury webu a sitemap prošly. Sitemap zachovává 906 indexovatelných URL; mění se jen datum úpravy dvou vstupních tarotových stránek. Pilot má `noindex`.
- Skutečná zkouška generování na smyšleném zadání odhalila problémy formátu a stylu staršího modelu. Výchozí Sonnet 4.6 s pevnými poli vrátil úplný validní výklad. Lokální ukázka je v `tmp_email_previews/relationship-tarot/sample.html`; nebyla odeslána zákazníkovi. Jedna ukázka není důkaz spolehlivosti všech budoucích výkladů.
- Railway logy potvrdily běh reconciliation jobu každých 10 minut. Lokální testovací aplikace běží s testovacím Stripe klíčem, skutečným generováním a Resendem, ale izolovanou paměťovou databází a vypnutými ostatními úlohami.
- Sdílený AI rozpočet: 5.–12. 9. databáze evidovala 2–18 rezervovaných požadavků denně, oproti výchozímu limitu 120. Jde o aktuální kontrolu kapacity, nikoliv rezervaci kapacity pro budoucí objednávky.
- Testovací Stripe Checkout za 149 Kč byl dokončen veřejnou testovací kartou, přijal jej skutečný podepsaný webhook (HTTP 200), spustilo se skutečné generování a Resend odeslal výklad. Izolovaná databáze zaznamenala právě jeden nákup a doručenou objednávku. Návratová stránka ověřila platbu přes cookie důkaz. Provozovatel potvrdil přijetí a čitelnost e-mailu ve své schránce. Nebyla stržena skutečná platba ani použita zákaznická adresa.
- Po zpětné vazbě z Gmailu byla přepracována grafika a stavba e-mailu. Nová ukázka má ověřený desktopový i mobilní náhled a byla úspěšně odeslána provozovateli. [Vložené obrázky podle Resendu](https://resend.com/docs/dashboard/emails/embed-inline-images), [podporované styly Gmailu](https://developers.google.com/workspace/gmail/design/css).
- Nasazení a aktivace se ověřují samostatně pro konkrétní Git commit postupem výše; tento audit sám o sobě není potvrzením běžící produkční verze.
