function i(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function c(){return window.API_CONFIG?.BASE_URL||"/api"}function p(e=!1){let t=window.Auth?.token,n={};return t&&(n.Authorization=`Bearer ${t}`),e&&(n["Content-Type"]="application/json"),n}async function k(e=!1){let t=p(e),n=window.getCSRFToken?await window.getCSRFToken():null;return n&&(t["X-CSRF-Token"]=n),t}function b(e){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[e]||"star"}" class="reading-type-icon"></i>`}function y(e){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Manifesta\u010Dn\xED den\xEDk","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[e]||"V\xFDklad"}var f=[],u="all",w=0,I=10,D={"crystal-ball":["crystal-ball","crystal"],"natal-chart":["natal-chart","natal"]},j=!1,P=!1,L=!1;function R(){return f}function N(e,t){let n=f.find(a=>a.id===e);n&&Object.assign(n,t)}async function z(){let e=document.getElementById("readings-list");try{let t=await fetch(`${c()}/user/readings`,{credentials:"include",headers:p()});if(!t.ok)throw new Error("Failed to load readings");return f=(await t.json()).readings||[],w=0,A(),f}catch(t){return console.error("Error loading readings:",t),e&&(e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u26A0\uFE0F</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,e.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function O(){if(u==="all")return f;let e=D[u]||[u];return f.filter(t=>e.includes(t.type))}function B(e){return[...e].sort((t,n)=>new Date(n.created_at)-new Date(t.created_at))[0]||null}function V(e){let t=e?.type||"reading";return t==="synastry"?{title:"Nav\xE1zat jednou konkr\xE9tn\xED vztahovou ot\xE1zkou",description:"Kdy\u017E u\u017E zn\xE1\u0161 dynamiku vztahu, dal\u0161\xED krok je kr\xE1tk\xE1 ot\xE1zka ano/ne k tomu, co te\u010F ud\u011Blat.",href:"tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=relationship_follow_up",label:"Zeptat se tarotu ano/ne",feature:"tarot_yes_no",intent:"relationship_follow_up"}:t==="tarot"?{title:"Polo\u017Eit navazuj\xEDc\xED ot\xE1zku",description:"Den\xEDk m\xE1 nejv\u011Bt\u0161\xED hodnotu, kdy\u017E na prvn\xED odpov\u011B\u010F nav\xE1\u017Ee\u0161 jedn\xEDm dal\u0161\xEDm konkr\xE9tn\xEDm krokem.",href:"tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=follow_up",label:"Polo\u017Eit dal\u0161\xED ot\xE1zku",feature:"tarot_yes_no",intent:"follow_up"}:{title:"Prom\u011Bnit v\xFDklad v dal\u0161\xED krok",description:"Vyber si jednu praktickou ot\xE1zku a nech Den\xEDk dr\u017Eet souvislost mezi odpov\u011B\u010Fmi.",href:"partnerska-shoda.html?source=profile_history_next_step&feature=partnerska_detail&intent=relationship_follow_up",label:"Prov\u011B\u0159it vztahov\xE9 t\xE9ma",feature:"partnerska_detail",intent:"relationship_follow_up"}}function Z(e){if(u!=="all"||e.length===0)return"";let t=B(e),n=V(t);return P||(P=!0,window.MH_ANALYTICS?.trackEvent?.("profile_history_next_step_viewed",{source:"profile_history",feature:"profile_history",reading_count:e.length,latest_type:t?.type||null})),`
        <div class="profile-history-next-step">
            <div class="profile-history-next-step__copy">
                <span class="profile-history-next-step__eyebrow">Dal\u0161\xED krok po ulo\u017Een\xED</span>
                <strong>${i(n.title)}</strong>
                <p>${i(n.description)}</p>
            </div>
            <div class="profile-history-next-step__actions">
                ${t?.id?`<button class="btn btn--glass btn--sm" data-reading-action="view" data-reading-id="${i(t.id)}">Vr\xE1tit se k posledn\xEDmu v\xFDkladu</button>`:""}
                <a href="${i(n.href)}" class="btn btn--primary btn--sm" data-profile-history-next-step="${i(n.intent)}" data-analytics-cta="profile_history_next_step" data-analytics-feature="${i(n.feature)}">${i(n.label)}</a>
            </div>
        </div>
    `}function K(){return L||(L=!0,window.MH_ANALYTICS?.trackEvent?.("profile_activation_viewed",{source:"profile_history",feature:"profile_history"})),`
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
    `}function A(){let e=document.getElementById("readings-list");if(!e)return;let t=O();if(u==="all"&&f.length===0){e.innerHTML=K(),x(0,0);return}if(t.length===0){u==="all"&&!j&&(j=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u{1F52E}</div>
                <h4 class="empty-state__title">${u==="all"?"Den\xEDk v\xFDklad\u016F zat\xEDm \u010Dek\xE1 na prvn\xED odpov\u011B\u010F":"Tady zat\xEDm nen\xED \u017E\xE1dn\xFD v\xFDklad tohoto typu"}</h4>
                <p class="empty-state__text">${u==="all"?"Tady se budou dr\u017Eet tvoje ot\xE1zky, odpov\u011Bdi a opakuj\xEDc\xED se t\xE9mata. Za\u010Dni kr\xE1tk\xFDm v\xFDkladem, a\u0165 m\xE1 profil prvn\xED sign\xE1l pro n\xE1vrat.":"Filtr je pr\xE1zdn\xFD. Zkus jin\xFD typ v\xFDkladu nebo se vra\u0165 na celou historii."}</p>
                ${u==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot-ano-ne.html?source=profile_history_empty&feature=tarot_yes_no&intent=yes_no" class="btn btn--primary btn--sm" data-analytics-cta="profile_empty_tarot_yes_no" data-analytics-feature="tarot_yes_no">Tarot ano/ne</a>
                        <a href="tarot-tri-karty.html?source=profile_history_empty&feature=tarot_multi_card&intent=three_cards" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_three_cards" data-analytics-feature="tarot_multi_card">T\u0159i karty</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule&intent=yes_no_question" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_crystal_ball" data-analytics-feature="kristalova_koule">K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                    </div>
                `:""}
            </div>
        `,x(0,0);return}let n=t.slice(0,w+I);w=n.length,e.innerHTML=`${Z(t)}${n.map(a=>`
        <div class="reading-item card" data-reading-id="${i(a.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${b(a.type)}</span>
                    <div>
                        <strong>${i(y(a.type))}</strong>
                        <p class="reading-item__date">
                            ${new Date(a.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${i(a.id)}"
                        title="${a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}">
                        ${a.is_favorite?"\u2B50":"\u2606"}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${i(a.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join("")}`,x(w,t.length)}function x(e,t){let n=document.getElementById("readings-pagination");if(n)if(e<t){n.hidden=!1,n.classList.add("profile-block-visible");let a=document.getElementById("readings-load-more");a&&(a.textContent=`Na\u010D\xEDst dal\u0161\xED (${t-e} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}function q(e=0){let t=e>0;return`
        <div class="empty-state">
            <div class="empty-state__icon">\u2B50</div>
            <h4 class="empty-state__title">${t?"Vyber si prvn\xED v\xFDklad pro n\xE1vrat":"Obl\xEDben\xE9 zat\xEDm \u010Dekaj\xED na prvn\xED n\xE1vrat"}</h4>
            <p class="empty-state__text">${t?"Najdi v historii v\xFDklad, ke kter\xE9mu se chce\u0161 vr\xE1tit. Hv\u011Bzda z n\u011Bj ud\u011Bl\xE1 kr\xE1tk\xFD seznam t\xE9mat, kter\xE1 se opakuj\xED.":"Za\u010Dni jedn\xEDm v\xFDkladem. Obl\xEDben\xE9 pak nejsou sb\xEDrka hv\u011Bzdi\u010Dek, ale m\xEDsto pro odpov\u011Bdi, kter\xE9 maj\xED z\u016Fstat po ruce."}</p>
            <div class="empty-state__actions">
                ${t?'<button type="button" class="btn btn--primary btn--sm" data-profile-tab-target="history">Otev\u0159\xEDt historii</button>':'<a href="tarot.html?source=profile_favorites_empty&feature=tarot" class="btn btn--primary btn--sm">\u{1F0CF} Tarot</a><a href="horoskopy.html?source=profile_favorites_empty&feature=daily_guidance" class="btn btn--glass btn--sm">\u2B50 Denn\xED horoskop</a>'}
            </div>
        </div>
    `}async function C(){let e=document.getElementById("favorites-list");if(e){e.innerHTML='<p class="profile-loading">Na\u010D\xEDt\xE1n\xED...</p>';try{let t=await fetch(`${c()}/user/readings`,{credentials:"include",headers:p()});if(!t.ok)throw new Error("Failed to load readings");let a=(await t.json()).readings||[],o=a.filter(r=>r.is_favorite);if(o.length===0){e.innerHTML=q(a.length);return}e.innerHTML=o.map(r=>`
            <div class="reading-item card" data-reading-id="${i(r.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${b(r.type)}</span>
                        <div>
                            <strong>${i(y(r.type))}</strong>
                            <p class="reading-item__date">
                                ${new Date(r.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric"})}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${i(r.id)}" title="Odebrat z obl\xEDben\xFDch" aria-label="Odebrat z obl\xEDben\xFDch">\u2B50</button>
                        <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${i(r.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join("")}catch(t){console.error("Error loading favorites:",t),e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u26A0\uFE0F</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
            </div>
        `}}}var g=null,h=!1,$=null,v=null,_=null,U=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],J=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function ye(e){let t=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!(!t||!n)){g=e,t.hidden=!1,t.classList.add("is-visible"),n.innerHTML='<p class="reading-modal__loading">Na\u010D\xEDt\xE1n\xED...</p>',G(t);try{let a=await fetch(`${c()}/user/readings/${e}`,{credentials:"include",headers:p()});if(!a.ok)throw new Error("Failed to fetch reading");let r=(await a.json()).reading;h=r.is_favorite,M(),n.innerHTML=se(r),Q(n),te(n,r)}catch(a){console.error("Error loading reading:",a),n.innerHTML='<p class="reading-modal__error">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad.</p>'}}}function T(){let e=document.getElementById("reading-modal");e&&(e.classList.remove("is-visible"),e.hidden=!0),g=null,W()}async function ge(){g&&(await Y(g),h=!h,M())}async function Y(e,t=null){try{let n=await fetch(`${c()}/user/readings/${e}/favorite`,{method:"PATCH",credentials:"include",headers:await k()});if(!n.ok)throw new Error("Failed to toggle favorite");let a=await n.json();t&&(t.textContent=a.is_favorite?"\u2B50":"\u2606",t.title=a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",t.setAttribute("aria-label",a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let o=R(),r=o.find(l=>l.id===e);r&&(r.is_favorite=a.is_favorite,A()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:o}}));let s=document.getElementById("tab-favorites");s&&s.classList.contains("is-active")&&C()}catch(n){console.error("Error toggling favorite:",n),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}}async function ve(){if(g&&confirm("Opravdu chcete smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))try{if(!(await fetch(`${c()}/user/readings/${g}`,{method:"DELETE",credentials:"include",headers:await k()})).ok)throw new Error("Failed to delete reading");window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),T();let t=await z();document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:t}}))}catch(e){console.error("Error deleting reading:",e),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}}function M(){let e=document.getElementById("modal-favorite-btn");e&&(e.textContent=h?"\u2B50 V obl\xEDben\xFDch":"\u2606 P\u0159idat do obl\xEDben\xFDch",e.setAttribute("aria-label",h?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function G(e){$=document.activeElement,v=e;let t=F(e);(e.querySelector(".modal__close")||t[0]||e).focus(),_=a=>{if(!v)return;if(a.key==="Escape"){a.preventDefault(),T();return}if(a.key!=="Tab")return;let o=F(v);if(!o.length){a.preventDefault(),v.focus();return}let r=o[0],s=o[o.length-1];a.shiftKey&&document.activeElement===r?(a.preventDefault(),s.focus()):!a.shiftKey&&document.activeElement===s&&(a.preventDefault(),r.focus())},document.addEventListener("keydown",_)}function W(){_&&(document.removeEventListener("keydown",_),_=null),v=null,$&&($.focus(),$=null)}function F(e){return Array.from(e.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(t=>t.offsetParent!==null)}function Q(e){e.querySelectorAll("[data-tarot-fallback]").forEach(t=>{t.addEventListener("error",()=>{t.dataset.fallbackApplied!=="1"&&(t.dataset.fallbackApplied="1",t.src="/img/tarot/tarot_placeholder.webp")})})}function E(e,t,n="neutral"){let a=e?.querySelector?.(".reading-feedback__status");a&&(a.textContent=t,a.dataset.state=n)}async function S(e,t,n,a){if(!e)return null;a&&(a.disabled=!0),E(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let o=null;if(window.Auth?.saveReadingFeedback)o=await window.Auth.saveReadingFeedback(e,{...t,feature:"profile_history",source:"profile_reading_modal"});else{let s=await fetch(`${c()}/user/readings/${encodeURIComponent(e)}/feedback`,{method:"PATCH",credentials:"include",headers:await k(!0),body:JSON.stringify({...t,feature:"profile_history",source:"profile_reading_modal"})});o=await s.json().catch(()=>null),s.ok||(o=null)}if(a&&(a.disabled=!1),!o?.success)return E(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null;o.reading&&N(e,o.reading);let r=await z();return document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:r}})),E(n,"Ulo\u017Eeno. Pam\u011B\u0165 profilu m\xE1 dal\u0161\xED sign\xE1l pro n\xE1vratov\xFD ritu\xE1l.","success"),o}function X(e){let t=e?.data;if(e?.type==="journal"||!t||typeof t!="object"||Array.isArray(t))return"";let n=t.feedback&&typeof t.feedback=="object"&&!Array.isArray(t.feedback)?t.feedback:{},a=U.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${i(r.label)}
        </button>
    `).join(""),o=J.map(r=>`
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
                ${a}
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
    `}function ee(){T();let e=document.getElementById("journal-input");e&&(window.history.replaceState(null,"","#journal-input"),e.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>e.focus(),250))}function te(e,t){let n=e.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async a=>{let o=a.target.closest("[data-feedback-resonance]"),r=a.target.closest("[data-feedback-focus]"),s=a.target.closest("[data-feedback-next-action]"),l=o||r||s;if(!l)return;let d={};if(o&&(d.resonance=o.dataset.feedbackResonance),r&&(d.focus=r.dataset.feedbackFocus),s&&(d.nextAction=s.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(m=>{(d.resonance&&m.dataset.feedbackResonance||d.focus&&m.dataset.feedbackFocus)&&m.classList.toggle("is-selected",m===l)}),s?.tagName==="A"){a.preventDefault(),(await S(t.id,d,n,null))?.success&&(window.location.href=s.getAttribute("href"));return}if(d.nextAction==="journal"){(await S(t.id,d,n,s))?.success&&ee();return}await S(t.id,d,n,l)})}function ae(e){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[e]||String(e).replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function ne(e){return!e||typeof e!="object"?"":Object.entries(e).filter(([,t])=>t!=null&&t!=="").map(([t,n])=>{let a=typeof n=="object"?JSON.stringify(n,null,2):String(n);return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${i(ae(t))}</h4>
                    <p class="reading-structured-field__value">${i(a).replace(/\n/g,"<br>")}</p>
                </section>
            `}).join("")}function H(e,t){let n=t.filter(a=>a.value!==null&&a.value!==void 0&&a.value!=="").map(a=>`
            <span class="reading-metric">
                <strong>${i(a.label)}</strong>
                <span>${i(a.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${i(e)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function re(e){let t=e?.summary;return t?H("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:t.sunSign},{label:"M\u011Bs\xEDc",value:t.moonSign},{label:"Ascendent",value:t.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:t.dominantElement},{label:"Modalita",value:t.dominantQuality}]):""}function ie(e){let t=e?.synastry?.scores||e?.scores;return t?H("Sk\xF3re vztahu",[{label:"Celkem",value:`${t.total??"--"} %`},{label:"Emoce",value:`${t.emotion??"--"} %`},{label:"Komunikace",value:`${t.communication??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${t.passion??"--"} %`},{label:"Stabilita",value:`${t.stability??"--"} %`}]):""}function oe(e){if(!e||typeof e!="object")return"";let t=Array.isArray(e.recommendations)?e.recommendations.slice(0,3):[],n=Array.isArray(e.angularLines)?e.angularLines.slice(0,4):[],a=t.map(r=>`
        <li>
            <strong>${i(r.city||"M\xEDsto")}</strong>
            <span>${i(r.score??"--")} / 100 \xB7 ${i(r.primaryPlanet?.name||"planeta")}</span>
        </li>
    `).join(""),o=n.map(r=>`
        <li>
            <strong>${i(r.planetName||"Planeta")} ${i(r.angle||"")}</strong>
            <span>${i(r.longitude??"--")}\xB0</span>
        </li>
    `).join("");return!a&&!o?"":`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">Astro mapa</h3>
            ${a?`<ul class="reading-summary-list">${a}</ul>`:""}
            ${o?`<ul class="reading-summary-list reading-summary-list--compact">${o}</ul>`:""}
        </section>
    `}function se(e){let t=new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${b(e.type)}</span>
            <h2 class="reading-detail__title">${i(y(e.type))}</h2>
            <p class="reading-detail__date">${t}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,a=e.data||{};a&&typeof a=="object"&&(e.type==="synastry"&&(n+=ie(a)),n+=re(a.chart||a.synastry?.person1?.chart),e.type==="astrocartography"&&(n+=oe(a.astrocartography)));function o(r){return r?`img/tarot/tarot_${r.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_")}.webp`:"img/tarot/tarot_placeholder.webp"}if(typeof a=="string")n+=`<div class="reading-plain-text">${i(a).replace(/\n/g,"<br>")}</div>`;else if(e.type==="tarot"&&a.cards){n+='<div class="reading-tarot-grid">',a.cards.forEach(s=>{let l=o(s.name);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${i(l)}"
                              alt="${i(s.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${i(s.name)}</p>
                    ${s.position?`<small class="reading-tarot-card__position">${i(s.position)}</small>`:""}
                </div>
            `}),n+="</div>";let r=a.response||a.interpretation;if(r){let s=i(r).replace(/\n/g,"<br>");n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${s}
                    </div>
                </div>
            `}}else if(e.type==="horoscope"&&(a.text||a.prediction)){let r=a.text||a.prediction,l={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[a.period]||a.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${i(a.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${i(l)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${i(r)}
            </div>
        `,a.luckyNumbers&&(n+=`
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">\u0160\u0165astn\xE1 \u010D\xEDsla</span>
                    <span class="reading-lucky-numbers__value">${i(a.luckyNumbers.toString())}</span>
                </div>
            `)}else if(a.answer)a.question&&(n+=`
                <div class="reading-question">
                    <small class="reading-question__label">Ot\xE1zka</small>
                    <p class="reading-question__text">"${i(a.question)}"</p>
                </div>
            `),n+=`
            <div class="reading-answer">
                ${i(a.answer)}
            </div>
        `;else if(a.interpretation||a.response||a.text||a.result){let r=a.interpretation||a.response||a.text||a.result;if(typeof r=="string"){let s=i(r).replace(/\n/g,"<br>"),l=typeof DOMPurify<"u"?DOMPurify.sanitize(s):s;n+=`<div class="formatted-content reading-formatted-content">${l}</div>`}else n+=`<div class="reading-structured">${ne(r)}</div>`}else n+=`<pre class="reading-json">${i(JSON.stringify(a,null,2))}</pre>`;return n+="</div>",n+=X(e),n}export{T as closeReadingModal,ve as deleteReading,Y as toggleFavorite,ge as toggleFavoriteModal,ye as viewReading};
