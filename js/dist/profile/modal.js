function o(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function c(){return window.API_CONFIG?.BASE_URL||"/api"}function p(e=!1){let t=window.Auth?.token,n={};return t&&(n.Authorization=`Bearer ${t}`),e&&(n["Content-Type"]="application/json"),n}async function k(e=!1){let t=p(e),n=window.getCSRFToken?await window.getCSRFToken():null;return n&&(t["X-CSRF-Token"]=n),t}function m(e){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[e]||"star"}" class="reading-type-icon"></i>`}function y(e){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Manifesta\u010Dn\xED den\xEDk","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[e]||"V\xFDklad"}var _=[],u="all",w=0,D=10,I={"crystal-ball":["crystal-ball","crystal"],"natal-chart":["natal-chart","natal"]},R=!1,T=!1;function N(){return _}function L(e,t){let n=_.find(a=>a.id===e);n&&Object.assign(n,t)}async function x(){let e=document.getElementById("readings-list");try{let t=await fetch(`${c()}/user/readings`,{credentials:"include",headers:p()});if(!t.ok)throw new Error("Failed to load readings");return _=(await t.json()).readings||[],w=0,A(),_}catch(t){return console.error("Error loading readings:",t),e&&(e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u26A0\uFE0F</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,e.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function O(){if(u==="all")return _;let e=I[u]||[u];return _.filter(t=>e.includes(t.type))}function B(e){return[...e].sort((t,n)=>new Date(n.created_at)-new Date(t.created_at))[0]||null}function z(e){return e==null?"":typeof e=="string"?e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase():Array.isArray(e)?e.map(z).join(" "):typeof e=="object"?Object.values(e).map(z).join(" "):String(e).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}function Z(e){let t=e?.data||{};return e?.type==="tarot"&&(t.tool==="tarot_yes_no"||t.source==="tarot_yes_no_result"||e?.source==="tarot_yes_no_save_journal"||e?.feature==="tarot_yes_no")}function V(e){let t=z([e?.title,e?.source,e?.feature,e?.data]);return["vztah","partner","partnerka","laska","miluje","milovat","rozchod","rande","manzel","manzelka","ozvat","sance"].some(n=>t.includes(n))}function K(e){return V(e)?{href:"partnerska-shoda.html?source=profile_history_next_step&feature=compatibility&intent=relationship_follow_up#form",label:"Prov\u011B\u0159it partnerskou shodu",feature:"compatibility",intent:"relationship_follow_up"}:{href:"tarot-tri-karty.html?source=profile_history_next_step&feature=tarot_multi_card&intent=three_cards_follow_up",label:"Roz\u0161\xED\u0159it na t\u0159i karty",feature:"tarot_multi_card",intent:"three_cards_follow_up"}}function q(e){let t=e?.type||"reading";return Z(e)?{title:"Nav\xE1zat na odpov\u011B\u010F ano/ne",description:"Ulo\u017Een\xE1 odpov\u011B\u010F m\xE1 nejv\u011Bt\u0161\xED hodnotu, kdy\u017E se k n\xED vr\xE1t\xED\u0161 jednou konkr\xE9tn\xED navazuj\xEDc\xED ot\xE1zkou.",href:"tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=yes_no_follow_up",label:"Polo\u017Eit navazuj\xEDc\xED ot\xE1zku",feature:"tarot_yes_no",intent:"yes_no_follow_up",secondary:K(e)}:t==="synastry"?{title:"Nav\xE1zat jednou konkr\xE9tn\xED vztahovou ot\xE1zkou",description:"Kdy\u017E u\u017E zn\xE1\u0161 dynamiku vztahu, dal\u0161\xED krok je kr\xE1tk\xE1 ot\xE1zka ano/ne k tomu, co te\u010F ud\u011Blat.",href:"tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=relationship_follow_up",label:"Zeptat se tarotu ano/ne",feature:"tarot_yes_no",intent:"relationship_follow_up",secondary:{href:"partnerska-shoda.html?source=profile_history_next_step&feature=compatibility&intent=relationship_context#form",label:"Vr\xE1tit se ke shod\u011B",feature:"compatibility",intent:"relationship_context"}}:t==="tarot"?{title:"Polo\u017Eit navazuj\xEDc\xED ot\xE1zku",description:"Den\xEDk m\xE1 nejv\u011Bt\u0161\xED hodnotu, kdy\u017E na prvn\xED odpov\u011B\u010F nav\xE1\u017Ee\u0161 jedn\xEDm dal\u0161\xEDm konkr\xE9tn\xEDm krokem.",href:"tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=follow_up",label:"Polo\u017Eit dal\u0161\xED ot\xE1zku",feature:"tarot_yes_no",intent:"follow_up",secondary:{href:"tarot-tri-karty.html?source=profile_history_next_step&feature=tarot_multi_card&intent=three_cards_follow_up",label:"Roz\u0161\xED\u0159it na t\u0159i karty",feature:"tarot_multi_card",intent:"three_cards_follow_up"}}:{title:"Prom\u011Bnit v\xFDklad v dal\u0161\xED krok",description:"Vyber si jednu praktickou ot\xE1zku a nech Den\xEDk dr\u017Eet souvislost mezi odpov\u011B\u010Fmi.",href:"partnerska-shoda.html?source=profile_history_next_step&feature=partnerska_detail&intent=relationship_follow_up",label:"Prov\u011B\u0159it vztahov\xE9 t\xE9ma",feature:"partnerska_detail",intent:"relationship_follow_up",secondary:{href:"tarot-tri-karty.html?source=profile_history_next_step&feature=tarot_multi_card&intent=three_cards_follow_up",label:"Roz\u0161\xED\u0159it na t\u0159i karty",feature:"tarot_multi_card",intent:"three_cards_follow_up"}}}function U(e){if(u!=="all"||e.length===0)return"";let t=B(e),n=q(t);return T||(T=!0,window.MH_ANALYTICS?.trackEvent?.("profile_history_next_step_viewed",{source:"profile_history",feature:"profile_history",reading_count:e.length,latest_type:t?.type||null})),`
        <div class="profile-history-next-step">
            <div class="profile-history-next-step__copy">
                <span class="profile-history-next-step__eyebrow">Dal\u0161\xED krok po ulo\u017Een\xED</span>
                <strong>${o(n.title)}</strong>
                <p>${o(n.description)}</p>
            </div>
            <div class="profile-history-next-step__actions">
                ${t?.id?`<button class="btn btn--glass btn--sm" data-reading-action="view" data-reading-id="${o(t.id)}">Vr\xE1tit se k posledn\xEDmu v\xFDkladu</button>`:""}
                <a href="${o(n.href)}" class="btn btn--primary btn--sm" data-profile-history-next-step="${o(n.intent)}" data-analytics-cta="profile_history_next_step" data-analytics-feature="${o(n.feature)}">${o(n.label)}</a>
                ${n.secondary?`<a href="${o(n.secondary.href)}" class="btn btn--glass btn--sm" data-profile-history-next-step="${o(n.secondary.intent)}" data-analytics-cta="profile_history_next_step_secondary" data-analytics-feature="${o(n.secondary.feature)}">${o(n.secondary.label)}</a>`:""}
            </div>
        </div>
    `}function A(){let e=document.getElementById("readings-list");if(!e)return;let t=O();if(t.length===0){u==="all"&&!R&&(R=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u{1F52E}</div>
                <h4 class="empty-state__title">${u==="all"?"Ulo\u017E prvn\xED odpov\u011B\u010F a vra\u0165 se k n\xED pozd\u011Bji":"Tady zat\xEDm nen\xED \u017E\xE1dn\xFD v\xFDklad tohoto typu"}</h4>
                <p class="empty-state__text">${u==="all"?"Den\xEDk dr\u017E\xED tvoje ot\xE1zky, odpov\u011Bdi a opakuj\xEDc\xED se t\xE9mata pohromad\u011B. Za\u010Dni kr\xE1tk\xFDm v\xFDkladem ano/ne, ulo\u017E prvn\xED odpov\u011B\u010F a vra\u0165 se k n\xED, a\u017E bude\u0161 \u0159e\u0161it dal\u0161\xED krok.":"Filtr je pr\xE1zdn\xFD. Zkus jin\xFD typ v\xFDkladu nebo se vra\u0165 na celou historii."}</p>
                ${u==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot-ano-ne.html?source=profile_history_empty&feature=tarot_yes_no&intent=yes_no" class="btn btn--primary btn--sm" data-analytics-cta="profile_empty_tarot_yes_no" data-analytics-feature="tarot_yes_no">Tarot ano/ne</a>
                        <a href="tarot-tri-karty.html?source=profile_history_empty&feature=tarot_multi_card&intent=three_cards" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_three_cards" data-analytics-feature="tarot_multi_card">T\u0159i karty</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule&intent=yes_no_question" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_crystal_ball" data-analytics-feature="kristalova_koule">K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                    </div>
                `:""}
            </div>
        `,P(0,0);return}let n=t.slice(0,w+D);w=n.length,e.innerHTML=`${U(t)}${n.map(a=>`
        <div class="reading-item card" data-reading-id="${o(a.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${m(a.type)}</span>
                    <div>
                        <strong>${o(y(a.type))}</strong>
                        <p class="reading-item__date">
                            ${new Date(a.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${o(a.id)}"
                        title="${a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}">
                        ${a.is_favorite?"\u2B50":"\u2606"}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${o(a.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join("")}`,P(w,t.length)}function P(e,t){let n=document.getElementById("readings-pagination");if(n)if(e<t){n.hidden=!1,n.classList.add("profile-block-visible");let a=document.getElementById("readings-load-more");a&&(a.textContent=`Na\u010D\xEDst dal\u0161\xED (${t-e} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}function J(e=0){let t=e>0;return`
        <div class="empty-state">
            <div class="empty-state__icon">\u2B50</div>
            <h4 class="empty-state__title">${t?"Vyber si prvn\xED v\xFDklad pro n\xE1vrat":"Obl\xEDben\xE9 zat\xEDm \u010Dekaj\xED na prvn\xED n\xE1vrat"}</h4>
            <p class="empty-state__text">${t?"Najdi v historii v\xFDklad, ke kter\xE9mu se chce\u0161 vr\xE1tit. Hv\u011Bzda z n\u011Bj ud\u011Bl\xE1 kr\xE1tk\xFD seznam t\xE9mat, kter\xE1 se opakuj\xED.":"Za\u010Dni jedn\xEDm v\xFDkladem. Obl\xEDben\xE9 pak nejsou sb\xEDrka hv\u011Bzdi\u010Dek, ale m\xEDsto pro odpov\u011Bdi, kter\xE9 maj\xED z\u016Fstat po ruce."}</p>
            <div class="empty-state__actions">
                ${t?'<button type="button" class="btn btn--primary btn--sm" data-profile-tab-target="history">Otev\u0159\xEDt historii</button>':'<a href="tarot.html?source=profile_favorites_empty&feature=tarot" class="btn btn--primary btn--sm">\u{1F0CF} Tarot</a><a href="horoskopy.html?source=profile_favorites_empty&feature=daily_guidance" class="btn btn--glass btn--sm">\u2B50 Denn\xED horoskop</a>'}
            </div>
        </div>
    `}async function C(){let e=document.getElementById("favorites-list");if(e){e.innerHTML='<p class="profile-loading">Na\u010D\xEDt\xE1n\xED...</p>';try{let t=await fetch(`${c()}/user/readings`,{credentials:"include",headers:p()});if(!t.ok)throw new Error("Failed to load readings");let a=(await t.json()).readings||[],i=a.filter(r=>r.is_favorite);if(i.length===0){e.innerHTML=J(a.length);return}e.innerHTML=i.map(r=>`
            <div class="reading-item card" data-reading-id="${o(r.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${m(r.type)}</span>
                        <div>
                            <strong>${o(y(r.type))}</strong>
                            <p class="reading-item__date">
                                ${new Date(r.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric"})}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${o(r.id)}" title="Odebrat z obl\xEDben\xFDch" aria-label="Odebrat z obl\xEDben\xFDch">\u2B50</button>
                        <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${o(r.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join("")}catch(t){console.error("Error loading favorites:",t),e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u26A0\uFE0F</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
            </div>
        `}}}var b=null,v=!1,$=null,g=null,h=null,Y=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],G=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function ge(e){let t=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!(!t||!n)){b=e,t.hidden=!1,t.classList.add("is-visible"),n.innerHTML='<p class="reading-modal__loading">Na\u010D\xEDt\xE1n\xED...</p>',Q(t);try{let a=await fetch(`${c()}/user/readings/${e}`,{credentials:"include",headers:p()});if(!a.ok)throw new Error("Failed to fetch reading");let r=(await a.json()).reading;v=r.is_favorite,M(),n.innerHTML=de(r),ee(n),ne(n,r)}catch(a){console.error("Error loading reading:",a),n.innerHTML='<p class="reading-modal__error">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad.</p>'}}}function S(){let e=document.getElementById("reading-modal");e&&(e.classList.remove("is-visible"),e.hidden=!0),b=null,X()}async function he(){b&&(await W(b),v=!v,M())}async function W(e,t=null){try{let n=await fetch(`${c()}/user/readings/${e}/favorite`,{method:"PATCH",credentials:"include",headers:await k()});if(!n.ok)throw new Error("Failed to toggle favorite");let a=await n.json();t&&(t.textContent=a.is_favorite?"\u2B50":"\u2606",t.title=a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",t.setAttribute("aria-label",a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let i=N(),r=i.find(l=>l.id===e);r&&(r.is_favorite=a.is_favorite,A()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:i}}));let s=document.getElementById("tab-favorites");s&&s.classList.contains("is-active")&&C()}catch(n){console.error("Error toggling favorite:",n),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}}async function ve(){if(b&&confirm("Opravdu chcete smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))try{if(!(await fetch(`${c()}/user/readings/${b}`,{method:"DELETE",credentials:"include",headers:await k()})).ok)throw new Error("Failed to delete reading");window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),S();let t=await x();document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:t}}))}catch(e){console.error("Error deleting reading:",e),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}}function M(){let e=document.getElementById("modal-favorite-btn");e&&(e.textContent=v?"\u2B50 V obl\xEDben\xFDch":"\u2606 P\u0159idat do obl\xEDben\xFDch",e.setAttribute("aria-label",v?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function Q(e){$=document.activeElement,g=e;let t=F(e);(e.querySelector(".modal__close")||t[0]||e).focus(),h=a=>{if(!g)return;if(a.key==="Escape"){a.preventDefault(),S();return}if(a.key!=="Tab")return;let i=F(g);if(!i.length){a.preventDefault(),g.focus();return}let r=i[0],s=i[i.length-1];a.shiftKey&&document.activeElement===r?(a.preventDefault(),s.focus()):!a.shiftKey&&document.activeElement===s&&(a.preventDefault(),r.focus())},document.addEventListener("keydown",h)}function X(){h&&(document.removeEventListener("keydown",h),h=null),g=null,$&&($.focus(),$=null)}function F(e){return Array.from(e.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(t=>t.offsetParent!==null)}function ee(e){e.querySelectorAll("[data-tarot-fallback]").forEach(t=>{t.addEventListener("error",()=>{t.dataset.fallbackApplied!=="1"&&(t.dataset.fallbackApplied="1",t.src="/img/tarot/tarot_placeholder.webp")})})}function E(e,t,n="neutral"){let a=e?.querySelector?.(".reading-feedback__status");a&&(a.textContent=t,a.dataset.state=n)}async function j(e,t,n,a){if(!e)return null;a&&(a.disabled=!0),E(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let i=null;if(window.Auth?.saveReadingFeedback)i=await window.Auth.saveReadingFeedback(e,{...t,feature:"profile_history",source:"profile_reading_modal"});else{let s=await fetch(`${c()}/user/readings/${encodeURIComponent(e)}/feedback`,{method:"PATCH",credentials:"include",headers:await k(!0),body:JSON.stringify({...t,feature:"profile_history",source:"profile_reading_modal"})});i=await s.json().catch(()=>null),s.ok||(i=null)}if(a&&(a.disabled=!1),!i?.success)return E(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null;i.reading&&L(e,i.reading);let r=await x();return document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:r}})),E(n,"Ulo\u017Eeno. Pam\u011B\u0165 profilu m\xE1 dal\u0161\xED sign\xE1l pro n\xE1vratov\xFD ritu\xE1l.","success"),i}function te(e){let t=e?.data;if(e?.type==="journal"||!t||typeof t!="object"||Array.isArray(t))return"";let n=t.feedback&&typeof t.feedback=="object"&&!Array.isArray(t.feedback)?t.feedback:{},a=Y.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${o(r.label)}
        </button>
    `).join(""),i=G.map(r=>`
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
    `}function ae(){S();let e=document.getElementById("journal-input");e&&(window.history.replaceState(null,"","#journal-input"),e.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>e.focus(),250))}function ne(e,t){let n=e.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async a=>{let i=a.target.closest("[data-feedback-resonance]"),r=a.target.closest("[data-feedback-focus]"),s=a.target.closest("[data-feedback-next-action]"),l=i||r||s;if(!l)return;let d={};if(i&&(d.resonance=i.dataset.feedbackResonance),r&&(d.focus=r.dataset.feedbackFocus),s&&(d.nextAction=s.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(f=>{(d.resonance&&f.dataset.feedbackResonance||d.focus&&f.dataset.feedbackFocus)&&f.classList.toggle("is-selected",f===l)}),s?.tagName==="A"){a.preventDefault(),(await j(t.id,d,n,null))?.success&&(window.location.href=s.getAttribute("href"));return}if(d.nextAction==="journal"){(await j(t.id,d,n,s))?.success&&ae();return}await j(t.id,d,n,l)})}function re(e){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[e]||String(e).replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function oe(e){return!e||typeof e!="object"?"":Object.entries(e).filter(([,t])=>t!=null&&t!=="").map(([t,n])=>{let a=typeof n=="object"?JSON.stringify(n,null,2):String(n);return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${o(re(t))}</h4>
                    <p class="reading-structured-field__value">${o(a).replace(/\n/g,"<br>")}</p>
                </section>
            `}).join("")}function H(e,t){let n=t.filter(a=>a.value!==null&&a.value!==void 0&&a.value!=="").map(a=>`
            <span class="reading-metric">
                <strong>${o(a.label)}</strong>
                <span>${o(a.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${o(e)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function ie(e){let t=e?.summary;return t?H("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:t.sunSign},{label:"M\u011Bs\xEDc",value:t.moonSign},{label:"Ascendent",value:t.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:t.dominantElement},{label:"Modalita",value:t.dominantQuality}]):""}function se(e){let t=e?.synastry?.scores||e?.scores;return t?H("Sk\xF3re vztahu",[{label:"Celkem",value:`${t.total??"--"} %`},{label:"Emoce",value:`${t.emotion??"--"} %`},{label:"Komunikace",value:`${t.communication??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${t.passion??"--"} %`},{label:"Stabilita",value:`${t.stability??"--"} %`}]):""}function le(e){if(!e||typeof e!="object")return"";let t=Array.isArray(e.recommendations)?e.recommendations.slice(0,3):[],n=Array.isArray(e.angularLines)?e.angularLines.slice(0,4):[],a=t.map(r=>`
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
    `}function de(e){let t=new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${m(e.type)}</span>
            <h2 class="reading-detail__title">${o(y(e.type))}</h2>
            <p class="reading-detail__date">${t}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,a=e.data||{};a&&typeof a=="object"&&(e.type==="synastry"&&(n+=se(a)),n+=ie(a.chart||a.synastry?.person1?.chart),e.type==="astrocartography"&&(n+=le(a.astrocartography)));function i(r){return r?`img/tarot/tarot_${r.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_")}.webp`:"img/tarot/tarot_placeholder.webp"}if(typeof a=="string")n+=`<div class="reading-plain-text">${o(a).replace(/\n/g,"<br>")}</div>`;else if(e.type==="tarot"&&a.cards){n+='<div class="reading-tarot-grid">',a.cards.forEach(s=>{let l=i(s.name);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${o(l)}"
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
            `}}else if(e.type==="horoscope"&&(a.text||a.prediction)){let r=a.text||a.prediction,l={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[a.period]||a.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${o(a.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${o(l)}</span>
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
        `;else if(a.interpretation||a.response||a.text||a.result){let r=a.interpretation||a.response||a.text||a.result;if(typeof r=="string"){let s=o(r).replace(/\n/g,"<br>"),l=typeof DOMPurify<"u"?DOMPurify.sanitize(s):s;n+=`<div class="formatted-content reading-formatted-content">${l}</div>`}else n+=`<div class="reading-structured">${oe(r)}</div>`}else n+=`<pre class="reading-json">${o(JSON.stringify(a,null,2))}</pre>`;return n+="</div>",n+=te(e),n}export{S as closeReadingModal,ve as deleteReading,W as toggleFavorite,he as toggleFavoriteModal,ge as viewReading};
