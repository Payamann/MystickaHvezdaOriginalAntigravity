function r(e){if(!e)return"";let t=document.createElement("div");return t.textContent=e,t.innerHTML}function l(){return window.API_CONFIG?.BASE_URL||"/api"}function c(e=!1){let t=window.Auth?.token,a={};return t&&(a.Authorization=`Bearer ${t}`),e&&(a["Content-Type"]="application/json"),a}function d(e){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[e]||"star"}" class="reading-type-icon"></i>`}function m(e){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Manifesta\u010Dn\xED den\xEDk","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[e]||"V\xFDklad"}function o(e){if(!new Set(["book","bookmark","warning"]).has(e))throw new Error("Unknown profile UI icon");return'<svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#'+e+'"></use></svg>'}function u(e=0){let t=e>0;return`
        <div class="empty-state">
            <div class="empty-state__icon">${o("bookmark")}</div>
            <h4 class="empty-state__title">${t?"Vyber si prvn\xED v\xFDklad pro n\xE1vrat":"Obl\xEDben\xE9 zat\xEDm \u010Dekaj\xED na prvn\xED n\xE1vrat"}</h4>
            <p class="empty-state__text">${t?"Najdi v historii v\xFDklad, ke kter\xE9mu se chce\u0161 vr\xE1tit. Hv\u011Bzda z n\u011Bj ud\u011Bl\xE1 kr\xE1tk\xFD seznam t\xE9mat, kter\xE1 se opakuj\xED.":"Za\u010Dni jedn\xEDm v\xFDkladem. Obl\xEDben\xE9 pak nejsou sb\xEDrka hv\u011Bzdi\u010Dek, ale m\xEDsto pro odpov\u011Bdi, kter\xE9 maj\xED z\u016Fstat po ruce."}</p>
            <div class="empty-state__actions">
                ${t?'<button type="button" class="btn btn--primary btn--sm" data-profile-tab-target="history">Otev\u0159\xEDt historii</button>':'<a href="tarot.html?source=profile_favorites_empty&feature=tarot" class="btn btn--primary btn--sm">\u{1F0CF} Tarot</a><a href="horoskopy.html?source=profile_favorites_empty&feature=daily_guidance" class="btn btn--glass btn--sm">\u2B50 Denn\xED horoskop</a>'}
            </div>
        </div>
    `}async function b(){let e=document.getElementById("favorites-list");if(e){e.innerHTML='<p class="profile-loading">Na\u010D\xEDt\xE1n\xED...</p>';try{let t=await fetch(`${l()}/user/readings`,{credentials:"include",headers:c()});if(!t.ok)throw new Error("Failed to load readings");let s=(await t.json()).readings||[],i=s.filter(n=>n.is_favorite);if(i.length===0){e.innerHTML=u(s.length);return}e.innerHTML=i.map(n=>`
            <div class="reading-item card" data-reading-id="${r(n.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${d(n.type)}</span>
                        <div>
                            <strong>${r(m(n.type))}</strong>
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
                <div class="empty-state__icon">${o("warning")}</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
            </div>
        `}}}export{b as loadFavorites};
