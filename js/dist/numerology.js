import{calculateLifePath as v,calculateDestiny as y,calculateSoul as b,calculatePersonality as h,NUMBER_MEANINGS as w}from"./utils/numerology-logic.js";document.addEventListener("DOMContentLoaded",async()=>{const r=document.getElementById("numerology-form"),o=document.getElementById("use-profile-num");if(window.Auth&&window.Auth.isLoggedIn())try{const n=await window.Auth.getProfile();if(n&&n.birth_date){let e=n.birth_date;e.includes("T")&&(e=e.split("T")[0]),import("./utils/numerology-logic.js").then(t=>{if(t.calculatePersonalCycles){const i=t.calculatePersonalCycles(e);p(i)}})}}catch(n){console.warn("Auto-load daily vibes failed:",n)}if(o){const n=o.closest(".checkbox-wrapper");if(n){const e=()=>{n.style.display=window.Auth&&window.Auth.isLoggedIn()?"flex":"none"};e(),document.addEventListener("auth:changed",e)}}o&&o.addEventListener("change",async n=>{if(n.target.checked){if(!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast?.("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro tuto funkci se mus\xEDte p\u0159ihl\xE1sit.","info"),n.target.checked=!1;return}const e=await window.Auth.getProfile();if(e){if(document.getElementById("num-name").value=e.first_name||"",e.birth_date){let t=e.birth_date;t.includes("T")&&(t=t.split("T")[0]),document.getElementById("num-date").value=t}if(e.birth_time){let t=e.birth_time;t.length>5&&(t=t.substring(0,5)),document.getElementById("num-time").value=t}}}}),r&&r.addEventListener("submit",f)});async function f(r){if(r.preventDefault(),!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast?.("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro v\xFDpo\u010Det numerologie se pros\xEDm p\u0159ihlaste.","info"),window.Auth?.openModal?.("login");return}const o=document.getElementById("num-name").value.trim(),n=document.getElementById("num-date").value,e=document.getElementById("num-time").value;if(!o||!n){window.Auth?.showToast?.("Chyb\u011Bj\xEDc\xED \xFAdaje","Vypl\u0148te pros\xEDm jm\xE9no a datum narozen\xED.","error");return}const t=v(n),i=y(o),d=b(o),a=h(o);import("./utils/numerology-logic.js").then(l=>{if(l.calculatePersonalCycles){const s=l.calculatePersonalCycles(n);p(s)}}),k(t,i,d,a),await I(o,n,e,t,i,d,a)}function p(r){if(!r)return;const o=document.getElementById("daily-cycles");if(!o)return;const{personalYear:n,personalMonth:e,personalDay:t}=r;document.getElementById("val-pd").textContent=t,document.getElementById("val-pm").textContent=e,document.getElementById("val-py").textContent=n;const i=document.getElementById("current-date-display");i&&(i.textContent=new Date().toLocaleDateString("cs-CZ")),o.style.display="block"}function k(r,o,n,e){const t=document.getElementById("numerology-results");if(!t)return;t.style.display="block";const i=document.getElementById("daily-cycles");i&&i.style.display!=="none"?i.scrollIntoView({behavior:"smooth",block:"start"}):t.scrollIntoView({behavior:"smooth",block:"nearest"}),[{id:"card-lifepath",number:r,label:"\u017Divotn\xED cesta",color:"#d4af37"},{id:"card-destiny",number:o,label:"Osud",color:"#3498db"},{id:"card-soul",number:n,label:"Du\u0161e",color:"#2ecc71"},{id:"card-personality",number:e,label:"Osobnost",color:"#f1c40f"}].forEach(({id:a,number:l,label:s,color:m})=>{const c=document.getElementById(a);if(c){const u=w[l],g=l===11||l===22||l===33;c.innerHTML=`
                <div class="number-card ${g?"master":""}" style="--card-color: ${m}">
                    <div class="number-value">${l}</div>
                    <div class="number-label">${s}</div>
                    <div class="number-title">${u?.title||""}</div>
                    <div class="number-meaning">${u?.short||""}</div>
                </div>
            `}})}async function I(r,o,n,e,t,i,d){const a=document.getElementById("num-interpretation");if(!a)return;if(!(window.Auth&&window.Auth.isLoggedIn()&&window.Auth.isPremium())){a.innerHTML=`
            <div class="interpretation-section">
                <h3>\u2728 Va\u0161e \u010C\xEDsla</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
                    <div class="number-card" style="background: linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(52, 152, 219, 0.2)); padding: 1.5rem; border-radius: 12px; text-align: center;">
                      <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 0.5rem;">\u017Divotn\xED Cesta</div>
                        <div style="font-size: 3rem; font-weight: 700; color: var(--color-mystic-gold);">${e}</div>
                    </div>
                    <div class="number-card" style="background: linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(46, 204, 113, 0.2)); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 0.5rem;">Osud</div>
                        <div style="font-size: 3rem; font-weight: 700; color: var(--color-electric-blue);">${t}</div>
                    </div>
                    <div class="number-card" style="background: linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(241, 196, 15, 0.2)); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 0.5rem;">Du\u0161e</div>
                        <div style="font-size: 3rem; font-weight: 700; color: var(--color-cosmic-green);">${i}</div>
                    </div>
                    <div class="number-card" style="background: linear-gradient(135deg, rgba(241, 196, 15, 0.2), rgba(230, 126, 34, 0.2)); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 0.5rem;">Osobnost</div>
                        <div style="font-size: 3rem; font-weight: 700; color: var(--color-starlight);">${d}</div>
                    </div>
                </div>

                <div class="premium-locked" style="position: relative; margin-top: 2rem; padding: 3rem; background: linear-gradient(135deg, rgba(30, 20, 50, 0.8), rgba(42, 26, 78, 0.8)); border-radius: 15px; filter: blur(5px);">
                    <h4>Hlubok\xFD Rozbor</h4>
                    <p>Objevte tajemstv\xED va\u0161ich \u010D\xEDsel s pomoc\xED starod\xE1vn\xE9 moudrosti. Ka\u017Ed\xE9 \u010D\xEDslo nese v sob\u011B mocn\xE9 poselstv\xED...</p>
                    <p style="opacity: 0.7;">Va\u0161e \u017Eivotn\xED cesta ${e} symbolizuje...</p>
                </div>
                
                <div class="premium-lock-overlay">
                    <div class="lock-icon">\u{1F512}</div>
                    <p class="lock-text">Detailn\xED rozbor je Premium funkce</p>
                    <button class="btn btn--gold unlock-btn numerology-upgrade-btn">\u{1F31F} Vyzkou\u0161et 7 dn\xED zdarma</button>
                </div>
            </div>
        `,window.Premium?.trackPaywallHit&&window.Premium.trackPaywallHit("numerologie_vyklad");const s=a.querySelector(".numerology-upgrade-btn");s&&s.addEventListener("click",()=>{window.Premium?.showTrialPaywall?window.Premium.showTrialPaywall("numerologie_vyklad"):(sessionStorage.setItem("pending_plan","pruvodce"),window.location.href="/registrace.html")});return}a.innerHTML=`
        <div class="interpretation-loading" style="text-align: center; padding: 2rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem; color: var(--color-silver-mist);">Generuji hloubkovou interpretaci...</p>
        </div>
    `;try{const s=window.Auth?.token||localStorage.getItem("auth_token"),m=window.API_CONFIG?.BASE_URL||"http://localhost:3001/api",c=await fetch(`${m}/numerology`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",Authorization:`Bearer ${s}`},body:JSON.stringify({name:r,birthDate:o,birthTime:n,lifePath:e,destiny:t,soul:i,personality:d})});if(!c.ok)throw new Error(`API error: ${c.status}`);const u=await c.json();if(a.innerHTML=`
            <div class="interpretation-section">
                ${u.fromCache?'<span class="badge badge--cache">\u{1F4E6} Z cache (deterministic result)</span>':""}
                <div class="interpretation-content">
                    ${u.response.replace(/```html/g,"").replace(/```/g,"")}
                </div>
            </div>
        `,window.Auth&&window.Auth.saveReading){const g=await window.Auth.saveReading("numerology",{name:r,birthDate:o,birthTime:n,lifePath:e,destiny:t,soul:i,personality:d});console.log("Reading saved:",g)}}catch(s){console.error("AI interpretation error:",s),a.innerHTML=`
            <div class="error-message" style="background: rgba(231, 76, 60, 0.1); padding: 1.5rem; border-radius: 10px; border-left: 4px solid #e74c3c;">
                <p style="color: #e74c3c; margin: 0;">\u274C Nepoda\u0159ilo se na\u010D\xEDst interpretaci. Zkuste to pros\xEDm znovu.</p>
            </div>
        `}}document.addEventListener("auth:refreshed",()=>{console.log("\u{1F504} Auth refreshed, reloading to unlock content..."),setTimeout(()=>window.location.reload(),500)},{once:!0});
