function i(e){if(!e)return"";let a=document.createElement("div");return a.textContent=e,a.innerHTML}function d(){return window.API_CONFIG?.BASE_URL||"/api"}function l(e=!1){let a=window.Auth?.token,n={};return a&&(n.Authorization=`Bearer ${a}`),e&&(n["Content-Type"]="application/json"),n}function c(e){return`<i data-lucide="${{tarot:"book-marked",horoscope:"sparkles",natal:"map","natal-chart":"map",numerology:"hash",synastry:"heart",crystal:"crystal-ball",journal:"pen-tool"}[e]||"star"}" class="reading-type-icon"></i>`}function u(e){return{tarot:"Tarotov\xFD v\xFDklad",horoscope:"Horoskop",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie",synastry:"Partnersk\xE1 shoda",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule",journal:"Manifesta\u010Dn\xED den\xEDk"}[e]||"V\xFDklad"}var f=[],g="all",y=0,L=10;function $(){return f}async function x(){let e=document.getElementById("readings-list");try{let a=await fetch(`${d()}/user/readings`,{credentials:"include",headers:l()});if(!a.ok)throw new Error("Failed to load readings");return f=(await a.json()).readings||[],y=0,k(),f}catch(a){return console.error("Error loading readings:",a),e&&(e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u26A0\uFE0F</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,e.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function F(){return g==="all"?f:f.filter(e=>e.type===g)}function k(){let e=document.getElementById("readings-list");if(!e)return;let a=F();if(a.length===0){e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u{1F52E}</div>
                <h4 class="empty-state__title">${g==="all"?"Zat\xEDm nem\xE1te \u017E\xE1dn\xE9 v\xFDklady":"\u017D\xE1dn\xE9 v\xFDklady tohoto typu"}</h4>
                <p class="empty-state__text">${g==="all"?"Vydejte se na cestu za pozn\xE1n\xEDm hv\u011Bzd!":"Zkuste jin\xFD typ v\xFDkladu."}</p>
                ${g==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot.html" class="btn btn--primary btn--sm">\u{1F0CF} Tarot</a>
                        <a href="kristalova-koule.html" class="btn btn--glass btn--sm">\u{1F52E} K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                        <a href="horoskopy.html" class="btn btn--glass btn--sm">\u2B50 Horoskop</a>
                    </div>
                `:""}
            </div>
        `,w(0,0);return}let n=a.slice(0,y+L);y=n.length,e.innerHTML=n.map(t=>`
        <div class="reading-item card" data-reading-id="${i(t.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${c(t.type)}</span>
                    <div>
                        <strong>${i(u(t.type))}</strong>
                        <p class="reading-item__date">
                            ${new Date(t.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${i(t.id)}"
                        title="${t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}">
                        ${t.is_favorite?"\u2B50":"\u2606"}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${i(t.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join(""),w(y,a.length)}function w(e,a){let n=document.getElementById("readings-pagination");if(n)if(e<a){n.hidden=!1,n.classList.add("profile-block-visible");let t=document.getElementById("readings-load-more");t&&(t.textContent=`Na\u010D\xEDst dal\u0161\xED (${a-e} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}async function E(){let e=document.getElementById("favorites-list");if(e){e.innerHTML='<p class="profile-loading">Na\u010D\xEDt\xE1n\xED...</p>';try{let a=await fetch(`${d()}/user/readings`,{credentials:"include",headers:l()});if(!a.ok)throw new Error("Failed to load readings");let t=((await a.json()).readings||[]).filter(r=>r.is_favorite);if(t.length===0){e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u2B50</div>
                    <h4 class="empty-state__title">\u017D\xE1dn\xE9 obl\xEDben\xE9 v\xFDklady</h4>
                    <p class="empty-state__text">Klikn\u011Bte na \u2606 u v\xFDkladu pro p\u0159id\xE1n\xED do obl\xEDben\xFDch</p>
                </div>
            `;return}e.innerHTML=t.map(r=>`
            <div class="reading-item card" data-reading-id="${i(r.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${c(r.type)}</span>
                        <div>
                            <strong>${i(u(r.type))}</strong>
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
        `).join("")}catch(a){console.error("Error loading favorites:",a),e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u26A0\uFE0F</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
            </div>
        `}}}var p=null,v=!1,_=null,b=null,h=null;async function K(e){let a=document.getElementById("reading-modal"),n=document.getElementById("reading-modal-content");if(!(!a||!n)){p=e,a.hidden=!1,a.classList.add("is-visible"),n.innerHTML='<p class="reading-modal__loading">Na\u010D\xEDt\xE1n\xED...</p>',I(a);try{let t=await fetch(`${d()}/user/readings/${e}`,{credentials:"include",headers:l()});if(!t.ok)throw new Error("Failed to fetch reading");let o=(await t.json()).reading;v=o.is_favorite,T(),n.innerHTML=A(o),N(n)}catch(t){console.error("Error loading reading:",t),n.innerHTML='<p class="reading-modal__error">Nepoda\u0159ilo se na\u010D\xEDst v\xFDklad.</p>'}}}function R(){let e=document.getElementById("reading-modal");e&&(e.classList.remove("is-visible"),e.hidden=!0),p=null,M()}async function V(){p&&(await H(p),v=!v,T())}async function H(e,a=null){try{let n=await fetch(`${d()}/user/readings/${e}/favorite`,{method:"PATCH",credentials:"include",headers:l()});if(!n.ok)throw new Error("Failed to toggle favorite");let t=await n.json();a&&(a.textContent=t.is_favorite?"\u2B50":"\u2606",a.title=t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch",a.setAttribute("aria-label",t.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"));let r=$(),o=r.find(m=>m.id===e);o&&(o.is_favorite=t.is_favorite,k()),document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:r}}));let s=document.getElementById("tab-favorites");s&&s.classList.contains("is-active")&&E()}catch(n){console.error("Error toggling favorite:",n),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se zm\u011Bnit obl\xEDben\xE9.","error")}}async function U(){if(p&&confirm("Opravdu chcete smazat tento v\xFDklad? Tuto akci nelze vr\xE1tit."))try{if(!(await fetch(`${d()}/user/readings/${p}`,{method:"DELETE",headers:l()})).ok)throw new Error("Failed to delete reading");window.Auth?.showToast?.("Smaz\xE1no","V\xFDklad byl smaz\xE1n.","success"),R();let a=await x();document.dispatchEvent(new CustomEvent("reading:updated",{detail:{readings:a}}))}catch(e){console.error("Error deleting reading:",e),window.Auth?.showToast?.("Chyba","Nepoda\u0159ilo se smazat v\xFDklad.","error")}}function T(){let e=document.getElementById("modal-favorite-btn");e&&(e.textContent=v?"\u2B50 V obl\xEDben\xFDch":"\u2606 P\u0159idat do obl\xEDben\xFDch",e.setAttribute("aria-label",v?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"))}function I(e){_=document.activeElement,b=e;let a=z(e);(e.querySelector(".modal__close")||a[0]||e).focus(),h=t=>{if(!b)return;if(t.key==="Escape"){t.preventDefault(),R();return}if(t.key!=="Tab")return;let r=z(b);if(!r.length){t.preventDefault(),b.focus();return}let o=r[0],s=r[r.length-1];t.shiftKey&&document.activeElement===o?(t.preventDefault(),s.focus()):!t.shiftKey&&document.activeElement===s&&(t.preventDefault(),o.focus())},document.addEventListener("keydown",h)}function M(){h&&(document.removeEventListener("keydown",h),h=null),b=null,_&&(_.focus(),_=null)}function z(e){return Array.from(e.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(a=>a.offsetParent!==null)}function N(e){e.querySelectorAll("[data-tarot-fallback]").forEach(a=>{a.addEventListener("error",()=>{a.dataset.fallbackApplied!=="1"&&(a.dataset.fallbackApplied="1",a.src="/img/tarot/tarot_placeholder.webp")})})}function A(e){let a=new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=`
        <div class="reading-detail__header">
            <span class="reading-detail__icon" aria-hidden="true">${c(e.type)}</span>
            <h2 class="reading-detail__title">${i(u(e.type))}</h2>
            <p class="reading-detail__date">${a}</p>
        </div>
        <div class="reading-content reading-detail__body">
    `,t=e.data||{};function r(o){return o?`img/tarot/tarot_${o.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ /g,"_")}.webp`:"img/tarot/tarot_placeholder.webp"}if(e.type==="tarot"&&t.cards){n+='<div class="reading-tarot-grid">',t.cards.forEach(s=>{let m=r(s.name);n+=`
                <div class="reading-tarot-card">
                    <div class="reading-tarot-card__image-wrap">
                         <img src="${i(m)}"
                              alt="${i(s.name)}"
                              loading="lazy"
                              data-tarot-fallback
                              class="reading-tarot-card__image">
                    </div>
                    <p class="reading-tarot-card__title">${i(s.name)}</p>
                    ${s.position?`<small class="reading-tarot-card__position">${i(s.position)}</small>`:""}
                </div>
            `}),n+="</div>";let o=t.response||t.interpretation;o&&(n+=`
                <div class="reading-interpretation">
                    <h4 class="reading-interpretation__title">V\xDDKLAD KARET</h4>
                    <div class="reading-interpretation__text">
                        ${o.replace(/\n/g,"<br>")}
                    </div>
                </div>
            `)}else if(e.type==="horoscope"&&(t.text||t.prediction)){let o=t.text||t.prediction,m={daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop"}[t.period]||t.period||"Horoskop";n+=`
            <div class="reading-horoscope-header">
                <h3 class="reading-horoscope-header__sign">${i(t.sign||"Znamen\xED")}</h3>
                <span class="reading-horoscope-header__period">${i(m)}</span>
            </div>
            <div class="reading-horoscope-text">
                ${i(o)}
            </div>
        `,t.luckyNumbers&&(n+=`
                <div class="reading-lucky-numbers">
                    <span class="reading-lucky-numbers__label">\u0160\u0165astn\xE1 \u010D\xEDsla</span>
                    <span class="reading-lucky-numbers__value">${i(t.luckyNumbers.toString())}</span>
                </div>
            `)}else if(t.answer)t.question&&(n+=`
                <div class="reading-question">
                    <small class="reading-question__label">Ot\xE1zka</small>
                    <p class="reading-question__text">"${i(t.question)}"</p>
                </div>
            `),n+=`
            <div class="reading-answer">
                ${i(t.answer)}
            </div>
        `;else if(t.interpretation||t.text||t.result){let o=t.interpretation||t.text||t.result;if(typeof o=="string"){let s=typeof DOMPurify<"u"?DOMPurify.sanitize(o):o;n+=`<div class="formatted-content reading-formatted-content">${s}</div>`}else n+=`<p class="reading-plain-text">${i(o)}</p>`}else n+=`<pre class="reading-json">${i(JSON.stringify(t,null,2))}</pre>`;return n+="</div>",n}export{R as closeReadingModal,U as deleteReading,H as toggleFavorite,V as toggleFavoriteModal,K as viewReading};
