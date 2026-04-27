function o(t){if(!t)return"";let e=document.createElement("div");return e.textContent=t,e.innerHTML}function c(){return window.API_CONFIG?.BASE_URL||"/api"}function d(t=!1){let e=window.Auth?.token,n={};return e&&(n.Authorization=`Bearer ${e}`),t&&(n["Content-Type"]="application/json"),n}function u(t){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[t]||"star"}" class="reading-type-icon"></i>`}function m(t){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Manifesta\u010Dn\xED den\xEDk","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[t]||"V\xFDklad"}var s=[],r="all",i=0,f=10,g={"crystal-ball":["crystal-ball","crystal"],"natal-chart":["natal-chart","natal"]};function v(){return s}function k(t,e){let n=s.find(a=>a.id===t);n&&Object.assign(n,e)}async function _(){let t=document.getElementById("readings-list");try{let e=await fetch(`${c()}/user/readings`,{credentials:"include",headers:d()});if(!e.ok)throw new Error("Failed to load readings");return s=(await e.json()).readings||[],i=0,l(),s}catch(e){return console.error("Error loading readings:",e),t&&(t.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u26A0\uFE0F</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,t.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function w(t){r=t.target.value,i=0,l()}function y(){if(r==="all")return s;let t=g[r]||[r];return s.filter(e=>t.includes(e.type))}function l(){let t=document.getElementById("readings-list");if(!t)return;let e=y();if(e.length===0){t.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u{1F52E}</div>
                <h4 class="empty-state__title">${r==="all"?"Zat\xEDm nem\xE1te \u017E\xE1dn\xE9 v\xFDklady":"\u017D\xE1dn\xE9 v\xFDklady tohoto typu"}</h4>
                <p class="empty-state__text">${r==="all"?"Vydejte se na cestu za pozn\xE1n\xEDm hv\u011Bzd!":"Zkuste jin\xFD typ v\xFDkladu."}</p>
                ${r==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot.html" class="btn btn--primary btn--sm">\u{1F0CF} Tarot</a>
                        <a href="kristalova-koule.html" class="btn btn--glass btn--sm">\u{1F52E} K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                        <a href="horoskopy.html" class="btn btn--glass btn--sm">\u2B50 Horoskop</a>
                    </div>
                `:""}
            </div>
        `,p(0,0);return}let n=e.slice(0,i+f);i=n.length,t.innerHTML=n.map(a=>`
        <div class="reading-item card" data-reading-id="${o(a.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${u(a.type)}</span>
                    <div>
                        <strong>${o(m(a.type))}</strong>
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
    `).join(""),p(i,e.length)}function P(){l()}function p(t,e){let n=document.getElementById("readings-pagination");if(n)if(t<e){n.hidden=!1,n.classList.add("profile-block-visible");let a=document.getElementById("readings-load-more");a&&(a.textContent=`Na\u010D\xEDst dal\u0161\xED (${e-t} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}export{v as getAllReadings,w as handleFilterChange,_ as loadReadings,l as renderReadings,P as showMoreReadings,k as updateReading};
