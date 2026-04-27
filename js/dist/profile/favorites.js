function r(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function s(){return window.API_CONFIG?.BASE_URL||"/api"}function i(e=!1){let t=window.Auth?.token,a={};return t&&(a.Authorization=`Bearer ${t}`),e&&(a["Content-Type"]="application/json"),a}function l(e){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[e]||"star"}" class="reading-type-icon"></i>`}function c(e){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Manifesta\u010Dn\xED den\xEDk","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[e]||"V\xFDklad"}async function m(){let e=document.getElementById("favorites-list");if(e){e.innerHTML='<p class="profile-loading">Na\u010D\xEDt\xE1n\xED...</p>';try{let t=await fetch(`${s()}/user/readings`,{credentials:"include",headers:i()});if(!t.ok)throw new Error("Failed to load readings");let o=((await t.json()).readings||[]).filter(n=>n.is_favorite);if(o.length===0){e.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state__icon">\u2B50</div>
                    <h4 class="empty-state__title">\u017D\xE1dn\xE9 obl\xEDben\xE9 v\xFDklady</h4>
                    <p class="empty-state__text">Klikn\u011Bte na \u2606 u v\xFDkladu pro p\u0159id\xE1n\xED do obl\xEDben\xFDch</p>
                </div>
            `;return}e.innerHTML=o.map(n=>`
            <div class="reading-item card" data-reading-id="${r(n.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${l(n.type)}</span>
                        <div>
                            <strong>${r(c(n.type))}</strong>
                            <p class="reading-item__date">
                                ${new Date(n.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric"})}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${r(n.id)}" title="Odebrat z obl\xEDben\xFDch" aria-label="Odebrat z obl\xEDben\xFDch">\u2B50</button>
                        <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${r(n.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join("")}catch(t){console.error("Error loading favorites:",t),e.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">\u26A0\uFE0F</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
            </div>
        `}}}export{m as loadFavorites};
