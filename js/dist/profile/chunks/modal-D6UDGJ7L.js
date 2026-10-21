import{a as i,b as v,c as O,d as A,h as T,j as E,k as P,q as z,r as q,v as C,w as D,z as H}from"./chunk-73QVOXZH.js";var B={cs:"Z\xE1kladn\xED symbolick\xFD v\xFDklad. Osobn\xED generov\xE1n\xED te\u010F nen\xED dostupn\xE9.",sk:"Z\xE1kladn\xFD symbolick\xFD v\xFDklad. Osobn\xE9 generovanie teraz nie je dostupn\xE9.",pl:"Podstawowa interpretacja symboliczna. Indywidualne generowanie jest teraz niedost\u0119pne."};function V(t="cs"){return B[String(t).slice(0,2)]||B.cs}function h(t){let a=String(t||"").replace(/```(?:html)?/g,"").trim();if(window.DOMPurify?.sanitize){let e=/<\/?(?:p|h[3-5]|ul|ol|li|blockquote)\b/i.test(a)?a:a.replace(/\n/g,"<br>");return window.DOMPurify.sanitize(e,{ALLOWED_TAGS:["h3","h4","h5","p","strong","b","em","i","ul","ol","li","blockquote","br"],ALLOWED_ATTR:[]})}let n=document.createElement("div");return n.textContent=a.replace(/<[^>]*>/g,""),n.innerHTML.replace(/\n/g,"<br>")}var F=null,y=!1,u=null,d=0,_=null,m=!1,g=null,b=null,w=null,$=new Map;function I(t){return`${window.Auth?.user?.id||""}:${t}`}function Z(t){let a=I(t);if($.has(a))return null;let n,e=new Promise(r=>{n=r}),o={key:a,promise:e,finish:n};return $.set(a,o),o}function R(t){$.delete(t.key),t.finish(),f()}var K=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],J=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function ue(t){let a=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!a||!n)return;let e=++d;_?.abort();let o=new AbortController;_=o,F=t,u=null,y=!1,m=!1,j(),f(),a.hidden=!1,a.classList.add("is-visible"),n.setAttribute("aria-busy","true"),n.innerHTML='<p class="reading-modal__loading" role="status">Na\u010D\xEDt\xE1n\xED...</p>',G(a);try{let r=$.get(I(t));if(r&&(await r.promise,e!==d))return;let s=await fetch(`${v()}/user/readings/${encodeURIComponent(t)}`,{credentials:"include",headers:O(),signal:o.signal});if(!s.ok)throw new Error("Failed to fetch reading");let l=await s.json();if(e!==d)return;let c=l.reading;if(!c||String(c.id)!==String(t))throw new Error("Invalid reading detail");n.innerHTML=oe(c),X(n),te(n,c),u=t,y=!!c.is_favorite,j()}catch(r){if(e!==d)return;u=null,console.error("Error loading reading:",r),n.innerHTML='<p class="reading-modal__error" role="alert">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad. Zav\u0159i detail a zkus ho otev\u0159\xEDt znovu.</p>'}finally{e===d&&(_=null,n.setAttribute("aria-busy","false"),f())}}function M(){++d,_?.abort(),_=null;let t=document.getElementById("reading-modal");t&&(t.classList.remove("is-visible"),t.hidden=!0),F=null,u=null,m=!1,document.getElementById("reading-modal-content")?.setAttribute("aria-busy","false"),f(),Q()}async function fe(){if(!N())return;let t=u,a=d;m=!0,f();try{let n=await W(t);if(a!==d||n===void 0)return;y=n,j()}finally{a===d&&(m=!1,f())}}async function W(t,a=null){let n=window.Auth?.user?.id;if(!window.Auth?.isLoggedIn?.()||typeof n!="string"||!n)return;let e=Z(t);if(e){a&&(a.disabled=!0);try{let o=await fetch(`${v()}/user/readings/${encodeURIComponent(t)}/favorite`,{method:"PATCH",credentials:"include",headers:await A(!0),body:JSON.stringify({expectedUserId:n})});if(!o.ok)throw new Error("Failed to toggle favorite");let r=await o.json();if(typeof r.is_favorite!="boolean")throw new Error("Neplatn\xE1 odpov\u011B\u010F obl\xEDben\xFDch.");if(n!==window.Auth?.user?.id)return r.is_favorite;C(!r.is_favorite,r.is_favorite),a&&(a.innerHTML=z("bookmark"),a.setAttribute("aria-pressed",String(r.is_favorite)),a.title=r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",a.setAttribute("aria-label",r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let l=q().find(c=>c.id===t);return l&&(l.is_favorite=r.is_favorite,H()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"favorite",id:t,isFavorite:r.is_favorite}})),r.is_favorite}catch(o){console.error("Error toggling favorite:",o),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}finally{R(e),a&&(a.disabled=!1)}}}async function pe(){if(!N())return;let t=u,a=d;if(!confirm("Opravdu chce\u0161 smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))return;let n=Z(t);if(!n)return;m=!0;let e=window.Auth?.user?.id;if(typeof e!="string"||!e){R(n),m=!1,f();return}f();try{if(!(await fetch(`${v()}/user/readings/${encodeURIComponent(t)}`,{method:"DELETE",credentials:"include",headers:await A(!0),body:JSON.stringify({expectedUserId:e})})).ok)throw new Error("Failed to delete reading");if(e!==window.Auth?.user?.id)return;window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),a===d&&M(),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"delete",id:t}}))}catch(o){console.error("Error deleting reading:",o),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}finally{R(n),a===d&&(m=!1,f())}}function N(){return u!==null&&u===F&&!m&&!$.has(I(u))}function f(){["modal-favorite-btn","modal-delete-btn"].forEach(t=>{let a=document.getElementById(t);a&&(a.disabled=!N())})}function j(){let t=document.getElementById("modal-favorite-btn");t&&(t.innerHTML=`${z("bookmark")} ${y?"V obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}`,t.setAttribute("aria-pressed",String(y)),t.setAttribute("aria-label",y?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function G(t){if(b===t)return;g=document.activeElement,b=t;let a=U(t);(t.querySelector(".modal__close")||a[0]||t).focus(),w=e=>{if(!b)return;if(e.key==="Escape"){e.preventDefault(),M();return}if(e.key!=="Tab")return;let o=U(b);if(!o.length){e.preventDefault(),b.focus();return}let r=o[0],s=o[o.length-1];e.shiftKey&&document.activeElement===r?(e.preventDefault(),s.focus()):!e.shiftKey&&document.activeElement===s&&(e.preventDefault(),r.focus())},document.addEventListener("keydown",w)}function Q(){if(w&&(document.removeEventListener("keydown",w),w=null),b=null,g){let t=g.closest("[data-reading-id]")?.dataset.readingId,a=[...document.querySelectorAll('[data-reading-action="view"]')].find(e=>e.dataset.readingId===t&&e.offsetParent!==null);(g.isConnected?g:a||document.querySelector('.profile-tab[aria-selected="true"]'))?.focus(),g=null}}function U(t){return Array.from(t.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(a=>a.offsetParent!==null)}function X(t){t.querySelectorAll("[data-tarot-fallback]").forEach(a=>{a.addEventListener("error",()=>{a.dataset.fallbackApplied!=="1"&&(a.dataset.fallbackApplied="1",a.src="/img/tarot-v2/tarot_card_back.webp")})})}function S(t,a,n="neutral"){let e=t?.querySelector?.(".reading-feedback__status");e&&(e.textContent=a,e.dataset.state=n)}async function x(t,a,n,e){if(!t)return null;let o=window.Auth?.user?.id;if(!window.Auth?.isLoggedIn?.()||typeof o!="string"||!o)return null;e&&(e.disabled=!0),S(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let r=null;try{if(window.Auth?.saveReadingFeedback)r=await window.Auth.saveReadingFeedback(t,{...a,feature:"profile_history",source:"profile_reading_modal"},o);else{let s=await fetch(`${v()}/user/readings/${encodeURIComponent(t)}/feedback`,{method:"PATCH",credentials:"include",headers:await A(!0),body:JSON.stringify({...a,feature:"profile_history",source:"profile_reading_modal",expectedUserId:o})});r=await s.json().catch(()=>null),s.ok||(r=null)}return!window.Auth?.isLoggedIn?.()||window.Auth?.user?.id!==o?null:r?.success?(r.reading&&D(t,r.reading),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"feedback",id:t}})),S(n,"Zp\u011Btn\xE1 vazba je ulo\u017Een\xE1.","success"),r):(S(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null)}catch(s){return console.warn("Reading feedback unavailable:",s.message),S(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null}finally{e&&(e.disabled=!1)}}function Y(t){let a=E(t||{});if(t?.type==="journal"||!a||typeof a!="object"||Array.isArray(a))return"";let n=a.feedback&&typeof a.feedback=="object"&&!Array.isArray(a.feedback)?a.feedback:{},e=K.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${i(r.label)}
        </button>
    `).join(""),o=J.map(r=>`
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
    `}function ee(){M();let t=document.getElementById("journal-input");t&&(window.history.replaceState(null,"","#journal-input"),t.scrollIntoView({behavior:"smooth",block:"center"}),setTimeout(()=>t.focus(),250))}function te(t,a){let n=t.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async e=>{let o=e.target.closest("[data-feedback-resonance]"),r=e.target.closest("[data-feedback-focus]"),s=e.target.closest("[data-feedback-next-action]"),l=o||r||s;if(!l)return;let c={};if(o&&(c.resonance=o.dataset.feedbackResonance),r&&(c.focus=r.dataset.feedbackFocus),s&&(c.nextAction=s.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(p=>{(c.resonance&&p.dataset.feedbackResonance||c.focus&&p.dataset.feedbackFocus)&&p.classList.toggle("is-selected",p===l)}),s?.tagName==="A"){e.preventDefault(),(await x(a.id,c,n,null))?.success&&(window.location.href=s.getAttribute("href"));return}if(c.nextAction==="journal"){(await x(a.id,c,n,s))?.success&&ee();return}await x(a.id,c,n,l)})}function ae(t){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[t]||String(t).replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function k(t){return!t||typeof t!="object"?"":Object.entries(t).filter(([,a])=>a!=null&&a!=="").map(([a,n])=>{let e=typeof n=="object"?JSON.stringify(n,null,2):String(n);return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${i(ae(a))}</h4>
                    <p class="reading-structured-field__value">${i(e).replace(/\n/g,"<br>")}</p>
                </section>
            `}).join("")}function L(t,a){let n=a.filter(e=>e.value!==null&&e.value!==void 0&&e.value!=="").map(e=>`
            <span class="reading-metric">
                <strong>${i(e.label)}</strong>
                <span>${i(e.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${i(t)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function ne(t){let a=t?.summary;return a?L("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:a.sunSign},{label:"M\u011Bs\xEDc",value:a.moonSign},{label:"Ascendent",value:a.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:a.dominantElement},{label:"Modalita",value:a.dominantQuality}]):""}function re(t){let a=t?.synastry?.scores||t?.scores;return a?L("Sk\xF3re vztahu",[{label:"Osoba 1",value:t.person1?.name},{label:"Osoba 2",value:t.person2?.name},{label:"Celkem",value:`${a.total??a.totalScore??"--"} %`},{label:"Emoce",value:`${a.emotion??a.emotionScore??"--"} %`},{label:"Komunikace",value:`${a.communication??a.commScore??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${a.passion??a.passionScore??"--"} %`},{label:"Stabilita",value:`${a.stability??a.stabilityScore??"--"} %`}]):""}function ie(t){if(!t||typeof t!="object")return"";let a=Array.isArray(t.recommendations)?t.recommendations.slice(0,3):[],n=Array.isArray(t.angularLines)?t.angularLines.slice(0,4):[],e=a.map(r=>`
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
    `}function oe(t){let a=new Date(t.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${T(t.type)}</span>
            <h2 class="reading-detail__title">${i(P(t))}</h2>
            <p class="reading-detail__date">${a}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,e=E(t)||{};e?.fallback&&(n+=`<p class="result-context-notice">${i(V())}</p>`),typeof e?.question=="string"&&e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">Tvoje ot\xE1zka</small><p class="reading-question__text">${i(e.question)}</p></div>`),typeof e?.intention=="string"&&e.intention&&e.intention!==e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">P\u016Fvodn\xED z\xE1m\u011Br</small><p class="reading-question__text">${i(e.intention)}</p></div>`),e?.rune&&typeof e.rune=="object"&&(n+=`<section class="reading-summary-panel"><h3>${i(e.rune.symbol||"")} ${i(e.rune.name||"Runa")}</h3><p>${i(e.rune.meaning||"")}</p></section>`),e?.card&&typeof e.card=="object"&&t.type!=="tarot"&&(n+=`<section class="reading-summary-panel"><h3>${i(e.card.name||"Karta")}</h3><p>${i(e.card.theme||"")}</p><p>${i(e.card.message||"")}</p></section>`),e?.totem&&(n+=`<section class="reading-summary-panel"><h3>P\u016Fvodn\xED symbol</h3>${typeof e.totem=="object"?k(e.totem):`<p>${i(e.totem)}</p>`}</section>`),e&&typeof e=="object"&&(t.type==="synastry"&&(n+=re(e)),t.type==="numerology"&&(n+=L("Vypo\u010Dten\xE1 \u010D\xEDsla",[{label:"\u017Divotn\xED cesta",value:e.lifePath},{label:"Osud",value:e.destiny},{label:"Du\u0161e",value:e.soul},{label:"Osobnost",value:e.personality}])),n+=ne(e.chart||e.synastry?.person1?.chart),t.type==="astrocartography"&&(n+=ie(e.astrocartography)));function o(s,l){return typeof l=="string"&&/^\/?img\/tarot-v2\/[a-z0-9_-]+\.webp$/i.test(l)?l:!s||typeof s!="string"?"img/tarot-v2/tarot_card_back.webp":`img/tarot-v2/tarot_${s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_").replace(/[^a-z0-9_]/g,"")}.webp`}let r=Array.isArray(e.cards)?e.cards:t.type==="tarot"&&(e.card_name||e.cardName)?[{name:e.card_name||e.cardName}]:null;if(typeof e=="string")n+=`<div class="reading-plain-text">${i(e).replace(/\n/g,"<br>")}</div>`;else if(t.type==="tarot"&&r?.length){n+='<div class="reading-tarot-grid">',r.forEach(l=>{let c=typeof l=="string"?{name:l}:l||{},p=o(c.name,c.image);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${i(p)}"
                              alt="${i(c.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${i(c.name)}</p>
                    ${c.position?`<small class="reading-tarot-card__position">${i(c.position)}</small>`:""}
                    ${c.meaning?`<p>${i(c.meaning)}</p>`:""}
                </div>
            `}),n+="</div>";let s=e.response||e.interpretation||e.answer;if(s){let l=typeof s=="object"?k(s):h(s);n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${l}
                    </div>
                </div>
            `}r.forEach(l=>{!l||typeof l!="object"||!l.interpretation||(n+=`<details class="reading-card-reference" ${!s&&r.length===1?"open":""}>
                <summary>V\xFDznam karty ${i(l.name)}${l.position?` \xB7 ${i(l.position)}`:""}</summary>
                <div class="reading-interpretation__text">${typeof l.interpretation=="object"?k(l.interpretation):h(l.interpretation)}</div>
            </details>`)})}else if(t.type==="horoscope"&&(e.text||e.prediction)){let s=e.text||e.prediction,c={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[e.period]||e.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${i(e.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${i(c)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${typeof s=="object"?k(s):h(s)}
            </div>
        `,e.affirmation&&(n+=`<section class="reading-summary-panel"><h4>Podn\u011Bt k zamy\u0161len\xED</h4><p>${i(e.affirmation)}</p></section>`),e.luckyNumbers&&(n+=`
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">\u0160\u0165astn\xE1 \u010D\xEDsla</span>
                    <span class="reading-lucky-numbers__value">${i(e.luckyNumbers.toString())}</span>
                </div>
            `)}else if(e.answer)n+=`
            <div class="reading-answer">
                ${i(e.answer)}
            </div>
        `;else if(e.interpretation||e.response||e.text||e.result){let s=e.interpretation||e.response||e.text||e.result;if(typeof s=="string"){let l=h(s);n+=`<div class="formatted-content reading-formatted-content">${l}</div>`}else n+=`<div class="reading-structured">${k(s)}</div>`}else n+=`<pre class="reading-json">${i(JSON.stringify(e,null,2))}</pre>`;return n+="</div>",n+=Y(t),n}export{M as closeReadingModal,pe as deleteReading,W as toggleFavorite,fe as toggleFavoriteModal,ue as viewReading};
