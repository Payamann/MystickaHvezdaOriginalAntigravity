> Pomocná zdrojová inventura. Ověřený rozsah, konečné priority a opravené závěry jsou v [hlavním seznamu](README.md). Doporučení níže nejsou automatická instrukce k hromadným úpravám.

# Tarot card detail inventory (78 pages)

Read-only source review on 2026-10-14. Scope is every HTML file in `tarot-vyznam/`; no visual or browser review is claimed. The pages are generated as a shared static template with card-specific copy and related links.

## Shared top-to-bottom section order

1. `.tarot-card-detail-hero` (source lines 137–153): breadcrumb, `h1`, card image/summary, primary `Vyložit kartu` and secondary return-to-index CTA.
2. `.section--alt` (about lines 157–207): eleven h2 blocks in this exact order: `Co znamená karta [card]`; `[card] v lásce`; `[card] v práci a rozhodování`; `[card] jako odpověď ano/ne`; `[card] obráceně`; `Příklad výkladu karty [card]`; `Co si z karty odnést dnes`; `Co udělat, když se ti ukazuje [card]`; `Rychlý přehled`; then a panel CTA. The takeaway has one related blog guide. The next-step block has daily-card, contextual-reading and profile-save links.
3. `section` (about lines 208–238): `Kam pokračovat dál` with three adjacent tarot-card detail links.
4. `section` (about lines 242–266): `[card] v tarotu`, four `details.faq-item` questions, and bottom tarot/index CTAs.
5. `.mh-email-bridge[data-analytics-source="tarot_card_detail"]` (about lines 267–300): morning-horoscope copy, email input, sign select, subscribe button, hidden success message and unsubscribe note. It is a div-based control group; no literal `form` element appears.

## Shared simplification recommendation

Keep the complete card interpretation, all forms/controls, trust or access copy, canonical/meta/JSON-LD and analytics parameters. The four FAQ details are already collapsed; keep them as individual details and do not add an outer accordion. Fold only separate long reference prose if the rendered page warrants it. Review repeated hero, panel and bottom crossroads before removing any; preserve one clear tarot continuation and adjacent-card navigation. The email bridge can be a smaller optional continuation; preserve the subscription hook if retained.

## Per-file inventory

| File | Card | Group | Source lines | Visible words* | Blog continuation | Controls/details | Individual note |
|---|---|---:|---:|---:|---|---|---|
| `blazen.html` | Blázen | Major Arcana | 311 | 502 | `/blog/karta-blazen-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `cisar.html` | Císař | Major Arcana | 311 | 472 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `cisarovna.html` | Císařovna | Major Arcana | 311 | 487 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `ctyrka-holi.html` | Čtyřka holí | Wands | 311 | 535 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `ctyrka-mecu.html` | Čtyřka mečů | Swords | 312 | 578 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `ctyrka-pentaklu.html` | Čtyřka pentáklů | Pentacles | 311 | 500 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `ctyrka-poharu.html` | Čtyřka pohárů | Cups | 311 | 578 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `dabel.html` | Ďábel | Major Arcana | 312 | 505 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `desitka-holi.html` | Desítka holí | Wands | 311 | 525 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `desitka-mecu.html` | Desítka mečů | Swords | 312 | 565 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `desitka-pentaklu.html` | Desítka pentáklů | Pentacles | 310 | 487 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `desitka-poharu.html` | Desítka pohárů | Cups | 311 | 561 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `devitka-holi.html` | Devítka holí | Wands | 311 | 509 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `devitka-mecu.html` | Devítka mečů | Swords | 312 | 580 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `devitka-pentaklu.html` | Devítka pentáklů | Pentacles | 310 | 493 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `devitka-poharu.html` | Devítka pohárů | Cups | 311 | 564 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `dvojka-holi.html` | Dvojka holí | Wands | 311 | 521 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `dvojka-mecu.html` | Dvojka mečů | Swords | 312 | 579 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `dvojka-pentaklu.html` | Dvojka pentáklů | Pentacles | 311 | 483 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `dvojka-poharu.html` | Dvojka pohárů | Cups | 312 | 609 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `eso-holi.html` | Eso holí | Wands | 311 | 546 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `eso-mecu.html` | Eso mečů | Swords | 312 | 587 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `eso-pentaklu.html` | Eso pentáklů | Pentacles | 310 | 503 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `eso-poharu.html` | Eso pohárů | Cups | 311 | 549 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `hvezda.html` | Hvězda | Major Arcana | 311 | 508 | `/blog/karta-hvezda-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `kolo-stesti.html` | Kolo štěstí | Major Arcana | 311 | 518 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `kral-holi.html` | Král holí | Wands | 311 | 511 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `kral-mecu.html` | Král mečů | Swords | 312 | 566 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `kral-pentaklu.html` | Král pentáklů | Pentacles | 311 | 494 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `kral-poharu.html` | Král pohárů | Cups | 311 | 563 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `kralovna-holi.html` | Královna holí | Wands | 311 | 520 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `kralovna-mecu.html` | Královna mečů | Swords | 312 | 560 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `kralovna-pentaklu.html` | Královna pentáklů | Pentacles | 311 | 494 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `kralovna-poharu.html` | Královna pohárů | Cups | 311 | 541 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `luna.html` | Luna | Major Arcana | 311 | 500 | `/blog/karta-mesic-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `mag.html` | Mág | Major Arcana | 311 | 498 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `milenci.html` | Milenci | Major Arcana | 312 | 658 | `/blog/karta-milenci-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `mirnost.html` | Mírnost | Major Arcana | 311 | 487 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `osmicka-holi.html` | Osmička holí | Wands | 311 | 520 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `osmicka-mecu.html` | Osmička mečů | Swords | 312 | 571 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `osmicka-pentaklu.html` | Osmička pentáklů | Pentacles | 311 | 477 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `osmicka-poharu.html` | Osmička pohárů | Cups | 311 | 561 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `paze-holi.html` | Páže holí | Wands | 311 | 511 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `paze-mecu.html` | Páže mečů | Swords | 312 | 559 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `paze-pentaklu.html` | Páže pentáklů | Pentacles | 311 | 479 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `paze-poharu.html` | Páže pohárů | Cups | 311 | 552 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `petka-holi.html` | Pětka holí | Wands | 311 | 530 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `petka-mecu.html` | Pětka mečů | Swords | 312 | 565 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `petka-pentaklu.html` | Pětka pentáklů | Pentacles | 311 | 503 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `petka-poharu.html` | Pětka pohárů | Cups | 311 | 566 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `poustevnik.html` | Poustevník | Major Arcana | 311 | 499 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `rytir-holi.html` | Rytíř holí | Wands | 311 | 516 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `rytir-mecu.html` | Rytíř mečů | Swords | 312 | 556 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `rytir-pentaklu.html` | Rytíř pentáklů | Pentacles | 311 | 489 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `rytir-poharu.html` | Rytíř pohárů | Cups | 311 | 551 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `sedmicka-holi.html` | Sedmička holí | Wands | 311 | 520 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `sedmicka-mecu.html` | Sedmička mečů | Swords | 312 | 563 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `sedmicka-pentaklu.html` | Sedmička pentáklů | Pentacles | 310 | 490 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `sedmicka-poharu.html` | Sedmička pohárů | Cups | 311 | 552 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `sestka-holi.html` | Šestka holí | Wands | 311 | 518 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `sestka-mecu.html` | Šestka mečů | Swords | 312 | 558 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `sestka-pentaklu.html` | Šestka pentáklů | Pentacles | 310 | 491 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `sestka-poharu.html` | Šestka pohárů | Cups | 311 | 553 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `sila.html` | Síla | Major Arcana | 311 | 493 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `slunce.html` | Slunce | Major Arcana | 312 | 662 | `/blog/karta-slunce-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `smrt.html` | Smrt | Major Arcana | 312 | 500 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `soud.html` | Soud | Major Arcana | 311 | 506 | `/blog/karta-soudce-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `spravedlnost.html` | Spravedlnost | Major Arcana | 311 | 486 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `svet.html` | Svět | Major Arcana | 311 | 495 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `trojka-holi.html` | Trojka holí | Wands | 311 | 517 | `/blog/hulkove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `trojka-mecu.html` | Trojka mečů | Swords | 312 | 599 | `/blog/mecove-karty-tarot-vyznam.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `trojka-pentaklu.html` | Trojka pentáklů | Pentacles | 310 | 481 | `/blog/pentagramy-tarot-penize-kariera.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `trojka-poharu.html` | Trojka pohárů | Cups | 311 | 557 | `/blog/co-znamenaji-pohary-v-tarotu.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `veleknez.html` | Velekněz | Major Arcana | 311 | 501 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `veleknezka.html` | Velekněžka | Major Arcana | 311 | 504 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `vez.html` | Věž | Major Arcana | 312 | 493 | `/blog/lekce-padajici-veze-tarot.html` | input+select+button; 4 FAQ details; 3 adjacent card links | card/suit guide |
| `viselec.html` | Viselec | Major Arcana | 311 | 501 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |
| `vuz.html` | Vůz | Major Arcana | 311 | 493 | `/blog/vyklad-tarotu-pro-zacatecniky.html` | input+select+button; 4 FAQ details; 3 adjacent card links | shared major-arcana guide |

\* Word counts are approximate source text counts after removing markup/scripts; they are useful for comparison, not a rendered word count. Every row was inspected from its full source. All rows share the same section sequence and controls; individual exceptions are blog continuation targets and copy length. Notable major-arcana exceptions include the dedicated guides for Blázen, Hvězda, Luna, Milenci, Slunce, Soud and Věž.

## Line-level hooks and remaining risks

- Hero links use `/tarot.html?source=tarot_card_detail&card=...` and `/tarot-vyznam-karet.html?source=tarot_card_detail&card=...`.
- Next-step links use analytics attributes such as `tarot_card_detail_next_daily`, `tarot_card_detail_next_reading` and `tarot_card_detail_next_profile`; panel and bottom CTAs use `tarot_card_detail_panel` and `tarot_card_detail_bottom`.
- The newsletter controls are duplicated IDs in each standalone page (`horoscope-email-input`, `horoscope-sign-select`, `horoscope-subscribe-btn`) and a hidden `#horoscope-subscribed-msg`; do not fold or duplicate this group without checking the JS selector contract.
- The four FAQ `details` elements are already native disclosure controls. A wrapper must not nest `details` inside another `details`.
- These notes identify source structure only. Parent runtime review covers default/result/error/access states and visual clutter.

