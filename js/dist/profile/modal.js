function i(e){if(!e)return"";let a=document.createElement("div");return a.textContent=e,a.innerHTML}function d(){return window.API_CONFIG?.BASE_URL||"/api"}function u(e=!1){let a=window.Auth?.token,n={};return a&&(n.Authorization=`Bearer ${a}`),e&&(n["Content-Type"]="application/json"),n}async function w(e=!1){let a=u(e),n=window.getCSRFToken?await window.getCSRFToken():null;return n&&(a["X-CSRF-Token"]=n),a}function b(e){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[e]||"star"}" class="reading-type-icon"></i>`}function x(e){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Osobn\xED pozn\xE1mka","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[e]||"V\xFDklad"}function $(e){if(e?.type!=="horoscope")return x(e?.type);let a=e.data;if(typeof a=="string")try{a=JSON.parse(a)}catch{return"Horoskop"}return[{daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop",yearly:"Ro\u010Dn\xED horoskop"}[a?.period]||"Horoskop",a?.sign].filter(t=>typeof t=="string"&&t).join(" \xB7 ")}function f(e){if(!new Set(["book","bookmark","warning"]).has(e))throw new Error("Unknown profile UI icon");return'<svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#'+e+'"></use></svg>'}var p=[],g="all",I=0,E=[],U=1,T=0,J=0,h=null,C=0;var Y=10,G={"crystal-ball":["crystal-ball","crystal"],"natal-chart":["natal-chart","natal"]},F=!1,H=!1;function O(){return p}function B(){return h}function D(e,a){h&&e!==a&&(h.favorites=Math.max(0,h.favorites+(a?1:-1)))}async function W(e,a="all",n=!1){let t=new URLSearchParams({page:String(e),limit:"20"});a!=="all"&&t.set("type",(G[a]||[a]).join(",")),n&&t.set("summary","true");let o=await fetch(`${d()}/user/readings?${t}`,{credentials:"include",headers:u()});if(!o.ok)throw new Error("Nepoda\u0159ilo se na\u010D\xEDst historii.");let r=await o.json();if(!r.success||!Array.isArray(r.readings))throw new Error("Nepoda\u0159ilo se na\u010D\xEDst historii.");return r}function Q(e,a=!1){let n=(t,o)=>[...new Map([...t,...o].map(r=>[r.id,r])).values()];E=a?n(E,e.readings):e.readings,p=n(p,e.readings),U=e.pagination?.page||1,T=e.pagination?.total??E.length,J=e.pagination?.totalPages||1,e.summary&&(h=e.summary)}function q(e,a){let n=p.find(t=>t.id===e);n&&Object.assign(n,a)}async function L(){let e=document.getElementById("readings-list");try{let a=++C;g="all";let n=document.getElementById("readings-filter");n&&(n.value="all");let t=await W(1,"all",!0);return a!==C||(p=[],Q(t),I=Y,R()),p}catch(a){return console.error("Error loading readings:",a),e&&(e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">${f("warning")}</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,e.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function X(){return E}function ee(){return H||(H=!0,window.MH_ANALYTICS?.trackEvent?.("profile_activation_viewed",{source:"profile_history",feature:"profile_history"})),`
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
    `}function R(){let e=document.getElementById("readings-list");if(!e)return;let a=X();if(g==="all"&&T===0){e.innerHTML=ee(),z(0,0);return}if(a.length===0){g==="all"&&!F&&(F=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">${f("book")}</div>
                <h4 class="empty-state__title">${g==="all"?"Den\xEDk v\xFDklad\u016F zat\xEDm \u010Dek\xE1 na prvn\xED odpov\u011B\u010F":"Tady zat\xEDm nen\xED \u017E\xE1dn\xFD v\xFDklad tohoto typu"}</h4>
                <p class="empty-state__text">${g==="all"?"Tady se budou dr\u017Eet tvoje ot\xE1zky, odpov\u011Bdi a opakuj\xEDc\xED se t\xE9mata. Za\u010Dni kr\xE1tk\xFDm v\xFDkladem, a\u0165 m\xE1 profil prvn\xED sign\xE1l pro n\xE1vrat.":"Filtr je pr\xE1zdn\xFD. Zkus jin\xFD typ v\xFDkladu nebo se vra\u0165 na celou historii."}</p>
                ${g==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot-ano-ne.html?source=profile_history_empty&feature=tarot_yes_no&intent=yes_no" class="btn btn--primary btn--sm" data-analytics-cta="profile_empty_tarot_yes_no" data-analytics-feature="tarot_yes_no">Tarot ano/ne</a>
                        <a href="tarot-tri-karty.html?source=profile_history_empty&feature=tarot_multi_card&intent=three_cards" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_three_cards" data-analytics-feature="tarot_multi_card">T\u0159i karty</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule&intent=yes_no_question" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_crystal_ball" data-analytics-feature="kristalova_koule">K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                    </div>
                `:""}
            </div>
        `,z(0,0);return}let n=a.slice(0,I);e.innerHTML=`${n.map(t=>`
        <div class="reading-item card" data-reading-id="${i(t.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${b(t.type)}</span>
                    <div>
                        <strong>${i($(t))}</strong>
                        <p class="reading-item__date">
                            ${new Date(t.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${i(t.id)}"
                        title="${t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}">
                        ${t.is_favorite?"\u2605":"\u2606"}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${i(t.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join("")}`,z(n.length,T),window.lucide?.createIcons?.()}function z(e,a){let n=document.getElementById("readings-pagination");if(n)if(e<a){n.hidden=!1,n.classList.add("profile-block-visible");let t=document.getElementById("readings-load-more");t&&(t.textContent=`Na\u010D\xEDst dal\u0161\xED (${a-e} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}var P=0;function te(e=0){let a=e>0;return`
        <div class="empty-state">
            <div class="empty-state__icon">${f("bookmark")}</div>
            <h4 class="empty-state__title">${a?"Vyber si prvn\xED v\xFDklad pro n\xE1vrat":"Obl\xEDben\xE9 zat\xEDm \u010Dekaj\xED na prvn\xED n\xE1vrat"}</h4>
            <p class="empty-state__text">${a?"Ozna\u010D si v historii v\xFDklad, ke kter\xE9mu se chce\u0161 vr\xE1tit. Tady ho pak najde\u0161 po ruce.":"Po prvn\xEDm v\xFDkladu si m\u016F\u017Ee\u0161 ulo\u017Eit do obl\xEDben\xFDch to, k \u010Demu se chce\u0161 vracet."}</p>
            <div class="empty-state__actions">
                ${a?'<button type="button" class="btn btn--primary btn--sm" data-profile-tab-target="history">Otev\u0159\xEDt historii</button>':'<a href="tarot.html?source=profile_favorites_empty&feature=tarot" class="btn btn--primary btn--sm">Tarot</a><a href="horoskopy.html?source=profile_favorites_empty&feature=daily_guidance" class="btn btn--glass btn--sm">Denn\xED horoskop</a>'}
            </div>
        </div>
    `}async function S(e=1,a=null){a===null&&(a=++P);let n=document.getElementById("favorites-list");if(n){e===1&&(n.innerHTML='<p class="profile-loading" role="status">Na\u010D\xEDt\xE1n\xED\u2026</p>');try{let t=await fetch(`${d()}/user/readings?favorites=true&page=${e}&limit=20`,{credentials:"include",headers:u()});if(!t.ok)throw new Error("Failed to load readings");let o=await t.json();if(a!==P)return;let s=o.readings||[];if(s.length===0){e===1&&(n.innerHTML=te(B()?.total||0));return}n.querySelector("[data-favorites-more]")?.remove();let c=s.map(l=>`
            <div class="reading-item card" data-reading-id="${i(l.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${b(l.type)}</span>
                        <div>
                            <strong>${i($(l))}</strong>
                            <p class="reading-item__date">
                                ${new Date(l.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric"})}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${i(l.id)}" title="Odebrat z obl\xEDben\xFDch" aria-label="Odebrat z obl\xEDben\xFDch">${f("bookmark")}</button>
                        <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${i(l.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join("");if(e===1?n.innerHTML=c:n.insertAdjacentHTML("beforeend",c),e<(o.pagination?.totalPages||1)){n.insertAdjacentHTML("beforeend",'<button type="button" class="btn btn--glass btn--sm" data-favorites-more>Na\u010D\xEDst dal\u0161\xED obl\xEDben\xE9</button>');let l=n.querySelector("[data-favorites-more]");l?.addEventListener("click",async()=>{l.disabled=!0,await S(e+1,a),l.isConnected&&(l.disabled=!1)})}window.lucide?.createIcons?.()}catch(t){if(console.error("Error loading favorites:",t),a!==P)return;if(e>1){let o=n.querySelector("[data-favorites-more]");o&&(o.textContent="Na\u010Dten\xED selhalo \xB7 zkusit znovu");return}n.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">${f("warning")}</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
                <button type="button" class="btn btn--glass btn--sm" data-favorites-retry>Zkusit znovu</button>
            </div>
        `,n.querySelector("[data-favorites-retry]")?.addEventListener("click",()=>S())}}}var v=null,A=!1,y=null,_=null,k=null,ae=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],ne=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function Ae(e){let a=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!(!a||!n)){v=e,a.hidden=!1,a.classList.add("is-visible"),n.innerHTML='<p class="reading-modal__loading">Na\u010D\xEDt\xE1n\xED...</p>',ie(a);try{let t=await fetch(`${d()}/user/readings/${e}`,{credentials:"include",headers:u()});if(!t.ok)throw new Error("Failed to fetch reading");let r=(await t.json()).reading;A=r.is_favorite,V(),n.innerHTML=ge(r),se(n),de(n,r)}catch(t){console.error("Error loading reading:",t),n.innerHTML='<p class="reading-modal__error">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad.</p>'}}}function N(){let e=document.getElementById("reading-modal");e&&(e.classList.remove("is-visible"),e.hidden=!0),v=null,oe()}async function xe(){if(!v)return;let e=await re(v);e!==void 0&&(A=e,V())}async function re(e,a=null){try{let n=await fetch(`${d()}/user/readings/${e}/favorite`,{method:"PATCH",credentials:"include",headers:await w()});if(!n.ok)throw new Error("Failed to toggle favorite");let t=await n.json();if(typeof t.is_favorite!="boolean")throw new Error("Neplatn\xE1 odpov\u011B\u010F obl\xEDben\xFDch.");D(!t.is_favorite,t.is_favorite),a&&(a.textContent=t.is_favorite?"\u2605":"\u2606",a.title=t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",a.setAttribute("aria-label",t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let o=O(),r=o.find(c=>c.id===e);r&&(r.is_favorite=t.is_favorite,R()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:o}}));let s=document.getElementById("tab-favorites");return s&&s.classList.contains("is-active")&&S(),t.is_favorite}catch(n){console.error("Error toggling favorite:",n),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}}async function ze(){if(v&&confirm("Opravdu chce\u0161 smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))try{if(!(await fetch(`${d()}/user/readings/${v}`,{method:"DELETE",credentials:"include",headers:await w()})).ok)throw new Error("Failed to delete reading");window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),N();let a=await L();document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:a}}))}catch(e){console.error("Error deleting reading:",e),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}}function V(){let e=document.getElementById("modal-favorite-btn");e&&(e.textContent=A?"\u2605 V obl\xEDben\xFDch":"\u2606 P\u0159idat do obl\xEDben\xFDch",e.setAttribute("aria-label",A?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function ie(e){y=document.activeElement,_=e;let a=Z(e);(e.querySelector(".modal__close")||a[0]||e).focus(),k=t=>{if(!_)return;if(t.key==="Escape"){t.preventDefault(),N();return}if(t.key!=="Tab")return;let o=Z(_);if(!o.length){t.preventDefault(),_.focus();return}let r=o[0],s=o[o.length-1];t.shiftKey&&document.activeElement===r?(t.preventDefault(),s.focus()):!t.shiftKey&&document.activeElement===s&&(t.preventDefault(),r.focus())},document.addEventListener("keydown",k)}function oe(){if(k&&(document.removeEventListener("keydown",k),k=null),_=null,y){let e=y.closest("[data-reading-id]")?.dataset.readingId,a=[...document.querySelectorAll('[data-reading-action="view"]')].find(t=>t.dataset.readingId===e&&t.offsetParent!==null);(y.isConnected?y:a||document.querySelector('.profile-tab[aria-selected="true"]'))?.focus(),y=null}}function Z(e){return Array.from(e.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(a=>a.offsetParent!==null)}function se(e){e.querySelectorAll("[data-tarot-fallback]").forEach(a=>{a.addEventListener("error",()=>{a.dataset.fallbackApplied!=="1"&&(a.dataset.fallbackApplied="1",a.src="/img/tarot-v2/tarot_card_back.webp")})})}function M(e,a,n="neutral"){let t=e?.querySelector?.(".reading-feedback__status");t&&(t.textContent=a,t.dataset.state=n)}async function j(e,a,n,t){if(!e)return null;t&&(t.disabled=!0),M(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let o=null;if(window.Auth?.saveReadingFeedback)o=await window.Auth.saveReadingFeedback(e,{...a,feature:"profile_history",source:"profile_reading_modal"});else{let s=await fetch(`${d()}/user/readings/${encodeURIComponent(e)}/feedback`,{method:"PATCH",credentials:"include",headers:await w(!0),body:JSON.stringify({...a,feature:"profile_history",source:"profile_reading_modal"})});o=await s.json().catch(()=>null),s.ok||(o=null)}if(t&&(t.disabled=!1),!o?.success)return M(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null;o.reading&&q(e,o.reading);let r=await L();return document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:r}})),M(n,"Ulo\u017Eeno. Pam\u011B\u0165 profilu m\xE1 dal\u0161\xED sign\xE1l pro n\xE1vratov\xFD ritu\xE1l.","success"),o}function le(e){let a=e?.data;if(e?.type==="journal"||!a||typeof a!="object"||Array.isArray(a))return"";let n=a.feedback&&typeof a.feedback=="object"&&!Array.isArray(a.feedback)?a.feedback:{},t=ae.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${i(r.label)}
        </button>
    `).join(""),o=ne.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.focus===r.value?"is-selected":""}" data-feedback-focus="${r.value}">
            ${i(r.label)}
        </button>
    `).join("");return`
        <section class="reading-feedback" data-reading-feedback="${i(e.id)}">
            <div class="reading-feedback__header">
                <span class="reading-feedback__eyebrow">Zp\u011Btn\xE1 vazba</span>
                <strong>Co m\xE1 profil br\xE1t jako dal\u0161\xED sign\xE1l?</strong>
            </div>
            <div class="reading-feedback__chips" aria-label="Zp\u011Btn\xE1 vazba k v\xFDkladu">
                ${t}
            </div>
            <div class="reading-feedback__chips" aria-label="T\xE9ma pro pam\u011B\u0165 ritu\xE1lu">
                ${o}
            </div>
            <div class="reading-feedback__actions">
                <button type="button" class="btn btn--glass btn--sm" data-feedback-next-action="journal">Zapsat reflexi</button>
                <a class="btn btn--glass btn--sm" href="tarot.html?source=profile_feedback&feature=another_reading" data-feedback-next-action="another_reading">Nav\xE1zat v\xFDkladem</a>
            </div>
            <p class="reading-feedback__status" aria-live="polite"></p>
        </section>
    `}function ce(){N();let e=document.getElementById("journal-input");e&&(window.history.replaceState(null,"","#journal-input"),e.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>e.focus(),250))}function de(e,a){let n=e.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async t=>{let o=t.target.closest("[data-feedback-resonance]"),r=t.target.closest("[data-feedback-focus]"),s=t.target.closest("[data-feedback-next-action]"),c=o||r||s;if(!c)return;let l={};if(o&&(l.resonance=o.dataset.feedbackResonance),r&&(l.focus=r.dataset.feedbackFocus),s&&(l.nextAction=s.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(m=>{(l.resonance&&m.dataset.feedbackResonance||l.focus&&m.dataset.feedbackFocus)&&m.classList.toggle("is-selected",m===c)}),s?.tagName==="A"){t.preventDefault(),(await j(a.id,l,n,null))?.success&&(window.location.href=s.getAttribute("href"));return}if(l.nextAction==="journal"){(await j(a.id,l,n,s))?.success&&ce();return}await j(a.id,l,n,c)})}function ue(e){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[e]||String(e).replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function fe(e){return!e||typeof e!="object"?"":Object.entries(e).filter(([,a])=>a!=null&&a!=="").map(([a,n])=>{let t=typeof n=="object"?JSON.stringify(n,null,2):String(n);return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${i(ue(a))}</h4>
                    <p class="reading-structured-field__value">${i(t).replace(/\n/g,"<br>")}</p>
                </section>
            `}).join("")}function K(e,a){let n=a.filter(t=>t.value!==null&&t.value!==void 0&&t.value!=="").map(t=>`
            <span class="reading-metric">
                <strong>${i(t.label)}</strong>
                <span>${i(t.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${i(e)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function pe(e){let a=e?.summary;return a?K("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:a.sunSign},{label:"M\u011Bs\xEDc",value:a.moonSign},{label:"Ascendent",value:a.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:a.dominantElement},{label:"Modalita",value:a.dominantQuality}]):""}function me(e){let a=e?.synastry?.scores||e?.scores;return a?K("Sk\xF3re vztahu",[{label:"Celkem",value:`${a.total??"--"} %`},{label:"Emoce",value:`${a.emotion??"--"} %`},{label:"Komunikace",value:`${a.communication??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${a.passion??"--"} %`},{label:"Stabilita",value:`${a.stability??"--"} %`}]):""}function be(e){if(!e||typeof e!="object")return"";let a=Array.isArray(e.recommendations)?e.recommendations.slice(0,3):[],n=Array.isArray(e.angularLines)?e.angularLines.slice(0,4):[],t=a.map(r=>`
        <li>
            <strong>${i(r.city||"M\xEDsto")}</strong>
            <span>${i(r.score??"--")} / 100 \xB7 ${i(r.primaryPlanet?.name||"planeta")}</span>
        </li>
    `).join(""),o=n.map(r=>`
        <li>
            <strong>${i(r.planetName||"Planeta")} ${i(r.angle||"")}</strong>
            <span>${i(r.longitude??"--")}\xB0</span>
        </li>
    `).join("");return!t&&!o?"":`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">Astro mapa</h3>
            ${t?`<ul class="reading-summary-list">${t}</ul>`:""}
            ${o?`<ul class="reading-summary-list reading-summary-list--compact">${o}</ul>`:""}
        </section>
    `}function ge(e){let a=new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${b(e.type)}</span>
            <h2 class="reading-detail__title">${i(x(e.type))}</h2>
            <p class="reading-detail__date">${a}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,t=e.data||{};t&&typeof t=="object"&&(e.type==="synastry"&&(n+=me(t)),n+=pe(t.chart||t.synastry?.person1?.chart),e.type==="astrocartography"&&(n+=be(t.astrocartography)));function o(r){return r?`img/tarot-v2/tarot_${r.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_")}.webp`:"img/tarot-v2/tarot_card_back.webp"}if(typeof t=="string")n+=`<div class="reading-plain-text">${i(t).replace(/\n/g,"<br>")}</div>`;else if(e.type==="tarot"&&t.cards){n+='<div class="reading-tarot-grid">',t.cards.forEach(s=>{let c=o(s.name);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${i(c)}"
                              alt="${i(s.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${i(s.name)}</p>
                    ${s.position?`<small class="reading-tarot-card__position">${i(s.position)}</small>`:""}
                </div>
            `}),n+="</div>";let r=t.response||t.interpretation;if(r){let s=i(r).replace(/\n/g,"<br>");n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${s}
                    </div>
                </div>
            `}}else if(e.type==="horoscope"&&(t.text||t.prediction)){let r=t.text||t.prediction,c={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[t.period]||t.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${i(t.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${i(c)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${i(r)}
            </div>
        `,t.luckyNumbers&&(n+=`
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">\u0160\u0165astn\xE1 \u010D\xEDsla</span>
                    <span class="reading-lucky-numbers__value">${i(t.luckyNumbers.toString())}</span>
                </div>
            `)}else if(t.answer)t.question&&(n+=`
                <div class="reading-question">
                    <small class="reading-question__label">Ot\xE1zka</small>
                    <p class="reading-question__text">"${i(t.question)}"</p>
                </div>
            `),n+=`
            <div class="reading-answer">
                ${i(t.answer)}
            </div>
        `;else if(t.interpretation||t.response||t.text||t.result){let r=t.interpretation||t.response||t.text||t.result;if(typeof r=="string"){let s=i(r).replace(/\n/g,"<br>"),c=typeof DOMPurify<"u"?DOMPurify.sanitize(s):s;n+=`<div class="formatted-content reading-formatted-content">${c}</div>`}else n+=`<div class="reading-structured">${fe(r)}</div>`}else n+=`<pre class="reading-json">${i(JSON.stringify(t,null,2))}</pre>`;return n+="</div>",n+=le(e),n}export{N as closeReadingModal,ze as deleteReading,re as toggleFavorite,xe as toggleFavoriteModal,Ae as viewReading};
