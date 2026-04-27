(()=>{let g={},w=[];function _(e){return e==="Celtic Cross"?"vip-majestrat":"pruvodce"}function h(e,a="tarot_inline_upsell"){const r=_(e),n=new URL("/cenik.html",window.location.origin);return n.searchParams.set("plan",r),n.searchParams.set("source",a),n.searchParams.set("feature",e==="Celtic Cross"?"tarot_celtic_cross":"tarot_multi_card"),`${n.pathname}${n.search}`}function k(e,a="tarot_inline_upsell"){const r=_(e);if(window.MH_ANALYTICS?.trackCTA?.(a,{plan_id:r,spread_type:e}),window.Auth?.startPlanCheckout){window.Auth.startPlanCheckout(r,{source:a,feature:e==="Celtic Cross"?"tarot_celtic_cross":"tarot_multi_card",redirect:"/cenik.html",authMode:window.Auth?.isLoggedIn?.()?"login":"register"});return}window.location.href=h(e,a)}function C(e){e.querySelectorAll(".tarot-card-image").forEach(a=>{a.addEventListener("error",()=>{a.dataset.fallbackApplied!=="1"&&(a.dataset.fallbackApplied="1",a.src="/img/tarot/tarot_placeholder.webp")})})}document.addEventListener("DOMContentLoaded",async()=>{await L(),T()});async function L(){try{const e=await fetch("/data/tarot-cards.json?v=2");if(!e.ok)throw new Error("Failed to load tarot data");g=await e.json(),w=Object.keys(g),window.MH_DEBUG&&console.debug("Tarot data loaded:",w.length,"cards")}catch(e){console.error("CRITICAL: Failed to load tarot cards:",e);const a=document.querySelector(".tarot-deck");a&&(a.innerHTML='<div class="text-center tarot-load-error">Nepoda\u0159ilo se na\u010D\xEDst data karet. Zkontrolujte p\u0159ipojen\xED.</div>')}}function T(){const e=document.querySelectorAll(".spread-trigger"),a=document.querySelectorAll(".t-spread-card"),r=document.querySelector(".tarot-deck");if(!r)return;let n=document.getElementById("tarot-results");if(!n){n=document.createElement("div"),n.id="tarot-results",n.className="container hidden tarot-results";const o=r.closest(".section");o?o.after(n):document.body.appendChild(n)}a.forEach(o=>{o.addEventListener("click",()=>{a.forEach(c=>{c.classList.remove("featured");const p=c.querySelector(".btn");p&&(p.classList.remove("btn--primary"),p.classList.add("btn--glass"))}),o.classList.add("featured");const i=o.querySelector(".btn");i&&(i.classList.remove("btn--glass"),i.classList.add("btn--primary"))})}),e.forEach(o=>{o.addEventListener("click",i=>{i.preventDefault(),i.stopPropagation();const c=o.dataset.spreadType;let p=!1;if(c!=="Jedna karta"){if(!window.Auth||!window.Auth.isLoggedIn()){window.Auth?.showToast("P\u0159ihl\xE1\u0161en\xED vy\u017Eadov\xE1no","Pro vstup do Hv\u011Bzdn\xE9ho Pr\u016Fvodce se pros\xEDm p\u0159ihlaste.","info"),k(c,"tarot_auth_gate");return}if(!window.Auth?.isPremium()){p=!0;const u=new Date().toISOString().split("T")[0];let s={};try{s=JSON.parse(localStorage.getItem("tarot_free_usage")||"{}")}catch{localStorage.removeItem("tarot_free_usage")}if(s.date===u&&s.count>=1){window.Auth.showToast("Limit vy\u010Derp\xE1n \u{1F512}","Dne\u0161n\xED uk\xE1zka zdarma ji\u017E byla vy\u010Derp\xE1na. Z\xEDskejte Premium pro neomezen\xE9 v\xFDklady.","error"),k(c,"tarot_limit_gate");return}localStorage.setItem("tarot_free_usage",JSON.stringify({date:u,count:1}))}}const f=o.closest(".t-spread-card");f&&!f.classList.contains("featured")&&f.click(),c&&y(c,p)})}),r.querySelectorAll(".tarot-card").forEach(o=>{o.classList.add("tarot-card--clickable"),o.addEventListener("click",()=>{const i=document.querySelector(".t-spread-card.featured .btn"),c=i?i.dataset.spreadType:"Jedna karta";y(c)})})}function v(e){const a=document.createElement("div");return a.textContent=e,a.innerHTML}async function y(e,a=!1){const r=document.querySelector(".tarot-deck");if(!r)return;r.scrollIntoView({behavior:"smooth",block:"center"}),await new Promise(t=>setTimeout(t,300)),r.classList.add("tarot-deck--shuffle-scale"),r.classList.add("shaking"),await new Promise(t=>setTimeout(t,1500)),r.classList.remove("shaking"),r.classList.remove("tarot-deck--shuffle-scale"),await new Promise(t=>setTimeout(t,300));const n=w.filter(t=>g[t].image);let m=1;e==="T\u0159i karty"&&(m=3),e==="Celtic Cross"&&(m=10);const o=[];for(;o.length<m&&o.length<n.length;){const t=n[Math.floor(Math.random()*n.length)];o.includes(t)||o.push(t)}const i=o.map(t=>({name:t,...g[t]})),c=document.getElementById("tarot-results");if(!c)return;const p=m===1?"grid-1":m<=3?`grid-${m}`:"grid-5";c.innerHTML=`
        <div class="text-center">
            <h3 class="mb-lg tarot-results__title">\u2728 Va\u0161e vylosovan\xE9 karty \u2728</h3>
            <div class="tarot-spread grid ${p} tarot-results__spread">
                ${i.map((t,l)=>{const d=a&&l>0;return`
                    <div class="tarot-flip-card ${d?"locked-card":""}" data-index="${l}">
                        <div class="tarot-flip-inner">
                            <div class="tarot-flip-front">
                                <img src="img/tarot-back.webp" alt="Tarot Card Back">
                            </div>
                            <div class="tarot-flip-back ${t.image?"has-image":""}">
                                ${d?`
                                    <div class="premium-lock-overlay tarot-card-lock">
                                        <div class="lock-icon tarot-card-lock__icon">\u{1F512}</div>
                                        <h2 class="tarot-card-lock__title">Pouze pro Premium</h2>
                                        <p class="tarot-card-lock__copy">
                                            Hv\u011Bzdn\xFD Pr\u016Fvodce je exkluzivn\xED zdroj moudrosti pro na\u0161e p\u0159edplatitele.<br>
                                            Odemkn\u011Bte pln\xFD potenci\xE1l a z\xEDskejte p\u0159\xEDstup ke v\u0161em v\xFDklad\u016Fm.
                                        </p>
                                        <a href="${h(e,"tarot_locked_card")}" class="btn btn--primary tarot-upgrade-btn">Z\xEDskat Premium</a>
                                    </div>
                                    <img src="img/tarot-back.webp" class="tarot-card-image--locked" alt="Locked">
                                `:t.image?`
                                    <img src="${t.image}" alt="${v(t.name)}" class="tarot-card-image" loading="lazy">
                                `:`
                                    <div class="tarot-card-content">
                                        <span class="tarot-card-emoji">${t.emoji}</span>
                                        <h4 class="tarot-card-name">${v(t.name)}</h4>
                                        <p class="tarot-card-meaning">${v(t.meaning)}</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                `}).join("")}
            </div>
            <div id="interpretations-container" class="tarot-interpretations"></div>
             ${a?`
                <div class="text-center mt-xl p-lg tarot-soft-gate">
                    <h3 class="tarot-soft-gate__title">Odemkn\u011Bte sv\u016Fj osud</h3>
                    <p class="mb-lg">Pr\xE1v\u011B jste nahl\xE9dli za oponu. Zb\xFDvaj\xEDc\xEDch ${m-1} karet skr\xFDv\xE1 kl\xED\u010D k pochopen\xED cel\xE9 situace.</p>
                    <a href="${h(e,"tarot_teaser_banner")}" class="btn btn--primary tarot-upgrade-btn">Z\xEDskat Premium a odhalit v\u0161e</a>
                </div>
            `:""}
        </div>
    `,c.classList.remove("hidden"),C(c),c.querySelectorAll(".tarot-upgrade-btn").forEach(t=>{t.addEventListener("click",l=>{l.preventDefault();const d=t.closest(".premium-lock-overlay")?"tarot_locked_card":"tarot_teaser_banner";k(e,d)})}),await new Promise(t=>setTimeout(t,100)),c.scrollIntoView({behavior:"smooth"});const f=c.querySelectorAll(".tarot-flip-card");for(let t=0;t<f.length;t++)await new Promise(l=>setTimeout(l,600)),f[t].classList.add("flipped");await new Promise(t=>setTimeout(t,800));const u=document.getElementById("interpretations-container");let s=i.map((t,l)=>{if(a&&l>0)return"";let d="";e==="T\u0159i karty"?d=["\u{1F4DC} Minulost","\u23F3 P\u0159\xEDtomnost","\u{1F52E} Budoucnost"][l]||"":e==="Celtic Cross"&&(d=["\u{1F3AF} Situace","\u2694\uFE0F V\xFDzva","\u{1F4AB} Podv\u011Bdom\xED","\u{1F3DB}\uFE0F Z\xE1klad","\u{1F305} Minulost","\u{1F52E} Budoucnost","\u{1F9D8} Postoj","\u{1F30D} Vliv okol\xED","\u{1F4AD} Nad\u011Bje/Obavy","\u{1F3C1} V\xFDsledek"][l]||"");const b=Object.keys(g).indexOf(t.name)<22;return window.Templates?window.Templates.renderTarotResult(t,l,b,d):(console.error("Templates library missing"),"")}).join("");if(m>1&&window.Templates&&!a&&(e==="T\u0159i karty"?s+=window.Templates.renderSummary3Card(i):e==="Celtic Cross"?s+=window.Templates.renderSummaryCeltic(i):s+=window.Templates.renderSummaryDefault(i)),u.innerHTML=s,m>1&&!a)setTimeout(()=>P(i,e),500);else if(window.Auth&&window.Auth.saveReading){const t=i.slice(0,a?1:void 0).map((d,b)=>({name:d.name,position:"Jedna karta",meaning:d.meaning})),l=await window.Auth.saveReading("tarot",{spreadType:a?`${e} (Uk\xE1zka)`:e,cards:t});if(l&&l.id){window.currentTarotReadingId=l.id;const d=document.createElement("div");d.className="text-center favorite-reading-action",d.innerHTML=`
                    <button id="favorite-tarot-btn" class="btn btn--glass favorite-reading-action__button">
                        <span class="favorite-icon">\u2B50</span> P\u0159idat do obl\xEDben\xFDch
                    </button>
                `,u.appendChild(d),document.getElementById("favorite-tarot-btn").addEventListener("click",async()=>{await toggleFavorite(window.currentTarotReadingId,"favorite-tarot-btn")})}}}async function P(e,a){const r=document.getElementById("ethereal-tarot-summary");if(r)try{const n=e.map((f,u)=>{let s="";return a==="T\u0159i karty"?s=["Minulost","P\u0159\xEDtomnost","Budoucnost"][u]||`Pozice ${u+1}`:a==="Celtic Cross"?s=["Situace","V\xFDzva","Podv\u011Bdom\xED","Z\xE1klad","Minulost","Budoucnost","Postoj","Vliv okol\xED","Nad\u011Bje/Obavy","V\xFDsledek"][u]||`Pozice ${u+1}`:s=`Karta ${u+1}`,{name:f.name,position:s,meaning:f.meaning}}),m=window.location.pathname;let o="cs";m.includes("/sk/")?o="sk":m.includes("/pl/")&&(o="pl");const i=window.getCSRFToken?await window.getCSRFToken():null,p=await(await fetch(`${window.API_CONFIG?.BASE_URL||"/api"}/tarot-summary`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...i&&{"X-CSRF-Token":i}},body:JSON.stringify({spreadType:a,cards:n,lang:o})})).json();if(p.success){const u=p.response.split(`
`).filter(s=>s.trim().length>0).map(s=>`<p class="mb-md">${s}</p>`).join("");if(r.innerHTML=typeof DOMPurify<"u"?DOMPurify.sanitize(u):u,window.Auth&&window.Auth.saveReading){const s=await window.Auth.saveReading("tarot",{spreadType:a,cards:n,response:p.response});if(s&&s.id){window.currentTarotReadingId=s.id;const t=document.createElement("div");t.className="text-center favorite-reading-action",t.innerHTML=`
                        <button id="favorite-tarot-btn" class="btn btn--glass favorite-reading-action__button">
                            <span class="favorite-icon">\u2B50</span> P\u0159idat do obl\xEDben\xFDch
                        </button>
                    `,r.parentElement.appendChild(t),document.getElementById("favorite-tarot-btn").addEventListener("click",async()=>{await toggleFavorite(window.currentTarotReadingId,"favorite-tarot-btn")})}}r.parentElement.classList.add("fade-in")}else throw new Error(p.error||"Failed to generate summary")}catch(n){console.error("AI Summary Error:",n),r.innerHTML=`
            <p class="text-center tarot-summary-error">
                <em>Hv\u011Bzdy jsou nyn\xED p\u0159\xEDli\u0161 daleko... (Spojen\xED selhalo)</em>
            </p>
        `}}})();
