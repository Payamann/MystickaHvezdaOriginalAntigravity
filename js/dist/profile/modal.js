function o(t){if(!t)return"";let a=document.createElement("div");return a.textContent=t,a.innerHTML}function y(){return window.API_CONFIG?.BASE_URL||"/api"}function x(t=!1){let a=window.Auth?.token,n={};return a&&(n.Authorization=`Bearer ${a}`),t&&(n["Content-Type"]="application/json"),n}async function S(t=!1){let a=x(t),n=window.getCSRFToken?await window.getCSRFToken():null;return n&&(a["X-CSRF-Token"]=n),a}function R(t){let n={angel:"angel","angel-card":"angel",astrocartography:"globe",crystal:"crystal","crystal-ball":"crystal","daily-wisdom":"star",horoscope:"chart",journal:"pen","medicine-wheel":"compass",natal:"chart","natal-chart":"chart",numerology:"numbers","past-life":"hourglass",runes:"rune",synastry:"partner",tarot:"tarot",oracle:"eye"}[t]||"star";return p(n)}function te(t){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Osobn\xED pozn\xE1mka","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie",oracle:"Or\xE1kulum","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[t]||"V\xFDklad"}var ae=[{value:"all",label:"V\u0161e"},...[["tarot","Tarot"],["horoscope","Horoskopy"],["journal","Moje pozn\xE1mky"],["crystal-ball","K\u0159i\u0161\u0165\xE1lov\xE1 koule",["crystal-ball","crystal"]],["natal-chart","Nat\xE1ln\xED karta",["natal-chart","natal"]],["numerology","Numerologie"],["synastry","Partnersk\xE1 shoda"],["angel-card","And\u011Blsk\xE9 karty",["angel-card","angel"]],["runes","Runy"],["astrocartography","Astro mapa"],["past-life","Minul\xFD \u017Eivot"],["medicine-wheel","\u0160amansk\xE9 kolo"],["daily-wisdom","Denn\xED moudrost"],["oracle","Or\xE1kulum"]].map(([t,a,n])=>({value:t,label:a,types:n||[t]}))];function k(t){let a=t.data;if(t.type==="journal")return a;if(typeof a=="string")try{a=JSON.parse(a)}catch{return a}return a}function z(t){let a=k(t||{});if(t?.type==="tarot"){if(a?.tool==="tarot_yes_no")return"Tarot ano/ne";let e={"Tarot karta dne":"Tarot karta dne",daily:"Tarot karta dne","Jedna karta":"Tarot \xB7 jedna karta","T\u0159i karty":"Tarot \xB7 t\u0159i karty","Celtic Cross":"Tarot \xB7 Keltsk\xFD k\u0159\xED\u017E"};if(e[a?.spreadType])return e[a.spreadType];if(typeof a?.spreadType=="string"&&a.spreadType.endsWith(" (Uk\xE1zka)"))return`${e[a.spreadType.slice(0,-9)]||"Tarotov\xFD v\xFDklad"} \xB7 uk\xE1zka`}return t?.type!=="horoscope"?te(t?.type):[{daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop",yearly:"Ro\u010Dn\xED horoskop"}[a?.period]||"Horoskop",a?.sign].filter(e=>typeof e=="string"&&e).join(" \xB7 ")}function P(t){let a=k(t||{}),n=t?.type==="journal"&&typeof a=="string"?a:typeof a?.question=="string"?a.question:typeof a?.intention=="string"?a.intention:Array.isArray(a?.cards)?a.cards.map(e=>typeof e=="string"?e:e?.name||"").join(" \xB7 "):a?.cardName||"";return typeof n=="string"?n.replace(/\s+/g," ").trim().slice(0,160):""}function p(t){if(!new Set(["book","bookmark","warning","angel","globe","crystal","star","chart","pen","compass","numbers","hourglass","rune","partner","tarot","eye","dream","leaf","flower","user","check"]).has(t))throw new Error("Unknown profile UI icon");return'<svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#'+t+'"></use></svg>'}var K=[],_="all",ne=0,re=[];var D=0;var j=null;var O=!1,q=!1;function Z(){return K}function V(t,a){j&&t!==a&&(j.favorites=Math.max(0,j.favorites+(a?1:-1)))}function U(t,a){let n=K.find(e=>e.id===t);n&&Object.assign(n,a)}function oe(){return re}function ie(){return q||(q=!0,window.MH_ANALYTICS?.trackEvent?.("profile_activation_viewed",{source:"profile_history",feature:"profile_history"})),`
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
    `}function J(){let t=document.getElementById("readings-list");if(!t)return;let a=oe();if(_==="all"&&D===0){t.innerHTML=ie(),L(0,0);return}if(a.length===0){_==="all"&&!O&&(O=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),t.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">${p("book")}</div>
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
        `,L(0,0);return}let n=a.slice(0,ne);t.innerHTML=`${n.map(e=>`
        <div class="reading-item card" data-reading-id="${o(e.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${R(e.type)}</span>
                    <div>
                        <strong>${o(z(e))}</strong>
                        ${P(e)?`<p class="reading-item__preview">${o(P(e))}</p>`:""}
                        <p class="reading-item__date">
                            ${new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${o(e.id)}"
                        title="${e.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${e.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}" aria-pressed="${!!e.is_favorite}">
                        ${p("bookmark")}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${o(e.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join("")}`,L(n.length,D),window.lucide?.createIcons?.()}function L(t,a){let n=document.getElementById("readings-pagination");if(n)if(t<a){n.hidden=!1,n.classList.add("profile-block-visible");let e=document.getElementById("readings-load-more");e&&(e.textContent=`Na\u010D\xEDst dal\u0161\xED (${a-t} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}var W={cs:"Z\xE1kladn\xED symbolick\xFD v\xFDklad. Osobn\xED generov\xE1n\xED te\u010F nen\xED dostupn\xE9.",sk:"Z\xE1kladn\xFD symbolick\xFD v\xFDklad. Osobn\xE9 generovanie teraz nie je dostupn\xE9.",pl:"Podstawowa interpretacja symboliczna. Indywidualne generowanie jest teraz niedost\u0119pne."};function G(t="cs"){return W[String(t).slice(0,2)]||W.cs}function w(t){let a=String(t||"").replace(/```(?:html)?/g,"").trim();if(window.DOMPurify?.sanitize){let e=/<\/?(?:p|h[3-5]|ul|ol|li|blockquote)\b/i.test(a)?a:a.replace(/\n/g,"<br>");return window.DOMPurify.sanitize(e,{ALLOWED_TAGS:["h3","h4","h5","p","strong","b","em","i","ul","ol","li","blockquote","br"],ALLOWED_ATTR:[]})}let n=document.createElement("div");return n.textContent=a.replace(/<[^>]*>/g,""),n.innerHTML.replace(/\n/g,"<br>")}var I=null,h=!1,u=null,d=0,A=null,m=!1,b=null,v=null,T=null,E=new Map;function F(t){return`${window.Auth?.user?.id||""}:${t}`}function Q(t){let a=F(t);if(E.has(a))return null;let n,e=new Promise(r=>{n=r}),i={key:a,promise:e,finish:n};return E.set(a,i),i}function X(t){E.delete(t.key),t.finish(),f()}var se=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],le=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function Se(t){let a=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!a||!n)return;let e=++d;A?.abort();let i=new AbortController;A=i,I=t,u=null,h=!1,m=!1,C(),f(),a.hidden=!1,a.classList.add("is-visible"),n.setAttribute("aria-busy","true"),n.innerHTML='<p class="reading-modal__loading" role="status">Na\u010D\xEDt\xE1n\xED...</p>',de(a);try{let r=E.get(F(t));if(r&&(await r.promise,e!==d))return;let s=await fetch(`${y()}/user/readings/${encodeURIComponent(t)}`,{credentials:"include",headers:x(),signal:i.signal});if(!s.ok)throw new Error("Failed to fetch reading");let l=await s.json();if(e!==d)return;let c=l.reading;if(!c||String(c.id)!==String(t))throw new Error("Invalid reading detail");n.innerHTML=ke(c),fe(n),ge(n,c),u=t,h=!!c.is_favorite,C()}catch(r){if(e!==d)return;u=null,console.error("Error loading reading:",r),n.innerHTML='<p class="reading-modal__error" role="alert">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad. Zav\u0159i detail a zkus ho otev\u0159\xEDt znovu.</p>'}finally{e===d&&(A=null,n.setAttribute("aria-busy","false"),f())}}function H(){++d,A?.abort(),A=null;let t=document.getElementById("reading-modal");t&&(t.classList.remove("is-visible"),t.hidden=!0),I=null,u=null,m=!1,document.getElementById("reading-modal-content")?.setAttribute("aria-busy","false"),f(),ue()}async function Re(){if(!B())return;let t=u,a=d;m=!0,f();try{let n=await ce(t);if(a!==d||n===void 0)return;h=n,C()}finally{a===d&&(m=!1,f())}}async function ce(t,a=null){let n=window.Auth?.user?.id,e=Q(t);if(e){a&&(a.disabled=!0);try{let i=await fetch(`${y()}/user/readings/${encodeURIComponent(t)}/favorite`,{method:"PATCH",credentials:"include",headers:await S()});if(!i.ok)throw new Error("Failed to toggle favorite");let r=await i.json();if(typeof r.is_favorite!="boolean")throw new Error("Neplatn\xE1 odpov\u011B\u010F obl\xEDben\xFDch.");if(n!==window.Auth?.user?.id)return r.is_favorite;V(!r.is_favorite,r.is_favorite),a&&(a.innerHTML=p("bookmark"),a.setAttribute("aria-pressed",String(r.is_favorite)),a.title=r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",a.setAttribute("aria-label",r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let l=Z().find(c=>c.id===t);return l&&(l.is_favorite=r.is_favorite,J()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"favorite",id:t,isFavorite:r.is_favorite}})),r.is_favorite}catch(i){console.error("Error toggling favorite:",i),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}finally{X(e),a&&(a.disabled=!1)}}}async function ze(){if(!B())return;let t=u,a=d;if(!confirm("Opravdu chce\u0161 smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))return;let n=Q(t);if(!n)return;m=!0;let e=window.Auth?.user?.id;f();try{if(!(await fetch(`${y()}/user/readings/${encodeURIComponent(t)}`,{method:"DELETE",credentials:"include",headers:await S()})).ok)throw new Error("Failed to delete reading");if(e!==window.Auth?.user?.id)return;window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),a===d&&H(),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"delete",id:t}}))}catch(i){console.error("Error deleting reading:",i),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}finally{X(n),a===d&&(m=!1,f())}}function B(){return u!==null&&u===I&&!m&&!E.has(F(u))}function f(){["modal-favorite-btn","modal-delete-btn"].forEach(t=>{let a=document.getElementById(t);a&&(a.disabled=!B())})}function C(){let t=document.getElementById("modal-favorite-btn");t&&(t.innerHTML=`${p("bookmark")} ${h?"V obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}`,t.setAttribute("aria-pressed",String(h)),t.setAttribute("aria-label",h?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function de(t){if(v===t)return;b=document.activeElement,v=t;let a=Y(t);(t.querySelector(".modal__close")||a[0]||t).focus(),T=e=>{if(!v)return;if(e.key==="Escape"){e.preventDefault(),H();return}if(e.key!=="Tab")return;let i=Y(v);if(!i.length){e.preventDefault(),v.focus();return}let r=i[0],s=i[i.length-1];e.shiftKey&&document.activeElement===r?(e.preventDefault(),s.focus()):!e.shiftKey&&document.activeElement===s&&(e.preventDefault(),r.focus())},document.addEventListener("keydown",T)}function ue(){if(T&&(document.removeEventListener("keydown",T),T=null),v=null,b){let t=b.closest("[data-reading-id]")?.dataset.readingId,a=[...document.querySelectorAll('[data-reading-action="view"]')].find(e=>e.dataset.readingId===t&&e.offsetParent!==null);(b.isConnected?b:a||document.querySelector('.profile-tab[aria-selected="true"]'))?.focus(),b=null}}function Y(t){return Array.from(t.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(a=>a.offsetParent!==null)}function fe(t){t.querySelectorAll("[data-tarot-fallback]").forEach(a=>{a.addEventListener("error",()=>{a.dataset.fallbackApplied!=="1"&&(a.dataset.fallbackApplied="1",a.src="/img/tarot-v2/tarot_card_back.webp")})})}function M(t,a,n="neutral"){let e=t?.querySelector?.(".reading-feedback__status");e&&(e.textContent=a,e.dataset.state=n)}async function N(t,a,n,e){if(!t)return null;e&&(e.disabled=!0),M(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let i=null;try{if(window.Auth?.saveReadingFeedback)i=await window.Auth.saveReadingFeedback(t,{...a,feature:"profile_history",source:"profile_reading_modal"});else{let r=await fetch(`${y()}/user/readings/${encodeURIComponent(t)}/feedback`,{method:"PATCH",credentials:"include",headers:await S(!0),body:JSON.stringify({...a,feature:"profile_history",source:"profile_reading_modal"})});i=await r.json().catch(()=>null),r.ok||(i=null)}return i?.success?(i.reading&&U(t,i.reading),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"feedback",id:t}})),M(n,"Zp\u011Btn\xE1 vazba je ulo\u017Een\xE1.","success"),i):(M(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null)}catch(r){return console.warn("Reading feedback unavailable:",r.message),M(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null}finally{e&&(e.disabled=!1)}}function pe(t){let a=k(t||{});if(t?.type==="journal"||!a||typeof a!="object"||Array.isArray(a))return"";let n=a.feedback&&typeof a.feedback=="object"&&!Array.isArray(a.feedback)?a.feedback:{},e=se.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${o(r.label)}
        </button>
    `).join(""),i=le.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.focus===r.value?"is-selected":""}" data-feedback-focus="${r.value}">
            ${o(r.label)}
        </button>
    `).join("");return`
        <section class="reading-feedback" data-reading-feedback="${o(t.id)}">
            <div class="reading-feedback__header">
                <span class="reading-feedback__eyebrow">Zp\u011Btn\xE1 vazba</span>
                <strong>Co m\xE1 profil br\xE1t jako dal\u0161\xED sign\xE1l?</strong>
            </div>
            <div class="reading-feedback__chips" aria-label="Zp\u011Btn\xE1 vazba k v\xFDkladu">
                ${e}
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
    `}function me(){H();let t=document.getElementById("journal-input");t&&(window.history.replaceState(null,"","#journal-input"),t.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>t.focus(),250))}function ge(t,a){let n=t.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async e=>{let i=e.target.closest("[data-feedback-resonance]"),r=e.target.closest("[data-feedback-focus]"),s=e.target.closest("[data-feedback-next-action]"),l=i||r||s;if(!l)return;let c={};if(i&&(c.resonance=i.dataset.feedbackResonance),r&&(c.focus=r.dataset.feedbackFocus),s&&(c.nextAction=s.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(g=>{(c.resonance&&g.dataset.feedbackResonance||c.focus&&g.dataset.feedbackFocus)&&g.classList.toggle("is-selected",g===l)}),s?.tagName==="A"){e.preventDefault(),(await N(a.id,c,n,null))?.success&&(window.location.href=s.getAttribute("href"));return}if(c.nextAction==="journal"){(await N(a.id,c,n,s))?.success&&me();return}await N(a.id,c,n,l)})}function ye(t){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[t]||String(t).replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function $(t){return!t||typeof t!="object"?"":Object.entries(t).filter(([,a])=>a!=null&&a!=="").map(([a,n])=>{let e=typeof n=="object"?JSON.stringify(n,null,2):String(n);return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${o(ye(a))}</h4>
                    <p class="reading-structured-field__value">${o(e).replace(/\n/g,"<br>")}</p>
                </section>
            `}).join("")}function ee(t,a){let n=a.filter(e=>e.value!==null&&e.value!==void 0&&e.value!=="").map(e=>`
            <span class="reading-metric">
                <strong>${o(e.label)}</strong>
                <span>${o(e.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${o(t)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function be(t){let a=t?.summary;return a?ee("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:a.sunSign},{label:"M\u011Bs\xEDc",value:a.moonSign},{label:"Ascendent",value:a.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:a.dominantElement},{label:"Modalita",value:a.dominantQuality}]):""}function ve(t){let a=t?.synastry?.scores||t?.scores;return a?ee("Sk\xF3re vztahu",[{label:"Celkem",value:`${a.total??"--"} %`},{label:"Emoce",value:`${a.emotion??"--"} %`},{label:"Komunikace",value:`${a.communication??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${a.passion??"--"} %`},{label:"Stabilita",value:`${a.stability??"--"} %`}]):""}function he(t){if(!t||typeof t!="object")return"";let a=Array.isArray(t.recommendations)?t.recommendations.slice(0,3):[],n=Array.isArray(t.angularLines)?t.angularLines.slice(0,4):[],e=a.map(r=>`
        <li>
            <strong>${o(r.city||"M\xEDsto")}</strong>
            <span>${o(r.score??"--")} / 100 \xB7 ${o(r.primaryPlanet?.name||"planeta")}</span>
        </li>
    `).join(""),i=n.map(r=>`
        <li>
            <strong>${o(r.planetName||"Planeta")} ${o(r.angle||"")}</strong>
            <span>${o(r.longitude??"--")}\xB0</span>
        </li>
    `).join("");return!e&&!i?"":`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">Astro mapa</h3>
            ${e?`<ul class="reading-summary-list">${e}</ul>`:""}
            ${i?`<ul class="reading-summary-list reading-summary-list--compact">${i}</ul>`:""}
        </section>
    `}function ke(t){let a=new Date(t.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${R(t.type)}</span>
            <h2 class="reading-detail__title">${o(z(t))}</h2>
            <p class="reading-detail__date">${a}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,e=k(t)||{};e?.fallback&&(n+=`<p class="result-context-notice">${o(G())}</p>`),typeof e?.question=="string"&&e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">Tvoje ot\xE1zka</small><p class="reading-question__text">${o(e.question)}</p></div>`),typeof e?.intention=="string"&&e.intention&&e.intention!==e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">P\u016Fvodn\xED z\xE1m\u011Br</small><p class="reading-question__text">${o(e.intention)}</p></div>`),e?.rune&&typeof e.rune=="object"&&(n+=`<section class="reading-summary-panel"><h3>${o(e.rune.symbol||"")} ${o(e.rune.name||"Runa")}</h3><p>${o(e.rune.meaning||"")}</p></section>`),e?.card&&typeof e.card=="object"&&t.type!=="tarot"&&(n+=`<section class="reading-summary-panel"><h3>${o(e.card.name||"Karta")}</h3><p>${o(e.card.theme||"")}</p><p>${o(e.card.message||"")}</p></section>`),e?.totem&&(n+=`<section class="reading-summary-panel"><h3>P\u016Fvodn\xED symbol</h3>${typeof e.totem=="object"?$(e.totem):`<p>${o(e.totem)}</p>`}</section>`),e&&typeof e=="object"&&(t.type==="synastry"&&(n+=ve(e)),n+=be(e.chart||e.synastry?.person1?.chart),t.type==="astrocartography"&&(n+=he(e.astrocartography)));function i(r){return!r||typeof r!="string"?"img/tarot-v2/tarot_card_back.webp":`img/tarot-v2/tarot_${r.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_").replace(/[^a-z0-9_]/g,"")}.webp`}if(typeof e=="string")n+=`<div class="reading-plain-text">${o(e).replace(/\n/g,"<br>")}</div>`;else if(t.type==="tarot"&&Array.isArray(e.cards)){n+='<div class="reading-tarot-grid">',e.cards.forEach(s=>{let l=typeof s=="string"?{name:s}:s||{},c=i(l.name);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${o(c)}"
                              alt="${o(l.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${o(l.name)}</p>
                    ${l.position?`<small class="reading-tarot-card__position">${o(l.position)}</small>`:""}
                    ${l.meaning?`<p>${o(l.meaning)}</p>`:""}
                    ${l.interpretation?`<details class="reading-card-reference" ${!e.response&&!e.interpretation?"open":""}><summary>V\xFDznam t\xE9to karty</summary><div class="reading-interpretation__text">${typeof l.interpretation=="object"?$(l.interpretation):w(l.interpretation)}</div></details>`:""}
                </div>
            `}),n+="</div>";let r=e.response||e.interpretation;if(r){let s=typeof r=="object"?$(r):w(r);n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${s}
                    </div>
                </div>
            `}}else if(t.type==="horoscope"&&(e.text||e.prediction)){let r=e.text||e.prediction,l={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[e.period]||e.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${o(e.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${o(l)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${typeof r=="object"?$(r):w(r)}
            </div>
        `,e.affirmation&&(n+=`<section class="reading-summary-panel"><h4>Podn\u011Bt k zamy\u0161len\xED</h4><p>${o(e.affirmation)}</p></section>`),e.luckyNumbers&&(n+=`
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">\u0160\u0165astn\xE1 \u010D\xEDsla</span>
                    <span class="reading-lucky-numbers__value">${o(e.luckyNumbers.toString())}</span>
                </div>
            `)}else if(e.answer)n+=`
            <div class="reading-answer">
                ${o(e.answer)}
            </div>
        `;else if(e.interpretation||e.response||e.text||e.result){let r=e.interpretation||e.response||e.text||e.result;if(typeof r=="string"){let s=w(r);n+=`<div class="formatted-content reading-formatted-content">${s}</div>`}else n+=`<div class="reading-structured">${$(r)}</div>`}else n+=`<pre class="reading-json">${o(JSON.stringify(e,null,2))}</pre>`;return n+="</div>",n+=pe(t),n}export{H as closeReadingModal,ze as deleteReading,ce as toggleFavorite,Re as toggleFavoriteModal,Se as viewReading};
