function o(t){if(!t)return"";let e=document.createElement("div");return e.textContent=t,e.innerHTML}function s(){return window.API_CONFIG?.BASE_URL||"/api"}function i(t=!1){let e=window.Auth?.token,n={};return e&&(n.Authorization=`Bearer ${e}`),t&&(n["Content-Type"]="application/json"),n}function l(t){return`<i data-lucide="${{tarot:"book-marked",horoscope:"sparkles",natal:"map","natal-chart":"map",numerology:"hash",synastry:"heart",crystal:"crystal-ball",journal:"pen-tool"}[t]||"star"}" class="reading-type-icon"></i>`}function d(t){return{tarot:"Tarotov\xFD v\xFDklad",horoscope:"Horoskop",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie",synastry:"Partnersk\xE1 shoda",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule",journal:"Manifesta\u010Dn\xED den\xEDk"}[t]||"V\xFDklad"}async function p(){let t=document.getElementById("favorites-list");if(t){t.innerHTML='<p class="profile-loading">Na\u010D\xEDt\xE1n\xED...</p>';try{let e=await fetch(`${s()}/user/readings`,{credentials:"include",headers:i()});if(!e.ok)throw new Error("Failed to load readings");let r=((await e.json()).readings||[]).filter(a=>a.is_favorite);if(r.length===0){t.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u2B50</div>
                    <h4 class="empty-state__title">\u017D\xE1dn\xE9 obl\xEDben\xE9 v\xFDklady</h4>
                    <p class="empty-state__text">Klikn\u011Bte na \u2606 u v\xFDkladu pro p\u0159id\xE1n\xED do obl\xEDben\xFDch</p>
                </div>
            `;return}t.innerHTML=r.map(a=>`
            <div class="reading-item card" data-reading-id="${o(a.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${l(a.type)}</span>
                        <div>
                            <strong>${o(d(a.type))}</strong>
                            <p class="reading-item__date">
                                ${new Date(a.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric"})}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${o(a.id)}" title="Odebrat z obl\xEDben\xFDch" aria-label="Odebrat z obl\xEDben\xFDch">\u2B50</button>
                        <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${o(a.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join("")}catch(e){console.error("Error loading favorites:",e),t.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u26A0\uFE0F</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
            </div>
        `}}}export{p as loadFavorites};
