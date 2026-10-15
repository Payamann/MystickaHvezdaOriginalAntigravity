function l(t){if(!t)return"";let e=document.createElement("div");return e.textContent=t,e.innerHTML}function w(){return window.API_CONFIG?.BASE_URL||"/api"}function x(t=!1){let e=window.Auth?.token,a={};return e&&(a.Authorization=`Bearer ${e}`),t&&(a["Content-Type"]="application/json"),a}function P(t){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[t]||"star"}" class="reading-type-icon"></i>`}function z(t){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Osobn\xED pozn\xE1mka","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[t]||"V\xFDklad"}function L(t){if(t?.type!=="horoscope")return z(t?.type);let e=t.data;if(typeof e=="string")try{e=JSON.parse(e)}catch{return"Horoskop"}return[{daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop",yearly:"Ro\u010Dn\xED horoskop"}[e?.period]||"Horoskop",e?.sign].filter(n=>typeof n=="string"&&n).join(" \xB7 ")}function y(t){if(!new Set(["book","bookmark","warning"]).has(t))throw new Error("Unknown profile UI icon");return'<svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#'+t+'"></use></svg>'}var i=[],r="all",u=0,c=[],h=1,v=0,M=0,d=null,o=0,g=!1,_=10,E={"crystal-ball":["crystal-ball","crystal"],"natal-chart":["natal-chart","natal"]},T=!1,A=!1;function j(){return i}function H(){return d}async function C(){try{return(await m(1,"journal")).readings}catch{return null}}function B(t,e){d&&t!==e&&(d.favorites=Math.max(0,d.favorites+(e?1:-1)))}async function m(t,e="all",a=!1){let n=new URLSearchParams({page:String(t),limit:"20"});e!=="all"&&n.set("type",(E[e]||[e]).join(",")),a&&n.set("summary","true");let p=await fetch(`${w()}/user/readings?${n}`,{credentials:"include",headers:x()});if(!p.ok)throw new Error("Nepoda\u0159ilo se na\u010D\xEDst historii.");let s=await p.json();if(!s.success||!Array.isArray(s.readings))throw new Error("Nepoda\u0159ilo se na\u010D\xEDst historii.");return s}function k(t,e=!1){let a=(n,p)=>[...new Map([...n,...p].map(s=>[s.id,s])).values()];c=e?a(c,t.readings):t.readings,i=a(i,t.readings),h=t.pagination?.page||1,v=t.pagination?.total??c.length,M=t.pagination?.totalPages||1,t.summary&&(d=t.summary)}function F(t,e){let a=i.find(n=>n.id===t);a&&Object.assign(a,e)}async function Z(){let t=document.getElementById("readings-list");try{let e=++o;r="all";let a=document.getElementById("readings-filter");a&&(a.value="all");let n=await m(1,"all",!0);return e!==o||(i=[],k(n),u=_,b()),i}catch(e){return console.error("Error loading readings:",e),t&&(t.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">${y("warning")}</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,t.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}async function R(t){r=t.target.value;let e=++o,a=document.getElementById("readings-list");a&&(a.innerHTML='<p class="profile-loading" role="status">Na\u010D\xEDt\xE1n\xED\u2026</p>'),f(0,0);try{let n=await m(1,r);if(e!==o)return;k(n),u=_,b()}catch{if(e!==o)return;a&&(a.innerHTML='<p role="alert">Nepoda\u0159ilo se na\u010D\xEDst historii.</p><button type="button" class="btn btn--glass btn--sm" data-readings-action="retry-filter">Zkusit znovu</button>',a.querySelector("button")?.addEventListener("click",()=>R({target:{value:r}})))}}function S(){return c}function N(){return A||(A=!0,window.MH_ANALYTICS?.trackEvent?.("profile_activation_viewed",{source:"profile_history",feature:"profile_history"})),`
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
    `}function b(){let t=document.getElementById("readings-list");if(!t)return;let e=S();if(r==="all"&&v===0){t.innerHTML=N(),f(0,0);return}if(e.length===0){r==="all"&&!T&&(T=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),t.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">${y("book")}</div>
                <h4 class="empty-state__title">${r==="all"?"Den\xEDk v\xFDklad\u016F zat\xEDm \u010Dek\xE1 na prvn\xED odpov\u011B\u010F":"Tady zat\xEDm nen\xED \u017E\xE1dn\xFD v\xFDklad tohoto typu"}</h4>
                <p class="empty-state__text">${r==="all"?"Tady se budou dr\u017Eet tvoje ot\xE1zky, odpov\u011Bdi a opakuj\xEDc\xED se t\xE9mata. Za\u010Dni kr\xE1tk\xFDm v\xFDkladem, a\u0165 m\xE1 profil prvn\xED sign\xE1l pro n\xE1vrat.":"Filtr je pr\xE1zdn\xFD. Zkus jin\xFD typ v\xFDkladu nebo se vra\u0165 na celou historii."}</p>
                ${r==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot-ano-ne.html?source=profile_history_empty&feature=tarot_yes_no&intent=yes_no" class="btn btn--primary btn--sm" data-analytics-cta="profile_empty_tarot_yes_no" data-analytics-feature="tarot_yes_no">Tarot ano/ne</a>
                        <a href="tarot-tri-karty.html?source=profile_history_empty&feature=tarot_multi_card&intent=three_cards" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_three_cards" data-analytics-feature="tarot_multi_card">T\u0159i karty</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule&intent=yes_no_question" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_crystal_ball" data-analytics-feature="kristalova_koule">K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                    </div>
                `:""}
            </div>
        `,f(0,0);return}let a=e.slice(0,u);t.innerHTML=`${a.map(n=>`
        <div class="reading-item card" data-reading-id="${l(n.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${P(n.type)}</span>
                    <div>
                        <strong>${l(L(n))}</strong>
                        <p class="reading-item__date">
                            ${new Date(n.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${l(n.id)}"
                        title="${n.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${n.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}">
                        ${n.is_favorite?"\u2605":"\u2606"}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${l(n.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join("")}`,f(a.length,v),window.lucide?.createIcons?.()}async function K(){if(g)return;let t=o,e=document.getElementById("readings-load-more");g=!0,e&&(e.disabled=!0,e.textContent="Na\u010D\xEDt\xE1n\xED\u2026");try{if(u>=c.length&&h<M){let a=await m(h+1,r);if(t!==o)return;k(a,!0)}u+=_,b()}catch{t===o&&e&&(e.textContent="Na\u010Dten\xED selhalo \xB7 zkusit znovu")}finally{g=!1,e&&(e.disabled=!1)}}function f(t,e){let a=document.getElementById("readings-pagination");if(a)if(t<e){a.hidden=!1,a.classList.add("profile-block-visible");let n=document.getElementById("readings-load-more");n&&(n.textContent=`Na\u010D\xEDst dal\u0161\xED (${e-t} zb\xFDv\xE1)`)}else a.hidden=!0,a.classList.remove("profile-block-visible")}export{j as getAllReadings,H as getReadingSummary,R as handleFilterChange,C as loadJournalReadings,Z as loadReadings,b as renderReadings,K as showMoreReadings,B as updateFavoriteSummary,F as updateReading};
