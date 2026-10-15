function o(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function u(){return window.API_CONFIG?.BASE_URL||"/api"}function p(e=!1){let t=window.Auth?.token,n={};return t&&(n.Authorization=`Bearer ${t}`),e&&(n["Content-Type"]="application/json"),n}async function x(e=!1){let t=p(e),n=window.getCSRFToken?await window.getCSRFToken():null;return n&&(t["X-CSRF-Token"]=n),t}function h(e){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[e]||"star"}" class="reading-type-icon"></i>`}function L(e){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Osobn\xED pozn\xE1mka","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[e]||"V\xFDklad"}function z(e){if(e?.type!=="horoscope")return L(e?.type);let t=e.data;if(typeof t=="string")try{t=JSON.parse(t)}catch{return"Horoskop"}return[{daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop",yearly:"Ro\u010Dn\xED horoskop"}[t?.period]||"Horoskop",t?.sign].filter(a=>typeof a=="string"&&a).join(" \xB7 ")}function m(e){if(!new Set(["book","bookmark","warning"]).has(e))throw new Error("Unknown profile UI icon");return'<svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#'+e+'"></use></svg>'}var b=[],_="all",U=0,T=[],X=1,C=0,ee=0,$=null,q=0;var te=10,ae={"crystal-ball":["crystal-ball","crystal"],"natal-chart":["natal-chart","natal"]},Z=!1,V=!1;function K(){return b}function J(){return $}function Y(e,t){$&&e!==t&&($.favorites=Math.max(0,$.favorites+(t?1:-1)))}async function ne(e,t="all",n=!1){let a=new URLSearchParams({page:String(e),limit:"20"});t!=="all"&&a.set("type",(ae[t]||[t]).join(",")),n&&a.set("summary","true");let i=await fetch(`${u()}/user/readings?${a}`,{credentials:"include",headers:p()});if(!i.ok)throw new Error("Nepoda\u0159ilo se na\u010D\xEDst historii.");let r=await i.json();if(!r.success||!Array.isArray(r.readings))throw new Error("Nepoda\u0159ilo se na\u010D\xEDst historii.");return r}function re(e,t=!1){let n=(a,i)=>[...new Map([...a,...i].map(r=>[r.id,r])).values()];T=t?n(T,e.readings):e.readings,b=n(b,e.readings),X=e.pagination?.page||1,C=e.pagination?.total??T.length,ee=e.pagination?.totalPages||1,e.summary&&($=e.summary)}function G(e,t){let n=b.find(a=>a.id===e);n&&Object.assign(n,t)}async function M(){let e=document.getElementById("readings-list");try{let t=++q;_="all";let n=document.getElementById("readings-filter");n&&(n.value="all");let a=await ne(1,"all",!0);return t!==q||(b=[],re(a),U=te,j()),b}catch(t){return console.error("Error loading readings:",t),e&&(e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">${m("warning")}</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,e.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function ie(){return T}function oe(){return V||(V=!0,window.MH_ANALYTICS?.trackEvent?.("profile_activation_viewed",{source:"profile_history",feature:"profile_history"})),`
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
    `}function j(){let e=document.getElementById("readings-list");if(!e)return;let t=ie();if(_==="all"&&C===0){e.innerHTML=oe(),P(0,0);return}if(t.length===0){_==="all"&&!Z&&(Z=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">${m("book")}</div>
                <h4 class="empty-state__title">${_==="all"?"Den\xEDk v\xFDklad\u016F zat\xEDm \u010Dek\xE1 na prvn\xED odpov\u011B\u010F":"Tady zat\xEDm nen\xED \u017E\xE1dn\xFD v\xFDklad tohoto typu"}</h4>
                <p class="empty-state__text">${_==="all"?"Tady se budou dr\u017Eet tvoje ot\xE1zky, odpov\u011Bdi a opakuj\xEDc\xED se t\xE9mata. Za\u010Dni kr\xE1tk\xFDm v\xFDkladem, a\u0165 m\xE1 profil prvn\xED sign\xE1l pro n\xE1vrat.":"Filtr je pr\xE1zdn\xFD. Zkus jin\xFD typ v\xFDkladu nebo se vra\u0165 na celou historii."}</p>
                ${_==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot-ano-ne.html?source=profile_history_empty&feature=tarot_yes_no&intent=yes_no" class="btn btn--primary btn--sm" data-analytics-cta="profile_empty_tarot_yes_no" data-analytics-feature="tarot_yes_no">Tarot ano/ne</a>
                        <a href="tarot-tri-karty.html?source=profile_history_empty&feature=tarot_multi_card&intent=three_cards" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_three_cards" data-analytics-feature="tarot_multi_card">T\u0159i karty</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule&intent=yes_no_question" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_crystal_ball" data-analytics-feature="kristalova_koule">K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                    </div>
                `:""}
            </div>
        `,P(0,0);return}let n=t.slice(0,U);e.innerHTML=`${n.map(a=>`
        <div class="reading-item card" data-reading-id="${o(a.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${h(a.type)}</span>
                    <div>
                        <strong>${o(z(a))}</strong>
                        <p class="reading-item__date">
                            ${new Date(a.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${o(a.id)}"
                        title="${a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}">
                        ${a.is_favorite?"\u2605":"\u2606"}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${o(a.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join("")}`,P(n.length,C),window.lucide?.createIcons?.()}function P(e,t){let n=document.getElementById("readings-pagination");if(n)if(e<t){n.hidden=!1,n.classList.add("profile-block-visible");let a=document.getElementById("readings-load-more");a&&(a.textContent=`Na\u010D\xEDst dal\u0161\xED (${t-e} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}var N=0;function se(e=0){let t=e>0;return`
        <div class="empty-state">
            <div class="empty-state__icon">${m("bookmark")}</div>
            <h4 class="empty-state__title">${t?"Vyber si prvn\xED v\xFDklad pro n\xE1vrat":"Obl\xEDben\xE9 zat\xEDm \u010Dekaj\xED na prvn\xED n\xE1vrat"}</h4>
            <p class="empty-state__text">${t?"Ozna\u010D si v historii v\xFDklad, ke kter\xE9mu se chce\u0161 vr\xE1tit. Tady ho pak najde\u0161 po ruce.":"Po prvn\xEDm v\xFDkladu si m\u016F\u017Ee\u0161 ulo\u017Eit do obl\xEDben\xFDch to, k \u010Demu se chce\u0161 vracet."}</p>
            <div class="empty-state__actions">
                ${t?'<button type="button" class="btn btn--primary btn--sm" data-profile-tab-target="history">Otev\u0159\xEDt historii</button>':'<a href="tarot.html?source=profile_favorites_empty&feature=tarot" class="btn btn--primary btn--sm">Tarot</a><a href="horoskopy.html?source=profile_favorites_empty&feature=daily_guidance" class="btn btn--glass btn--sm">Denn\xED horoskop</a>'}
            </div>
        </div>
    `}async function R(e=1,t=null){t===null&&(t=++N);let n=document.getElementById("favorites-list");if(n){e===1&&(n.innerHTML='<p class="profile-loading" role="status">Na\u010D\xEDt\xE1n\xED\u2026</p>');try{let a=await fetch(`${u()}/user/readings?favorites=true&page=${e}&limit=20`,{credentials:"include",headers:p()});if(!a.ok)throw new Error("Failed to load readings");let i=await a.json();if(t!==N)return;let s=i.readings||[];if(s.length===0){e===1&&(n.innerHTML=se(J()?.total||0));return}n.querySelector("[data-favorites-more]")?.remove();let c=s.map(l=>`
            <div class="reading-item card" data-reading-id="${o(l.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${h(l.type)}</span>
                        <div>
                            <strong>${o(z(l))}</strong>
                            <p class="reading-item__date">
                                ${new Date(l.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric"})}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${o(l.id)}" title="Odebrat z obl\xEDben\xFDch" aria-label="Odebrat z obl\xEDben\xFDch">${m("bookmark")}</button>
                        <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${o(l.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join("");if(e===1?n.innerHTML=c:n.insertAdjacentHTML("beforeend",c),e<(i.pagination?.totalPages||1)){n.insertAdjacentHTML("beforeend",'<button type="button" class="btn btn--glass btn--sm" data-favorites-more>Na\u010D\xEDst dal\u0161\xED obl\xEDben\xE9</button>');let l=n.querySelector("[data-favorites-more]");l?.addEventListener("click",async()=>{l.disabled=!0,await R(e+1,t),l.isConnected&&(l.disabled=!1)})}window.lucide?.createIcons?.()}catch(a){if(console.error("Error loading favorites:",a),t!==N)return;if(e>1){let i=n.querySelector("[data-favorites-more]");i&&(i.textContent="Na\u010Dten\xED selhalo \xB7 zkusit znovu");return}n.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">${m("warning")}</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
                <button type="button" class="btn btn--glass btn--sm" data-favorites-retry>Zkusit znovu</button>
            </div>
        `,n.querySelector("[data-favorites-retry]")?.addEventListener("click",()=>R())}}}var B=null,S=!1,f=null,d=0,E=null,g=!1,k=null,w=null,A=null,le=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],ce=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function Pe(e){let t=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!t||!n)return;let a=++d;E?.abort();let i=new AbortController;E=i,B=e,f=null,S=!1,g=!1,H(),y(),t.hidden=!1,t.classList.add("is-visible"),n.setAttribute("aria-busy","true"),n.innerHTML='<p class="reading-modal__loading" role="status">Na\u010D\xEDt\xE1n\xED...</p>',ue(t);try{let r=await fetch(`${u()}/user/readings/${encodeURIComponent(e)}`,{credentials:"include",headers:p(),signal:i.signal});if(!r.ok)throw new Error("Failed to fetch reading");let s=await r.json();if(a!==d)return;let c=s.reading;if(!c||String(c.id)!==String(e))throw new Error("Invalid reading detail");n.innerHTML=we(c),pe(n),ge(n,c),f=e,S=!!c.is_favorite,H()}catch(r){if(a!==d)return;f=null,console.error("Error loading reading:",r),n.innerHTML='<p class="reading-modal__error" role="alert">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad. Zav\u0159i detail a zkus ho otev\u0159\xEDt znovu.</p>'}finally{a===d&&(E=null,n.setAttribute("aria-busy","false"),y())}}function O(){++d,E?.abort(),E=null;let e=document.getElementById("reading-modal");e&&(e.classList.remove("is-visible"),e.hidden=!0),B=null,f=null,g=!1,document.getElementById("reading-modal-content")?.setAttribute("aria-busy","false"),y(),fe()}async function Ce(){if(!D())return;let e=f,t=d;g=!0,y();try{let n=await de(e);if(t!==d||n===void 0)return;S=n,H()}finally{t===d&&(g=!1,y())}}async function de(e,t=null){try{let n=await fetch(`${u()}/user/readings/${encodeURIComponent(e)}/favorite`,{method:"PATCH",credentials:"include",headers:await x()});if(!n.ok)throw new Error("Failed to toggle favorite");let a=await n.json();if(typeof a.is_favorite!="boolean")throw new Error("Neplatn\xE1 odpov\u011B\u010F obl\xEDben\xFDch.");Y(!a.is_favorite,a.is_favorite),t&&(t.textContent=a.is_favorite?"\u2605":"\u2606",t.title=a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",t.setAttribute("aria-label",a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let i=K(),r=i.find(c=>c.id===e);r&&(r.is_favorite=a.is_favorite,j()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:i}}));let s=document.getElementById("tab-favorites");return s&&s.classList.contains("is-active")&&R(),a.is_favorite}catch(n){console.error("Error toggling favorite:",n),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}}async function Me(){if(!D())return;let e=f,t=d;if(confirm("Opravdu chce\u0161 smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit.")){g=!0,y();try{if(!(await fetch(`${u()}/user/readings/${encodeURIComponent(e)}`,{method:"DELETE",credentials:"include",headers:await x()})).ok)throw new Error("Failed to delete reading");window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),t===d&&O();let a=await M();document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:a}}))}catch(n){console.error("Error deleting reading:",n),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}finally{t===d&&(g=!1,y())}}}function D(){return f!==null&&f===B&&!g}function y(){["modal-favorite-btn","modal-delete-btn"].forEach(e=>{let t=document.getElementById(e);t&&(t.disabled=!D())})}function H(){let e=document.getElementById("modal-favorite-btn");e&&(e.textContent=S?"\u2605 V obl\xEDben\xFDch":"\u2606 P\u0159idat do obl\xEDben\xFDch",e.setAttribute("aria-label",S?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function ue(e){if(w===e)return;k=document.activeElement,w=e;let t=W(e);(e.querySelector(".modal__close")||t[0]||e).focus(),A=a=>{if(!w)return;if(a.key==="Escape"){a.preventDefault(),O();return}if(a.key!=="Tab")return;let i=W(w);if(!i.length){a.preventDefault(),w.focus();return}let r=i[0],s=i[i.length-1];a.shiftKey&&document.activeElement===r?(a.preventDefault(),s.focus()):!a.shiftKey&&document.activeElement===s&&(a.preventDefault(),r.focus())},document.addEventListener("keydown",A)}function fe(){if(A&&(document.removeEventListener("keydown",A),A=null),w=null,k){let e=k.closest("[data-reading-id]")?.dataset.readingId,t=[...document.querySelectorAll('[data-reading-action="view"]')].find(a=>a.dataset.readingId===e&&a.offsetParent!==null);(k.isConnected?k:t||document.querySelector('.profile-tab[aria-selected="true"]'))?.focus(),k=null}}function W(e){return Array.from(e.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(t=>t.offsetParent!==null)}function pe(e){e.querySelectorAll("[data-tarot-fallback]").forEach(t=>{t.addEventListener("error",()=>{t.dataset.fallbackApplied!=="1"&&(t.dataset.fallbackApplied="1",t.src="/img/tarot-v2/tarot_card_back.webp")})})}function I(e,t,n="neutral"){let a=e?.querySelector?.(".reading-feedback__status");a&&(a.textContent=t,a.dataset.state=n)}async function F(e,t,n,a){if(!e)return null;a&&(a.disabled=!0),I(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let i=null;if(window.Auth?.saveReadingFeedback)i=await window.Auth.saveReadingFeedback(e,{...t,feature:"profile_history",source:"profile_reading_modal"});else{let s=await fetch(`${u()}/user/readings/${encodeURIComponent(e)}/feedback`,{method:"PATCH",credentials:"include",headers:await x(!0),body:JSON.stringify({...t,feature:"profile_history",source:"profile_reading_modal"})});i=await s.json().catch(()=>null),s.ok||(i=null)}if(a&&(a.disabled=!1),!i?.success)return I(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null;i.reading&&G(e,i.reading);let r=await M();return document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:r}})),I(n,"Ulo\u017Eeno. Pam\u011B\u0165 profilu m\xE1 dal\u0161\xED sign\xE1l pro n\xE1vratov\xFD ritu\xE1l.","success"),i}function me(e){let t=e?.data;if(e?.type==="journal"||!t||typeof t!="object"||Array.isArray(t))return"";let n=t.feedback&&typeof t.feedback=="object"&&!Array.isArray(t.feedback)?t.feedback:{},a=le.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${o(r.label)}
        </button>
    `).join(""),i=ce.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.focus===r.value?"is-selected":""}" data-feedback-focus="${r.value}">
            ${o(r.label)}
        </button>
    `).join("");return`
        <section class="reading-feedback" data-reading-feedback="${o(e.id)}">
            <div class="reading-feedback__header">
                <span class="reading-feedback__eyebrow">Zp\u011Btn\xE1 vazba</span>
                <strong>Co m\xE1 profil br\xE1t jako dal\u0161\xED sign\xE1l?</strong>
            </div>
            <div class="reading-feedback__chips" aria-label="Zp\u011Btn\xE1 vazba k v\xFDkladu">
                ${a}
            </div>
            <div class="reading-feedback__chips" aria-label="T\xE9ma pro pam\u011B\u0165 ritu\xE1lu">
                ${i}
            </div>
            <div class="reading-feedback__actions">
                <button type="button" class="btn btn--glass btn--sm" data-feedback-next-action="journal">Zapsat reflexi</button>
                <a class="btn btn--glass btn--sm" href="tarot.html?source=profile_feedback&feature=another_reading" data-feedback-next-action="another_reading">Nav\xE1zat v\xFDkladem</a>
            </div>
            <p class="reading-feedback__status" aria-live="polite"></p>
        </section>
    `}function be(){O();let e=document.getElementById("journal-input");e&&(window.history.replaceState(null,"","#journal-input"),e.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>e.focus(),250))}function ge(e,t){let n=e.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async a=>{let i=a.target.closest("[data-feedback-resonance]"),r=a.target.closest("[data-feedback-focus]"),s=a.target.closest("[data-feedback-next-action]"),c=i||r||s;if(!c)return;let l={};if(i&&(l.resonance=i.dataset.feedbackResonance),r&&(l.focus=r.dataset.feedbackFocus),s&&(l.nextAction=s.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(v=>{(l.resonance&&v.dataset.feedbackResonance||l.focus&&v.dataset.feedbackFocus)&&v.classList.toggle("is-selected",v===c)}),s?.tagName==="A"){a.preventDefault(),(await F(t.id,l,n,null))?.success&&(window.location.href=s.getAttribute("href"));return}if(l.nextAction==="journal"){(await F(t.id,l,n,s))?.success&&be();return}await F(t.id,l,n,c)})}function ye(e){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[e]||String(e).replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function ve(e){return!e||typeof e!="object"?"":Object.entries(e).filter(([,t])=>t!=null&&t!=="").map(([t,n])=>{let a=typeof n=="object"?JSON.stringify(n,null,2):String(n);return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${o(ye(t))}</h4>
                    <p class="reading-structured-field__value">${o(a).replace(/\n/g,"<br>")}</p>
                </section>
            `}).join("")}function Q(e,t){let n=t.filter(a=>a.value!==null&&a.value!==void 0&&a.value!=="").map(a=>`
            <span class="reading-metric">
                <strong>${o(a.label)}</strong>
                <span>${o(a.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${o(e)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function he(e){let t=e?.summary;return t?Q("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:t.sunSign},{label:"M\u011Bs\xEDc",value:t.moonSign},{label:"Ascendent",value:t.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:t.dominantElement},{label:"Modalita",value:t.dominantQuality}]):""}function _e(e){let t=e?.synastry?.scores||e?.scores;return t?Q("Sk\xF3re vztahu",[{label:"Celkem",value:`${t.total??"--"} %`},{label:"Emoce",value:`${t.emotion??"--"} %`},{label:"Komunikace",value:`${t.communication??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${t.passion??"--"} %`},{label:"Stabilita",value:`${t.stability??"--"} %`}]):""}function ke(e){if(!e||typeof e!="object")return"";let t=Array.isArray(e.recommendations)?e.recommendations.slice(0,3):[],n=Array.isArray(e.angularLines)?e.angularLines.slice(0,4):[],a=t.map(r=>`
        <li>
            <strong>${o(r.city||"M\xEDsto")}</strong>
            <span>${o(r.score??"--")} / 100 \xB7 ${o(r.primaryPlanet?.name||"planeta")}</span>
        </li>
    `).join(""),i=n.map(r=>`
        <li>
            <strong>${o(r.planetName||"Planeta")} ${o(r.angle||"")}</strong>
            <span>${o(r.longitude??"--")}\xB0</span>
        </li>
    `).join("");return!a&&!i?"":`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">Astro mapa</h3>
            ${a?`<ul class="reading-summary-list">${a}</ul>`:""}
            ${i?`<ul class="reading-summary-list reading-summary-list--compact">${i}</ul>`:""}
        </section>
    `}function we(e){let t=new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${h(e.type)}</span>
            <h2 class="reading-detail__title">${o(L(e.type))}</h2>
            <p class="reading-detail__date">${t}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,a=e.data||{};a&&typeof a=="object"&&(e.type==="synastry"&&(n+=_e(a)),n+=he(a.chart||a.synastry?.person1?.chart),e.type==="astrocartography"&&(n+=ke(a.astrocartography)));function i(r){return r?`img/tarot-v2/tarot_${r.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_")}.webp`:"img/tarot-v2/tarot_card_back.webp"}if(typeof a=="string")n+=`<div class="reading-plain-text">${o(a).replace(/\n/g,"<br>")}</div>`;else if(e.type==="tarot"&&a.cards){n+='<div class="reading-tarot-grid">',a.cards.forEach(s=>{let c=i(s.name);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${o(c)}"
                              alt="${o(s.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${o(s.name)}</p>
                    ${s.position?`<small class="reading-tarot-card__position">${o(s.position)}</small>`:""}
                </div>
            `}),n+="</div>";let r=a.response||a.interpretation;if(r){let s=o(r).replace(/\n/g,"<br>");n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${s}
                    </div>
                </div>
            `}}else if(e.type==="horoscope"&&(a.text||a.prediction)){let r=a.text||a.prediction,c={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[a.period]||a.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${o(a.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${o(c)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${o(r)}
            </div>
        `,a.luckyNumbers&&(n+=`
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">\u0160\u0165astn\xE1 \u010D\xEDsla</span>
                    <span class="reading-lucky-numbers__value">${o(a.luckyNumbers.toString())}</span>
                </div>
            `)}else if(a.answer)a.question&&(n+=`
                <div class="reading-question">
                    <small class="reading-question__label">Ot\xE1zka</small>
                    <p class="reading-question__text">"${o(a.question)}"</p>
                </div>
            `),n+=`
            <div class="reading-answer">
                ${o(a.answer)}
            </div>
        `;else if(a.interpretation||a.response||a.text||a.result){let r=a.interpretation||a.response||a.text||a.result;if(typeof r=="string"){let s=o(r).replace(/\n/g,"<br>"),c=typeof DOMPurify<"u"?DOMPurify.sanitize(s):s;n+=`<div class="formatted-content reading-formatted-content">${c}</div>`}else n+=`<div class="reading-structured">${ve(r)}</div>`}else n+=`<pre class="reading-json">${o(JSON.stringify(a,null,2))}</pre>`;return n+="</div>",n+=me(e),n}export{O as closeReadingModal,Me as deleteReading,de as toggleFavorite,Ce as toggleFavoriteModal,Pe as viewReading};
