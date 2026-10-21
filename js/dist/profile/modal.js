function V(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}function i(t){if(!t)return"";let a=document.createElement("div");return a.textContent=t,a.innerHTML}function k(){return window.API_CONFIG?.BASE_URL||"/api"}function R(t=!1){let a=window.Auth?.token,n={};return a&&(n.Authorization=`Bearer ${a}`),t&&(n["Content-Type"]="application/json"),n}async function z(t=!1){let a=R(t),n=window.getCSRFToken?await window.getCSRFToken():null;return n&&(a["X-CSRF-Token"]=n),a}function P(t){let n={angel:"angel","angel-card":"angel",astrocartography:"globe",crystal:"crystal","crystal-ball":"crystal","daily-wisdom":"star",horoscope:"chart",journal:"pen","medicine-wheel":"compass",natal:"chart","natal-chart":"chart",numerology:"numbers","past-life":"hourglass",runes:"rune",synastry:"partner",tarot:"tarot",oracle:"eye"}[t]||"star";return v(n,"reading-type-icon")}function oe(t){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Osobn\xED pozn\xE1mka","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie",oracle:"Or\xE1kulum","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[t]||"V\xFDklad"}var ie=[{value:"all",label:"V\u0161e"},...[["tarot","Tarot"],["horoscope","Horoskopy"],["journal","Moje pozn\xE1mky"],["crystal-ball","K\u0159i\u0161\u0165\xE1lov\xE1 koule",["crystal-ball","crystal"]],["natal-chart","Nat\xE1ln\xED karta",["natal-chart","natal"]],["numerology","Numerologie"],["synastry","Partnersk\xE1 shoda"],["angel-card","And\u011Blsk\xE9 karty",["angel-card","angel"]],["runes","Runy"],["astrocartography","Astro mapa"],["past-life","Minul\xFD \u017Eivot"],["medicine-wheel","\u0160amansk\xE9 kolo"],["daily-wisdom","Denn\xED moudrost"],["oracle","Or\xE1kulum"]].map(([t,a,n])=>({value:t,label:a,types:n||[t]}))];function A(t){let a=t.data;if(t.type==="journal")return a;if(typeof a=="string")try{a=JSON.parse(a)}catch{return a}return a}function M(t){let a=A(t||{});if(t?.type==="tarot"){if(a?.tool==="tarot_yes_no")return"Tarot ano/ne";let e={"Tarot karta dne":"Tarot karta dne",daily:"Tarot karta dne","Jedna karta":"Tarot \xB7 jedna karta","T\u0159i karty":"Tarot \xB7 t\u0159i karty","Celtic Cross":"Tarot \xB7 Keltsk\xFD k\u0159\xED\u017E"};if(e[a?.spreadType])return e[a.spreadType];if(typeof a?.spreadType=="string"&&a.spreadType.endsWith(" (Uk\xE1zka)"))return`${e[a.spreadType.slice(0,-9)]||"Tarotov\xFD v\xFDklad"} \xB7 uk\xE1zka`}return t?.type!=="horoscope"?oe(t?.type):[{daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop",yearly:"Ro\u010Dn\xED horoskop"}[a?.period]||"Horoskop",a?.sign].filter(e=>typeof e=="string"&&e).join(" \xB7 ")}function j(t){let a=A(t||{}),n=Array.isArray(a?.cards)?a.cards.map(o=>typeof o=="string"?o:o?.name||"").filter(Boolean).join(" \xB7 "):"",e=[a?.question,a?.intention,n,a?.cardName,a?.card_name,a?.card?.name,a?.rune?.name,typeof a=="string"?a:""].find(o=>typeof o=="string"&&o.trim());return typeof e=="string"?e.replace(/\s+/g," ").trim().slice(0,160):""}function v(t,a=""){let n=new Set(["book","bookmark","warning","angel","globe","crystal","star","chart","pen","compass","numbers","hourglass","rune","partner","tarot","eye","dream","leaf","flower","user","check","logout"]),e=new Set(["","reading-type-icon"]);if(!n.has(t))throw new Error("Unknown profile UI icon");if(!e.has(a))throw new Error("Unknown profile UI icon variant");return'<svg class="'+(a?`mh-symbol ${a}`:"mh-symbol")+'" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#'+t+'"></use></svg>'}var G=[],S="all",se=0,le=[];var Z=0;var I=null;var U=!1,J=!1;function W(){return G}function Y(t,a){I&&t!==a&&(I.favorites=Math.max(0,I.favorites+(a?1:-1)))}function Q(t,a){let n=G.find(e=>e.id===t);n&&Object.assign(n,a)}function ce(){return le}function de(){return J||(J=!0,window.MH_ANALYTICS?.trackEvent?.("profile_activation_viewed",{source:"profile_history",feature:"profile_history"})),`
        <div class="card glass-card profile-activation-hero">
            <div class="profile-activation-hero__icon" aria-hidden="true"><svg class="mh-symbol" viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg></div>
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
    `}function X(){let t=document.getElementById("readings-list");if(!t)return;let a=ce();if(S==="all"&&Z===0){t.innerHTML=de(),N(0,0);return}if(a.length===0){S==="all"&&!U&&(U=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),t.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">${v("book")}</div>
                <h4 class="empty-state__title">${S==="all"?"Den\xEDk v\xFDklad\u016F zat\xEDm \u010Dek\xE1 na prvn\xED odpov\u011B\u010F":"Tady zat\xEDm nen\xED \u017E\xE1dn\xFD v\xFDklad tohoto typu"}</h4>
                <p class="empty-state__text">${S==="all"?"Tady se budou dr\u017Eet tvoje ot\xE1zky, odpov\u011Bdi a opakuj\xEDc\xED se t\xE9mata. Za\u010Dni kr\xE1tk\xFDm v\xFDkladem, a\u0165 m\xE1 profil prvn\xED sign\xE1l pro n\xE1vrat.":"Filtr je pr\xE1zdn\xFD. Zkus jin\xFD typ v\xFDkladu nebo se vra\u0165 na celou historii."}</p>
                ${S==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot-ano-ne.html?source=profile_history_empty&feature=tarot_yes_no&intent=yes_no" class="btn btn--primary btn--sm" data-analytics-cta="profile_empty_tarot_yes_no" data-analytics-feature="tarot_yes_no">Tarot ano/ne</a>
                        <a href="tarot-tri-karty.html?source=profile_history_empty&feature=tarot_multi_card&intent=three_cards" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_three_cards" data-analytics-feature="tarot_multi_card">T\u0159i karty</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule&intent=yes_no_question" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_crystal_ball" data-analytics-feature="kristalova_koule">K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                    </div>
                `:""}
            </div>
        `,N(0,0);return}let n=a.slice(0,se);t.innerHTML=`${n.map(e=>`
        <div class="reading-item card" data-reading-id="${i(e.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${P(e.type)}</span>
                    <div>
                        <strong>${i(M(e))}</strong>
                        ${j(e)?`<p class="reading-item__preview">${i(j(e))}</p>`:""}
                        <p class="reading-item__date">
                            ${new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${i(e.id)}"
                        title="${e.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${e.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}" aria-pressed="${!!e.is_favorite}">
                        ${v("bookmark")}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${i(e.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join("")}`,N(n.length,Z)}function N(t,a){let n=document.getElementById("readings-pagination");if(n)if(t<a){n.hidden=!1,n.classList.add("profile-block-visible");let e=document.getElementById("readings-load-more");e&&(e.textContent=`Na\u010D\xEDst dal\u0161\xED (${a-t} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}var ee={cs:"Z\xE1kladn\xED symbolick\xFD v\xFDklad. Osobn\xED generov\xE1n\xED te\u010F nen\xED dostupn\xE9.",sk:"Z\xE1kladn\xFD symbolick\xFD v\xFDklad. Osobn\xE9 generovanie teraz nie je dostupn\xE9.",pl:"Podstawowa interpretacja symboliczna. Indywidualne generowanie jest teraz niedost\u0119pne."};function te(t="cs"){return ee[String(t).slice(0,2)]||ee.cs}function h(t){let a=String(t||"").replace(/```(?:html)?/g,"").trim();if(window.DOMPurify?.sanitize){let e=/<\/?(?:p|h[3-5]|ul|ol|li|blockquote)\b/i.test(a)?a:a.replace(/\n/g,"<br>");return window.DOMPurify.sanitize(e,{ALLOWED_TAGS:["h3","h4","h5","p","strong","b","em","i","ul","ol","li","blockquote","br"],ALLOWED_ATTR:[]})}let n=document.createElement("div");return n.textContent=a.replace(/<[^>]*>/g,""),n.innerHTML.replace(/\n/g,"<br>")}var B=null,$=!1,g=null,u=0,E=null,b=!1,_=null,w=null,x=null,T=new Map,ue=new Set(["fallback","source","dateKey","spreadType","tool","continuedFrom","previousAnswer"]);function O(t){return`${window.Auth?.user?.id||""}:${t}`}function ne(t){let a=O(t);if(T.has(a))return null;let n,e=new Promise(r=>{n=r}),o={key:a,promise:e,finish:n};return T.set(a,o),o}function C(t){T.delete(t.key),t.finish(),y()}var fe=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],pe=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function Le(t){let a=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!a||!n)return;let e=++u;E?.abort();let o=new AbortController;E=o,B=t,g=null,$=!1,b=!1,H(),y(),a.hidden=!1,a.classList.add("is-visible"),n.setAttribute("aria-busy","true"),n.innerHTML='<p class="reading-modal__loading" role="status">Na\u010D\xEDt\xE1n\xED...</p>',ge(a);try{let r=T.get(O(t));if(r&&(await r.promise,e!==u))return;let d=await fetch(`${k()}/user/readings/${encodeURIComponent(t)}`,{credentials:"include",headers:R(),signal:o.signal});if(!d.ok)throw new Error("Failed to fetch reading");let p=await d.json();if(e!==u)return;let l=p.reading;if(!l||String(l.id)!==String(t))throw new Error("Invalid reading detail");n.innerHTML=Se(l),be(n),ke(n,l),g=t,$=!!l.is_favorite,H()}catch(r){if(e!==u)return;g=null,console.error("Error loading reading:",r),n.innerHTML='<p class="reading-modal__error" role="alert">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad. Zav\u0159i detail a zkus ho otev\u0159\xEDt znovu.</p>'}finally{e===u&&(E=null,n.setAttribute("aria-busy","false"),y())}}function D(){++u,E?.abort(),E=null;let t=document.getElementById("reading-modal");t&&(t.classList.remove("is-visible"),t.hidden=!0),B=null,g=null,b=!1,document.getElementById("reading-modal-content")?.setAttribute("aria-busy","false"),y(),ye()}async function je(){if(!q())return;let t=g,a=u;b=!0,y();try{let n=await me(t);if(a!==u||n===void 0)return;$=n,H()}finally{a===u&&(b=!1,y())}}async function me(t,a=null){let n=window.Auth?.user?.id;if(!window.Auth?.isLoggedIn?.()||typeof n!="string"||!n)return;let e=ne(t);if(e){a&&(a.disabled=!0);try{let o=await fetch(`${k()}/user/readings/${encodeURIComponent(t)}/favorite`,{method:"PATCH",credentials:"include",headers:await z(!0),body:JSON.stringify({expectedUserId:n})});if(!o.ok)throw new Error("Failed to toggle favorite");let r=await o.json();if(typeof r.is_favorite!="boolean")throw new Error("Neplatn\xE1 odpov\u011B\u010F obl\xEDben\xFDch.");if(n!==window.Auth?.user?.id)return r.is_favorite;Y(!r.is_favorite,r.is_favorite),a&&(a.innerHTML=v("bookmark"),a.setAttribute("aria-pressed",String(r.is_favorite)),a.title=r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",a.setAttribute("aria-label",r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let p=W().find(l=>l.id===t);return p&&(p.is_favorite=r.is_favorite,X()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"favorite",id:t,isFavorite:r.is_favorite}})),r.is_favorite}catch(o){console.error("Error toggling favorite:",o),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}finally{C(e),a&&(a.disabled=!1)}}}async function Ie(){if(!q())return;let t=g,a=u;if(!confirm("Opravdu chce\u0161 smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))return;let n=ne(t);if(!n)return;b=!0;let e=window.Auth?.user?.id;if(typeof e!="string"||!e){C(n),b=!1,y();return}y();try{if(!(await fetch(`${k()}/user/readings/${encodeURIComponent(t)}`,{method:"DELETE",credentials:"include",headers:await z(!0),body:JSON.stringify({expectedUserId:e})})).ok)throw new Error("Failed to delete reading");if(e!==window.Auth?.user?.id)return;window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),a===u&&D(),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"delete",id:t}}))}catch(o){console.error("Error deleting reading:",o),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}finally{C(n),a===u&&(b=!1,y())}}function q(){return g!==null&&g===B&&!b&&!T.has(O(g))}function y(){["modal-favorite-btn","modal-delete-btn"].forEach(t=>{let a=document.getElementById(t);a&&(a.disabled=!q())})}function H(){let t=document.getElementById("modal-favorite-btn");t&&(t.innerHTML=`${v("bookmark")} ${$?"V obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}`,t.setAttribute("aria-pressed",String($)),t.setAttribute("aria-label",$?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function ge(t){if(w===t)return;_=document.activeElement,w=t;let a=ae(t);(t.querySelector(".modal__close")||a[0]||t).focus(),x=e=>{if(!w)return;if(e.key==="Escape"){e.preventDefault(),D();return}if(e.key!=="Tab")return;let o=ae(w);if(!o.length){e.preventDefault(),w.focus();return}let r=o[0],d=o[o.length-1];e.shiftKey&&document.activeElement===r?(e.preventDefault(),d.focus()):!e.shiftKey&&document.activeElement===d&&(e.preventDefault(),r.focus())},document.addEventListener("keydown",x)}function ye(){if(x&&(document.removeEventListener("keydown",x),x=null),w=null,_){let t=_.closest("[data-reading-id]")?.dataset.readingId,a=[...document.querySelectorAll('[data-reading-action="view"]')].find(e=>e.dataset.readingId===t&&e.offsetParent!==null);(_.isConnected?_:a||document.querySelector('.profile-tab[aria-selected="true"]'))?.focus(),_=null}}function ae(t){return Array.from(t.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(a=>a.offsetParent!==null)}function be(t){t.querySelectorAll("[data-tarot-fallback]").forEach(a=>{a.addEventListener("error",()=>{a.dataset.fallbackApplied!=="1"&&(a.dataset.fallbackApplied="1",a.src="/img/tarot-v2/tarot_card_back.webp")})})}function L(t,a,n="neutral"){let e=t?.querySelector?.(".reading-feedback__status");e&&(e.textContent=a,e.dataset.state=n)}async function F(t,a,n,e){if(!t)return null;let o=window.Auth?.user?.id;if(!window.Auth?.isLoggedIn?.()||typeof o!="string"||!o)return null;e&&(e.disabled=!0),L(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let r=null;try{if(window.Auth?.saveReadingFeedback)r=await window.Auth.saveReadingFeedback(t,{...a,feature:"profile_history",source:"profile_reading_modal"},o);else{let d=await fetch(`${k()}/user/readings/${encodeURIComponent(t)}/feedback`,{method:"PATCH",credentials:"include",headers:await z(!0),body:JSON.stringify({...a,feature:"profile_history",source:"profile_reading_modal",expectedUserId:o})});r=await d.json().catch(()=>null),d.ok||(r=null)}return!window.Auth?.isLoggedIn?.()||window.Auth?.user?.id!==o?null:r?.success?(r.reading&&Q(t,r.reading),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"feedback",id:t}})),L(n,"Zp\u011Btn\xE1 vazba je ulo\u017Een\xE1.","success"),r):(L(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null)}catch(d){return console.warn("Reading feedback unavailable:",d.message),L(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null}finally{e&&(e.disabled=!1)}}function ve(t){let a=A(t||{});if(t?.type==="journal"||!a||typeof a!="object"||Array.isArray(a))return"";let n=a.feedback&&typeof a.feedback=="object"&&!Array.isArray(a.feedback)?a.feedback:{},e=fe.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${i(r.label)}
        </button>
    `).join(""),o=pe.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.focus===r.value?"is-selected":""}" data-feedback-focus="${r.value}">
            ${i(r.label)}
        </button>
    `).join("");return`
        <section class="reading-feedback" data-reading-feedback="${i(t.id)}">
            <div class="reading-feedback__header">
                <span class="reading-feedback__eyebrow">Zp\u011Btn\xE1 vazba</span>
                <strong>Co m\xE1 profil br\xE1t jako dal\u0161\xED sign\xE1l?</strong>
            </div>
            <div class="reading-feedback__chips" aria-label="Zp\u011Btn\xE1 vazba k v\xFDkladu">
                ${e}
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
    `}function he(){D();let t=document.getElementById("journal-input");t&&(window.history.replaceState(null,"","#journal-input"),t.scrollIntoView({behavior:V(),block:"center"}),setTimeout(()=>t.focus(),250))}function ke(t,a){let n=t.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async e=>{let o=e.target.closest("[data-feedback-resonance]"),r=e.target.closest("[data-feedback-focus]"),d=e.target.closest("[data-feedback-next-action]"),p=o||r||d;if(!p)return;let l={};if(o&&(l.resonance=o.dataset.feedbackResonance),r&&(l.focus=r.dataset.feedbackFocus),d&&(l.nextAction=d.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(s=>{(l.resonance&&s.dataset.feedbackResonance||l.focus&&s.dataset.feedbackFocus)&&s.classList.toggle("is-selected",s===p)}),d?.tagName==="A"){e.preventDefault(),(await F(a.id,l,n,null))?.success&&(window.location.href=d.getAttribute("href"));return}if(l.nextAction==="journal"){(await F(a.id,l,n,d))?.success&&he();return}await F(a.id,l,n,p)})}function _e(t){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",practicalStep:"Praktick\xFD krok",practical_step:"Praktick\xFD krok",action:"Praktick\xFD krok",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[t]||String(t).replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function m(t,a=0){if(!t||typeof t!="object")return"";if(a>4)return`<p class="reading-structured-field__value">${i(JSON.stringify(t))}</p>`;if(Array.isArray(t)){let n=t.filter(e=>e!=null&&e!=="").map(e=>`<li>${e&&typeof e=="object"?m(e,a+1):i(String(e)).replace(/\n/g,"<br>")}</li>`).join("");return n?`<ul class="reading-structured-list">${n}</ul>`:""}return Object.entries(t).filter(([n,e])=>e!=null&&e!==""&&!(a===0&&ue.has(n))).map(([n,e])=>{let o=e&&typeof e=="object"?m(e,a+1):`<p class="reading-structured-field__value">${i(String(e)).replace(/\n/g,"<br>")}</p>`;return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${i(_e(n))}</h4>
                    ${o}
                </section>
            `}).join("")}function K(t,a){let n=a.filter(e=>e.value!==null&&e.value!==void 0&&e.value!=="").map(e=>`
            <span class="reading-metric">
                <strong>${i(e.label)}</strong>
                <span>${i(e.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${i(t)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function we(t){let a=t?.summary;return a?K("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:a.sunSign},{label:"M\u011Bs\xEDc",value:a.moonSign},{label:"Ascendent",value:a.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:a.dominantElement},{label:"Modalita",value:a.dominantQuality}]):""}function $e(t){let a=t?.synastry?.scores||t?.scores;return a?K("Sk\xF3re vztahu",[{label:"Osoba 1",value:t.person1?.name},{label:"Osoba 2",value:t.person2?.name},{label:"Celkem",value:`${a.total??a.totalScore??"--"} %`},{label:"Emoce",value:`${a.emotion??a.emotionScore??"--"} %`},{label:"Komunikace",value:`${a.communication??a.commScore??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${a.passion??a.passionScore??"--"} %`},{label:"Stabilita",value:`${a.stability??a.stabilityScore??"--"} %`}]):""}function Ae(t){if(!t||typeof t!="object")return"";let a=Array.isArray(t.recommendations)?t.recommendations.slice(0,3):[],n=Array.isArray(t.angularLines)?t.angularLines.slice(0,4):[],e=a.map(r=>`
        <li>
            <strong>${i(r.city||"M\xEDsto")}</strong>
            <span>${i(r.score??"--")} / 100 \xB7 ${i(r.primaryPlanet?.name||"planeta")}</span>
        </li>
    `).join(""),o=n.map(r=>`
        <li>
            <strong>${i(r.planetName||"Planeta")} ${i(r.angle||"")}</strong>
            <span>${i(r.longitude??"--")}\xB0</span>
        </li>
    `).join("");return!e&&!o?"":`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">Astro mapa</h3>
            ${e?`<ul class="reading-summary-list">${e}</ul>`:""}
            ${o?`<ul class="reading-summary-list reading-summary-list--compact">${o}</ul>`:""}
        </section>
    `}function Se(t){let a=new Date(t.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${P(t.type)}</span>
            <h2 class="reading-detail__title">${i(M(t))}</h2>
            <p class="reading-detail__date">${a}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,e=A(t)||{};e?.fallback&&(n+=`<p class="result-context-notice">${i(te())}</p>`);let o=t.type==="tarot"?e?.response||e?.interpretation||e?.answer:t.type==="horoscope"?e?.text||e?.prediction||e?.answer||e?.interpretation||e?.response||e?.result:e?.answer||e?.interpretation||e?.response||e?.text||e?.result,r=[e?.practicalStep,e?.practical_step,e?.action].find(s=>typeof s=="string"&&s.trim())||(o?[e?.result?.practicalStep,e?.result?.practical_step,e?.result?.action].find(s=>typeof s=="string"&&s.trim()):null),d=typeof o=="string"?o:o&&typeof o=="object"?JSON.stringify(o):"";r&&!d.includes(r.trim())&&(n+=`<section class="reading-summary-panel"><h3 class="reading-summary-panel__title">Praktick\xFD krok</h3><div class="reading-structured-field__value">${h(r)}</div></section>`),typeof e?.question=="string"&&e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">Tvoje ot\xE1zka</small><p class="reading-question__text">${i(e.question)}</p></div>`),typeof e?.intention=="string"&&e.intention&&e.intention!==e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">P\u016Fvodn\xED z\xE1m\u011Br</small><p class="reading-question__text">${i(e.intention)}</p></div>`),e?.rune&&typeof e.rune=="object"&&(n+=`<section class="reading-summary-panel"><h3>${i(e.rune.symbol||"")} ${i(e.rune.name||"Runa")}</h3><p>${i(e.rune.meaning||"")}</p></section>`),e?.card&&typeof e.card=="object"&&t.type!=="tarot"&&(n+=`<section class="reading-summary-panel"><h3>${i(e.card.name||"Karta")}</h3><p>${i(e.card.theme||"")}</p><p>${i(e.card.message||"")}</p></section>`),e?.totem&&(n+=`<section class="reading-summary-panel"><h3>P\u016Fvodn\xED symbol</h3>${typeof e.totem=="object"?m(e.totem):`<p>${i(e.totem)}</p>`}</section>`),e&&typeof e=="object"&&(t.type==="synastry"&&(n+=$e(e)),t.type==="numerology"&&(n+=K("Vypo\u010Dten\xE1 \u010D\xEDsla",[{label:"\u017Divotn\xED cesta",value:e.lifePath},{label:"Osud",value:e.destiny},{label:"Du\u0161e",value:e.soul},{label:"Osobnost",value:e.personality}])),n+=we(e.chart||e.synastry?.person1?.chart),t.type==="astrocartography"&&(n+=Ae(e.astrocartography)));function p(s,c){return typeof c=="string"&&/^\/?img\/tarot-v2\/[a-z0-9_-]+\.webp$/i.test(c)?c:!s||typeof s!="string"?"img/tarot-v2/tarot_card_back.webp":`img/tarot-v2/tarot_${s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_").replace(/[^a-z0-9_]/g,"")}.webp`}let l=Array.isArray(e.cards)?e.cards:t.type==="tarot"&&(e.card_name||e.cardName)?[{name:e.card_name||e.cardName}]:null;if(typeof e=="string")n+=`<div class="reading-plain-text">${i(e).replace(/\n/g,"<br>")}</div>`;else if(t.type==="tarot"&&l?.length){n+='<div class="reading-tarot-grid">',l.forEach(c=>{let f=typeof c=="string"?{name:c}:c||{},re=p(f.name,f.image);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${i(re)}"
                              alt="${i(f.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${i(f.name)}</p>
                    ${f.position?`<small class="reading-tarot-card__position">${i(f.position)}</small>`:""}
                    ${f.meaning?`<p>${i(f.meaning)}</p>`:""}
                </div>
            `}),n+="</div>";let s=e.response||e.interpretation||e.answer;if(s){let c=typeof s=="object"?m(s):h(s);n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${c}
                    </div>
                </div>
            `}l.forEach(c=>{!c||typeof c!="object"||!c.interpretation||(n+=`<details class="reading-card-reference" ${!s&&l.length===1?"open":""}>
                <summary>V\xFDznam karty ${i(c.name)}${c.position?` \xB7 ${i(c.position)}`:""}</summary>
                <div class="reading-interpretation__text">${typeof c.interpretation=="object"?m(c.interpretation):h(c.interpretation)}</div>
            </details>`)})}else if(t.type==="horoscope"&&(e.text||e.prediction)){let s=e.text||e.prediction,f={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[e.period]||e.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${i(e.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${i(f)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${typeof s=="object"?m(s):h(s)}
            </div>
        `,e.affirmation&&(n+=`<section class="reading-summary-panel"><h4>Podn\u011Bt k zamy\u0161len\xED</h4><p>${i(e.affirmation)}</p></section>`),e.luckyNumbers&&(n+=`
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">\u0160\u0165astn\xE1 \u010D\xEDsla</span>
                    <span class="reading-lucky-numbers__value">${i(e.luckyNumbers.toString())}</span>
                </div>
            `)}else if(e.answer){let s=typeof e.answer=="string"?h(e.answer):m(e.answer);n+=`
            <div class="reading-answer">
                ${s}
            </div>
        `}else if(e.interpretation||e.response||e.text||e.result){let s=e.interpretation||e.response||e.text||e.result;if(typeof s=="string"){let c=h(s);n+=`<div class="formatted-content reading-formatted-content">${c}</div>`}else n+=`<div class="reading-structured">${m(s)}</div>`}else{let s=m(e);n+=s?`<div class="reading-structured">${s}</div>`:'<p class="reading-formatted-content reading-detail__empty">Tento v\xFDklad u\u017E nem\xE1 ulo\u017Een\xFD \u010Diteln\xFD obsah.</p>'}return n+="</div>",n+=ve(t),n}export{D as closeReadingModal,Ie as deleteReading,me as toggleFavorite,je as toggleFavoriteModal,Le as viewReading};
