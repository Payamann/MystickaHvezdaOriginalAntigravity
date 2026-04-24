let v={},f=[];document.addEventListener("DOMContentLoaded",async()=>{await k(),b()});async function k(){try{const r=await fetch("data/tarot-cards.json?v=2");if(!r.ok)throw new Error("Failed to load tarot data");v=await r.json(),f=Object.keys(v),console.log("\u{1F0CF} Tarot Data Loaded:",f.length,"cards")}catch(r){console.error("CRITICAL: Failed to load tarot cards:",r);const a=document.querySelector(".tarot-deck");a&&(a.innerHTML='<div class="text-center" style="color: #ff6b6b; padding: 2rem;">Nepoda\u0159ilo se na\u010D\xEDst data karet. Zkontrolujte p\u0159ipojen\xED.</div>')}}function b(){const r=document.querySelectorAll(".spread-trigger"),a=document.querySelectorAll(".t-spread-card"),s=document.querySelector(".tarot-deck");if(!s)return;let i=document.getElementById("tarot-results");if(!i){i=document.createElement("div"),i.id="tarot-results",i.className="container hidden",i.style.marginTop="var(--space-2xl)";const e=s.closest(".section");e?e.after(i):document.body.appendChild(i)}a.forEach(e=>{e.addEventListener("click",()=>{a.forEach(l=>{l.classList.remove("featured");const p=l.querySelector(".btn");p&&(p.classList.remove("btn--primary"),p.classList.add("btn--glass"))}),e.classList.add("featured");const n=e.querySelector(".btn");n&&(n.classList.remove("btn--glass"),n.classList.add("btn--primary"))})}),r.forEach(e=>{e.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation();const l=e.dataset.spreadType;let p=!1;if(l!=="Jedna karta"){if(!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro vstup do Hv\u011Bzdn\xE9ho Pr\u016Fvodce se pros\xEDm p\u0159ihlaste.","info"),window.location.href="/prihlaseni.html?redirect=/tarot.html";return}if(!window.Auth?.isPremium()){p=!0;const c=new Date().toISOString().split("T")[0];let o={};try{o=JSON.parse(localStorage.getItem("tarot_free_usage")||"{}")}catch{localStorage.removeItem("tarot_free_usage")}if(o.date===c&&o.count>=1){window.Auth.showToast("Limit vy\u010Derp\xE1n \u{1F512}","Dne\u0161n\xED uk\xE1zka zdarma ji\u017E byla vy\u010Derp\xE1na. Z\xEDskejte Premium pro neomezen\xE9 v\xFDklady.","error");return}localStorage.setItem("tarot_free_usage",JSON.stringify({date:c,count:1}))}}const g=e.closest(".t-spread-card");g&&!g.classList.contains("featured")&&g.click(),l&&h(l,p)})}),s.querySelectorAll(".tarot-card").forEach(e=>{e.style.cursor="pointer",e.addEventListener("click",()=>{const n=document.querySelector(".t-spread-card.featured .btn"),l=n?n.dataset.spreadType:"Jedna karta";h(l)})})}function w(r){const a=document.createElement("div");return a.textContent=r,a.innerHTML}async function h(r,a=!1){const s=document.querySelector(".tarot-deck");if(!s)return;s.scrollIntoView({behavior:"smooth",block:"center"}),await new Promise(t=>setTimeout(t,300)),s.style.transform="scale(1.05)",s.classList.add("shaking"),await new Promise(t=>setTimeout(t,1500)),s.classList.remove("shaking"),s.style.transform="",await new Promise(t=>setTimeout(t,300));const i=f.filter(t=>v[t].image);let u=1;r==="T\u0159i karty"&&(u=3),r==="Celtic Cross"&&(u=10);const e=[];for(;e.length<u&&e.length<i.length;){const t=i[Math.floor(Math.random()*i.length)];e.includes(t)||e.push(t)}const n=e.map(t=>({name:t,...v[t]})),l=document.getElementById("tarot-results");if(!l)return;const p=u===1?"grid-1":u<=3?`grid-${u}`:"grid-5";l.innerHTML=`
        <div class="text-center">
            <h3 class="mb-lg" style="color: var(--color-mystic-gold);">\u2728 Va\u0161e vylosovan\xE9 karty \u2728</h3>
            <div class="tarot-spread grid ${p}" style="gap: var(--space-lg); margin-bottom: var(--space-xl); max-width: 1200px; margin-left: auto; margin-right: auto;">
                ${n.map((t,d)=>{const m=a&&d>0;return`
                    <div class="tarot-flip-card ${m?"locked-card":""}" data-index="${d}" style="--flip-delay: ${d*.3}s;">
                        <div class="tarot-flip-inner">
                            <div class="tarot-flip-front">
                                <img src="img/tarot-back.webp" alt="Tarot Card Back">
                            </div>
                            <div class="tarot-flip-back ${t.image?"has-image":""}">
                                ${m?`
                                    <div class="premium-lock-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10;">
                                        <div class="lock-icon" style="font-size: 2rem;">\u{1F512}</div>
                                        <h2 style="font-family: 'Cinzel', serif; color: var(--color-mystic-gold); margin-bottom: 1rem;">Pouze pro Premium</h2>
                                        <p style="margin-bottom: 2rem; color: var(--color-silver-mist);">
                                            Hv\u011Bzdn\xFD Pr\u016Fvodce je exkluzivn\xED zdroj moudrosti pro na\u0161e p\u0159edplatitele.<br>
                                            Odemkn\u011Bte pln\xFD potenci\xE1l a z\xEDskejte p\u0159\xEDstup ke v\u0161em v\xFDklad\u016Fm.
                                        </p>
                                        <a href="cenik.html" class="btn btn--primary">Z\xEDskat Premium</a>
                                    </div>
                                    <img src="img/tarot-back.webp" style="filter: blur(5px); opacity: 0.5;" alt="Locked">
                                `:t.image?`
                                    <img src="${t.image}" onerror="this.onerror=null;this.src='img/tarot/tarot_placeholder.webp'" alt="${w(t.name)}" class="tarot-card-image" loading="lazy">
                                `:`
                                    <div class="tarot-card-content">
                                        <span class="tarot-card-emoji">${t.emoji}</span>
                                        <h4 class="tarot-card-name">${w(t.name)}</h4>
                                        <p class="tarot-card-meaning">${w(t.meaning)}</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                `}).join("")}
            </div>
            <div id="interpretations-container" style="margin-top: var(--space-xl);"></div>
             ${a?`
                <div class="text-center mt-xl p-lg" style="background: rgba(212, 175, 55, 0.1); border: 1px solid var(--color-mystic-gold); border-radius: 12px; max-width: 600px; margin: 2rem auto;">
                    <h3 style="color: var(--color-mystic-gold);">Odemkn\u011Bte sv\u016Fj osud</h3>
                    <p class="mb-lg">Pr\xE1v\u011B jste nahl\xE9dli za oponu. Zb\xFDvaj\xEDc\xEDch ${u-1} karet skr\xFDv\xE1 kl\xED\u010D k pochopen\xED cel\xE9 situace.</p>
                    <a href="cenik.html" class="btn btn--primary">Z\xEDskat Premium a odhalit v\u0161e</a>
                </div>
            `:""}
        </div>
    `,l.classList.remove("hidden"),await new Promise(t=>setTimeout(t,100)),l.scrollIntoView({behavior:"smooth"});const g=l.querySelectorAll(".tarot-flip-card");for(let t=0;t<g.length;t++)await new Promise(d=>setTimeout(d,600)),g[t].classList.add("flipped");await new Promise(t=>setTimeout(t,800));const c=document.getElementById("interpretations-container");let o=n.map((t,d)=>{if(a&&d>0)return"";let m="";r==="T\u0159i karty"?m=["\u{1F4DC} Minulost","\u23F3 P\u0159\xEDtomnost","\u{1F52E} Budoucnost"][d]||"":r==="Celtic Cross"&&(m=["\u{1F3AF} Situace","\u2694\uFE0F V\xFDzva","\u{1F4AB} Podv\u011Bdom\xED","\u{1F3DB}\uFE0F Z\xE1klad","\u{1F305} Minulost","\u{1F52E} Budoucnost","\u{1F9D8} Postoj","\u{1F30D} Vliv okol\xED","\u{1F4AD} Nad\u011Bje/Obavy","\u{1F3C1} V\xFDsledek"][d]||"");const y=Object.keys(v).indexOf(t.name)<22;return window.Templates?window.Templates.renderTarotResult(t,d,y,m):(console.error("Templates library missing"),"")}).join("");if(u>1&&window.Templates&&!a&&(r==="T\u0159i karty"?o+=window.Templates.renderSummary3Card(n):r==="Celtic Cross"?o+=window.Templates.renderSummaryCeltic(n):o+=window.Templates.renderSummaryDefault(n)),c.innerHTML=o,u>1&&!a)setTimeout(()=>T(n,r),500);else if(window.Auth&&window.Auth.saveReading){const t=n.slice(0,a?1:void 0).map((m,y)=>({name:m.name,position:"Jedna karta",meaning:m.meaning})),d=await window.Auth.saveReading("tarot",{spreadType:a?`${r} (Uk\xE1zka)`:r,cards:t});if(d&&d.id){window.currentTarotReadingId=d.id;const m=document.createElement("div");m.className="text-center",m.style.marginTop="var(--space-xl)",m.innerHTML=`
                    <button id="favorite-tarot-btn" class="btn btn--glass" style="min-width: 200px;">
                        <span class="favorite-icon">\u2B50</span> P\u0159idat do obl\xEDben\xFDch
                    </button>
                `,c.appendChild(m),document.getElementById("favorite-tarot-btn").addEventListener("click",async()=>{await toggleFavorite(window.currentTarotReadingId,"favorite-tarot-btn")})}}}async function T(r,a){const s=document.getElementById("ethereal-tarot-summary");if(s)try{const i=r.map((g,c)=>{let o="";return a==="T\u0159i karty"?o=["Minulost","P\u0159\xEDtomnost","Budoucnost"][c]||`Pozice ${c+1}`:a==="Celtic Cross"?o=["Situace","V\xFDzva","Podv\u011Bdom\xED","Z\xE1klad","Minulost","Budoucnost","Postoj","Vliv okol\xED","Nad\u011Bje/Obavy","V\xFDsledek"][c]||`Pozice ${c+1}`:o=`Karta ${c+1}`,{name:g.name,position:o,meaning:g.meaning}}),u=window.location.pathname;let e="cs";u.includes("/sk/")?e="sk":u.includes("/pl/")&&(e="pl");const n=window.getCSRFToken?await window.getCSRFToken():null,p=await(await fetch(`${window.API_CONFIG?.BASE_URL||"/api"}/tarot-summary`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...n&&{"X-CSRF-Token":n}},body:JSON.stringify({spreadType:a,cards:i,lang:e})})).json();if(p.success){const c=p.response.split(`
`).filter(o=>o.trim().length>0).map(o=>`<p class="mb-md">${o}</p>`).join("");if(s.innerHTML=typeof DOMPurify<"u"?DOMPurify.sanitize(c):c,window.Auth&&window.Auth.saveReading){const o=await window.Auth.saveReading("tarot",{spreadType:a,cards:i,response:p.response});if(o&&o.id){window.currentTarotReadingId=o.id;const t=document.createElement("div");t.className="text-center",t.style.marginTop="var(--space-xl)",t.innerHTML=`
                        <button id="favorite-tarot-btn" class="btn btn--glass" style="min-width: 200px;">
                            <span class="favorite-icon">\u2B50</span> P\u0159idat do obl\xEDben\xFDch
                        </button>
                    `,s.parentElement.appendChild(t),document.getElementById("favorite-tarot-btn").addEventListener("click",async()=>{await toggleFavorite(window.currentTarotReadingId,"favorite-tarot-btn")})}}s.parentElement.classList.add("fade-in")}else throw new Error(p.error||"Failed to generate summary")}catch(i){console.error("AI Summary Error:",i),s.innerHTML=`
            <p class="text-center" style="color: var(--color-silver-mist);">
                <em>Hv\u011Bzdy jsou nyn\xED p\u0159\xEDli\u0161 daleko... (Spojen\xED selhalo)</em>
            </p>
        `}}
