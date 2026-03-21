let TAROT_CARDS={},TAROT_CARDS_ARRAY=[];document.addEventListener("DOMContentLoaded",async()=>{await loadTarotData(),initTarot()});async function loadTarotData(){try{const o=await fetch("data/tarot-cards.json?v=2");if(!o.ok)throw new Error("Failed to load tarot data");TAROT_CARDS=await o.json(),TAROT_CARDS_ARRAY=Object.keys(TAROT_CARDS),console.log("\u{1F0CF} Tarot Data Loaded:",TAROT_CARDS_ARRAY.length,"cards")}catch(o){console.error("CRITICAL: Failed to load tarot cards:",o);const a=document.querySelector(".tarot-deck");a&&(a.innerHTML='<div class="text-center" style="color: #ff6b6b; padding: 2rem;">Nepoda\u0159ilo se na\u010D\xEDst data karet. Zkontrolujte p\u0159ipojen\xED.</div>')}}function initTarot(){const o=document.querySelectorAll(".spread-trigger"),a=document.querySelectorAll(".t-spread-card"),s=document.querySelector(".tarot-deck");if(!s)return;let i=document.getElementById("tarot-results");if(!i){i=document.createElement("div"),i.id="tarot-results",i.className="container hidden",i.style.marginTop="var(--space-2xl)";const e=s.closest(".section");e?e.after(i):document.body.appendChild(i)}a.forEach(e=>{e.addEventListener("click",()=>{a.forEach(l=>{l.classList.remove("featured");const p=l.querySelector(".btn");p&&(p.classList.remove("btn--primary"),p.classList.add("btn--glass"))}),e.classList.add("featured");const n=e.querySelector(".btn");n&&(n.classList.remove("btn--glass"),n.classList.add("btn--primary"))})}),o.forEach(e=>{e.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation();const l=e.dataset.spreadType;let p=!1;if(l!=="Jedna karta"){if(!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro vstup do Hv\u011Bzdn\xE9ho Pr\u016Fvodce se pros\xEDm p\u0159ihlaste.","info"),window.Auth?.openModal("login");return}if(!window.Auth.isPremium()){p=!0;const c=new Date().toISOString().split("T")[0],r=JSON.parse(localStorage.getItem("tarot_free_usage")||"{}");if(r.date===c&&r.count>=1){window.Auth.showToast("Limit vy\u010Derp\xE1n \u{1F512}","Dne\u0161n\xED uk\xE1zka zdarma ji\u017E byla vy\u010Derp\xE1na. Z\xEDskejte Premium pro neomezen\xE9 v\xFDklady.","error");return}localStorage.setItem("tarot_free_usage",JSON.stringify({date:c,count:1}))}}const v=e.closest(".t-spread-card");v&&!v.classList.contains("featured")&&v.click(),l&&startReading(l,p)})}),s.querySelectorAll(".tarot-card").forEach(e=>{e.style.cursor="pointer",e.addEventListener("click",()=>{const n=document.querySelector(".t-spread-card.featured .btn"),l=n?n.dataset.spreadType:"Jedna karta";startReading(l)})})}function escapeHtml(o){const a=document.createElement("div");return a.textContent=o,a.innerHTML}async function startReading(o,a=!1){const s=document.querySelector(".tarot-deck");if(!s)return;s.scrollIntoView({behavior:"smooth",block:"center"}),await new Promise(t=>setTimeout(t,300)),s.style.transform="scale(1.05)",s.classList.add("shaking"),await new Promise(t=>setTimeout(t,1500)),s.classList.remove("shaking"),s.style.transform="",await new Promise(t=>setTimeout(t,300));const i=TAROT_CARDS_ARRAY.filter(t=>TAROT_CARDS[t].image);let u=1;o==="T\u0159i karty"&&(u=3),o==="Celtic Cross"&&(u=10);const e=[];for(;e.length<u&&e.length<i.length;){const t=i[Math.floor(Math.random()*i.length)];e.includes(t)||e.push(t)}const n=e.map(t=>({name:t,...TAROT_CARDS[t]})),l=document.getElementById("tarot-results");if(!l)return;const p=u===1?"grid-1":u<=3?`grid-${u}`:"grid-5";l.innerHTML=`
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
                                    <img src="${t.image}" onerror="this.onerror=null;this.src='img/tarot/tarot_placeholder.webp'" alt="${escapeHtml(t.name)}" class="tarot-card-image" loading="lazy">
                                `:`
                                    <div class="tarot-card-content">
                                        <span class="tarot-card-emoji">${t.emoji}</span>
                                        <h4 class="tarot-card-name">${escapeHtml(t.name)}</h4>
                                        <p class="tarot-card-meaning">${escapeHtml(t.meaning)}</p>
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
    `,l.classList.remove("hidden"),await new Promise(t=>setTimeout(t,100)),l.scrollIntoView({behavior:"smooth"});const v=l.querySelectorAll(".tarot-flip-card");for(let t=0;t<v.length;t++)await new Promise(d=>setTimeout(d,600)),v[t].classList.add("flipped");await new Promise(t=>setTimeout(t,800));const c=document.getElementById("interpretations-container");let r=n.map((t,d)=>{if(a&&d>0)return"";let m="";o==="T\u0159i karty"?m=["\u{1F4DC} Minulost","\u23F3 P\u0159\xEDtomnost","\u{1F52E} Budoucnost"][d]||"":o==="Celtic Cross"&&(m=["\u{1F3AF} Situace","\u2694\uFE0F V\xFDzva","\u{1F4AB} Podv\u011Bdom\xED","\u{1F3DB}\uFE0F Z\xE1klad","\u{1F305} Minulost","\u{1F52E} Budoucnost","\u{1F9D8} Postoj","\u{1F30D} Vliv okol\xED","\u{1F4AD} Nad\u011Bje/Obavy","\u{1F3C1} V\xFDsledek"][d]||"");const g=Object.keys(TAROT_CARDS).indexOf(t.name)<22;return window.Templates?window.Templates.renderTarotResult(t,d,g,m):(console.error("Templates library missing"),"")}).join("");if(u>1&&window.Templates&&!a&&(o==="T\u0159i karty"?r+=window.Templates.renderSummary3Card(n):o==="Celtic Cross"?r+=window.Templates.renderSummaryCeltic(n):r+=window.Templates.renderSummaryDefault(n)),c.innerHTML=r,u>1&&!a)setTimeout(()=>generateEtherealSummary(n,o),500);else if(window.Auth&&window.Auth.saveReading){const t=n.slice(0,a?1:void 0).map((m,g)=>({name:m.name,position:"Jedna karta",meaning:m.meaning})),d=await window.Auth.saveReading("tarot",{spreadType:a?`${o} (Uk\xE1zka)`:o,cards:t});if(d&&d.id){window.currentTarotReadingId=d.id;const m=document.createElement("div");m.className="text-center",m.style.marginTop="var(--space-xl)",m.innerHTML=`
                    <button id="favorite-tarot-btn" class="btn btn--glass" style="min-width: 200px;">
                        <span class="favorite-icon">\u2B50</span> P\u0159idat do obl\xEDben\xFDch
                    </button>
                `,c.appendChild(m),document.getElementById("favorite-tarot-btn").addEventListener("click",async()=>{await toggleFavorite(window.currentTarotReadingId,"favorite-tarot-btn")})}}}async function generateEtherealSummary(o,a){const s=document.getElementById("ethereal-tarot-summary");if(s)try{const i=o.map((v,c)=>{let r="";return a==="T\u0159i karty"?r=["Minulost","P\u0159\xEDtomnost","Budoucnost"][c]||`Pozice ${c+1}`:a==="Celtic Cross"?r=["Situace","V\xFDzva","Podv\u011Bdom\xED","Z\xE1klad","Minulost","Budoucnost","Postoj","Vliv okol\xED","Nad\u011Bje/Obavy","V\xFDsledek"][c]||`Pozice ${c+1}`:r=`Karta ${c+1}`,{name:v.name,position:r,meaning:v.meaning}}),u=window.location.pathname;let e="cs";u.includes("/sk/")?e="sk":u.includes("/pl/")&&(e="pl");const n=window.Auth?.token,p=await(await fetch(`${window.API_CONFIG?.BASE_URL||"/api"}/tarot-summary`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...n?{Authorization:`Bearer ${n}`}:{}},body:JSON.stringify({spreadType:a,cards:i,lang:e})})).json();if(p.success){const c=p.response.split(`
`).filter(r=>r.trim().length>0).map(r=>`<p class="mb-md">${r}</p>`).join("");if(s.innerHTML=typeof DOMPurify<"u"?DOMPurify.sanitize(c):c,window.Auth&&window.Auth.saveReading){const r=await window.Auth.saveReading("tarot",{spreadType:a,cards:i,response:p.response});if(r&&r.id){window.currentTarotReadingId=r.id;const t=document.createElement("div");t.className="text-center",t.style.marginTop="var(--space-xl)",t.innerHTML=`
                        <button id="favorite-tarot-btn" class="btn btn--glass" style="min-width: 200px;">
                            <span class="favorite-icon">\u2B50</span> P\u0159idat do obl\xEDben\xFDch
                        </button>
                    `,s.parentElement.appendChild(t),document.getElementById("favorite-tarot-btn").addEventListener("click",async()=>{await toggleFavorite(window.currentTarotReadingId,"favorite-tarot-btn")})}}s.parentElement.classList.add("fade-in")}else throw new Error(p.error||"Failed to generate summary")}catch(i){console.error("AI Summary Error:",i),s.innerHTML=`
            <p class="text-center" style="color: var(--color-silver-mist);">
                <em>Hv\u011Bzdy jsou nyn\xED p\u0159\xEDli\u0161 daleko... (Spojen\xED selhalo)</em>
            </p>
        `}}
