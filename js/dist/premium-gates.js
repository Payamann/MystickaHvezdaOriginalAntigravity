window.Premium={_escapeHTML(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML},async checkStatus(){if(window.Auth?.isPremium?.())return console.log("Premium Verified (Local)"),!0;if(window.Auth&&!window.Auth.isLoggedIn())return!1;try{const t=await fetch(`${API_CONFIG.BASE_URL}/payment/subscription/status`,{credentials:"include"});if(!t.ok)return!1;const e=await t.json(),n=["premium_monthly","exclusive_monthly","vip_majestrat"].includes(e.planType),a=e.status==="active"||e.status==="trialing"||e.status==="cancel_pending",o=!e.currentPeriodEnd||new Date(e.currentPeriodEnd)>new Date;return n&&a&&o}catch(t){return console.error("Premium check error:",t),!1}},showPaywall(t,e=null){const a=e||{numerology:"\u{1F522} Va\u0161e \u010D\xEDsla skr\xFDvaj\xED v\xEDc, ne\u017E \u010Dek\xE1te \u2013 hlubok\xFD v\xFDklad \u010D\xEDsel odemknete v pl\xE1nu Hv\u011Bzdn\xFD Pr\u016Fvodce",weekly_horoscope:"\u{1F31F} Detailn\xED t\xFDdenn\xED pr\u016Fvodce planetami \u010Dek\xE1 na v\xE1s \u2013 odemkn\u011Bte ho s Hv\u011Bzdn\xFDm Pr\u016Fvodcem",monthly_horoscope:"\u{1F4C5} Cel\xFD m\u011Bs\xEDc pod hv\u011Bzdami \u2013 kompletn\xED m\u011Bs\xED\u010Dn\xED p\u0159edpov\u011B\u010F pat\u0159\xED Hv\u011Bzdn\xFDm Pr\u016Fvodc\u016Fm",natal_chart:"\u2B50 V\xE1\u0161 vesm\xEDrn\xFD pl\xE1n \u010Dek\xE1 \u2013 pln\xE1 interpretace nat\xE1ln\xED karty je sou\u010D\xE1st\xED Hv\u011Bzdn\xE9ho Pr\u016Fvodce",synastry:"\u{1F4AB} Hloubkov\xE1 synastrie prozrad\xED, zda jste pro sebe stvo\u0159eni \u2013 dostupn\xE1 v Hv\u011Bzdn\xE9m Pr\u016Fvodci",astrocartography:"\u{1F30D} Kde na sv\u011Bt\u011B v\xE1s hv\u011Bzdy volaj\xED? Astrokartografie je jen pro Hv\u011Bzdn\xE9 Pr\u016Fvodce",journal_insights:"\u{1F4D6} Hlubok\xE1 anal\xFDza vzorc\u016F ve va\u0161em den\xEDku \u2013 funkce Hv\u011Bzdn\xE9ho Pr\u016Fvodce",mentor:"\u{1F319} V\xE1\u0161 duchovn\xED pr\u016Fvodce bez omezen\xED zpr\xE1v \u2013 sta\u0148te se Hv\u011Bzdn\xFDm Pr\u016Fvodcem",rituals:"\u{1F319} Lun\xE1rn\xED ritu\xE1ly v\xE1s vedou hluboko do noci \u2013 pln\xFD p\u0159\xEDstup pat\u0159\xED Hv\u011Bzdn\xFDm Pr\u016Fvodc\u016Fm"}[t]||"Tato funkce vy\u017Eaduje Premium p\u0159edplatn\xE9";this.trackPaywallHit(t);const o=this._escapeHTML(a),s=document.createElement("div");s.className="paywall-overlay",s.innerHTML=`
            <div class="paywall-content">
                <div class="paywall-icon">\u2728</div>
                <h3 class="paywall-title">Hv\u011Bzdn\xFD Pr\u016Fvodce</h3>
                <p class="paywall-message">${o}</p>
                <div class="paywall-benefits">
                    <div class="benefit-item">\u2713 Neomezen\xFD tarot \u2013 kdykoliv, na cokoliv</div>
                    <div class="benefit-item">\u2713 T\xFDdenn\xED + m\u011Bs\xED\u010Dn\xED horoskopy p\u0159esn\u011B pro v\xE1s</div>
                    <div class="benefit-item">\u2713 Duchovn\xED pr\u016Fvodce bez limitu zpr\xE1v</div>
                    <div class="benefit-item">\u2713 Pln\xE1 nat\xE1ln\xED karta s interpretac\xED</div>
                </div>
                <div class="paywall-actions">
                    <button class="btn btn--primary paywall-upgrade">
                        \u{1F31F} St\xE1t se Pr\u016Fvodcem \u2013 199 K\u010D/m\u011Bs\xEDc
                    </button>
                    <button class="btn btn--ghost paywall-close">Te\u010F ne</button>
                </div>
                <p class="paywall-footer">Bez z\xE1vazk\u016F \u2022 Zru\u0161en\xED jedn\xEDm kliknut\xEDm \u2022 7 dn\xED zdarma</p>
            </div>
        `,document.body.appendChild(s),s.querySelector(".paywall-upgrade").addEventListener("click",async()=>{const i=s.querySelector(".paywall-upgrade");if(i.textContent="P\u0159esm\u011Brov\xE1v\xE1m...",i.disabled=!0,window.Auth&&window.Auth.isLoggedIn())try{const r=await(await fetch(`${window.API_CONFIG?.BASE_URL||"/api"}/payment/create-checkout-session`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId:"pruvodce"})})).json();if(r.url){window.location.href=r.url;return}}catch(l){console.error(l)}sessionStorage.setItem("pending_plan","pruvodce"),window.location.href="/prihlaseni.html?registrace=1&redirect=/cenik.html"}),s.querySelector(".paywall-close").addEventListener("click",()=>{s.remove()}),s.addEventListener("click",i=>{i.target===s&&s.remove()})},showExclusivePaywall(t){this.trackPaywallHit(t);const e=document.createElement("div");e.className="paywall-overlay",e.innerHTML=`
            <div class="paywall-content">
                <div class="paywall-icon">\u{1F52D}</div>
                <h3 class="paywall-title">Osv\xEDcen\xED</h3>
                <p class="paywall-message">Tato funkce je dostupn\xE1 od pl\xE1nu Osv\xEDcen\xED</p>
                <div class="paywall-benefits">
                    <div class="benefit-item">\u2713 Astrokartografie \u2014 va\u0161e hv\u011Bzdn\xE1 mapa sv\u011Bta</div>
                    <div class="benefit-item">\u2713 Pokro\u010Dil\xE1 nat\xE1ln\xED karta s hlub\u0161\xEDm v\xFDkladem</div>
                    <div class="benefit-item">\u2713 Exkluzivn\xED lun\xE1rn\xED ritu\xE1ly</div>
                    <div class="benefit-item">\u2713 Prioritn\xED odpov\u011Bdi duchovn\xEDho pr\u016Fvodce</div>
                </div>
                <div class="paywall-actions">
                    <button class="btn btn--primary paywall-upgrade">
                        \u{1F52D} Probudit se \u2014 499 K\u010D/m\u011Bs\xEDc
                    </button>
                    <button class="btn btn--ghost paywall-close">Te\u010F ne</button>
                </div>
                <p class="paywall-footer">Bez z\xE1vazk\u016F \u2022 Zru\u0161en\xED jedn\xEDm kliknut\xEDm</p>
            </div>
        `,document.body.appendChild(e),e.querySelector(".paywall-upgrade").addEventListener("click",async()=>{const n=e.querySelector(".paywall-upgrade");if(n.textContent="P\u0159esm\u011Brov\xE1v\xE1m...",n.disabled=!0,window.Auth&&window.Auth.isLoggedIn())try{const o=await(await fetch(`${window.API_CONFIG?.BASE_URL||"/api"}/payment/create-checkout-session`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId:"osviceni"})})).json();if(o.url){window.location.href=o.url;return}}catch(a){console.error(a)}sessionStorage.setItem("pending_plan","osviceni"),window.location.href="/prihlaseni.html?registrace=1&redirect=/cenik.html"}),e.querySelector(".paywall-close").addEventListener("click",()=>e.remove()),e.addEventListener("click",n=>{n.target===e&&e.remove()})},showLoginGate(t,e=null){const a=this._escapeHTML(e||"\u2B50 P\u0159ihlaste se zdarma a z\xEDskejte pln\xFD osobn\xED v\xFDklad"),o=document.createElement("div");o.className="login-gate",o.style.cssText="text-align:center;padding:2rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;margin-top:1.5rem;",o.innerHTML=`
            <p style="color:var(--color-mystic-gold);font-size:1.05rem;margin-bottom:0.75rem;">${a}</p>
            <p style="color:rgba(255,255,255,0.55);font-size:0.9rem;margin-bottom:1.5rem;">Registrace je zdarma, trv\xE1 30 sekund</p>
            <button class="btn btn--primary login-gate-btn" style="min-width:200px;">P\u0159ihl\xE1sit se zdarma \u2192</button>
        `,t.appendChild(o),o.querySelector(".login-gate-btn").addEventListener("click",()=>{window.Auth?.openModal("login")})},markAsPremium(t){const e=document.createElement("span");e.className="premium-badge",e.innerHTML="\u{1F48E} Premium",e.title="Tato funkce vy\u017Eaduje Premium p\u0159edplatn\xE9",t.style.position="relative",t.appendChild(e)},lockContent(t,e){t.classList.add("premium-locked");const n=document.createElement("div");n.className="premium-lock-overlay",n.innerHTML=`
            <div class="lock-icon">\u{1F512}</div>
            <p class="lock-text">Premium obsah</p>
            <button class="btn btn--sm btn--gold unlock-btn">Odemknout</button>
        `,t.style.position="relative",t.appendChild(n),n.querySelector(".unlock-btn").addEventListener("click",a=>{a.stopPropagation(),this.showPaywall(e)})},trackPaywallHit(t){try{window.analytics&&window.analytics.track("Paywall Hit",{feature:t,timestamp:new Date().toISOString()}),console.log(`[ANALYTICS] Paywall hit: ${t}`)}catch(e){console.error("Analytics tracking error:",e)}},showTrialPaywall(t){this.trackPaywallHit(t);const n={rituals:"Lun\xE1rn\xED ritu\xE1ly t\u011B provedou ka\u017Edou f\xE1z\xED m\u011Bs\xEDce",partnerska_detail:"Detailn\xED anal\xFDza odhal\xED hlub\u0161\xED dynamiku va\u0161eho vztahu",numerologie_vyklad:"AI v\xFDklad odhal\xED co tv\xE1 \u010D\xEDsla skute\u010Dn\u011B znamenaj\xED",natalni_interpretace:"Pln\xE1 AI interpretace tv\xE9 nat\xE1ln\xED karty"}[t]||"Tato funkce je sou\u010D\xE1st\xED Hv\u011Bzdn\xE9ho Pr\u016Fvodce",a=document.createElement("div");a.className="paywall-overlay",a.innerHTML=`
            <div class="paywall-content">
                <div class="paywall-icon">\u2728</div>
                <div style="background:linear-gradient(135deg,#f9d423,#ff4e50);color:#000;padding:6px 16px;border-radius:20px;font-size:0.75rem;font-weight:800;letter-spacing:1px;display:inline-block;margin-bottom:1rem;">7 DN\xCD ZDARMA</div>
                <h3 class="paywall-title">Hv\u011Bzdn\xFD Pr\u016Fvodce</h3>
                <p class="paywall-message">${this._escapeHTML(n)}</p>
                <div class="paywall-benefits">
                    <div class="benefit-item">\u2713 Neomezen\xFD chat bez limitu</div>
                    <div class="benefit-item">\u2713 Lun\xE1rn\xED ritu\xE1ly & v\xFDklady</div>
                    <div class="benefit-item">\u2713 Nat\xE1ln\xED karta s interpretac\xED</div>
                    <div class="benefit-item">\u2713 Numerologick\xFD v\xFDklad bez omezen\xED</div>
                </div>
                <div class="paywall-actions">
                    <button class="btn btn--primary paywall-upgrade">
                        \u{1F31F} Vyzkou\u0161et 7 dn\xED zdarma
                    </button>
                    <button class="btn btn--ghost paywall-close">Te\u010F ne</button>
                </div>
                <p class="paywall-footer">Zru\u0161\xED\u0161 kdykoliv \u2022 Karta po\u017Eadov\xE1na po trialu \u2022 199 K\u010D/m\u011Bs\xEDc</p>
            </div>
        `,document.body.appendChild(a),a.querySelector(".paywall-upgrade").addEventListener("click",async()=>{const o=a.querySelector(".paywall-upgrade");if(o.textContent="P\u0159esm\u011Brov\xE1v\xE1m...",o.disabled=!0,window.Auth&&window.Auth.isLoggedIn())try{const i=await(await fetch(`${window.API_CONFIG?.BASE_URL||"/api"}/payment/create-checkout-session`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({planId:"pruvodce"})})).json();if(i.url){window.location.href=i.url;return}}catch(s){console.error(s)}sessionStorage.setItem("pending_plan","pruvodce"),window.location.href="/prihlaseni.html?registrace=1&redirect=/cenik.html"}),a.querySelector(".paywall-close").addEventListener("click",()=>a.remove()),a.addEventListener("click",o=>{o.target===a&&a.remove()})},async init(){const t=await this.checkStatus();if(document.body.classList.toggle("is-premium",t),t||document.querySelectorAll('[data-premium="true"]').forEach(e=>{const n=document.createElement("span");n.className="nav-premium-badge",n.textContent="\u{1F48E}",e.appendChild(n)}),!t&&document.getElementById("header-placeholder")){const e=()=>{const n=document.querySelector("header nav");if(n&&!document.getElementById("upgrade-cta")){const a=document.createElement("a");a.id="upgrade-cta",a.href="/cenik.html",a.className="btn btn--sm btn--gold upgrade-cta-btn",a.innerHTML="\u2728 Vyzkou\u0161et Premium",n.appendChild(a)}};document.querySelector("header nav")?e():document.addEventListener("components:loaded",e)}}},document.addEventListener("DOMContentLoaded",()=>{window.Premium.init()});
