var P=Object.defineProperty;var E=(e,t)=>()=>(e&&(t=e(e=0)),t);var C=(e,t)=>{for(var r in t)P(e,r,{get:t[r],enumerable:!0})};var k={};C(k,{NUMBER_MEANINGS:()=>g,calculateDestiny:()=>b,calculateLifePath:()=>w,calculatePersonalCycles:()=>L,calculatePersonality:()=>_,calculateSoul:()=>f,letterToNumber:()=>h,reduceToSingleDigit:()=>i});function i(e,t=!0){for(;e>9;){if(t&&(e===11||e===22||e===33))return e;e=(""+e).split("").reduce((r,n)=>r+parseInt(n),0)}return e}function w(e){if(!e)return 0;let[t,r,n]=e.split("-").map(Number);if(!t||!r||!n)return 0;let o=i(n),a=i(r),u=i(t);return i(o+a+u)}function h(e){let t={A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8},r=e.normalize("NFD").replace(/[\u0300-\u036f]/g,"");return t[r.toUpperCase()]||0}function b(e){if(!e)return 0;let t=e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z]/g,"").split("").reduce((r,n)=>r+h(n),0);return i(t)}function f(e){if(!e)return 0;let t="AEIOUY",r=e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().split("").filter(n=>t.includes(n)).reduce((n,o)=>n+h(o),0);return i(r)}function _(e){if(!e)return 0;let t="AEIOUY",r=e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().split("").filter(n=>!t.includes(n)&&/[A-Z]/.test(n)).reduce((n,o)=>n+h(o),0);return i(r)}function L(e,t=new Date){if(!e)return null;let[r,n,o]=e.split("-").map(Number);if(!n||!o)return null;let a=t.getFullYear(),u=t.getMonth()+1,s=t.getDate(),l=i(o)+i(n)+i(a),c=i(l,!0),v=i(c)+i(u),d=i(v,!0),m=i(d)+i(s),p=i(m,!0);return{personalYear:c,personalMonth:d,personalDay:p}}var g,y=E(()=>{g={1:{title:"V\u016Fdce",short:"Nez\xE1vislost a odvaha"},2:{title:"M\xEDrotv\u016Frce",short:"Harmonie a spolupr\xE1ce"},3:{title:"Tv\u016Frce",short:"Kreativita a vyj\xE1d\u0159en\xED"},4:{title:"Stavitel",short:"Stabilita a organizace"},5:{title:"Dobrodruh",short:"Svoboda a zm\u011Bna"},6:{title:"Pe\u010Dovatel",short:"L\xE1ska a odpov\u011Bdnost"},7:{title:"Hleda\u010D",short:"Moudrost a duchovnost"},8:{title:"Velmoc",short:"S\xEDla a \xFAsp\u011Bch"},9:{title:"Humanista",short:"Soucit a odpu\u0161t\u011Bn\xED"},11:{title:"Osv\xEDcen\xFD",short:"Intuice a inspirace"},22:{title:"Mistr stavitel",short:"Vize a realizace"},33:{title:"Mistr u\u010Ditel",short:"Duchovn\xED veden\xED"}}});y();function T(e="numerology_inline_gate"){let t=new URL("/cenik.html",window.location.origin);return t.searchParams.set("plan","pruvodce"),t.searchParams.set("source",e),t.searchParams.set("feature","numerologie_vyklad"),`${t.pathname}${t.search}`}function A(e="numerology_inline_gate",t="register"){if(window.MH_ANALYTICS?.trackCTA?.(e,{plan_id:"pruvodce",feature:"numerologie_vyklad"}),window.Auth?.startPlanCheckout){window.Auth.startPlanCheckout("pruvodce",{source:e,feature:"numerologie_vyklad",redirect:"/cenik.html",authMode:t});return}window.location.href=T(e)}document.addEventListener("DOMContentLoaded",async()=>{let e=document.getElementById("numerology-form"),t=document.getElementById("use-profile-num");if(window.Auth&&window.Auth.isLoggedIn())try{let r=await window.Auth.getProfile();if(r&&r.birth_date){let n=r.birth_date;n.includes("T")&&(n=n.split("T")[0]),Promise.resolve().then(()=>(y(),k)).then(o=>{if(o.calculatePersonalCycles){let a=o.calculatePersonalCycles(n);I(a)}})}}catch(r){console.warn("Auto-load daily vibes failed:",r)}if(t){let r=t.closest(".checkbox-wrapper");if(r){let n=()=>{let o=window.Auth&&window.Auth.isLoggedIn();r.hidden=!o,r.classList.toggle("mh-flex-visible",o)};n(),document.addEventListener("auth:changed",n)}}t&&t.addEventListener("change",async r=>{if(r.target.checked){if(!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast?.("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro tuto funkci se mus\xEDte p\u0159ihl\xE1sit.","info"),r.target.checked=!1;return}let n=await window.Auth.getProfile();if(n){if(document.getElementById("num-name").value=n.first_name||"",n.birth_date){let o=n.birth_date;o.includes("T")&&(o=o.split("T")[0]),document.getElementById("num-date").value=o}if(n.birth_time){let o=n.birth_time;o.length>5&&(o=o.substring(0,5)),document.getElementById("num-time").value=o}}}}),e&&e.addEventListener("submit",D)});async function D(e){if(e.preventDefault(),!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast?.("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro v\xFDpo\u010Det numerologie se pros\xEDm p\u0159ihlaste.","info"),A("numerology_auth_gate","register");return}let t=document.getElementById("num-name").value.trim(),r=document.getElementById("num-date").value,n=document.getElementById("num-time").value;if(!t||!r){window.Auth?.showToast?.("Chyb\u011Bj\xEDc\xED \xFAdaje","Vypl\u0148te pros\xEDm jm\xE9no a datum narozen\xED.","error");return}let o=w(r),a=b(t),u=f(t),s=_(t);Promise.resolve().then(()=>(y(),k)).then(l=>{if(l.calculatePersonalCycles){let c=l.calculatePersonalCycles(r);I(c)}}).catch(l=>console.error("Nepoda\u0159ilo se na\u010D\xEDst numerology-logic:",l)),S(o,a,u,s),await M(t,r,n,o,a,u,s)}function I(e){if(!e)return;let t=document.getElementById("daily-cycles");if(!t)return;let{personalYear:r,personalMonth:n,personalDay:o}=e;document.getElementById("val-pd").textContent=o,document.getElementById("val-pm").textContent=n,document.getElementById("val-py").textContent=r;let a=document.getElementById("current-date-display");a&&(a.textContent=new Date().toLocaleDateString("cs-CZ")),t.hidden=!1,t.classList.add("mh-block-visible")}function S(e,t,r,n){let o=document.getElementById("numerology-results");if(!o)return;o.hidden=!1,o.classList.add("mh-block-visible");let a=document.getElementById("daily-cycles");a&&!a.hidden?a.scrollIntoView({behavior:"smooth",block:"start"}):o.scrollIntoView({behavior:"smooth",block:"nearest"}),[{id:"card-lifepath",number:e,label:"\u017Divotn\xED cesta",colorClass:"number-card--gold"},{id:"card-destiny",number:t,label:"Osud",colorClass:"number-card--blue"},{id:"card-soul",number:r,label:"Du\u0161e",colorClass:"number-card--green"},{id:"card-personality",number:n,label:"Osobnost",colorClass:"number-card--starlight"}].forEach(({id:s,number:l,label:c,colorClass:v})=>{let d=document.getElementById(s);if(d){let m=g[l],p=l===11||l===22||l===33;d.innerHTML=`
                <div class="number-card ${v} ${p?"master":""}">
                    <div class="number-value">${l}</div>
                    <div class="number-label">${c}</div>
                    <div class="number-title">${m?.title||""}</div>
                    <div class="number-meaning">${m?.short||""}</div>
                </div>
            `}})}async function M(e,t,r,n,o,a,u){let s=document.getElementById("num-interpretation");if(!s)return;if(!(window.Auth&&window.Auth.isLoggedIn()&&window.Auth.isPremium())){s.innerHTML=`
            <div class="interpretation-section">
                <h3>\u2728 Va\u0161e \u010C\xEDsla</h3>
                <div class="numerology-summary-grid">
                    <div class="number-card number-card--summary number-card--summary-life">
                      <div class="number-card__summary-label">\u017Divotn\xED Cesta</div>
                        <div class="number-card__summary-value number-card__summary-value--gold">${n}</div>
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
                    <p class="numerology-premium-preview__muted">Va\u0161e \u017Eivotn\xED cesta ${n} symbolizuje...</p>
                </div>
                
                <div class="premium-lock-overlay">
                    <div class="lock-icon">\u{1F512}</div>
                    <p class="lock-text">Detailn\xED rozbor je Premium funkce</p>
                    <button class="btn btn--gold unlock-btn numerology-upgrade-btn">\u{1F31F} Vyzkou\u0161et 7 dn\xED zdarma</button>
                </div>
            </div>
        `,window.Premium?.trackPaywallHit&&window.Premium.trackPaywallHit("numerologie_vyklad");let c=s.querySelector(".numerology-upgrade-btn");c&&c.addEventListener("click",()=>{window.Premium?.showTrialPaywall?window.Premium.showTrialPaywall("numerologie_vyklad"):A("numerology_inline_gate","register")});return}s.innerHTML=`
        <div class="interpretation-loading">
            <div class="spinner"></div>
            <p class="interpretation-loading__text">Generuji hloubkovou interpretaci...</p>
        </div>
    `;try{let c=window.API_CONFIG?.BASE_URL||"/api",v=window.getCSRFToken?await window.getCSRFToken():null,d=await fetch(`${c}/numerology`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...v&&{"X-CSRF-Token":v}},body:JSON.stringify({name:e,birthDate:t,birthTime:r,lifePath:n,destiny:o,soul:a,personality:u})});if(!d.ok)throw new Error(`API error: ${d.status}`);let m=await d.json();if(s.innerHTML=`
            <div class="interpretation-section">
                ${m.cached||m.fromCache?'<span class="badge badge--cache">\u{1F4E6} Z cache (deterministic result)</span>':""}
                <div class="interpretation-content">
                    ${m.response.replace(/```html/g,"").replace(/```/g,"")}
                </div>
            </div>
        `,window.Auth&&window.Auth.saveReading){let p=await window.Auth.saveReading("numerology",{name:e,birthDate:t,birthTime:r,lifePath:n,destiny:o,soul:a,personality:u,response:m.response});window.MH_DEBUG&&console.debug("Reading saved:",p)}}catch(c){console.error("AI interpretation error:",c),s.innerHTML=`
            <div class="error-message error-message--inline">
                <p class="error-message__text">\u274C Nepoda\u0159ilo se na\u010D\xEDst interpretaci. Zkuste to pros\xEDm znovu.</p>
            </div>
        `}}document.addEventListener("auth:refreshed",()=>{window.MH_DEBUG&&console.debug("Auth refreshed, reloading to unlock content..."),setTimeout(()=>window.location.reload(),500)},{once:!0});
