import{A as K,a as O,b as s,c as w,d as q,e as E,i as D,k as z,l as C,r as R,s as H,w as B,x as V}from"./chunk-5XBJAF4Y.js";var U={cs:"Z\xE1kladn\xED symbolick\xFD v\xFDklad. Osobn\xED generov\xE1n\xED te\u010F nen\xED dostupn\xE9.",sk:"Z\xE1kladn\xFD symbolick\xFD v\xFDklad. Osobn\xE9 generovanie teraz nie je dostupn\xE9.",pl:"Podstawowa interpretacja symboliczna. Indywidualne generowanie jest teraz niedost\u0119pne."};function Z(t="cs"){return U[String(t).slice(0,2)]||U.cs}function v(t){let a=String(t||"").replace(/```(?:html)?/g,"").trim();if(window.DOMPurify?.sanitize){let e=/<\/?(?:p|h[3-5]|ul|ol|li|blockquote)\b/i.test(a)?a:a.replace(/\n/g,"<br>");return window.DOMPurify.sanitize(e,{ALLOWED_TAGS:["h3","h4","h5","p","strong","b","em","i","ul","ol","li","blockquote","br"],ALLOWED_ATTR:[]})}let n=document.createElement("div");return n.textContent=a.replace(/<[^>]*>/g,""),n.innerHTML.replace(/\n/g,"<br>")}var N=null,_=!1,g=null,u=0,$=null,y=!1,h=null,k=null,A=null,S=new Map,Q=new Set(["fallback","source","dateKey","spreadType","tool","continuedFrom","previousAnswer"]);function T(t){return`${window.Auth?.user?.id||""}:${t}`}function W(t){let a=T(t);if(S.has(a))return null;let n,e=new Promise(r=>{n=r}),i={key:a,promise:e,finish:n};return S.set(a,i),i}function F(t){S.delete(t.key),t.finish(),b()}var Y=[{value:"fits",label:"Sed\xED"},{value:"neutral",label:"Je\u0161t\u011B nev\xEDm"},{value:"miss",label:"Netrefilo se"}],X=[{value:"relationships",label:"Vztahy"},{value:"work",label:"Pr\xE1ce"},{value:"energy",label:"Energie"},{value:"self",label:"Sebepozn\xE1n\xED"},{value:"timing",label:"Na\u010Dasov\xE1n\xED"}];async function be(t){let a=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!a||!n)return;let e=++u;$?.abort();let i=new AbortController;$=i,N=t,g=null,_=!1,y=!1,I(),b(),a.hidden=!1,a.classList.add("is-visible"),n.setAttribute("aria-busy","true"),n.innerHTML='<p class="reading-modal__loading" role="status">Na\u010D\xEDt\xE1n\xED...</p>',te(a);try{let r=S.get(T(t));if(r&&(await r.promise,e!==u))return;let d=await fetch(`${w()}/user/readings/${encodeURIComponent(t)}`,{credentials:"include",headers:q(),signal:i.signal});if(!d.ok)throw new Error("Failed to fetch reading");let p=await d.json();if(e!==u)return;let l=p.reading;if(!l||String(l.id)!==String(t))throw new Error("Invalid reading detail");n.innerHTML=ue(l),ne(n),se(n,l),g=t,_=!!l.is_favorite,I()}catch(r){if(e!==u)return;g=null,console.error("Error loading reading:",r),n.innerHTML='<p class="reading-modal__error" role="alert">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad. Zav\u0159i detail a zkus ho otev\u0159\xEDt znovu.</p>'}finally{e===u&&($=null,n.setAttribute("aria-busy","false"),b())}}function L(){++u,$?.abort(),$=null;let t=document.getElementById("reading-modal");t&&(t.classList.remove("is-visible"),t.hidden=!0),N=null,g=null,y=!1,document.getElementById("reading-modal-content")?.setAttribute("aria-busy","false"),b(),ae()}async function ye(){if(!M())return;let t=g,a=u;y=!0,b();try{let n=await ee(t);if(a!==u||n===void 0)return;_=n,I()}finally{a===u&&(y=!1,b())}}async function ee(t,a=null){let n=window.Auth?.user?.id;if(!window.Auth?.isLoggedIn?.()||typeof n!="string"||!n)return;let e=W(t);if(e){a&&(a.disabled=!0);try{let i=await fetch(`${w()}/user/readings/${encodeURIComponent(t)}/favorite`,{method:"PATCH",credentials:"include",headers:await E(!0),body:JSON.stringify({expectedUserId:n})});if(!i.ok)throw new Error("Failed to toggle favorite");let r=await i.json();if(typeof r.is_favorite!="boolean")throw new Error("Neplatn\xE1 odpov\u011B\u010F obl\xEDben\xFDch.");if(n!==window.Auth?.user?.id)return r.is_favorite;B(!r.is_favorite,r.is_favorite),a&&(a.innerHTML=R("bookmark"),a.setAttribute("aria-pressed",String(r.is_favorite)),a.title=r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",a.setAttribute("aria-label",r.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let p=H().find(l=>l.id===t);return p&&(p.is_favorite=r.is_favorite,K()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"favorite",id:t,isFavorite:r.is_favorite}})),r.is_favorite}catch(i){console.error("Error toggling favorite:",i),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}finally{F(e),a&&(a.disabled=!1)}}}async function ve(){if(!M())return;let t=g,a=u;if(!confirm("Opravdu chce\u0161 smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))return;let n=W(t);if(!n)return;y=!0;let e=window.Auth?.user?.id;if(typeof e!="string"||!e){F(n),y=!1,b();return}b();try{if(!(await fetch(`${w()}/user/readings/${encodeURIComponent(t)}`,{method:"DELETE",credentials:"include",headers:await E(!0),body:JSON.stringify({expectedUserId:e})})).ok)throw new Error("Failed to delete reading");if(e!==window.Auth?.user?.id)return;window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),a===u&&L(),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"delete",id:t}}))}catch(i){console.error("Error deleting reading:",i),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}finally{F(n),a===u&&(y=!1,b())}}function M(){return g!==null&&g===N&&!y&&!S.has(T(g))}function b(){["modal-favorite-btn","modal-delete-btn"].forEach(t=>{let a=document.getElementById(t);a&&(a.disabled=!M())})}function I(){let t=document.getElementById("modal-favorite-btn");t&&(t.innerHTML=`${R("bookmark")} ${_?"V obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}`,t.setAttribute("aria-pressed",String(_)),t.setAttribute("aria-label",_?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function te(t){if(k===t)return;h=document.activeElement,k=t;let a=J(t);(t.querySelector(".modal__close")||a[0]||t).focus(),A=e=>{if(!k)return;if(e.key==="Escape"){e.preventDefault(),L();return}if(e.key!=="Tab")return;let i=J(k);if(!i.length){e.preventDefault(),k.focus();return}let r=i[0],d=i[i.length-1];e.shiftKey&&document.activeElement===r?(e.preventDefault(),d.focus()):!e.shiftKey&&document.activeElement===d&&(e.preventDefault(),r.focus())},document.addEventListener("keydown",A)}function ae(){if(A&&(document.removeEventListener("keydown",A),A=null),k=null,h){let t=h.closest("[data-reading-id]")?.dataset.readingId,a=[...document.querySelectorAll('[data-reading-action="view"]')].find(e=>e.dataset.readingId===t&&e.offsetParent!==null);(h.isConnected?h:a||document.querySelector('.profile-tab[aria-selected="true"]'))?.focus(),h=null}}function J(t){return Array.from(t.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(a=>a.offsetParent!==null)}function ne(t){t.querySelectorAll("[data-tarot-fallback]").forEach(a=>{a.addEventListener("error",()=>{a.dataset.fallbackApplied!=="1"&&(a.dataset.fallbackApplied="1",a.src="/img/tarot-v2/tarot_card_back.webp")})})}function x(t,a,n="neutral"){let e=t?.querySelector?.(".reading-feedback__status");e&&(e.textContent=a,e.dataset.state=n)}async function j(t,a,n,e){if(!t)return null;let i=window.Auth?.user?.id;if(!window.Auth?.isLoggedIn?.()||typeof i!="string"||!i)return null;e&&(e.disabled=!0),x(n,"Ukl\xE1d\xE1m zp\u011Btnou vazbu...","pending");let r=null;try{if(window.Auth?.saveReadingFeedback)r=await window.Auth.saveReadingFeedback(t,{...a,feature:"profile_history",source:"profile_reading_modal"},i);else{let d=await fetch(`${w()}/user/readings/${encodeURIComponent(t)}/feedback`,{method:"PATCH",credentials:"include",headers:await E(!0),body:JSON.stringify({...a,feature:"profile_history",source:"profile_reading_modal",expectedUserId:i})});r=await d.json().catch(()=>null),d.ok||(r=null)}return!window.Auth?.isLoggedIn?.()||window.Auth?.user?.id!==i?null:r?.success?(r.reading&&V(t,r.reading),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{reason:"feedback",id:t}})),x(n,"Zp\u011Btn\xE1 vazba je ulo\u017Een\xE1.","success"),r):(x(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null)}catch(d){return console.warn("Reading feedback unavailable:",d.message),x(n,"Nepoda\u0159ilo se ulo\u017Eit. Zkus to znovu.","error"),null}finally{e&&(e.disabled=!1)}}function re(t){let a=z(t||{});if(t?.type==="journal"||!a||typeof a!="object"||Array.isArray(a))return"";let n=a.feedback&&typeof a.feedback=="object"&&!Array.isArray(a.feedback)?a.feedback:{},e=Y.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.resonance===r.value?"is-selected":""}" data-feedback-resonance="${r.value}">
            ${s(r.label)}
        </button>
    `).join(""),i=X.map(r=>`
        <button type="button" class="reading-feedback__chip ${n.focus===r.value?"is-selected":""}" data-feedback-focus="${r.value}">
            ${s(r.label)}
        </button>
    `).join("");return`
        <section class="reading-feedback" data-reading-feedback="${s(t.id)}">
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
    `}function ie(){L();let t=document.getElementById("journal-input");t&&(window.history.replaceState(null,"","#journal-input"),t.scrollIntoView({behavior:O(),block:"center"}),setTimeout(()=>t.focus(),250))}function se(t,a){let n=t.querySelector("[data-reading-feedback]");n&&n.addEventListener("click",async e=>{let i=e.target.closest("[data-feedback-resonance]"),r=e.target.closest("[data-feedback-focus]"),d=e.target.closest("[data-feedback-next-action]"),p=i||r||d;if(!p)return;let l={};if(i&&(l.resonance=i.dataset.feedbackResonance),r&&(l.focus=r.dataset.feedbackFocus),d&&(l.nextAction=d.dataset.feedbackNextAction),n.querySelectorAll(".reading-feedback__chip").forEach(o=>{(l.resonance&&o.dataset.feedbackResonance||l.focus&&o.dataset.feedbackFocus)&&o.classList.toggle("is-selected",o===p)}),d?.tagName==="A"){e.preventDefault(),(await j(a.id,l,n,null))?.success&&(window.location.href=d.getAttribute("href"));return}if(l.nextAction==="journal"){(await j(a.id,l,n,d))?.success&&ie();return}await j(a.id,l,n,p)})}function oe(t){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",practicalStep:"Praktick\xFD krok",practical_step:"Praktick\xFD krok",action:"Praktick\xFD krok",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[t]||String(t).replace(/([a-z0-9])([A-Z])/g,"$1 $2").replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function m(t,a=0){if(!t||typeof t!="object")return"";if(a>4)return`<p class="reading-structured-field__value">${s(JSON.stringify(t))}</p>`;if(Array.isArray(t)){let n=t.filter(e=>e!=null&&e!=="").map(e=>`<li>${e&&typeof e=="object"?m(e,a+1):s(String(e)).replace(/\n/g,"<br>")}</li>`).join("");return n?`<ul class="reading-structured-list">${n}</ul>`:""}return Object.entries(t).filter(([n,e])=>e!=null&&e!==""&&!(a===0&&Q.has(n))).map(([n,e])=>{let i=e&&typeof e=="object"?m(e,a+1):`<p class="reading-structured-field__value">${s(String(e)).replace(/\n/g,"<br>")}</p>`;return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${s(oe(n))}</h4>
                    ${i}
                </section>
            `}).join("")}function P(t,a){let n=a.filter(e=>e.value!==null&&e.value!==void 0&&e.value!=="").map(e=>`
            <span class="reading-metric">
                <strong>${s(e.label)}</strong>
                <span>${s(e.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${s(t)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function le(t){let a=t?.summary;return a?P("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:a.sunSign},{label:"M\u011Bs\xEDc",value:a.moonSign},{label:"Ascendent",value:a.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:a.dominantElement},{label:"Modalita",value:a.dominantQuality}]):""}function ce(t){let a=t?.synastry?.scores||t?.scores;return a?P("Sk\xF3re vztahu",[{label:"Osoba 1",value:t.person1?.name},{label:"Osoba 2",value:t.person2?.name},{label:"Celkem",value:`${a.total??a.totalScore??"--"} %`},{label:"Emoce",value:`${a.emotion??a.emotionScore??"--"} %`},{label:"Komunikace",value:`${a.communication??a.commScore??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${a.passion??a.passionScore??"--"} %`},{label:"Stabilita",value:`${a.stability??a.stabilityScore??"--"} %`}]):""}function de(t){if(!t||typeof t!="object")return"";let a=Array.isArray(t.recommendations)?t.recommendations.slice(0,3):[],n=Array.isArray(t.angularLines)?t.angularLines.slice(0,4):[],e=a.map(r=>`
        <li>
            <strong>${s(r.city||"M\xEDsto")}</strong>
            <span>${s(r.score??"--")} / 100 \xB7 ${s(r.primaryPlanet?.name||"planeta")}</span>
        </li>
    `).join(""),i=n.map(r=>`
        <li>
            <strong>${s(r.planetName||"Planeta")} ${s(r.angle||"")}</strong>
            <span>${s(r.longitude??"--")}\xB0</span>
        </li>
    `).join("");return!e&&!i?"":`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">Astro mapa</h3>
            ${e?`<ul class="reading-summary-list">${e}</ul>`:""}
            ${i?`<ul class="reading-summary-list reading-summary-list--compact">${i}</ul>`:""}
        </section>
    `}function ue(t){let a=new Date(t.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${D(t.type)}</span>
            <h2 class="reading-detail__title">${s(C(t))}</h2>
            <p class="reading-detail__date">${a}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,e=z(t)||{};e?.fallback&&(n+=`<p class="result-context-notice">${s(Z())}</p>`);let i=t.type==="tarot"?e?.response||e?.interpretation||e?.answer:t.type==="horoscope"?e?.text||e?.prediction||e?.answer||e?.interpretation||e?.response||e?.result:e?.answer||e?.interpretation||e?.response||e?.text||e?.result,r=[e?.practicalStep,e?.practical_step,e?.action].find(o=>typeof o=="string"&&o.trim())||(i?[e?.result?.practicalStep,e?.result?.practical_step,e?.result?.action].find(o=>typeof o=="string"&&o.trim()):null),d=typeof i=="string"?i:i&&typeof i=="object"?JSON.stringify(i):"";r&&!d.includes(r.trim())&&(n+=`<section class="reading-summary-panel"><h3 class="reading-summary-panel__title">Praktick\xFD krok</h3><div class="reading-structured-field__value">${v(r)}</div></section>`),typeof e?.question=="string"&&e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">Tvoje ot\xE1zka</small><p class="reading-question__text">${s(e.question)}</p></div>`),typeof e?.intention=="string"&&e.intention&&e.intention!==e.question&&(n+=`<div class="reading-question"><small class="reading-question__label">P\u016Fvodn\xED z\xE1m\u011Br</small><p class="reading-question__text">${s(e.intention)}</p></div>`),e?.rune&&typeof e.rune=="object"&&(n+=`<section class="reading-summary-panel"><h3>${s(e.rune.symbol||"")} ${s(e.rune.name||"Runa")}</h3><p>${s(e.rune.meaning||"")}</p></section>`),e?.card&&typeof e.card=="object"&&t.type!=="tarot"&&(n+=`<section class="reading-summary-panel"><h3>${s(e.card.name||"Karta")}</h3><p>${s(e.card.theme||"")}</p><p>${s(e.card.message||"")}</p></section>`),e?.totem&&(n+=`<section class="reading-summary-panel"><h3>P\u016Fvodn\xED symbol</h3>${typeof e.totem=="object"?m(e.totem):`<p>${s(e.totem)}</p>`}</section>`),e&&typeof e=="object"&&(t.type==="synastry"&&(n+=ce(e)),t.type==="numerology"&&(n+=P("Vypo\u010Dten\xE1 \u010D\xEDsla",[{label:"\u017Divotn\xED cesta",value:e.lifePath},{label:"Osud",value:e.destiny},{label:"Du\u0161e",value:e.soul},{label:"Osobnost",value:e.personality}])),n+=le(e.chart||e.synastry?.person1?.chart),t.type==="astrocartography"&&(n+=de(e.astrocartography)));function p(o,c){return typeof c=="string"&&/^\/?img\/tarot-v2\/[a-z0-9_-]+\.webp$/i.test(c)?c:!o||typeof o!="string"?"img/tarot-v2/tarot_card_back.webp":`img/tarot-v2/tarot_${o.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_").replace(/[^a-z0-9_]/g,"")}.webp`}let l=Array.isArray(e.cards)?e.cards:t.type==="tarot"&&(e.card_name||e.cardName)?[{name:e.card_name||e.cardName}]:null;if(typeof e=="string")n+=`<div class="reading-plain-text">${s(e).replace(/\n/g,"<br>")}</div>`;else if(t.type==="tarot"&&l?.length){n+='<div class="reading-tarot-grid">',l.forEach(c=>{let f=typeof c=="string"?{name:c}:c||{},G=p(f.name,f.image);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${s(G)}"
                              alt="${s(f.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${s(f.name)}</p>
                    ${f.position?`<small class="reading-tarot-card__position">${s(f.position)}</small>`:""}
                    ${f.meaning?`<p>${s(f.meaning)}</p>`:""}
                </div>
            `}),n+="</div>";let o=e.response||e.interpretation||e.answer;if(o){let c=typeof o=="object"?m(o):v(o);n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${c}
                    </div>
                </div>
            `}l.forEach(c=>{!c||typeof c!="object"||!c.interpretation||(n+=`<details class="reading-card-reference" ${!o&&l.length===1?"open":""}>
                <summary>V\xFDznam karty ${s(c.name)}${c.position?` \xB7 ${s(c.position)}`:""}</summary>
                <div class="reading-interpretation__text">${typeof c.interpretation=="object"?m(c.interpretation):v(c.interpretation)}</div>
            </details>`)})}else if(t.type==="horoscope"&&(e.text||e.prediction)){let o=e.text||e.prediction,f={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[e.period]||e.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${s(e.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${s(f)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${typeof o=="object"?m(o):v(o)}
            </div>
        `,e.affirmation&&(n+=`<section class="reading-summary-panel"><h4>Podn\u011Bt k zamy\u0161len\xED</h4><p>${s(e.affirmation)}</p></section>`),e.luckyNumbers&&(n+=`
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">\u0160\u0165astn\xE1 \u010D\xEDsla</span>
                    <span class="reading-lucky-numbers__value">${s(e.luckyNumbers.toString())}</span>
                </div>
            `)}else if(e.answer){let o=typeof e.answer=="string"?v(e.answer):m(e.answer);n+=`
            <div class="reading-answer">
                ${o}
            </div>
        `}else if(e.interpretation||e.response||e.text||e.result){let o=e.interpretation||e.response||e.text||e.result;if(typeof o=="string"){let c=v(o);n+=`<div class="formatted-content reading-formatted-content">${c}</div>`}else n+=`<div class="reading-structured">${m(o)}</div>`}else{let o=m(e);n+=o?`<div class="reading-structured">${o}</div>`:'<p class="reading-formatted-content reading-detail__empty">Tento v\xFDklad u\u017E nem\xE1 ulo\u017Een\xFD \u010Diteln\xFD obsah.</p>'}return n+="</div>",n+=re(t),n}export{L as closeReadingModal,ve as deleteReading,ee as toggleFavorite,ye as toggleFavoriteModal,be as viewReading};
