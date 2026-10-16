function o(a){if(!a)return"";let t=document.createElement("div");return t.textContent=a,t.innerHTML}function y(){return window.API_CONFIG?.BASE_URL||"/api"}function T(a=!1){let t=window.Auth?.token,n={};return t&&(n.Authorization=`Bearer ${t}`),a&&(n["Content-Type"]="application/json"),n}async function x(a=!1){let t=T(a),n=window.getCSRFToken?await window.getCSRFToken():null;return n&&(t["X-CSRF-Token"]=n),t}function R(a){let n={angel:"angel","angel-card":"angel",astrocartography:"globe",crystal:"crystal","crystal-ball":"crystal","daily-wisdom":"star",horoscope:"chart",journal:"pen","medicine-wheel":"compass",natal:"chart","natal-chart":"chart",numerology:"numbers","past-life":"hourglass",runes:"rune",synastry:"partner",tarot:"tarot",oracle:"eye"}[a]||"star";return m(n)}function te(a){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Osobn\xED pozn\xE1mka","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie",oracle:"Or\xE1kulum","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[a]||"V\xFDklad"}var ae=[{value:"all",label:"V\u0161e"},...[["tarot","Tarot"],["horoscope","Horoskopy"],["journal","Moje pozn\xE1mky"],["crystal-ball","K\u0159i\u0161\u0165\xE1lov\xE1 koule",["crystal-ball","crystal"]],["natal-chart","Nat\xE1ln\xED karta",["natal-chart","natal"]],["numerology","Numerologie"],["synastry","Partnersk\xE1 shoda"],["angel-card","And\u011Blsk\xE9 karty",["angel-card","angel"]],["runes","Runy"],["astrocartography","Astro mapa"],["past-life","Minul\xFD \u017Eivot"],["medicine-wheel","\u0160amansk\xE9 kolo"],["daily-wisdom","Denn\xED moudrost"],["oracle","Or\xE1kulum"]].map(([a,t,n])=>({value:a,label:t,types:n||[a]}))];function k(a){let t=a.data;if(a.type==="journal")return t;if(typeof t=="string")try{t=JSON.parse(t)}catch{return t}return t}function z(a){let t=k(a||{});if(a?.type==="tarot"){if(t?.tool==="tarot_yes_no")return"Tarot ano/ne";let e={"Tarot karta dne":"Tarot karta dne",daily:"Tarot karta dne","Jedna karta":"Tarot \xB7 jedna karta","T\u0159i karty":"Tarot \xB7 t\u0159i karty","Celtic Cross":"Tarot \xB7 Keltsk\xFD k\u0159\xED\u017E"};if(e[t?.spreadType])return e[t.spreadType];if(typeof t?.spreadType=="string"&&t.spreadType.endsWith(" (Uk\xE1zka)"))return`${e[t.spreadType.slice(0,-9)]||"Tarotov\xFD v\xFDklad"} \xB7 uk\xE1zka`}return a?.type!=="horoscope"?te(a?.type):[{daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop",yearly:"Ro\u010Dn\xED horoskop"}[t?.period]||"Horoskop",t?.sign].filter(e=>typeof e=="string"&&e).join(" \xB7 ")}function M(a){let t=k(a||{}),n=Array.isArray(t?.cards)?t.cards.map(i=>typeof i=="string"?i:i?.name||"").filter(Boolean).join(" \xB7 "):"",e=[t?.question,t?.intention,n,t?.cardName,t?.card_name,t?.card?.name,t?.rune?.name,typeof t=="string"?t:""].find(i=>typeof i=="string"&&i.trim());return typeof e=="string"?e.replace(/\s+/g," ").trim().slice(0,160):""}function m(a){if(!new Set(["book","bookmark","warning","angel","globe","crystal","star","chart","pen","compass","numbers","hourglass","rune","partner","tarot","eye","dream","leaf","flower","user","check"]).has(a))throw new Error("Unknown profile UI icon");return'<svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#'+a+'"></use></svg>'}var Z=[],_="all",ne=0,re=[];var D=0;var j=null;var q=!1,K=!1;function V(){return Z}function U(a,t){j&&a!==t&&(j.favorites=Math.max(0,j.favorites+(t?1:-1)))}function J(a,t){let n=Z.find(e=>e.id===a);n&&Object.assign(n,t)}function oe(){return re}function ie(){return K||(K=!0,window.MH_ANALYTICS?.trackEvent?.("profile_activation_viewed",{source:"profile_history",feature:"profile_history"})),`
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
    `}function W(){let a=document.getElementById("readings-list");if(!a)return;let t=oe();if(_==="all"&&D===0){a.innerHTML=ie(),L(0,0);return}if(t.length===0){_==="all"&&!q&&(q=!0,window.MH_ANALYTICS?.trackEvent?.("profile_empty_history_viewed",{source:"profile_history",feature:"profile_history"})),a.innerHTML=`
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
        `,L(0,0);return}let n=t.slice(0,ne);a.innerHTML=`${n.map(e=>`
        <div class="reading-item card" data-reading-id="${o(e.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${R(e.type)}</span>
                    <div>
                        <strong>${o(z(e))}</strong>
                        ${M(e)?`<p class="reading-item__preview">${o(M(e))}</p>`:""}
                        <p class="reading-item__date">
                            ${new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${o(e.id)}"
                        title="${e.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${e.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}" aria-pressed="${!!e.is_favorite}">
                        ${m("bookmark")}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${o(e.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join("")}`,L(n.length,D),window.lucide?.createIcons?.()}function L(a,t){let n=document.getElementById("readings-pagination");if(n)if(a<t){n.hidden=!1,n.classList.add("profile-block-visible");let e=document.getElementById("readings-load-more");e&&(e.textContent=`Na\u010D\xEDst dal\u0161\xED (${t-a} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}var G={cs:"Z\xE1kladn\xED symbolick\xFD v\xFDklad. Osobn\xED generov\xE1n\xED te\u010F nen\xED dostupn\xE9.",sk:"Z\xE1kladn\xFD symbolick\xFD v\xFDklad. Osobn\xE9 generovanie teraz nie je dostupn\xE9.",pl:"Podstawowa interpretacja symboliczna. Indywidualne generowanie jest teraz niedost\u0119pne."};function Y(a="cs"){return G[String(a).slice(0,2)]||G.cs}function w(a){let t=String(a||"").replace(/```(?:html)?/g,"").trim();if(window.DOMPurify?.sanitize){let e=/<\/?(?:p|h[3-5]|ul|ol|li|blockquote)\b/i.test(t)?t:t.replace(/\n/g,"<br>");return window.DOMPurify.sanitize(e,{ALLOWED_TAGS:["h3","h4","h5","p","strong","b","em","i","ul","ol","li","blockquote","br"],ALLOWED_ATTR:[]})}let n=document.createElement("div");return n.textContent=t.replace(/<[^>]*>/g,""),n.innerHTML.replace(/\n/g,"<br>")}var F=null,h=!1,u=null,d=0,A=null,g=!1,b=null,v=null,S=null,E=new Map;function C(a){return`${window.Auth?.user?.id||""}:${a}`}function X(a){let t=C(a);if(E.has(t))return null;let n,e=new Promise(r=>{n=r}),i={key:t,promise:e,finish:n};return E.set(t,i),i}function ee(a){E.delete(a.key),a.finish(),p()}var se=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],le=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function xe(a){let t=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!t||!n)return;let e=++d;A?.abort();let i=new AbortController;A=i,F=a,u=null,h=!1,g=!1,I(),p(),t.hidden=!1,t.classList.add("is-visible"),n.setAttribute("aria-busy","true"),n.innerHTML='<p class="reading-modal__loading" role="status">Na\u010D\xEDt\xE1n\xED...</p>',de(t);try{let r=E.get(C(a));if(r&&(await r.promise,e!==d))return;let s=await fetch(`${y()}/user/readings/${encodeURIComponent(a)}`,{credentials:"include",headers:T(),signal:i.signal});if(!s.ok)throw new Error("Failed to fetch reading");let l=await s.json();if(e!==d)return;let c=l.reading;if(!c||String(c.id)!==String(a))throw new Error("Invalid reading detail");n.innerHTML=ke(c),fe(n),ge(n,c),u=a,h=!!c.is_favorite,I()}catch(r){if(e!==d)return;u=null,console.error("Error loading reading:",r),n.innerHTML='<p class="reading-modal__error" role="alert">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad. Zav\u0159i detail a zkus ho otev\u0159\xEDt znovu.</p>'}finally{e===d&&(A=null,n.setAttribute("aria-busy","false"),p())}}function H(){++d,A?.abort(),A=null;let a=document.getElementById("reading-modal");a&&(a.classList.remove("is-visible"),a.hidden=!0),F=null,u=null,g=!1,document.getElementById("reading-modal-content")?.setAttribute("aria-busy","false"),p(),ue()}async function Re(){if(!O())return;let a=u,t=d;g=!0,p();try{let n=await ce(a);if(t!==d||n===void 0)return;h=n,I()}finally{t===d&&(g=!1,p())}}async function ce(a,t=null){let n=window.Auth?.user?.id,e=X(a);if(e){t&&(t.disabled=!0);try{let i=await fetch(`${y()}/user/readings/${encodeURIComponent(a)}/favorite`,{method:"PATCH",credentials:"include",headers:await x()});if(!i.ok)throw new Error("Failed to toggle favorite");let r=await i.json();if(typeof r.is_favorite!="boolean")throw new Error("Neplatn\xE1 odpov\u011B\u010F obl\xEDben\xFDch.");if(n!==window.Auth?.user?.id)return r.is_favorite;U(!r.is_favorite,r.is_favorite),t&&(t.innerHTML=m("bookmark"),t.setAttribute("aria-pressed",String(r.is_favorite)),t.title=r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",t.setAttribute("aria-label",r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let l=V().find(c=>c.id===a);return l&&(l.is_favorite=r.is_favorite,W()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"favorite",id:a,isFavorite:r.is_favorite}})),r.is_favorite}catch(i){console.error("Error toggling favorite:",i),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}finally{ee(e),t&&(t.disabled=!1)}}}async function ze(){if(!O())return;let a=u,t=d;if(!confirm("Opravdu chce\u0161 smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))return;let n=X(a);if(!n)return;g=!0;let e=window.Auth?.user?.id;p();try{if(!(await fetch(`${y()}/user/readings/${encodeURIComponent(a)}`,{method:"DELETE",credentials:"include",headers:await x()})).ok)throw new Error("Failed to delete reading");if(e!==window.Auth?.user?.id)return;window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),t===d&&H(),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"delete",id:a}}))}catch(i){console.error("Error deleting reading:",i),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}finally{ee(n),t===d&&(g=!1,p())}}function O(){return u!==null&&u===F&&!g&&!E.has(C(u))}function p(){["modal-favorite-btn","modal-delete-btn"].forEach(a=>{let t=document.getElementById(a);t&&(t.disabled=!O())})}function I(){let a=document.getElementById("modal-favorite-btn");a&&(a.innerHTML=`${m("bookmark")} ${h?"V obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}`,a.setAttribute("aria-pressed",String(h)),a.setAttribute("aria-label",h?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function de(a){if(v===a)return;b=document.activeElement,v=a;let t=Q(a);(a.querySelector(".modal__close")||t[0]||a).focus(),S=e=>{if(!v)return;if(e.key==="Escape"){e.preventDefault(),H();return}if(e.key!=="Tab")return;let i=Q(v);if(!i.length){e.preventDefault(),v.focus();return}let r=i[0],s=i[i.length-1];e.shiftKey&&document.activeElement===r?(e.preventDefault(),s.focus()):!e.shiftKey&&document.activeElement===s&&(e.preventDefault(),r.focus())},document.addEventListener("keydown",S)}function ue(){if(S&&(document.removeEventListener("keydown",S),S=null),v=null,b){let a=b.closest("[data-reading-id]")?.dataset.readingId,t=[...document.querySelectorAll('[data-reading-action="view"]')].find(e=>e.dataset.readingId===a&&e.offsetParent!==null);(b.isConnected?b:t||document.querySelector('.profile-tab[aria-selected="true"]'))?.focus(),b=null}}function Q(a){return Array.from(a.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(t=>t.offsetParent!==null)}function fe(a){a.querySelectorAll("[data-tarot-fallback]").forEach(t=>{t.addEventListener("error",()=>{t.dataset.fallbackApplied!=="1"&&(t.dataset.fallbackApplied="1",t.src="/img/tarot-v2/tarot_card_back.webp")})})}function P(a,t,n="neutral"){let e=a?.querySelector?.(".reading-feedback__status");e&&(e.textContent=t,e.dataset.state=n)}async function N(a,t,n,e){if(!a)return null;e&&(e.disabled=!0),P(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let i=null;try{if(window.Auth?.saveReadingFeedback)i=await window.Auth.saveReadingFeedback(a,{...t,feature:"profile_history",source:"profile_reading_modal"});else{let r=await fetch(`${y()}/user/readings/${encodeURIComponent(a)}/feedback`,{method:"PATCH",credentials:"include",headers:await x(!0),body:JSON.stringify({...t,feature:"profile_history",source:"profile_reading_modal"})});i=await r.json().catch(()=>null),r.ok||(i=null)}return i?.success?(i.reading&&J(a,i.reading),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"feedback",id:a}})),P(n,"Zp\u011Btn\xE1 vazba je ulo\u017Een\xE1.","success"),i):(P(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null)}catch(r){return console.warn("Reading feedback unavailable:",r.message),P(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null}finally{e&&(e.disabled=!1)}}function pe(a){let t=k(a||{});if(a?.type==="journal"||!t||typeof t!="object"||Array.isArray(t))return"";let n=t.feedback&&typeof t.feedback=="object"&&!Array.isArray(t.feedback)?t.feedback:{},e=se.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${o(r.label)}
        </button>
    `).join(""),i=le.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.focus===r.value?"is-selected":""}" data-feedback-focus="${r.value}">
            ${o(r.label)}
        </button>
    `).join("");return`
        <section class="reading-feedback" data-reading-feedback="${o(a.id)}">
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
    `}function me(){H();let a=document.getElementById("journal-input");a&&(window.history.replaceState(null,"","#journal-input"),a.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>a.focus(),250))}function ge(a,t){let n=a.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async e=>{let i=e.target.closest("[data-feedback-resonance]"),r=e.target.closest("[data-feedback-focus]"),s=e.target.closest("[data-feedback-next-action]"),l=i||r||s;if(!l)return;let c={};if(i&&(c.resonance=i.dataset.feedbackResonance),r&&(c.focus=r.dataset.feedbackFocus),s&&(c.nextAction=s.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(f=>{(c.resonance&&f.dataset.feedbackResonance||c.focus&&f.dataset.feedbackFocus)&&f.classList.toggle("is-selected",f===l)}),s?.tagName==="A"){e.preventDefault(),(await N(t.id,c,n,null))?.success&&(window.location.href=s.getAttribute("href"));return}if(c.nextAction==="journal"){(await N(t.id,c,n,s))?.success&&me();return}await N(t.id,c,n,l)})}function ye(a){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[a]||String(a).replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function $(a){return!a||typeof a!="object"?"":Object.entries(a).filter(([,t])=>t!=null&&t!=="").map(([t,n])=>{let e=typeof n=="object"?JSON.stringify(n,null,2):String(n);return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${o(ye(t))}</h4>
                    <p class="reading-structured-field__value">${o(e).replace(/\n/g,"<br>")}</p>
                </section>
            `}).join("")}function B(a,t){let n=t.filter(e=>e.value!==null&&e.value!==void 0&&e.value!=="").map(e=>`
            <span class="reading-metric">
                <strong>${o(e.label)}</strong>
                <span>${o(e.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${o(a)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function be(a){let t=a?.summary;return t?B("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:t.sunSign},{label:"M\u011Bs\xEDc",value:t.moonSign},{label:"Ascendent",value:t.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:t.dominantElement},{label:"Modalita",value:t.dominantQuality}]):""}function ve(a){let t=a?.synastry?.scores||a?.scores;return t?B("Sk\xF3re vztahu",[{label:"Osoba 1",value:a.person1?.name},{label:"Osoba 2",value:a.person2?.name},{label:"Celkem",value:`${t.total??t.totalScore??"--"} %`},{label:"Emoce",value:`${t.emotion??t.emotionScore??"--"} %`},{label:"Komunikace",value:`${t.communication??t.commScore??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${t.passion??t.passionScore??"--"} %`},{label:"Stabilita",value:`${t.stability??t.stabilityScore??"--"} %`}]):""}function he(a){if(!a||typeof a!="object")return"";let t=Array.isArray(a.recommendations)?a.recommendations.slice(0,3):[],n=Array.isArray(a.angularLines)?a.angularLines.slice(0,4):[],e=t.map(r=>`
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
    `}function ke(a){let t=new Date(a.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${R(a.type)}</span>
            <h2 class="reading-detail__title">${o(z(a))}</h2>
            <p class="reading-detail__date">${t}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,e=k(a)||{};e?.fallback&&(n+=`<p class="result-context-notice">${o(Y())}</p>`),typeof e?.question=="string"&&e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">Tvoje ot\xE1zka</small><p class="reading-question__text">${o(e.question)}</p></div>`),typeof e?.intention=="string"&&e.intention&&e.intention!==e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">P\u016Fvodn\xED z\xE1m\u011Br</small><p class="reading-question__text">${o(e.intention)}</p></div>`),e?.rune&&typeof e.rune=="object"&&(n+=`<section class="reading-summary-panel"><h3>${o(e.rune.symbol||"")} ${o(e.rune.name||"Runa")}</h3><p>${o(e.rune.meaning||"")}</p></section>`),e?.card&&typeof e.card=="object"&&a.type!=="tarot"&&(n+=`<section class="reading-summary-panel"><h3>${o(e.card.name||"Karta")}</h3><p>${o(e.card.theme||"")}</p><p>${o(e.card.message||"")}</p></section>`),e?.totem&&(n+=`<section class="reading-summary-panel"><h3>P\u016Fvodn\xED symbol</h3>${typeof e.totem=="object"?$(e.totem):`<p>${o(e.totem)}</p>`}</section>`),e&&typeof e=="object"&&(a.type==="synastry"&&(n+=ve(e)),a.type==="numerology"&&(n+=B("Vypo\u010Dten\xE1 \u010D\xEDsla",[{label:"\u017Divotn\xED cesta",value:e.lifePath},{label:"Osud",value:e.destiny},{label:"Du\u0161e",value:e.soul},{label:"Osobnost",value:e.personality}])),n+=be(e.chart||e.synastry?.person1?.chart),a.type==="astrocartography"&&(n+=he(e.astrocartography)));function i(s,l){return typeof l=="string"&&/^\/?img\/tarot-v2\/[a-z0-9_-]+\.webp$/i.test(l)?l:!s||typeof s!="string"?"img/tarot-v2/tarot_card_back.webp":`img/tarot-v2/tarot_${s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_").replace(/[^a-z0-9_]/g,"")}.webp`}let r=Array.isArray(e.cards)?e.cards:a.type==="tarot"&&(e.card_name||e.cardName)?[{name:e.card_name||e.cardName}]:null;if(typeof e=="string")n+=`<div class="reading-plain-text">${o(e).replace(/\n/g,"<br>")}</div>`;else if(a.type==="tarot"&&r?.length){n+='<div class="reading-tarot-grid">',r.forEach(l=>{let c=typeof l=="string"?{name:l}:l||{},f=i(c.name,c.image);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${o(f)}"
                              alt="${o(c.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${o(c.name)}</p>
                    ${c.position?`<small class="reading-tarot-card__position">${o(c.position)}</small>`:""}
                    ${c.meaning?`<p>${o(c.meaning)}</p>`:""}
                </div>
            `}),n+="</div>";let s=e.response||e.interpretation||e.answer;if(s){let l=typeof s=="object"?$(s):w(s);n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${l}
                    </div>
                </div>
            `}r.forEach(l=>{!l||typeof l!="object"||!l.interpretation||(n+=`<details class="reading-card-reference" ${!s&&r.length===1?"open":""}>
                <summary>V\xFDznam karty ${o(l.name)}${l.position?` \xB7 ${o(l.position)}`:""}</summary>
                <div class="reading-interpretation__text">${typeof l.interpretation=="object"?$(l.interpretation):w(l.interpretation)}</div>
            </details>`)})}else if(a.type==="horoscope"&&(e.text||e.prediction)){let s=e.text||e.prediction,c={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[e.period]||e.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${o(e.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${o(c)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${typeof s=="object"?$(s):w(s)}
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
        `;else if(e.interpretation||e.response||e.text||e.result){let s=e.interpretation||e.response||e.text||e.result;if(typeof s=="string"){let l=w(s);n+=`<div class="formatted-content reading-formatted-content">${l}</div>`}else n+=`<div class="reading-structured">${$(s)}</div>`}else n+=`<pre class="reading-json">${o(JSON.stringify(e,null,2))}</pre>`;return n+="</div>",n+=pe(a),n}export{H as closeReadingModal,ze as deleteReading,ce as toggleFavorite,Re as toggleFavoriteModal,xe as viewReading};
