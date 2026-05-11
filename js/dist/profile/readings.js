function s(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function c(){return window.API_CONFIG?.BASE_URL||"/api"}function d(e=!1){let t=window.Auth?.token,n={};return t&&(n.Authorization=`Bearer ${t}`),e&&(n["Content-Type"]="application/json"),n}function u(e){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[e]||"star"}" class="reading-type-icon"></i>`}function m(e){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Manifesta\u010Dn\xED den\xEDk","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[e]||"V\xFDklad"}var o=[],r="all",i=0,f=10,y={"crystal-ball":["crystal-ball","crystal"],"natal-chart":["natal-chart","natal"]};function v(){return o}function k(e,t){let n=o.find(a=>a.id===e);n&&Object.assign(n,t)}async function _(){let e=document.getElementById("readings-list");try{let t=await fetch(`${c()}/user/readings`,{credentials:"include",headers:d()});if(!t.ok)throw new Error("Failed to load readings");return o=(await t.json()).readings||[],i=0,l(),o}catch(t){return console.error("Error loading readings:",t),e&&(e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u26A0\uFE0F</div>
                    <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `,e.querySelector('[data-readings-action="reload"]')?.addEventListener("click",()=>location.reload())),[]}}function w(e){r=e.target.value,i=0,l()}function g(){if(r==="all")return o;let e=y[r]||[r];return o.filter(t=>e.includes(t.type))}function l(){let e=document.getElementById("readings-list");if(!e)return;let t=g();if(t.length===0){e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u{1F52E}</div>
                <h4 class="empty-state__title">${r==="all"?"Historie zat\xEDm \u010Dek\xE1 na prvn\xED stopu":"Tady zat\xEDm nen\xED \u017E\xE1dn\xFD v\xFDklad tohoto typu"}</h4>
                <p class="empty-state__text">${r==="all"?"Za\u010Dni jedn\xEDm v\xFDkladem. Jakmile vznikne prvn\xED z\xE1znam, profil se p\u0159estane tv\xE1\u0159it jako archiv a za\u010Dne ukazovat, k \u010Demu se m\xE1\u0161 vracet.":"Filtr je pr\xE1zdn\xFD. Zkus jin\xFD typ v\xFDkladu nebo se vra\u0165 na celou historii."}</p>
                ${r==="all"?`
                    <div class="empty-state__actions">
                        <a href="tarot.html?source=profile_history_empty&feature=tarot" class="btn btn--primary btn--sm">\u{1F0CF} Tarot</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule" class="btn btn--glass btn--sm">\u{1F52E} K\u0159i\u0161\u0165\xE1lov\xE1 koule</a>
                        <a href="horoskopy.html?source=profile_history_empty&feature=daily_guidance" class="btn btn--glass btn--sm">\u2B50 Horoskop</a>
                    </div>
                `:""}
            </div>
        `,p(0,0);return}let n=t.slice(0,i+f);i=n.length,e.innerHTML=n.map(a=>`
        <div class="reading-item card" data-reading-id="${s(a.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${u(a.type)}</span>
                    <div>
                        <strong>${s(m(a.type))}</strong>
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
    `).join(""),p(i,t.length)}function P(){l()}function p(e,t){let n=document.getElementById("readings-pagination");if(n)if(e<t){n.hidden=!1,n.classList.add("profile-block-visible");let a=document.getElementById("readings-load-more");a&&(a.textContent=`Na\u010D\xEDst dal\u0161\xED (${t-e} zb\xFDv\xE1)`)}else n.hidden=!0,n.classList.remove("profile-block-visible")}export{v as getAllReadings,w as handleFilterChange,_ as loadReadings,l as renderReadings,P as showMoreReadings,k as updateReading};
