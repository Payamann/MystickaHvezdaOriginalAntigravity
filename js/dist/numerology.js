var E=Object.defineProperty;var A=(e,n)=>()=>(e&&(n=e(e=0)),n);var P=(e,n)=>{for(var r in n)E(e,r,{get:n[r],enumerable:!0})};var k={};P(k,{NUMBER_MEANINGS:()=>g,calculateDestiny:()=>w,calculateLifePath:()=>b,calculatePersonalCycles:()=>C,calculatePersonality:()=>_,calculateSoul:()=>f,letterToNumber:()=>h,reduceToSingleDigit:()=>i});function i(e,n=!0){for(;e>9;){if(n&&(e===11||e===22||e===33))return e;e=(""+e).split("").reduce((r,t)=>r+parseInt(t),0)}return e}function b(e){if(!e)return 0;let[n,r,t]=e.split("-").map(Number);if(!n||!r||!t)return 0;let o=i(t),a=i(r),u=i(n);return i(o+a+u)}function h(e){let n={A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8},r=e.normalize("NFD").replace(/[\u0300-\u036f]/g,"");return n[r.toUpperCase()]||0}function w(e){if(!e)return 0;let n=e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z]/g,"").split("").reduce((r,t)=>r+h(t),0);return i(n)}function f(e){if(!e)return 0;let n="AEIOUY",r=e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().split("").filter(t=>n.includes(t)).reduce((t,o)=>t+h(o),0);return i(r)}function _(e){if(!e)return 0;let n="AEIOUY",r=e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().split("").filter(t=>!n.includes(t)&&/[A-Z]/.test(t)).reduce((t,o)=>t+h(o),0);return i(r)}function C(e,n=new Date){if(!e)return null;let[r,t,o]=e.split("-").map(Number);if(!t||!o)return null;let a=n.getFullYear(),u=n.getMonth()+1,s=n.getDate(),l=i(o)+i(t)+i(a),c=i(l,!0),v=i(c)+i(u),d=i(v,!0),m=i(d)+i(s),p=i(m,!0);return{personalYear:c,personalMonth:d,personalDay:p}}var g,y=A(()=>{g={1:{title:"V\u016Fdce",short:"Nez\xE1vislost a odvaha"},2:{title:"M\xEDrotv\u016Frce",short:"Harmonie a spolupr\xE1ce"},3:{title:"Tv\u016Frce",short:"Kreativita a vyj\xE1d\u0159en\xED"},4:{title:"Stavitel",short:"Stabilita a organizace"},5:{title:"Dobrodruh",short:"Svoboda a zm\u011Bna"},6:{title:"Pe\u010Dovatel",short:"L\xE1ska a odpov\u011Bdnost"},7:{title:"Hleda\u010D",short:"Moudrost a duchovnost"},8:{title:"Velmoc",short:"S\xEDla a \xFAsp\u011Bch"},9:{title:"Humanista",short:"Soucit a odpu\u0161t\u011Bn\xED"},11:{title:"Osv\xEDcen\xFD",short:"Intuice a inspirace"},22:{title:"Mistr stavitel",short:"Vize a realizace"},33:{title:"Mistr u\u010Ditel",short:"Duchovn\xED veden\xED"}}});y();document.addEventListener("DOMContentLoaded",async()=>{let e=document.getElementById("numerology-form"),n=document.getElementById("use-profile-num");if(window.Auth&&window.Auth.isLoggedIn())try{let r=await window.Auth.getProfile();if(r&&r.birth_date){let t=r.birth_date;t.includes("T")&&(t=t.split("T")[0]),Promise.resolve().then(()=>(y(),k)).then(o=>{if(o.calculatePersonalCycles){let a=o.calculatePersonalCycles(t);I(a)}})}}catch(r){console.warn("Auto-load daily vibes failed:",r)}if(n){let r=n.closest(".checkbox-wrapper");if(r){let t=()=>{let o=window.Auth&&window.Auth.isLoggedIn();r.hidden=!o,r.classList.toggle("mh-flex-visible",o)};t(),document.addEventListener("auth:changed",t)}}n&&n.addEventListener("change",async r=>{if(r.target.checked){if(!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast?.("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro tuto funkci se mus\xEDte p\u0159ihl\xE1sit.","info"),r.target.checked=!1;return}let t=await window.Auth.getProfile();if(t){if(document.getElementById("num-name").value=t.first_name||"",t.birth_date){let o=t.birth_date;o.includes("T")&&(o=o.split("T")[0]),document.getElementById("num-date").value=o}if(t.birth_time){let o=t.birth_time;o.length>5&&(o=o.substring(0,5)),document.getElementById("num-time").value=o}}}}),e&&e.addEventListener("submit",D)});async function D(e){if(e.preventDefault(),!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast?.("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro v\xFDpo\u010Det numerologie se pros\xEDm p\u0159ihlaste.","info"),window.Auth?.startPlanCheckout?.("pruvodce",{source:"numerology_auth_gate",feature:"numerologie_vyklad",redirect:"/cenik.html",authMode:"register"});return}let n=document.getElementById("num-name").value.trim(),r=document.getElementById("num-date").value,t=document.getElementById("num-time").value;if(!n||!r){window.Auth?.showToast?.("Chyb\u011Bj\xEDc\xED \xFAdaje","Vypl\u0148te pros\xEDm jm\xE9no a datum narozen\xED.","error");return}let o=b(r),a=w(n),u=f(n),s=_(n);Promise.resolve().then(()=>(y(),k)).then(l=>{if(l.calculatePersonalCycles){let c=l.calculatePersonalCycles(r);I(c)}}).catch(l=>console.error("Nepoda\u0159ilo se na\u010D\xEDst numerology-logic:",l)),L(o,a,u,s),await M(n,r,t,o,a,u,s)}function I(e){if(!e)return;let n=document.getElementById("daily-cycles");if(!n)return;let{personalYear:r,personalMonth:t,personalDay:o}=e;document.getElementById("val-pd").textContent=o,document.getElementById("val-pm").textContent=t,document.getElementById("val-py").textContent=r;let a=document.getElementById("current-date-display");a&&(a.textContent=new Date().toLocaleDateString("cs-CZ")),n.hidden=!1,n.classList.add("mh-block-visible")}function L(e,n,r,t){let o=document.getElementById("numerology-results");if(!o)return;o.hidden=!1,o.classList.add("mh-block-visible");let a=document.getElementById("daily-cycles");a&&!a.hidden?a.scrollIntoView({behavior:"smooth",block:"start"}):o.scrollIntoView({behavior:"smooth",block:"nearest"}),[{id:"card-lifepath",number:e,label:"\u017Divotn\xED cesta",colorClass:"number-card--gold"},{id:"card-destiny",number:n,label:"Osud",colorClass:"number-card--blue"},{id:"card-soul",number:r,label:"Du\u0161e",colorClass:"number-card--green"},{id:"card-personality",number:t,label:"Osobnost",colorClass:"number-card--starlight"}].forEach(({id:s,number:l,label:c,colorClass:v})=>{let d=document.getElementById(s);if(d){let m=g[l],p=l===11||l===22||l===33;d.innerHTML=`
                <div class="number-card ${v} ${p?"master":""}">
                    <div class="number-value">${l}</div>
                    <div class="number-label">${c}</div>
                    <div class="number-title">${m?.title||""}</div>
                    <div class="number-meaning">${m?.short||""}</div>
                </div>
            `}})}async function M(e,n,r,t,o,a,u){let s=document.getElementById("num-interpretation");if(!s)return;if(!(window.Auth&&window.Auth.isLoggedIn()&&window.Auth.isPremium())){s.innerHTML=`
            <div class="interpretation-section">
                <h3>\u2728 Va\u0161e \u010C\xEDsla</h3>
                <div class="numerology-summary-grid">
                    <div class="number-card number-card--summary number-card--summary-life">
                      <div class="number-card__summary-label">\u017Divotn\xED Cesta</div>
                        <div class="number-card__summary-value number-card__summary-value--gold">${t}</div>
                    </div>
                    <div class="number-card number-card--summary number-card--summary-destiny">
                        <div class="number-card__summary-label">Osud</div>
                        <div class="number-card__summary-value number-card__summary-value--blue">${o}</div>
                    </div>
                    <div class="number-card number-card--summary number-card--summary-soul">
                        <div class="number-card__summary-label">Du\u0161e</div>
                        <div class="number-card__summary-value number-card__summary-value--green">${a}</div>
                    </div>
                    <div class="number-card number-card--summary number-card--summary-personality">
                        <div class="number-card__summary-label">Osobnost</div>
                        <div class="number-card__summary-value number-card__summary-value--starlight">${u}</div>
                    </div>
                </div>

                <div class="premium-locked numerology-premium-preview">
                    <h4>Hlubok\xFD Rozbor</h4>
                    <p>Objevte tajemstv\xED va\u0161ich \u010D\xEDsel s pomoc\xED starod\xE1vn\xE9 moudrosti. Ka\u017Ed\xE9 \u010D\xEDslo nese v sob\u011B mocn\xE9 poselstv\xED...</p>
                    <p class="numerology-premium-preview__muted">Va\u0161e \u017Eivotn\xED cesta ${t} symbolizuje...</p>
                </div>
                
                <div class="premium-lock-overlay">
                    <div class="lock-icon">\u{1F512}</div>
                    <p class="lock-text">Detailn\xED rozbor je Premium funkce</p>
                    <button class="btn btn--gold unlock-btn numerology-upgrade-btn">\u{1F31F} Vyzkou\u0161et 7 dn\xED zdarma</button>
                </div>
            </div>
        `,window.Premium?.trackPaywallHit&&window.Premium.trackPaywallHit("numerologie_vyklad");let c=s.querySelector(".numerology-upgrade-btn");c&&c.addEventListener("click",()=>{window.Premium?.showTrialPaywall?window.Premium.showTrialPaywall("numerologie_vyklad"):window.Auth?.startPlanCheckout?.("pruvodce",{source:"numerology_inline_gate",feature:"numerologie_vyklad",redirect:"/cenik.html",authMode:"register"})});return}s.innerHTML=`
        <div class="interpretation-loading">
            <div class="spinner"></div>
            <p class="interpretation-loading__text">Generuji hloubkovou interpretaci...</p>
        </div>
    `;try{let c=window.API_CONFIG?.BASE_URL||"/api",v=window.getCSRFToken?await window.getCSRFToken():null,d=await fetch(`${c}/numerology`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...v&&{"X-CSRF-Token":v}},body:JSON.stringify({name:e,birthDate:n,birthTime:r,lifePath:t,destiny:o,soul:a,personality:u})});if(!d.ok)throw new Error(`API error: ${d.status}`);let m=await d.json();if(s.innerHTML=`
            <div class="interpretation-section">
                ${m.fromCache?'<span class="badge badge--cache">\u{1F4E6} Z cache (deterministic result)</span>':""}
                <div class="interpretation-content">
                    ${m.response.replace(/```html/g,"").replace(/```/g,"")}
                </div>
            </div>
        `,window.Auth&&window.Auth.saveReading){let p=await window.Auth.saveReading("numerology",{name:e,birthDate:n,birthTime:r,lifePath:t,destiny:o,soul:a,personality:u});window.MH_DEBUG&&console.debug("Reading saved:",p)}}catch(c){console.error("AI interpretation error:",c),s.innerHTML=`
            <div class="error-message error-message--inline">
                <p class="error-message__text">\u274C Nepoda\u0159ilo se na\u010D\xEDst interpretaci. Zkuste to pros\xEDm znovu.</p>
            </div>
        `}}document.addEventListener("auth:refreshed",()=>{window.MH_DEBUG&&console.debug("Auth refreshed, reloading to unlock content..."),setTimeout(()=>window.location.reload(),500)},{once:!0});
