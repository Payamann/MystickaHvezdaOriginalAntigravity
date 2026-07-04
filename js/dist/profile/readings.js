function r(t){if(!t)return"";let e=document.createElement("div");return e.textContent=t,e.innerHTML}function c(){return window.API_CONFIG?.BASE_URL||"/api"}function u(t=!1){let e=window.Auth?.token,a={};return e&&(a.Authorization=`Bearer ${e}`),t&&(a["Content-Type"]="application/json"),a}function p(t){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[t]||"star"}" class="reading-type-icon"></i>`}function f(t){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Manifesta\u010Dn\xED den\xEDk","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[t]||"V\xFDklad"}var i=[],o="all",s=0,h=10,v={"crystal-ball":["crystal-ball","crystal"],"natal-chart":["natal-chart","natal"]},_=!1,m=!1,y=!1;function T(){return i}function A(t,e){let a=i.find(n=>n.id===t);a&&Object.assign(a,e)}async function $(){let t=document.getElementById("readings-list");try{let e=await fetch(`${c()}/user/readings`,{credentials:"include",headers:u()});if(!e.ok)throw new Error("Failed to load readings");return i=(await e.json()).readings||[],s=0,d(),i}catch(e){return console.error("Error loading readings:",e),t&&(t.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u26A0\uFE0F</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,t.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function L(t){o=t.target.value,s=0,d()}function k(){if(o==="all")return i;let t=v[o]||[o];return i.filter(e=>t.includes(e.type))}function g(t){return[...t].sort((e,a)=>new Date(a.created_at)-new Date(e.created_at))[0]||null}function b(t){let e=t?.type||"reading";return e==="synastry"?{title:"Nav\xE1zat jednou konkr\xE9tn\xED vztahovou ot\xE1zkou",description:"Kdy\u017E u\u017E zn\xE1\u0161 dynamiku vztahu, dal\u0161\xED krok je kr\xE1tk\xE1 ot\xE1zka ano/ne k tomu, co te\u010F ud\u011Blat.",href:"tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=relationship_follow_up",label:"Zeptat se tarotu ano/ne",feature:"tarot_yes_no",intent:"relationship_follow_up"}:e==="tarot"?{title:"Polo\u017Eit navazuj\xEDc\xED ot\xE1zku",description:"Den\xEDk m\xE1 nejv\u011Bt\u0161\xED hodnotu, kdy\u017E na prvn\xED odpov\u011B\u010F nav\xE1\u017Ee\u0161 jedn\xEDm dal\u0161\xEDm konkr\xE9tn\xEDm krokem.",href:"tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=follow_up",label:"Polo\u017Eit dal\u0161\xED ot\xE1zku",feature:"tarot_yes_no",intent:"follow_up"}:{title:"Prom\u011Bnit v\xFDklad v dal\u0161\xED krok",description:"Vyber si jednu praktickou ot\xE1zku a nech Den\xEDk dr\u017Eet souvislost mezi odpov\u011B\u010Fmi.",href:"partnerska-shoda.html?source=profile_history_next_step&feature=partnerska_detail&intent=relationship_follow_up",label:"Prov\u011B\u0159it vztahov\xE9 t\xE9ma",feature:"partnerska_detail",intent:"relationship_follow_up"}}function w(t){if(o!=="all"||t.length===0)return"";let e=g(t),a=b(e);return m||(m=!0,window.MH_ANALYTICS?.trackEvent?.("profile_history_next_step_viewed",{source:"profile_history",feature:"profile_history",reading_count:t.length,latest_type:e?.type||null})),`
        <div class="profile-history-next-step">
            <div class="profile-history-next-step__copy">
                <span class="profile-history-next-step__eyebrow">Dal\u0161\xED krok po ulo\u017Een\xED</span>
                <strong>${r(a.title)}</strong>
                <p>${r(a.description)}</p>
            </div>
            <div class="profile-history-next-step__actions">
                ${e?.id?`<button class="btn btn--glass btn--sm" data-reading-action="view" data-reading-id="${r(e.id)}">Vr\xE1tit se k posledn\xEDmu v\xFDkladu</button>`:""}
                <a href="${r(a.href)}" class="btn btn--primary btn--sm" data-profile-history-next-step="${r(a.intent)}" data-analytics-cta="profile_history_next_step" data-analytics-feature="${r(a.feature)}">${r(a.label)}</a>
            </div>
        </div>
    `}function x(){return y||(y=!0,window.MH_ANALYTICS?.trackEvent?.("profile_activation_viewed",{source:"profile_history",feature:"profile_history"})),`
        <div class="card glass-card profile-activation-hero">
            <div class="profile-activation-hero__icon" aria-hidden="true">\u2726</div>
            <h4 class="profile-activation-hero__title">Tv\u016Fj den\xEDk \u010Dek\xE1 na prvn\xED v\xFDklad</h4>
            <p class="profile-activation-hero__lead">V\xFDklady se ukl\xE1daj\xED sem, tak\u017Ee se k nim kdykoliv vr\xE1t\xED\u0161 a p\u0159\xED\u0161t\u011B na n\u011B nav\xE1\u017Ee\u0161 dal\u0161\xEDm krokem.</p>
            <div class="profile-activation-hero__grid">
                <a href="tarot-ano-ne.html?source=profile_activation&feature=tarot_yes_no" class="profile-activation-hero__card" data-analytics-cta="profile_activation_tarot_yes_no" data-analytics-feature="tarot_yes_no">
                    <strong>Tarot ano/ne</strong>
                    <span>Rychl\xE1 odpov\u011B\u010F na jednu konkr\xE9tn\xED ot\xE1zku.</span>
                </a>
                <a href="tarot-karta-dne.html?source=profile_activation" class="profile-activation-hero__card" data-analytics-cta="profile_activation_card_of_day" data-analytics-feature="tarot_daily_card_profile_save">
                    <strong>Karta dne</strong>
                    <span>Jeden symbol, kter\xFD nastav\xED sm\u011Br pro dne\u0161ek.</span>
                </a>
                <a href="horoskopy.html?source=profile_activation" class="profile-activation-hero__card" data-analytics-cta="profile_activation_daily_horoscope" data-analytics-feature="daily_guidance">
                    <strong>Denn\xED horoskop</strong>
                    <span>Osobn\xED veden\xED pro tvoje znamen\xED na dne\u0161ek.</span>
                </a>
            </div>
        </div>
    `}function d(){let t=document.getElementById("readings-list");if(!t)return;let e=k();if(o==="all"&&i.length===0){t.innerHTML=x(),l(0,0);return}if(e.length===0){o==="all"&&!_&&(_=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),t.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u{1F52E}</div>
                <h4 class="empty-state__title">${o==="all"?"Den\xEDk v\xFDklad\u016F zat\xEDm \u010Dek\xE1 na prvn\xED odpov\u011B\u010F":"Tady zat\xEDm nen\xED \u017E\xE1dn\xFD v\xFDklad tohoto typu"}</h4>
                <p class="empty-state__text">${o==="all"?"Tady se budou dr\u017Eet tvoje ot\xE1zky, odpov\u011Bdi a opakuj\xEDc\xED se t\xE9mata. Za\u010Dni kr\xE1tk\xFDm v\xFDkladem, a\u0165 m\xE1 profil prvn\xED sign\xE1l pro n\xE1vrat.":"Filtr je pr\xE1zdn\xFD. Zkus jin\xFD typ v\xFDkladu nebo se vra\u0165 na celou historii."}</p>
                ${o==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot-ano-ne.html?source=profile_history_empty&feature=tarot_yes_no&intent=yes_no" class="btn btn--primary btn--sm" data-analytics-cta="profile_empty_tarot_yes_no" data-analytics-feature="tarot_yes_no">Tarot ano/ne</a>
                        <a href="tarot-tri-karty.html?source=profile_history_empty&feature=tarot_multi_card&intent=three_cards" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_three_cards" data-analytics-feature="tarot_multi_card">T\u0159i karty</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule&intent=yes_no_question" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_crystal_ball" data-analytics-feature="kristalova_koule">K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                    </div>
                `:""}
            </div>
        `,l(0,0);return}let a=e.slice(0,s+h);s=a.length,t.innerHTML=`${w(e)}${a.map(n=>`
        <div class="reading-item card" data-reading-id="${r(n.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${p(n.type)}</span>
                    <div>
                        <strong>${r(f(n.type))}</strong>
                        <p class="reading-item__date">
                            ${new Date(n.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${r(n.id)}"
                        title="${n.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${n.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}">
                        ${n.is_favorite?"\u2B50":"\u2606"}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${r(n.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join("")}`,l(s,e.length)}function j(){d()}function l(t,e){let a=document.getElementById("readings-pagination");if(a)if(t<e){a.hidden=!1,a.classList.add("profile-block-visible");let n=document.getElementById("readings-load-more");n&&(n.textContent=`Na\u010D\xEDst dal\u0161\xED (${e-t} zb\xFDv\xE1)`)}else a.hidden=!0,a.classList.remove("profile-block-visible")}export{T as getAllReadings,L as handleFilterChange,$ as loadReadings,d as renderReadings,j as showMoreReadings,A as updateReading};
