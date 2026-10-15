function o(t){if(!t)return"";let e=document.createElement("div");return e.textContent=t,e.innerHTML}function l(){return window.API_CONFIG?.BASE_URL||"/api"}function c(t=!1){let e=window.Auth?.token,a={};return e&&(a.Authorization=`Bearer ${e}`),t&&(a["Content-Type"]="application/json"),a}function d(t){return`<i data-lucide="${{angel:"feather","angel-card":"feather",astrocartography:"map-pinned",crystal:"crystal-ball","crystal-ball":"crystal-ball","daily-wisdom":"sun",horoscope:"sparkles",journal:"pen-tool","medicine-wheel":"compass",natal:"map","natal-chart":"map",numerology:"hash","past-life":"history",runes:"gem",synastry:"heart",tarot:"book-marked"}[t]||"star"}" class="reading-type-icon"></i>`}function b(t){return{angel:"And\u011Blsk\xFD vzkaz","angel-card":"And\u011Blsk\xE1 karta",astrocartography:"Astro mapa",crystal:"K\u0159i\u0161\u0165\xE1lov\xE1 koule","crystal-ball":"K\u0159i\u0161\u0165\xE1lov\xE1 koule","daily-wisdom":"Denn\xED moudrost",horoscope:"Horoskop",journal:"Osobn\xED pozn\xE1mka","medicine-wheel":"\u0160amansk\xE9 kolo",natal:"Nat\xE1ln\xED karta","natal-chart":"Nat\xE1ln\xED karta",numerology:"Numerologie","past-life":"Minul\xFD \u017Eivot",runes:"Runov\xFD v\xFDklad",synastry:"Partnersk\xE1 shoda",tarot:"Tarotov\xFD v\xFDklad"}[t]||"V\xFDklad"}function u(t){if(t?.type!=="horoscope")return b(t?.type);let e=t.data;if(typeof e=="string")try{e=JSON.parse(e)}catch{return"Horoskop"}return[{daily:"Denn\xED horoskop",weekly:"T\xFDdenn\xED horoskop",monthly:"M\u011Bs\xED\u010Dn\xED horoskop",yearly:"Ro\u010Dn\xED horoskop"}[e?.period]||"Horoskop",e?.sign].filter(r=>typeof r=="string"&&r).join(" \xB7 ")}function s(t){if(!new Set(["book","bookmark","warning"]).has(t))throw new Error("Unknown profile UI icon");return'<svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#'+t+'"></use></svg>'}var g=null;function y(){return g}var p=0;function h(t=0){let e=t>0;return`
        <div class="empty-state">
            <div class="empty-state__icon">${s("bookmark")}</div>
            <h4 class="empty-state__title">${e?"Vyber si prvn\xED v\xFDklad pro n\xE1vrat":"Obl\xEDben\xE9 zat\xEDm \u010Dekaj\xED na prvn\xED n\xE1vrat"}</h4>
            <p class="empty-state__text">${e?"Ozna\u010D si v historii v\xFDklad, ke kter\xE9mu se chce\u0161 vr\xE1tit. Tady ho pak najde\u0161 po ruce.":"Po prvn\xEDm v\xFDkladu si m\u016F\u017Ee\u0161 ulo\u017Eit do obl\xEDben\xFDch to, k \u010Demu se chce\u0161 vracet."}</p>
            <div class="empty-state__actions">
                ${e?'<button type="button" class="btn btn--primary btn--sm" data-profile-tab-target="history">Otev\u0159\xEDt historii</button>':'<a href="tarot.html?source=profile_favorites_empty&feature=tarot" class="btn btn--primary btn--sm">Tarot</a><a href="horoskopy.html?source=profile_favorites_empty&feature=daily_guidance" class="btn btn--glass btn--sm">Denn\xED horoskop</a>'}
            </div>
        </div>
    `}async function v(t=1,e=null){e===null&&(e=++p);let a=document.getElementById("favorites-list");if(a){t===1&&(a.innerHTML='<p class="profile-loading" role="status">Na\u010D\xEDt\xE1n\xED\u2026</p>');try{let r=await fetch(`${l()}/user/readings?favorites=true&page=${t}&limit=20`,{credentials:"include",headers:c()});if(!r.ok)throw new Error("Failed to load readings");let i=await r.json();if(e!==p)return;let m=i.readings||[];if(m.length===0){t===1&&(a.innerHTML=h(y()?.total||0));return}a.querySelector("[data-favorites-more]")?.remove();let f=m.map(n=>`
            <div class="reading-item card" data-reading-id="${o(n.id)}" role="button" tabindex="0">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${d(n.type)}</span>
                        <div>
                            <strong>${o(u(n))}</strong>
                            <p class="reading-item__date">
                                ${new Date(n.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric"})}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${o(n.id)}" title="Odebrat z obl\xEDben\xFDch" aria-label="Odebrat z obl\xEDben\xFDch">${s("bookmark")}</button>
                        <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${o(n.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join("");if(t===1?a.innerHTML=f:a.insertAdjacentHTML("beforeend",f),t<(i.pagination?.totalPages||1)){a.insertAdjacentHTML("beforeend",'<button type="button" class="btn btn--glass btn--sm" data-favorites-more>Na\u010D\xEDst dal\u0161\xED obl\xEDben\xE9</button>');let n=a.querySelector("[data-favorites-more]");n?.addEventListener("click",async()=>{n.disabled=!0,await v(t+1,e),n.isConnected&&(n.disabled=!1)})}window.lucide?.createIcons?.()}catch(r){if(console.error("Error loading favorites:",r),e!==p)return;if(t>1){let i=a.querySelector("[data-favorites-more]");i&&(i.textContent="Na\u010Dten\xED selhalo \xB7 zkusit znovu");return}a.innerHTML=`
            <div class="empty-state">
                <div class="empty-state__icon">${s("warning")}</div>
                <p class="empty-state__text">Nepoda\u0159ilo se na\u010D\xEDst obl\xEDben\xE9.</p>
                <button type="button" class="btn btn--glass btn--sm" data-favorites-retry>Zkusit znovu</button>
            </div>
        `,a.querySelector("[data-favorites-retry]")?.addEventListener("click",()=>v())}}}export{v as loadFavorites};
