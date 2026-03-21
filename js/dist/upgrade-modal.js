export function showUpgradeModal(d){const{title:p="Odemkni neomezen\xFD p\u0159\xEDstup",message:m="Dos\xE1hl jsi denn\xEDho limitu. Vyzkou\u0161ej Premium 7 dn\xED zdarma.",feature:i="Unknown Feature",plan:n="pruvodce",price:o=199,priceLabel:l="K\u010D/m\u011Bs\xEDc",trialDays:e=7,features:g=["\u2713 Neomezen\xFD AI Pr\u016Fvodce","\u2713 Neomezen\xFD Tarot, Runy & And\u011Blsk\xE9 karty","\u2713 Lun\xE1rn\xED ritu\xE1ly","\u2713 Nat\xE1ln\xED karta s interpretac\xED"]}=d,c=document.getElementById("upgrade-modal-overlay");c&&c.remove();const v=e>0?`<div class="upgrade-modal-trial-badge">\u2728 ${e} DN\xCD ZDARMA</div>`:"",y=e>0?`<div class="upgrade-modal-price">
               <div class="price-trial">Prvn\xEDch ${e} dn\xED zdarma</div>
               <div class="price-then">pak ${o} ${l}</div>
           </div>`:`<div class="upgrade-modal-price">
               <div class="price-number">${o}</div>
               <div class="price-unit">${l}</div>
           </div>`,b=e>0?`Vyzkou\u0161et ${e} dn\xED zdarma`:"Upgradovat Te\u010F",f=`
        <div id="upgrade-modal-overlay" class="upgrade-modal-overlay">
            <div class="upgrade-modal-content">
                <button class="upgrade-modal-close" id="upgrade-close-btn" aria-label="Zav\u0159\xEDt">\xD7</button>
                ${v}
                <div class="upgrade-modal-badge">\u2B50 HV\u011AZDN\xDD PR\u016EVODCE</div>
                <h2 class="upgrade-modal-title">${p}</h2>
                <p class="upgrade-modal-message">${m}</p>
                <div class="upgrade-modal-features">
                    ${g.map(t=>`<div class="upgrade-feature-item">${t}</div>`).join("")}
                </div>
                ${y}
                <div class="upgrade-modal-buttons">
                    <button class="btn-upgrade-primary" id="upgrade-cta-btn">
                        ${b}
                    </button>
                    <button class="btn-upgrade-secondary" id="upgrade-later-btn">
                        Te\u010F ne
                    </button>
                </div>
                <div class="upgrade-modal-trust">
                    <span>\u{1F4B3} Karta po\u017Eadov\xE1na po trialu</span>
                    <span>\u21A9\uFE0F Zru\u0161\xED\u0161 kdykoliv</span>
                    <span>\u{1F512} Zabezpe\u010Den\xE1 platba</span>
                </div>
            </div>
        </div>
    `;document.body.insertAdjacentHTML("beforeend",f);const a=document.getElementById("upgrade-modal-overlay"),h=document.getElementById("upgrade-close-btn"),k=document.getElementById("upgrade-later-btn"),r=document.getElementById("upgrade-cta-btn"),s=()=>{a.classList.add("closing"),setTimeout(()=>a.remove(),300)};return h.addEventListener("click",s),k.addEventListener("click",s),r.addEventListener("click",async()=>{if(r.textContent="P\u0159esm\u011Brov\xE1v\xE1m...",r.disabled=!0,typeof gtag<"u"&&gtag("event","upgrade_cta_clicked",{feature:i,plan:n}),window.Auth&&window.Auth.isLoggedIn())try{const u=await(await fetch(`${window.API_CONFIG?.BASE_URL||"/api"}/payment/create-checkout-session`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId:n})})).json();if(u.url){window.location.href=u.url;return}}catch(t){console.error("Checkout error:",t)}sessionStorage.setItem("pending_plan",n),window.location.href="/registrace.html"}),document.addEventListener("keydown",t=>{t.key==="Escape"&&a&&document.body.contains(a)&&s()}),typeof gtag<"u"&&gtag("event","upgrade_modal_shown",{feature:i,plan:n,price:o}),requestAnimationFrame(()=>a.classList.add("active")),a}export function handleUpgradeResponse(d){return d&&d.upsell?(showUpgradeModal(d.upsell),!0):!1}
