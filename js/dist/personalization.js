function b(e,t){let n;return function(...i){clearTimeout(n),n=setTimeout(()=>e.apply(this,i),t)}}var S={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function c(e){return String(e).replace(/[&<>"']/g,t=>S[t])}var d="1.0",g="mh_user_prefs",a={STORAGE_KEY:g,STORAGE_VERSION:d,get(){try{let e=JSON.parse(localStorage.getItem(g))||{};return e.version||(e.version=d),e}catch{return{version:d}}},set(e){let n={...this.get(),...e,version:d};localStorage.setItem(g,JSON.stringify(n))},getSign(){return this.get().sign||null},getName(){return this.get().name||null},setSign(e){this.set({sign:e,signSetAt:Date.now()})},setName(e){this.set({name:e})}};window.MH_PERSONALIZATION=a;function h(){return document.cookie.split(";").some(t=>t.trim()==="logged_in=1")?window.Auth?.isLoggedIn?.()??!0:!1}var o={beran:{label:"Beran",emoji:"\u2648",dates:"21. 3. \u2013 19. 4."},byk:{label:"B\xFDk",emoji:"\u2649",dates:"20. 4. \u2013 20. 5."},blizenci:{label:"Bl\xED\u017Eenci",emoji:"\u264A",dates:"21. 5. \u2013 20. 6."},rak:{label:"Rak",emoji:"\u264B",dates:"21. 6. \u2013 22. 7."},lev:{label:"Lev",emoji:"\u264C",dates:"23. 7. \u2013 22. 8."},panna:{label:"Panna",emoji:"\u264D",dates:"23. 8. \u2013 22. 9."},vahy:{label:"V\xE1hy",emoji:"\u264E",dates:"23. 9. \u2013 22. 10."},stir:{label:"\u0160t\xEDr",emoji:"\u264F",dates:"23. 10. \u2013 21. 11."},strelec:{label:"St\u0159elec",emoji:"\u2650",dates:"22. 11. \u2013 21. 12."},kozoroh:{label:"Kozoroh",emoji:"\u2651",dates:"22. 12. \u2013 19. 1."},vodnar:{label:"Vodn\xE1\u0159",emoji:"\u2652",dates:"20. 1. \u2013 18. 2."},ryby:{label:"Ryby",emoji:"\u2653",dates:"19. 2. \u2013 20. 3."}};window.SIGNS_CZ=o;function f(){let e=document.getElementById("personalized-greeting");if(!e)return;if(!h()||!window.Auth?.user){e.classList.remove("personalized-greeting--visible"),e.setAttribute("aria-hidden","true"),e.removeAttribute("href"),e.textContent="";return}let t=a.getSign(),n=a.getName();if(t&&o[t]){let i=o[t],r=new Date().getHours(),l=r<12?"Dobr\xE9 r\xE1no":r<18?"Dobr\xFD den":"Dobr\xFD ve\u010Der",s=n?`, ${c(n)}`:"",k=`${i.emoji}\uFE0E`;e.innerHTML=`
            <span class="greeting-icon" aria-hidden="true">${k}</span>
            <span class="greeting-text">${l}${s}! Tv\u016Fj dne\u0161n\xED v\xFDhled pro ${i.label} \u2192</span>
        `,e.href=`horoskopy.html#${t}`,e.setAttribute("aria-hidden","false"),e.classList.add("personalized-greeting--visible")}else e.classList.remove("personalized-greeting--visible"),e.setAttribute("aria-hidden","true"),e.removeAttribute("href"),e.textContent=""}function m(){if(!h()){document.querySelectorAll(".zodiac-card").forEach(n=>{n.classList.remove("zodiac-card--highlighted"),n.querySelector(".zodiac-card__badge")?.remove()});return}let e=a.getSign();if(!e)return;document.querySelectorAll(".zodiac-card").forEach(n=>{let i=n.getAttribute("href"),r=i?i.substring(1):null,l=n.querySelector(".zodiac-card__badge");if(l&&l.remove(),r===e&&o[r]){n.classList.add("zodiac-card--highlighted");let s=document.createElement("span");s.className="zodiac-card__badge",s.textContent="Tvoje znamen\xED",n.appendChild(s),window.location.hash===`#${e}`&&requestAnimationFrame(()=>{n.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"})})}else n.classList.remove("zodiac-card--highlighted")})}var _=b(e=>{a.setSign(e),m(),p()},100);function y(e){let t=a.getSign();if(e.className="sign-picker",t&&o[t]){let n=o[t];e.innerHTML=`
            <div class="sign-picker__header">
                <span class="sign-picker__label">Tvoje znamen\xED:</span>
                <button id="sign-picker-toggle"
                    class="sign-picker__button"
                    aria-expanded="false"
                    aria-controls="sign-picker-expanded"
                    data-action="toggle-expanded"
                    title="Zobrazit/skr\xFDt v\u0161echna znamen\xED">
                    ${c(n.label)}
                </button>
                <button class="sign-picker__change-btn"
                    data-action="toggle-expanded"
                    title="Zm\u011Bnit znamen\xED"><svg class="mh-symbol mh-symbol--inline" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#pen"></use></svg> Zm\u011Bnit</button>
            </div>
            <div id="sign-picker-expanded" class="sign-picker__expanded" role="region" aria-label="V\xFDb\u011Br znamen\xED">
                ${Object.entries(o).map(([i,r])=>`
                    <button class="sign-picker__sign-btn ${t===i?"active":""}"
                        data-pick="${i}"
                        data-action="pick-sign"
                        title="${r.dates}"
                        aria-pressed="${t===i?"true":"false"}">
                        ${c(r.label)}
                    </button>
                `).join("")}
            </div>
        `}else e.innerHTML=`
            <div class="sign-picker__header">
                <span class="sign-picker__label">Tvoje znamen\xED:</span>
            </div>
            <div id="sign-picker-expanded" class="sign-picker__expanded active" role="region" aria-label="V\xFDb\u011Br znamen\xED">
                ${Object.entries(o).map(([n,i])=>`
                    <button class="sign-picker__sign-btn"
                        data-pick="${n}"
                        data-action="pick-sign"
                        title="${i.dates}">
                        ${c(i.label)}
                    </button>
                `).join("")}
            </div>
        `}function u(e){let t=document.getElementById("mh-sign-picker");if(!t)return;let n=e.target.closest("[data-action]")?.dataset.action,i=e.target.closest("[data-pick]");if(n==="toggle-expanded")e.preventDefault(),z(t);else if(i){e.preventDefault();let r=i.dataset.pick;r&&o[r]&&_(r)}}function p(){let e=document.getElementById("mh-sign-picker");if(e){if(!h()){e.hidden=!0,e.replaceChildren(),e.removeEventListener("click",u);return}e.hidden=!1,y(e),e.removeEventListener("click",u),e.addEventListener("click",u)}}function z(e){let t=e.querySelector("#sign-picker-expanded"),n=e.querySelector("#sign-picker-toggle");t&&(t.classList.toggle("active"),n&&n.setAttribute("aria-expanded",t.classList.contains("active")?"true":"false"))}function v(){f(),document.addEventListener("auth:changed",()=>{f(),p(),m()}),document.getElementById("mh-sign-picker")&&p(),document.querySelectorAll(".zodiac-card").length>0&&m()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",v,{once:!0}):v();
