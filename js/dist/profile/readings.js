function s(t){if(!t)return"";let e=document.createElement("div");return e.textContent=t,e.innerHTML}function d(){return window.API_CONFIG?.BASE_URL||"/api"}function c(t=!1){let e=window.Auth?.token,n={};return e&&(n.Authorization=`Bearer ${e}`),t&&(n["Content-Type"]="application/json"),n}function m(t){return`<i data-lucide="${{tarot:"book-marked",horoscope:"sparkles",natal:"map","natal-chart":"map",numerology:"hash",synastry:"heart",crystal:"crystal-ball",journal:"pen-tool"}[t]||"star"}" class="reading-type-icon"></i>`}function u(t){return{tarot:"Tarotov\xFD v\xFDklad",horoscope:"Horoskop",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie",synastry:"Partnersk\xE1 shoda",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule",journal:"Manifesta\u010Dn\xED den\xEDk"}[t]||"V\xFDklad"}var i=[],o="all",r=0,g=10;function f(){return i}function v(t,e){let n=i.find(a=>a.id===t);n&&Object.assign(n,e)}async function k(){let t=document.getElementById("readings-list");try{let e=await fetch(`${d()}/user/readings`,{credentials:"include",headers:c()});if(!e.ok)throw new Error("Failed to load readings");return i=(await e.json()).readings||[],r=0,l(),i}catch(e){return console.error("Error loading readings:",e),t&&(t.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u26A0\uFE0F</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,t.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function _(t){o=t.target.value,r=0,l()}function b(){return o==="all"?i:i.filter(t=>t.type===o)}function l(){let t=document.getElementById("readings-list");if(!t)return;let e=b();if(e.length===0){t.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u{1F52E}</div>
                <h4 class="empty-state__title">${o==="all"?"Zat\xEDm nem\xE1te \u017E\xE1dn\xE9 v\xFDklady":"\u017D\xE1dn\xE9 v\xFDklady tohoto typu"}</h4>
                <p class="empty-state__text">${o==="all"?"Vydejte se na cestu za pozn\xE1n\xEDm hv\u011Bzd!":"Zkuste jin\xFD typ v\xFDkladu."}</p>
                ${o==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot.html" class="btn btn--primary btn--sm">\u{1F0CF} Tarot</a>
                        <a href="kristalova-koule.html" class="btn btn--glass btn--sm">\u{1F52E} K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                        <a href="horoskopy.html" class="btn btn--glass btn--sm">\u2B50 Horoskop</a>
                    </div>
                `:""}
            </div>
        `,p(0,0);return}let n=e.slice(0,r+g);r=n.length,t.innerHTML=n.map(a=>`
        <div class="reading-item card" data-reading-id="${s(a.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${m(a.type)}</span>
                    <div>
                        <strong>${s(u(a.type))}</strong>
                        <p class="reading-item__date">
                            ${new Date(a.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${s(a.id)}"
                        title="${a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}"
                        aria-label="${a.is_favorite?"Odebrat z obl\xEDben\xFDch":"P\u0159idat do obl\xEDben\xFDch"}">
                        ${a.is_favorite?"\u2B50":"\u2606"}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${s(a.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join(""),p(r,e.length)}function x(){l()}function p(t,e){let n=document.getElementById("readings-pagination");if(n)if(t<e){n.hidden=!1,n.classList.add("profile-block-visible");let a=document.getElementById("readings-load-more");a&&(a.textContent=`Na\u010D\xEDst dal\u0161\xED (${e-t} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}export{f as getAllReadings,_ as handleFilterChange,k as loadReadings,l as renderReadings,x as showMoreReadings,v as updateReading};
