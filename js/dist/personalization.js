import{sanitizeText as l,debounce as k}from"./utils/helpers.js";const d="1.0",g="mh_user_prefs",c={STORAGE_KEY:g,STORAGE_VERSION:d,get(){try{const e=JSON.parse(localStorage.getItem(g))||{};return e.version||(e.version=d),e}catch{return{version:d}}},set(e){const n={...this.get(),...e,version:d};localStorage.setItem(g,JSON.stringify(n))},getSign(){return this.get().sign||null},getName(){return this.get().name||null},setSign(e){this.set({sign:e,signSetAt:Date.now()})},setName(e){this.set({name:e})}};window.MH_PERSONALIZATION=c;const s={beran:{label:"Beran",emoji:"\u2648",dates:"21. 3. \u2013 19. 4."},byk:{label:"B\xFDk",emoji:"\u2649",dates:"20. 4. \u2013 20. 5."},blizenci:{label:"Bl\xED\u017Eenci",emoji:"\u264A",dates:"21. 5. \u2013 20. 6."},rak:{label:"Rak",emoji:"\u264B",dates:"21. 6. \u2013 22. 7."},lev:{label:"Lev",emoji:"\u264C",dates:"23. 7. \u2013 22. 8."},panna:{label:"Panna",emoji:"\u264D",dates:"23. 8. \u2013 22. 9."},vahy:{label:"V\xE1hy",emoji:"\u264E",dates:"23. 9. \u2013 22. 10."},stir:{label:"\u0160t\xEDr",emoji:"\u264F",dates:"23. 10. \u2013 21. 11."},strelec:{label:"St\u0159elec",emoji:"\u2650",dates:"22. 11. \u2013 21. 12."},kozoroh:{label:"Kozoroh",emoji:"\u2651",dates:"22. 12. \u2013 19. 1."},vodnar:{label:"Vodn\xE1\u0159",emoji:"\u2652",dates:"20. 1. \u2013 18. 2."},ryby:{label:"Ryby",emoji:"\u2653",dates:"19. 2. \u2013 20. 3."}};window.SIGNS_CZ=s;function _(){const e=document.getElementById("personalized-greeting");if(!e)return;const t=c.getSign(),n=c.getName();if(t&&s[t]){const a=s[t],i=new Date().getHours(),r=i<12?"Dobr\xE9 r\xE1no":i<18?"Dobr\xFD den":"Dobr\xFD ve\u010Der",o=n?`, ${l(n)}`:"";e.innerHTML=`
            <span class="greeting-icon">${a.emoji}</span>
            <span class="greeting-text">${r}${o}! V\xE1\u0161 dne\u0161n\xED v\xFDhled pro ${a.label} \u2192</span>
        `,e.href=`horoskopy.html#${t}`,e.classList.add("personalized-greeting--visible")}}function m(){const e=c.getSign();if(!e)return;document.querySelectorAll(".zodiac-card").forEach(n=>{const a=n.getAttribute("href"),i=a?a.substring(1):null,r=n.querySelector(".zodiac-card__badge");if(r&&r.remove(),i===e&&s[i]){n.classList.add("zodiac-card--highlighted");const o=document.createElement("span");o.className="zodiac-card__badge",o.textContent="Va\u0161e znamen\xED",n.appendChild(o),window.location.hash===`#${e}`&&requestAnimationFrame(()=>{n.scrollIntoView({behavior:"smooth",block:"center"})})}else n.classList.remove("zodiac-card--highlighted")})}const h=k(e=>{c.setSign(e),m(),p()},100);function b(e){const t=c.getSign();if(e.className="sign-picker",t&&s[t]){const n=s[t];e.innerHTML=`
            <div class="sign-picker__header">
                <span class="sign-picker__label">Va\u0161e znamen\xED:</span>
                <button id="sign-picker-toggle"
                    class="sign-picker__button"
                    aria-expanded="false"
                    aria-controls="sign-picker-expanded"
                    data-action="toggle-expanded"
                    title="Zobrazit/skr\xFDt v\u0161echna znamen\xED">
                    ${l(n.label)}
                </button>
                <button class="sign-picker__change-btn"
                    data-action="toggle-expanded"
                    title="Zm\u011Bnit znamen\xED">\u270E Zm\u011Bnit</button>
            </div>
            <div id="sign-picker-expanded" class="sign-picker__expanded" role="region" aria-label="V\xFDb\u011Br znamen\xED">
                ${Object.entries(s).map(([a,i])=>`
                    <button class="sign-picker__sign-btn ${t===a?"active":""}"
                        data-pick="${a}"
                        data-action="pick-sign"
                        title="${i.dates}"
                        aria-pressed="${t===a?"true":"false"}">
                        ${l(i.label)}
                    </button>
                `).join("")}
            </div>
        `}else e.innerHTML=`
            <div class="sign-picker__header">
                <span class="sign-picker__label">Va\u0161e znamen\xED:</span>
            </div>
            <div id="sign-picker-expanded" class="sign-picker__expanded active" role="region" aria-label="V\xFDb\u011Br znamen\xED">
                ${Object.entries(s).map(([n,a])=>`
                    <button class="sign-picker__sign-btn"
                        data-pick="${n}"
                        data-action="pick-sign"
                        title="${a.dates}">
                        ${l(a.label)}
                    </button>
                `).join("")}
            </div>
        `}function S(e){const t=document.getElementById("mh-sign-picker");if(!t)return;const n=e.target.closest("[data-action]")?.dataset.action,a=e.target.closest("[data-pick]");if(n==="toggle-expanded")e.preventDefault(),E(t);else if(a){e.preventDefault();const i=a.dataset.pick;i&&s[i]&&h(i)}}function p(){const e=document.getElementById("mh-sign-picker");e&&(b(e),e.removeEventListener("click",S),e.addEventListener("click",S))}function E(e){const t=e.querySelector("#sign-picker-expanded"),n=e.querySelector("#sign-picker-toggle");t&&(t.classList.toggle("active"),n&&n.setAttribute("aria-expanded",t.classList.contains("active")?"true":"false"))}const u={STORAGE_KEY_STREAK:"mh_horoscope_streak",STORAGE_KEY_LAST_DATE:"mh_last_horoscope_date",STORAGE_KEY_BEST_STREAK:"mh_best_horoscope_streak",getStreak(){return parseInt(localStorage.getItem(this.STORAGE_KEY_STREAK)||"0")},getBestStreak(){return parseInt(localStorage.getItem(this.STORAGE_KEY_BEST_STREAK)||"0")},incrementStreak(){try{const e=new Date().toDateString(),t=localStorage.getItem(this.STORAGE_KEY_LAST_DATE);if(t===e)return this.getStreak();const n=new Date(Date.now()-864e5).toDateString();if(t!==n&&t!==null)localStorage.setItem(this.STORAGE_KEY_STREAK,"1");else{const r=this.getStreak()+1;localStorage.setItem(this.STORAGE_KEY_STREAK,r);const o=this.getBestStreak();r>o&&localStorage.setItem(this.STORAGE_KEY_BEST_STREAK,r)}return localStorage.setItem(this.STORAGE_KEY_LAST_DATE,e),this.getStreak()}catch(e){return console.warn("Streak tracking failed:",e),0}},resetStreak(){localStorage.removeItem(this.STORAGE_KEY_LAST_DATE)},displayStreak(){const e=this.getStreak();if(e<1)return;let t=document.getElementById("mh-streak-badge");t||(t=document.createElement("div"),t.id="mh-streak-badge",t.className="mh-streak-badge",document.body.insertBefore(t,document.body.firstChild));let n="\u{1F525}",a=!1;e%30===0?(n="\u{1F31F}",a=!0):e%7===0&&(n="\u2B50",a=!0),t.innerHTML=`${n} ${e} day streak!`,t.className="mh-streak-badge"+(a?" mh-streak-badge--milestone":""),t.style.animation="none",setTimeout(()=>{t.style.animation="mh-streak-bounce 0.5s ease-in-out"},10),setTimeout(()=>{t.style.opacity="0",t.style.transition="opacity 0.3s ease-out"},5e3)}};window.MH_STREAK=u,document.addEventListener("DOMContentLoaded",()=>{_(),document.getElementById("mh-sign-picker")&&p(),document.querySelectorAll(".zodiac-card").length>0&&m();const n=document.getElementById("personalized-greeting");n&&n.classList.contains("personalized-greeting--visible")&&n.addEventListener("click",()=>{u.incrementStreak()})});
