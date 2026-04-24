let v={},f=[];function b(e){return e==="Celtic Cross"?"vip-majestrat":"pruvodce"}function w(e,a="tarot_inline_upsell"){const s=b(e);window.MH_ANALYTICS?.trackCTA?.(a,{plan_id:s,spread_type:e}),window.Auth?.startPlanCheckout?.(s,{source:a,feature:e==="Celtic Cross"?"tarot_celtic_cross":"tarot_multi_card",redirect:"/cenik.html",authMode:window.Auth?.isLoggedIn?.()?"login":"register"})}document.addEventListener("DOMContentLoaded",async()=>{await C(),T()});async function C(){try{const e=await fetch("data/tarot-cards.json?v=2");if(!e.ok)throw new Error("Failed to load tarot data");v=await e.json(),f=Object.keys(v),console.log("\u{1F0CF} Tarot Data Loaded:",f.length,"cards")}catch(e){console.error("CRITICAL: Failed to load tarot cards:",e);const a=document.querySelector(".tarot-deck");a&&(a.innerHTML='<div class="text-center" style="color: #ff6b6b; padding: 2rem;">Nepoda\u0159ilo se na\u010D\xEDst data karet. Zkontrolujte p\u0159ipojen\xED.</div>')}}function T(){const e=document.querySelectorAll(".spread-trigger"),a=document.querySelectorAll(".t-spread-card"),s=document.querySelector(".tarot-deck");if(!s)return;let l=document.getElementById("tarot-results");if(!l){l=document.createElement("div"),l.id="tarot-results",l.className="container hidden",l.style.marginTop="var(--space-2xl)";const o=s.closest(".section");o?o.after(l):document.body.appendChild(l)}a.forEach(o=>{o.addEventListener("click",()=>{a.forEach(i=>{i.classList.remove("featured");const p=i.querySelector(".btn");p&&(p.classList.remove("btn--primary"),p.classList.add("btn--glass"))}),o.classList.add("featured");const n=o.querySelector(".btn");n&&(n.classList.remove("btn--glass"),n.classList.add("btn--primary"))})}),e.forEach(o=>{o.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation();const i=o.dataset.spreadType;let p=!1;if(i!=="Jedna karta"){if(!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro vstup do Hv\u011Bzdn\xE9ho Pr\u016Fvodce se pros\xEDm p\u0159ihlaste.","info"),w(i,"tarot_auth_gate");return}if(!window.Auth?.isPremium()){p=!0;const m=new Date().toISOString().split("T")[0];let r={};try{r=JSON.parse(localStorage.getItem("tarot_free_usage")||"{}")}catch{localStorage.removeItem("tarot_free_usage")}if(r.date===m&&r.count>=1){window.Auth.showToast("Limit vy\u010Derp\xE1n \u{1F512}","Dne\u0161n\xED uk\xE1zka zdarma ji\u017E byla vy\u010Derp\xE1na. Z\xEDskejte Premium pro neomezen\xE9 v\xFDklady.","error"),w(i,"tarot_limit_gate");return}localStorage.setItem("tarot_free_usage",JSON.stringify({date:m,count:1}))}}const g=o.closest(".t-spread-card");g&&!g.classList.contains("featured")&&g.click(),i&&k(i,p)})}),s.querySelectorAll(".tarot-card").forEach(o=>{o.style.cursor="pointer",o.addEventListener("click",()=>{const n=document.querySelector(".t-spread-card.featured .btn"),i=n?n.dataset.spreadType:"Jedna karta";k(i)})})}function h(e){const a=document.createElement("div");return a.textContent=e,a.innerHTML}async function k(e,a=!1){const s=document.querySelector(".tarot-deck");if(!s)return;s.scrollIntoView({behavior:"smooth",block:"center"}),await new Promise(t=>setTimeout(t,300)),s.style.transform="scale(1.05)",s.classList.add("shaking"),await new Promise(t=>setTimeout(t,1500)),s.classList.remove("shaking"),s.style.transform="",await new Promise(t=>setTimeout(t,300));const l=f.filter(t=>v[t].image);let u=1;e==="T\u0159i karty"&&(u=3),e==="Celtic Cross"&&(u=10);const o=[];for(;o.length<u&&o.length<l.length;){const t=l[Math.floor(Math.random()*l.length)];o.includes(t)||o.push(t)}const n=o.map(t=>({name:t,...v[t]})),i=document.getElementById("tarot-results");if(!i)return;const p=u===1?"grid-1":u<=3?`grid-${u}`:"grid-5";i.innerHTML=`
        <div class="text-center">
            <h3 class="mb-lg" style="color: var(--color-mystic-gold);">\u2728 Va\u0161e vylosovan\xE9 karty \u2728</h3>
            <div class="tarot-spread grid ${p}" style="gap: var(--space-lg); margin-bottom: var(--space-xl); max-width: 1200px; margin-left: auto; margin-right: auto;">
                ${n.map((t,c)=>{const d=a&&c>0;return`
                    <div class="tarot-flip-card ${d?"locked-card":""}" data-index="${c}" style="--flip-delay: ${c*.3}s;">
                        <div class="tarot-flip-inner">
                            <div class="tarot-flip-front">
                                <img src="img/tarot-back.webp" alt="Tarot Card Back">
                            </div>
                            <div class="tarot-flip-back ${t.image?"has-image":""}">
                                ${d?`
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
                                    <img src="${t.image}" onerror="this.onerror=null;this.src='img/tarot/tarot_placeholder.webp'" alt="${h(t.name)}" class="tarot-card-image" loading="lazy">
                                `:`
                                    <div class="tarot-card-content">
                                        <span class="tarot-card-emoji">${t.emoji}</span>
                                        <h4 class="tarot-card-name">${h(t.name)}</h4>
                                        <p class="tarot-card-meaning">${h(t.meaning)}</p>
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
    `,i.classList.remove("hidden"),i.querySelectorAll('a[href="cenik.html"]').forEach(t=>{t.addEventListener("click",c=>{c.preventDefault();const d=t.closest(".premium-lock-overlay")?"tarot_locked_card":"tarot_teaser_banner";w(e,d)})}),await new Promise(t=>setTimeout(t,100)),i.scrollIntoView({behavior:"smooth"});const g=i.querySelectorAll(".tarot-flip-card");for(let t=0;t<g.length;t++)await new Promise(c=>setTimeout(c,600)),g[t].classList.add("flipped");await new Promise(t=>setTimeout(t,800));const m=document.getElementById("interpretations-container");let r=n.map((t,c)=>{if(a&&c>0)return"";let d="";e==="T\u0159i karty"?d=["\u{1F4DC} Minulost","\u23F3 P\u0159\xEDtomnost","\u{1F52E} Budoucnost"][c]||"":e==="Celtic Cross"&&(d=["\u{1F3AF} Situace","\u2694\uFE0F V\xFDzva","\u{1F4AB} Podv\u011Bdom\xED","\u{1F3DB}\uFE0F Z\xE1klad","\u{1F305} Minulost","\u{1F52E} Budoucnost","\u{1F9D8} Postoj","\u{1F30D} Vliv okol\xED","\u{1F4AD} Nad\u011Bje/Obavy","\u{1F3C1} V\xFDsledek"][c]||"");const y=Object.keys(v).indexOf(t.name)<22;return window.Templates?window.Templates.renderTarotResult(t,c,y,d):(console.error("Templates library missing"),"")}).join("");if(u>1&&window.Templates&&!a&&(e==="T\u0159i karty"?r+=window.Templates.renderSummary3Card(n):e==="Celtic Cross"?r+=window.Templates.renderSummaryCeltic(n):r+=window.Templates.renderSummaryDefault(n)),m.innerHTML=r,u>1&&!a)setTimeout(()=>L(n,e),500);else if(window.Auth&&window.Auth.saveReading){const t=n.slice(0,a?1:void 0).map((d,y)=>({name:d.name,position:"Jedna karta",meaning:d.meaning})),c=await window.Auth.saveReading("tarot",{spreadType:a?`${e} (Uk\xE1zka)`:e,cards:t});if(c&&c.id){window.currentTarotReadingId=c.id;const d=document.createElement("div");d.className="text-center",d.style.marginTop="var(--space-xl)",d.innerHTML=`
                    <button id="favorite-tarot-btn" class="btn btn--glass" style="min-width: 200px;">
                        <span class="favorite-icon">\u2B50</span> P\u0159idat do obl\xEDben\xFDch
                    </button>
                `,m.appendChild(d),document.getElementById("favorite-tarot-btn").addEventListener("click",async()=>{await toggleFavorite(window.currentTarotReadingId,"favorite-tarot-btn")})}}}async function L(e,a){const s=document.getElementById("ethereal-tarot-summary");if(s)try{const l=e.map((g,m)=>{let r="";return a==="T\u0159i karty"?r=["Minulost","P\u0159\xEDtomnost","Budoucnost"][m]||`Pozice ${m+1}`:a==="Celtic Cross"?r=["Situace","V\xFDzva","Podv\u011Bdom\xED","Z\xE1klad","Minulost","Budoucnost","Postoj","Vliv okol\xED","Nad\u011Bje/Obavy","V\xFDsledek"][m]||`Pozice ${m+1}`:r=`Karta ${m+1}`,{name:g.name,position:r,meaning:g.meaning}}),u=window.location.pathname;let o="cs";u.includes("/sk/")?o="sk":u.includes("/pl/")&&(o="pl");const n=window.getCSRFToken?await window.getCSRFToken():null,p=await(await fetch(`${window.API_CONFIG?.BASE_URL||"/api"}/tarot-summary`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...n&&{"X-CSRF-Token":n}},body:JSON.stringify({spreadType:a,cards:l,lang:o})})).json();if(p.success){const m=p.response.split(`
`).filter(r=>r.trim().length>0).map(r=>`<p class="mb-md">${r}</p>`).join("");if(s.innerHTML=typeof DOMPurify<"u"?DOMPurify.sanitize(m):m,window.Auth&&window.Auth.saveReading){const r=await window.Auth.saveReading("tarot",{spreadType:a,cards:l,response:p.response});if(r&&r.id){window.currentTarotReadingId=r.id;const t=document.createElement("div");t.className="text-center",t.style.marginTop="var(--space-xl)",t.innerHTML=`
                        <button id="favorite-tarot-btn" class="btn btn--glass" style="min-width: 200px;">
                            <span class="favorite-icon">\u2B50</span> P\u0159idat do obl\xEDben\xFDch
                        </button>
                    `,s.parentElement.appendChild(t),document.getElementById("favorite-tarot-btn").addEventListener("click",async()=>{await toggleFavorite(window.currentTarotReadingId,"favorite-tarot-btn")})}}s.parentElement.classList.add("fade-in")}else throw new Error(p.error||"Failed to generate summary")}catch(l){console.error("AI Summary Error:",l),s.innerHTML=`
            <p class="text-center" style="color: var(--color-silver-mist);">
                <em>Hv\u011Bzdy jsou nyn\xED p\u0159\xEDli\u0161 daleko... (Spojen\xED selhalo)</em>
            </p>
        `}}
