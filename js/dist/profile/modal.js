function r(e){if(!e)return"";let a=document.createElement("div");return a.textContent=e,a.innerHTML}function l(){return window.API_CONFIG?.BASE_URL||"/api"}function c(e=!1){let a=window.Auth?.token,n={};return a&&(n.Authorization=`Bearer ${a}`),e&&(n["Content-Type"]="application/json"),n}async function k(e=!1){let a=c(e),n=window.getCSRFToken?await window.getCSRFToken():null;return n&&(a["X-CSRF-Token"]=n),a}function u(e){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[e]||"star"}" class="reading-type-icon"></i>`}function m(e){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Manifesta\u010Dn\xED den\xEDk","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[e]||"V\xFDklad"}var f=[],p="all",h=0,T=10,M={"crystal-ball":["crystal-ball","crystal"],"natal-chart":["natal-chart","natal"]};function E(){return f}async function x(){let e=document.getElementById("readings-list");try{let a=await fetch(`${l()}/user/readings`,{credentials:"include",headers:c()});if(!a.ok)throw new Error("Failed to load readings");return f=(await a.json()).readings||[],h=0,w(),f}catch(a){return console.error("Error loading readings:",a),e&&(e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u26A0\uFE0F</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,e.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function R(){if(p==="all")return f;let e=M[p]||[p];return f.filter(a=>e.includes(a.type))}function w(){let e=document.getElementById("readings-list");if(!e)return;let a=R();if(a.length===0){e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u{1F52E}</div>
                <h4 class="empty-state__title">${p==="all"?"Zat\xEDm nem\xE1te \u017E\xE1dn\xE9 v\xFDklady":"\u017D\xE1dn\xE9 v\xFDklady tohoto typu"}</h4>
                <p class="empty-state__text">${p==="all"?"Vydejte se na cestu za pozn\xE1n\xEDm hv\u011Bzd!":"Zkuste jin\xFD typ v\xFDkladu."}</p>
                ${p==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot.html" class="btn btn--primary btn--sm">\u{1F0CF} Tarot</a>
                        <a href="kristalova-koule.html" class="btn btn--glass btn--sm">\u{1F52E} K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                        <a href="horoskopy.html" class="btn btn--glass btn--sm">\u2B50 Horoskop</a>
                    </div>
                `:""}
            </div>
        `,$(0,0);return}let n=a.slice(0,h+T);h=n.length,e.innerHTML=n.map(t=>`
        <div class="reading-item card" data-reading-id="${r(t.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${u(t.type)}</span>
                    <div>
                        <strong>${r(m(t.type))}</strong>
                        <p class="reading-item__date">
                            ${new Date(t.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${r(t.id)}"
                        title="${t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}">
                        ${t.is_favorite?"\u2B50":"\u2606"}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${r(t.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join(""),$(h,a.length)}function $(e,a){let n=document.getElementById("readings-pagination");if(n)if(e<a){n.hidden=!1,n.classList.add("profile-block-visible");let t=document.getElementById("readings-load-more");t&&(t.textContent=`Na\u010D\xEDst dal\u0161\xED (${a-e} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}async function A(){let e=document.getElementById("favorites-list");if(e){e.innerHTML='<p class="profile-loading">Na\u010D\xEDt\xE1n\xED...</p>';try{let a=await fetch(`${l()}/user/readings`,{credentials:"include",headers:c()});if(!a.ok)throw new Error("Failed to load readings");let t=((await a.json()).readings||[]).filter(s=>s.is_favorite);if(t.length===0){e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u2B50</div>
                    <h4 class="empty-state__title">\u017D\xE1dn\xE9 obl\xEDben\xE9 v\xFDklady</h4>
                    <p class="empty-state__text">Klikn\u011Bte na \u2606 u v\xFDkladu pro p\u0159id\xE1n\xED do obl\xEDben\xFDch</p>
                </div>
            `;return}e.innerHTML=t.map(s=>`
            <div class="reading-item card" data-reading-id="${r(s.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${u(s.type)}</span>
                        <div>
                            <strong>${r(m(s.type))}</strong>
                            <p class="reading-item__date">
                                ${new Date(s.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric"})}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${r(s.id)}" title="Odebrat z obl\xEDben\xFDch" aria-label="Odebrat z obl\xEDben\xFDch">\u2B50</button>
                        <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${r(s.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join("")}catch(a){console.error("Error loading favorites:",a),e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u26A0\uFE0F</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
            </div>
        `}}}var g=null,v=!1,_=null,b=null,y=null;async function Y(e){let a=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!(!a||!n)){g=e,a.hidden=!1,a.classList.add("is-visible"),n.innerHTML='<p class="reading-modal__loading">Na\u010D\xEDt\xE1n\xED...</p>',F(a);try{let t=await fetch(`${l()}/user/readings/${e}`,{credentials:"include",headers:c()});if(!t.ok)throw new Error("Failed to fetch reading");let i=(await t.json()).reading;v=i.is_favorite,S(),n.innerHTML=K(i),N(n)}catch(t){console.error("Error loading reading:",t),n.innerHTML='<p class="reading-modal__error">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad.</p>'}}}function z(){let e=document.getElementById("reading-modal");e&&(e.classList.remove("is-visible"),e.hidden=!0),g=null,H()}async function ee(){g&&(await C(g),v=!v,S())}async function C(e,a=null){try{let n=await fetch(`${l()}/user/readings/${e}/favorite`,{method:"PATCH",credentials:"include",headers:await k()});if(!n.ok)throw new Error("Failed to toggle favorite");let t=await n.json();a&&(a.textContent=t.is_favorite?"\u2B50":"\u2606",a.title=t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",a.setAttribute("aria-label",t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let s=E(),i=s.find(d=>d.id===e);i&&(i.is_favorite=t.is_favorite,w()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:s}}));let o=document.getElementById("tab-favorites");o&&o.classList.contains("is-active")&&A()}catch(n){console.error("Error toggling favorite:",n),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}}async function te(){if(g&&confirm("Opravdu chcete smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))try{if(!(await fetch(`${l()}/user/readings/${g}`,{method:"DELETE",credentials:"include",headers:await k()})).ok)throw new Error("Failed to delete reading");window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),z();let a=await x();document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:a}}))}catch(e){console.error("Error deleting reading:",e),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}}function S(){let e=document.getElementById("modal-favorite-btn");e&&(e.textContent=v?"\u2B50 V obl\xEDben\xFDch":"\u2606 P\u0159idat do obl\xEDben\xFDch",e.setAttribute("aria-label",v?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function F(e){_=document.activeElement,b=e;let a=L(e);(e.querySelector(".modal__close")||a[0]||e).focus(),y=t=>{if(!b)return;if(t.key==="Escape"){t.preventDefault(),z();return}if(t.key!=="Tab")return;let s=L(b);if(!s.length){t.preventDefault(),b.focus();return}let i=s[0],o=s[s.length-1];t.shiftKey&&document.activeElement===i?(t.preventDefault(),o.focus()):!t.shiftKey&&document.activeElement===o&&(t.preventDefault(),i.focus())},document.addEventListener("keydown",y)}function H(){y&&(document.removeEventListener("keydown",y),y=null),b=null,_&&(_.focus(),_=null)}function L(e){return Array.from(e.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(a=>a.offsetParent!==null)}function N(e){e.querySelectorAll("[data-tarot-fallback]").forEach(a=>{a.addEventListener("error",()=>{a.dataset.fallbackApplied!=="1"&&(a.dataset.fallbackApplied="1",a.src="/img/tarot/tarot_placeholder.webp")})})}function j(e){return{era:"Obdob\xED",identity:"Identita",karmic_lesson:"Karmick\xE1 lekce",gifts:"Dary",patterns:"Vzorce",mission:"Mise",message:"Poselstv\xED",strengths:"Siln\xE9 str\xE1nky",challenges:"V\xFDzvy"}[e]||String(e).replace(/_/g," ").replace(/^\w/,n=>n.toUpperCase())}function I(e){return!e||typeof e!="object"?"":Object.entries(e).filter(([,a])=>a!=null&&a!=="").map(([a,n])=>{let t=typeof n=="object"?JSON.stringify(n,null,2):String(n);return`
                <section class="reading-structured-field">
                    <h4 class="reading-structured-field__label">${r(j(a))}</h4>
                    <p class="reading-structured-field__value">${r(t).replace(/\n/g,"<br>")}</p>
                </section>
            `}).join("")}function P(e,a){let n=a.filter(t=>t.value!==null&&t.value!==void 0&&t.value!=="").map(t=>`
            <span class="reading-metric">
                <strong>${r(t.label)}</strong>
                <span>${r(t.value)}</span>
            </span>
        `).join("");return n?`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">${r(e)}</h3>
            <div class="reading-metric-grid">${n}</div>
        </section>
    `:""}function B(e){let a=e?.summary;return a?P("Vypo\u010Dten\xE1 mapa",[{label:"Slunce",value:a.sunSign},{label:"M\u011Bs\xEDc",value:a.moonSign},{label:"Ascendent",value:a.ascendantSign||"nevypo\u010Dten"},{label:"Dominantn\xED \u017Eivel",value:a.dominantElement},{label:"Modalita",value:a.dominantQuality}]):""}function D(e){let a=e?.synastry?.scores||e?.scores;return a?P("Sk\xF3re vztahu",[{label:"Celkem",value:`${a.total??"--"} %`},{label:"Emoce",value:`${a.emotion??"--"} %`},{label:"Komunikace",value:`${a.communication??"--"} %`},{label:"V\xE1\u0161e\u0148",value:`${a.passion??"--"} %`},{label:"Stabilita",value:`${a.stability??"--"} %`}]):""}function O(e){if(!e||typeof e!="object")return"";let a=Array.isArray(e.recommendations)?e.recommendations.slice(0,3):[],n=Array.isArray(e.angularLines)?e.angularLines.slice(0,4):[],t=a.map(i=>`
        <li>
            <strong>${r(i.city||"M\xEDsto")}</strong>
            <span>${r(i.score??"--")} / 100 \xB7 ${r(i.primaryPlanet?.name||"planeta")}</span>
        </li>
    `).join(""),s=n.map(i=>`
        <li>
            <strong>${r(i.planetName||"Planeta")} ${r(i.angle||"")}</strong>
            <span>${r(i.longitude??"--")}\xB0</span>
        </li>
    `).join("");return!t&&!s?"":`
        <section class="reading-summary-panel">
            <h3 class="reading-summary-panel__title">Astro mapa</h3>
            ${t?`<ul class="reading-summary-list">${t}</ul>`:""}
            ${s?`<ul class="reading-summary-list reading-summary-list--compact">${s}</ul>`:""}
        </section>
    `}function K(e){let a=new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${u(e.type)}</span>
            <h2 class="reading-detail__title">${r(m(e.type))}</h2>
            <p class="reading-detail__date">${a}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,t=e.data||{};t&&typeof t=="object"&&(e.type==="synastry"&&(n+=D(t)),n+=B(t.chart||t.synastry?.person1?.chart),e.type==="astrocartography"&&(n+=O(t.astrocartography)));function s(i){return i?`img/tarot/tarot_${i.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_")}.webp`:"img/tarot/tarot_placeholder.webp"}if(typeof t=="string")n+=`<div class="reading-plain-text">${r(t).replace(/\n/g,"<br>")}</div>`;else if(e.type==="tarot"&&t.cards){n+='<div class="reading-tarot-grid">',t.cards.forEach(o=>{let d=s(o.name);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${r(d)}"
                              alt="${r(o.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${r(o.name)}</p>
                    ${o.position?`<small class="reading-tarot-card__position">${r(o.position)}</small>`:""}
                </div>
            `}),n+="</div>";let i=t.response||t.interpretation;if(i){let o=r(i).replace(/\n/g,"<br>");n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${o}
                    </div>
                </div>
            `}}else if(e.type==="horoscope"&&(t.text||t.prediction)){let i=t.text||t.prediction,d={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[t.period]||t.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${r(t.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${r(d)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${r(i)}
            </div>
        `,t.luckyNumbers&&(n+=`
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">\u0160\u0165astn\xE1 \u010D\xEDsla</span>
                    <span class="reading-lucky-numbers__value">${r(t.luckyNumbers.toString())}</span>
                </div>
            `)}else if(t.answer)t.question&&(n+=`
                <div class="reading-question">
                    <small class="reading-question__label">Ot\xE1zka</small>
                    <p class="reading-question__text">"${r(t.question)}"</p>
                </div>
            `),n+=`
            <div class="reading-answer">
                ${r(t.answer)}
            </div>
        `;else if(t.interpretation||t.response||t.text||t.result){let i=t.interpretation||t.response||t.text||t.result;if(typeof i=="string"){let o=r(i).replace(/\n/g,"<br>"),d=typeof DOMPurify<"u"?DOMPurify.sanitize(o):o;n+=`<div class="formatted-content reading-formatted-content">${d}</div>`}else n+=`<div class="reading-structured">${I(i)}</div>`}else n+=`<pre class="reading-json">${r(JSON.stringify(t,null,2))}</pre>`;return n+="</div>",n}export{z as closeReadingModal,te as deleteReading,C as toggleFavorite,ee as toggleFavoriteModal,Y as viewReading};
