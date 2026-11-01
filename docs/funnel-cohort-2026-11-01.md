# Propojení vztahové nabídky a objednávky

Kontrola 1. 11. 2026, produkční Supabase. Období 29. 9. 2026 00:00 Europe/Prague až 27. 10. 2026 00:00 Europe/Prague (včetně přechodu UTC+02 → UTC+01). Stejné datumové rozmezí jako audit 28. 10. Bez osobních otázek, adres a textů výkladů.

## Kohorta, nikoli samostatné součty

Filtr feature=relationship_tarot, metadata.flow_id. Pro každý neprázdný flow_id nalezen první one_time_offer_viewed. Další krok se započetl jen ve stejném toku, ve stejném období a v čase >= první nabídka. Tok není unikátní osoba. Každý sloupec ukazuje dosažení daného kroku po nabídce; nevyžaduje zaznamenání všech mezikroků a nezaručuje úplné sekvenční měření.

| Krok po první nabídce | Unikátní toky kohorty |
|---|---:|
| Zobrazení nabídky | 359 |
| Klik nabídky | 7 |
| Zobrazení produktu | 10 |
| Zahájení formuláře | 2 |
| Odeslání formuláře | 1 |
| Vytvoření checkoutu | 1 |
| Nákupní event | 1 |
| Event dokončení výkladu | 1 |

Samostatný součet všech eventů dává 8 klikajících a 22 produktových toků; není to stejná kohorta. Nelze proto tvrdit, že všech 22 přišlo z 359 nabídek. Dvě checkout session náležejí jednomu toku, nikoli dvěma zákazníkům či platbám. Největší pozorovaný úbytek je před zahájením formuláře. Z tohoto vzorku nelze určit příčinu, statistického vítěze ani kauzální dopad posledního vydání.

## Nezávislé propojení objednávky

Nákupní flow přes stripe_session_id odpovídá právě jednomu one_time_purchases záznamu, částce 14900 v nejmenší měnové jednotce a jednomu one_time_order_inputs záznamu se status=fulfilled a neprázdným fulfilled_at. Historický Stripe audit ověřil 149 Kč; nejde o další novou platbu. email_sent_at je prázdné: tato absence sama neprokazuje nedoručení ani potvrzení inboxu. Reconciliation může mít odlišné eventové pokrytí.

## Skutečně dostupná zpětná vazba

Ve funnel_events za stejné období nejsou feedback/helpful eventy. Samostatné analytics_events mají **4 footer feedback eventy**: numerologie/zivotni-cislo-8 yes=1, prihlaseni no=1, tarot-ano-ne yes=1 a no=1. Tyto hlasy nejsou párované s placenou objednávkou a nejsou čtyři ověření zákazníci; metadata nemají clientId pro deduplikaci. Z 11 readings vytvořených v období nemá žádný uložený neprázdný data.feedback v okamžiku kontroly. Tím se neověřují jiné kanály podpory ani pozdější hodnocení starších výkladů.

## Rozhodnutí

Nepřidávat nový checkout, slevy nebo další analytický producer podle jediného nákupu. Další konkrétní kontrola má sledovat srozumitelnost a návaznost stávající nabídky před formulářem (co zákazník dostane, automatický výklad, tři karty, jednorázových 149 Kč). Hodnocení přínosu musí vycházet z nových toků a skutečných objednávek; vhodné je předběžné učení s absolutními počty, ne tvrzení o průkazném A/B testu. Oslovení zákazníků nebylo odesláno. C01: datové propojení dokončeno, placená zákaznická zpětná vazba dosud chybí.
