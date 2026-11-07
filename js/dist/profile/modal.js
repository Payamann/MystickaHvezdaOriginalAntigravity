function Z(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}function i(a){if(!a)return"";let t=document.createElement("div");return t.textContent=a,t.innerHTML}function k(){return window.API_CONFIG?.BASE_URL||"/api"}function z(a=!1){let t=window.Auth?.token,n={};return t&&(n.Authorization=`Bearer ${t}`),a&&(n["Content-Type"]="application/json"),n}async function P(a=!1){let t=z(a),n=window.getCSRFToken?await window.getCSRFToken():null;return n&&(t["X-CSRF-Token"]=n),t}function M(a){let n={angel:"angel","angel-card":"angel",astrocartography:"globe",crystal:"crystal","crystal-ball":"crystal","daily-wisdom":"star",horoscope:"chart",journal:"pen","medicine-wheel":"compass",natal:"chart","natal-chart":"chart",numerology:"numbers","past-life":"hourglass",runes:"rune",synastry:"partner",tarot:"tarot",oracle:"eye"}[a]||"star";return v(n,"reading-type-icon")}function ie(a){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Osobn\xED pozn\xE1mka","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie",oracle:"Or\xE1kulum","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[a]||"V\xFDklad"}var se=[{value:"all",label:"V\u0161e"},...[["tarot","Tarot"],["horoscope","Horoskopy"],["journal","Moje pozn\xE1mky"],["crystal-ball","K\u0159i\u0161\u0165\xE1lov\xE1 koule",["crystal-ball","crystal"]],["natal-chart","Nat\xE1ln\xED karta",["natal-chart","natal"]],["numerology","Numerologie"],["synastry","Partnersk\xE1 shoda"],["angel-card","And\u011Blsk\xE9 karty",["angel-card","angel"]],["runes","Runy"],["astrocartography","Astro mapa"],["past-life","Minul\xFD \u017Eivot"],["medicine-wheel","\u0160amansk\xE9 kolo"],["daily-wisdom","Denn\xED moudrost"],["oracle","Or\xE1kulum"]].map(([a,t,n])=>({value:a,label:t,types:n||[a]}))];function A(a){let t=a.data;if(a.type==="journal")return t;if(typeof t=="string")try{t=JSON.parse(t)}catch{return t}return t}function L(a){let t=A(a||{});if(a?.type==="tarot"){if(t?.tool==="tarot_yes_no")return"Tarot ano/ne";let e={"Tarot karta dne":"Tarot karta dne",daily:"Tarot karta dne","Jedna karta":"Tarot \xB7 jedna karta","T\u0159i karty":"Tarot \xB7 t\u0159i karty","Celtic Cross":"Tarot \xB7 Keltsk\xFD k\u0159\xED\u017E"};if(e[t?.spreadType])return e[t.spreadType];if(typeof t?.spreadType=="string"&&t.spreadType.endsWith(" (Uk\xE1zka)"))return`${e[t.spreadType.slice(0,-9)]||"Tarotov\xFD v\xFDklad"} \xB7 uk\xE1zka`}return a?.type!=="horoscope"?ie(a?.type):[{daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop",yearly:"Ro\u010Dn\xED horoskop"}[t?.period]||"Horoskop",t?.sign].filter(e=>typeof e=="string"&&e).join(" \xB7 ")}function N(a){let t=A(a||{}),n=Array.isArray(t?.cards)?t.cards.map(o=>typeof o=="string"?o:o?.name||"").filter(Boolean).join(" \xB7 "):"",e=[t?.question,t?.intention,n,t?.cardName,t?.card_name,t?.card?.name,t?.rune?.name,typeof t=="string"?t:""].find(o=>typeof o=="string"&&o.trim());return typeof e=="string"?e.replace(/\s+/g," ").trim().slice(0,160):""}function v(a,t=""){let n=new Set(["book","bookmark","warning","angel","globe","crystal","star","chart","pen","compass","numbers","hourglass","rune","partner","tarot","eye","dream","leaf","flower","user","check","logout"]),e=new Set(["","reading-type-icon"]);if(!n.has(a))throw new Error("Unknown profile UI icon");if(!e.has(t))throw new Error("Unknown profile UI icon variant");return'<svg class="'+(t?`mh-symbol ${t}`:"mh-symbol")+'" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#'+a+'"></use></svg>'}var W=[],S="all",le=0,ce=[];var U=0;var I=null;var J=!1,G=!1,E=null;function de(){let a=document.querySelector("#readings-list .profile-activation-hero__grid");if(!a||(a.querySelector("[data-profile-first-value]")?.remove(),!E))return;let t=document.createElement("a");t.className="profile-activation-hero__card",t.href=E.href,t.dataset.profileFirstValue="",t.dataset.profileHistoryNextStep=E.action;let n=document.createElement("strong");n.textContent=E.title;let e=document.createElement("span");e.textContent=E.description,t.append(n,e),a.prepend(t)}function Y(){return W}function Q(a,t){I&&a!==t&&(I.favorites=Math.max(0,I.favorites+(t?1:-1)))}function X(a,t){let n=W.find(e=>e.id===a);n&&Object.assign(n,t)}function ue(){return ce}function fe(){return G||(G=!0,window.MH_ANALYTICS?.trackEvent?.("profile_activation_viewed",{source:"profile_history",feature:"profile_history"})),`
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
    `}function ee(){let a=document.getElementById("readings-list");if(!a)return;let t=ue();if(S==="all"&&U===0){a.innerHTML=fe(),de(),F(0,0);return}if(t.length===0){S==="all"&&!J&&(J=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),a.innerHTML=`
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
        `,F(0,0);return}let n=t.slice(0,le);a.innerHTML=`${n.map(e=>`
        <div class="reading-item card" data-reading-id="${i(e.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${M(e.type)}</span>
                    <div>
                        <strong>${i(L(e))}</strong>
                        ${N(e)?`<p class="reading-item__preview">${i(N(e))}</p>`:""}
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
    `).join("")}`,F(n.length,U)}function F(a,t){let n=document.getElementById("readings-pagination");if(n)if(a<t){n.hidden=!1,n.classList.add("profile-block-visible");let e=document.getElementById("readings-load-more");e&&(e.textContent=`Na\u010D\xEDst dal\u0161\xED (${t-a} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}var te={cs:"Z\xE1kladn\xED symbolick\xFD v\xFDklad. Osobn\xED generov\xE1n\xED te\u010F nen\xED dostupn\xE9.",sk:"Z\xE1kladn\xFD symbolick\xFD v\xFDklad. Osobn\xE9 generovanie teraz nie je dostupn\xE9.",pl:"Podstawowa interpretacja symboliczna. Indywidualne generowanie jest teraz niedost\u0119pne."};function ae(a="cs"){return te[String(a).slice(0,2)]||te.cs}function h(a){let t=String(a||"").replace(/```(?:html)?/g,"").trim();if(window.DOMPurify?.sanitize){let e=/<\/?(?:p|h[3-5]|ul|ol|li|blockquote)\b/i.test(t)?t:t.replace(/\n/g,"<br>");return window.DOMPurify.sanitize(e,{ALLOWED_TAGS:["h3","h4","h5","p","strong","b","em","i","ul","ol","li","blockquote","br"],ALLOWED_ATTR:[]})}let n=document.createElement("div");return n.textContent=t.replace(/<[^>]*>/g,""),n.innerHTML.replace(/\n/g,"<br>")}var O=null,$=!1,g=null,u=0,x=null,b=!1,_=null,w=null,T=null,R=new Map,pe=new Set(["fallback","source","dateKey","spreadType","tool","continuedFrom","previousAnswer"]);function D(a){return`${window.Auth?.user?.id||""}:${a}`}function re(a){let t=D(a);if(R.has(t))return null;let n,e=new Promise(r=>{n=r}),o={key:t,promise:e,finish:n};return R.set(t,o),o}function H(a){R.delete(a.key),a.finish(),y()}var me=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],ge=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function Ne(a){let t=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!t||!n)return;let e=++u;x?.abort();let o=new AbortController;x=o,O=a,g=null,$=!1,b=!1,B(),y(),t.hidden=!1,t.classList.add("is-visible"),n.setAttribute("aria-busy","true"),n.innerHTML='<p class="reading-modal__loading" role="status">Na\u010D\xEDt\xE1n\xED...</p>',be(t);try{let r=R.get(D(a));if(r&&(await r.promise,e!==u))return;let d=await fetch(`${k()}/user/readings/${encodeURIComponent(a)}`,{credentials:"include",headers:z(),signal:o.signal});if(!d.ok)throw new Error("Failed to fetch reading");let p=await d.json();if(e!==u)return;let l=p.reading;if(!l||String(l.id)!==String(a))throw new Error("Invalid reading detail");n.innerHTML=xe(l),he(n),we(n,l),g=a,$=!!l.is_favorite,B()}catch(r){if(e!==u)return;g=null,console.error("Error loading reading:",r),n.innerHTML='<p class="reading-modal__error" role="alert">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad. Zav\u0159i detail a zkus ho otev\u0159\xEDt znovu.</p>'}finally{e===u&&(x=null,n.setAttribute("aria-busy","false"),y())}}function q(){++u,x?.abort(),x=null;let a=document.getElementById("reading-modal");a&&(a.classList.remove("is-visible"),a.hidden=!0),O=null,g=null,b=!1,document.getElementById("reading-modal-content")?.setAttribute("aria-busy","false"),y(),ve()}async function Ie(){if(!V())return;let a=g,t=u;b=!0,y();try{let n=await ye(a);if(t!==u||n===void 0)return;$=n,B()}finally{t===u&&(b=!1,y())}}async function ye(a,t=null){let n=window.Auth?.user?.id;if(!window.Auth?.isLoggedIn?.()||typeof n!="string"||!n)return;let e=re(a);if(e){t&&(t.disabled=!0);try{let o=await fetch(`${k()}/user/readings/${encodeURIComponent(a)}/favorite`,{method:"PATCH",credentials:"include",headers:await P(!0),body:JSON.stringify({expectedUserId:n})});if(!o.ok)throw new Error("Failed to toggle favorite");let r=await o.json();if(typeof r.is_favorite!="boolean")throw new Error("Neplatn\xE1 odpov\u011B\u010F obl\xEDben\xFDch.");if(n!==window.Auth?.user?.id)return r.is_favorite;Q(!r.is_favorite,r.is_favorite),t&&(t.innerHTML=v("bookmark"),t.setAttribute("aria-pressed",String(r.is_favorite)),t.title=r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",t.setAttribute("aria-label",r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let p=Y().find(l=>l.id===a);return p&&(p.is_favorite=r.is_favorite,ee()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"favorite",id:a,isFavorite:r.is_favorite}})),r.is_favorite}catch(o){console.error("Error toggling favorite:",o),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}finally{H(e),t&&(t.disabled=!1)}}}async function Fe(){if(!V())return;let a=g,t=u;if(!confirm("Opravdu chce\u0161 smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))return;let n=re(a);if(!n)return;b=!0;let e=window.Auth?.user?.id;if(typeof e!="string"||!e){H(n),b=!1,y();return}y();try{if(!(await fetch(`${k()}/user/readings/${encodeURIComponent(a)}`,{method:"DELETE",credentials:"include",headers:await P(!0),body:JSON.stringify({expectedUserId:e})})).ok)throw new Error("Failed to delete reading");if(e!==window.Auth?.user?.id)return;window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),t===u&&q(),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"delete",id:a}}))}catch(o){console.error("Error deleting reading:",o),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}finally{H(n),t===u&&(b=!1,y())}}function V(){return g!==null&&g===O&&!b&&!R.has(D(g))}function y(){["modal-favorite-btn","modal-delete-btn"].forEach(a=>{let t=document.getElementById(a);t&&(t.disabled=!V())})}function B(){let a=document.getElementById("modal-favorite-btn");a&&(a.innerHTML=`${v("bookmark")} ${$?"V obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}`,a.setAttribute("aria-pressed",String($)),a.setAttribute("aria-label",$?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function be(a){if(w===a)return;_=document.activeElement,w=a;let t=ne(a);(a.querySelector(".modal__close")||t[0]||a).focus(),T=e=>{if(!w)return;if(e.key==="Escape"){e.preventDefault(),q();return}if(e.key!=="Tab")return;let o=ne(w);if(!o.length){e.preventDefault(),w.focus();return}let r=o[0],d=o[o.length-1];e.shiftKey&&document.activeElement===r?(e.preventDefault(),d.focus()):!e.shiftKey&&document.activeElement===d&&(e.preventDefault(),r.focus())},document.addEventListener("keydown",T)}function ve(){if(T&&(document.removeEventListener("keydown",T),T=null),w=null,_){let a=_.closest("[data-reading-id]")?.dataset.readingId,t=[...document.querySelectorAll('[data-reading-action="view"]')].find(e=>e.dataset.readingId===a&&e.offsetParent!==null);(_.isConnected?_:t||document.querySelector('.profile-tab[aria-selected="true"]'))?.focus(),_=null}}function ne(a){return Array.from(a.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(t=>t.offsetParent!==null)}function he(a){a.querySelectorAll("[data-tarot-fallback]").forEach(t=>{t.addEventListener("error",()=>{t.dataset.fallbackApplied!=="1"&&(t.dataset.fallbackApplied="1",t.src="/img/tarot-v2/tarot_card_back.webp")})})}function j(a,t,n="neutral"){let e=a?.querySelector?.(".reading-feedback__status");e&&(e.textContent=t,e.dataset.state=n)}async function C(a,t,n,e){if(!a)return null;let o=window.Auth?.user?.id;if(!window.Auth?.isLoggedIn?.()||typeof o!="string"||!o)return null;e&&(e.disabled=!0),j(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let r=null;try{if(window.Auth?.saveReadingFeedback)r=await window.Auth.saveReadingFeedback(a,{...t,feature:"profile_history",source:"profile_reading_modal"},o);else{let d=await fetch(`${k()}/user/readings/${encodeURIComponent(a)}/feedback`,{method:"PATCH",credentials:"include",headers:await P(!0),body:JSON.stringify({...t,feature:"profile_history",source:"profile_reading_modal",expectedUserId:o})});r=await d.json().catch(()=>null),d.ok||(r=null)}return!window.Auth?.isLoggedIn?.()||window.Auth?.user?.id!==o?null:r?.success?(r.reading&&X(a,r.reading),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"feedback",id:a}})),j(n,"Zp\u011Btn\xE1 vazba je ulo\u017Een\xE1.","success"),r):(j(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null)}catch(d){return console.warn("Reading feedback unavailable:",d.message),j(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null}finally{e&&(e.disabled=!1)}}function ke(a){let t=A(a||{});if(a?.type==="journal"||!t||typeof t!="object"||Array.isArray(t))return"";let n=t.feedback&&typeof t.feedback=="object"&&!Array.isArray(t.feedback)?t.feedback:{},e=me.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${i(r.label)}
        </button>
    `).join(""),o=ge.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.focus===r.value?"is-selected":""}" data-feedback-focus="${r.value}">
            ${i(r.label)}
        </button>
    `).join("");return`
        <section class="reading-feedback" data-reading-feedback="${i(a.id)}">
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
    `}function _e(){q();let a=document.getElementById("journal-input");a&&(window.history.replaceState(null,"","#journal-input"),a.scrollIntoView({behavior:Z(),block:"center"}),setTimeout(()=>a.focus(),250))}function we(a,t){let n=a.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async e=>{let o=e.target.closest("[data-feedback-resonance]"),r=e.target.closest("[data-feedback-focus]"),d=e.target.closest("[data-feedback-next-action]"),p=o||r||d;if(!p)return;let l={};if(o&&(l.resonance=o.dataset.feedbackResonance),r&&(l.focus=r.dataset.feedbackFocus),d&&(l.nextAction=d.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(s=>{(l.resonance&&s.dataset.feedbackResonance||l.focus&&s.dataset.feedbackFocus)&&s.classList.toggle("is-selected",s===p)}),d?.tagName==="A"){e.preventDefault(),(await C(t.id,l,n,null))?.success&&(window.location.href=d.getAttribute("href"));return}if(l.nextAction==="journal"){(await C(t.id,l,n,d))?.success&&_e();return}await C(t.id,l,n,p)})}function $e(a){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",practicalStep:"Praktick\xFD krok",practical_step:"Praktick\xFD krok",action:"Praktick\xFD krok",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[a]||String(a).replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function m(a,t=0){if(!a||typeof a!="object")return"";if(t>4)return`<p class="reading-structured-field__value">${i(JSON.stringify(a))}</p>`;if(Array.isArray(a)){let n=a.filter(e=>e!=null&&e!=="").map(e=>`<li>${e&&typeof e=="object"?m(e,t+1):i(String(e)).replace(/\n/g,"<br>")}</li>`).join("");return n?`<ul class="reading-structured-list">${n}</ul>`:""}return Object.entries(a).filter(([n,e])=>e!=null&&e!==""&&!(t===0&&pe.has(n))).map(([n,e])=>{let o=e&&typeof e=="object"?m(e,t+1):`<p class="reading-structured-field__value">${i(String(e)).replace(/\n/g,"<br>")}</p>`;return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${i($e(n))}</h4>
                    ${o}
                </section>
            `}).join("")}function K(a,t){let n=t.filter(e=>e.value!==null&&e.value!==void 0&&e.value!=="").map(e=>`
            <span class="reading-metric">
                <strong>${i(e.label)}</strong>
                <span>${i(e.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${i(a)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function Ae(a){let t=a?.summary;return t?K("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:t.sunSign},{label:"M\u011Bs\xEDc",value:t.moonSign},{label:"Ascendent",value:t.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:t.dominantElement},{label:"Modalita",value:t.dominantQuality}]):""}function Se(a){let t=a?.synastry?.scores||a?.scores;return t?K("Sk\xF3re vztahu",[{label:"Osoba 1",value:a.person1?.name},{label:"Osoba 2",value:a.person2?.name},{label:"Celkem",value:`${t.total??t.totalScore??"--"} %`},{label:"Emoce",value:`${t.emotion??t.emotionScore??"--"} %`},{label:"Komunikace",value:`${t.communication??t.commScore??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${t.passion??t.passionScore??"--"} %`},{label:"Stabilita",value:`${t.stability??t.stabilityScore??"--"} %`}]):""}function Ee(a){if(!a||typeof a!="object")return"";let t=Array.isArray(a.recommendations)?a.recommendations.slice(0,3):[],n=Array.isArray(a.angularLines)?a.angularLines.slice(0,4):[],e=t.map(r=>`
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
    `}function xe(a){let t=new Date(a.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${M(a.type)}</span>
            <h2 class="reading-detail__title">${i(L(a))}</h2>
            <p class="reading-detail__date">${t}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,e=A(a)||{};e?.fallback&&(n+=`<p class="result-context-notice">${i(ae())}</p>`);let o=a.type==="tarot"?e?.response||e?.interpretation||e?.answer:a.type==="horoscope"?e?.text||e?.prediction||e?.answer||e?.interpretation||e?.response||e?.result:e?.answer||e?.interpretation||e?.response||e?.text||e?.result,r=[e?.practicalStep,e?.practical_step,e?.action].find(s=>typeof s=="string"&&s.trim())||(o?[e?.result?.practicalStep,e?.result?.practical_step,e?.result?.action].find(s=>typeof s=="string"&&s.trim()):null),d=typeof o=="string"?o:o&&typeof o=="object"?JSON.stringify(o):"";r&&!d.includes(r.trim())&&(n+=`<section class="reading-summary-panel"><h3 class="reading-summary-panel__title">Praktick\xFD krok</h3><div class="reading-structured-field__value">${h(r)}</div></section>`),typeof e?.question=="string"&&e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">Tvoje ot\xE1zka</small><p class="reading-question__text">${i(e.question)}</p></div>`),typeof e?.intention=="string"&&e.intention&&e.intention!==e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">P\u016Fvodn\xED z\xE1m\u011Br</small><p class="reading-question__text">${i(e.intention)}</p></div>`),e?.rune&&typeof e.rune=="object"&&(n+=`<section class="reading-summary-panel"><h3>${i(e.rune.symbol||"")} ${i(e.rune.name||"Runa")}</h3><p>${i(e.rune.meaning||"")}</p></section>`),e?.card&&typeof e.card=="object"&&a.type!=="tarot"&&(n+=`<section class="reading-summary-panel"><h3>${i(e.card.name||"Karta")}</h3><p>${i(e.card.theme||"")}</p><p>${i(e.card.message||"")}</p></section>`),e?.totem&&(n+=`<section class="reading-summary-panel"><h3>P\u016Fvodn\xED symbol</h3>${typeof e.totem=="object"?m(e.totem):`<p>${i(e.totem)}</p>`}</section>`),e&&typeof e=="object"&&(a.type==="synastry"&&(n+=Se(e)),a.type==="numerology"&&(n+=K("Vypo\u010Dten\xE1 \u010D\xEDsla",[{label:"\u017Divotn\xED cesta",value:e.lifePath},{label:"Osud",value:e.destiny},{label:"Du\u0161e",value:e.soul},{label:"Osobnost",value:e.personality}])),n+=Ae(e.chart||e.synastry?.person1?.chart),a.type==="astrocartography"&&(n+=Ee(e.astrocartography)));function p(s,c){return typeof c=="string"&&/^\/?img\/tarot-v2\/[a-z0-9_-]+\.webp$/i.test(c)?c:!s||typeof s!="string"?"img/tarot-v2/tarot_card_back.webp":`img/tarot-v2/tarot_${s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_").replace(/[^a-z0-9_]/g,"")}.webp`}let l=Array.isArray(e.cards)?e.cards:a.type==="tarot"&&(e.card_name||e.cardName)?[{name:e.card_name||e.cardName}]:null;if(typeof e=="string")n+=`<div class="reading-plain-text">${i(e).replace(/\n/g,"<br>")}</div>`;else if(a.type==="tarot"&&l?.length){n+='<div class="reading-tarot-grid">',l.forEach(c=>{let f=typeof c=="string"?{name:c}:c||{},oe=p(f.name,f.image);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${i(oe)}"
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
            </details>`)})}else if(a.type==="horoscope"&&(e.text||e.prediction)){let s=e.text||e.prediction,f={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[e.period]||e.period||"Horoskop";n+=`
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
        `}else if(e.interpretation||e.response||e.text||e.result){let s=e.interpretation||e.response||e.text||e.result;if(typeof s=="string"){let c=h(s);n+=`<div class="formatted-content reading-formatted-content">${c}</div>`}else n+=`<div class="reading-structured">${m(s)}</div>`}else{let s=m(e);n+=s?`<div class="reading-structured">${s}</div>`:'<p class="reading-formatted-content reading-detail__empty">Tento v\xFDklad u\u017E nem\xE1 ulo\u017Een\xFD \u010Diteln\xFD obsah.</p>'}return n+="</div>",n+=ke(a),n}export{q as closeReadingModal,Fe as deleteReading,ye as toggleFavorite,Ie as toggleFavoriteModal,Ne as viewReading};
