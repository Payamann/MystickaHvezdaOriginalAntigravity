(()=>{(function(){"use strict";const p="mh_newsletter_dismissed",i="mh_newsletter_popup_shown",h="mh_exit_shown",g=["/prihlaseni","/onboarding","/profil"];let a=!1;function m(){if(g.some(s=>window.location.pathname.includes(s))||sessionStorage.getItem(h)||sessionStorage.getItem(i)||document.getElementById("exit-intent-modal")||document.querySelector(".paywall-overlay")||document.getElementById("mh-newsletter-popup")||document.getElementById("mh-popup-overlay"))return!1;const t=localStorage.getItem(p);if(!t)return!0;const e=parseInt(t,10);return(Date.now()-e)/(1e3*60*60*24)>=7}function n(){localStorage.setItem(p,Date.now().toString());const t=document.getElementById("mh-newsletter-popup");t&&(t.classList.add("is-closing"),setTimeout(()=>t.remove(),400));const e=document.getElementById("mh-popup-overlay");e&&(e.classList.add("is-closing"),setTimeout(()=>e.remove(),400))}async function f(t){const e=document.getElementById("mh-popup-submit"),o=document.getElementById("mh-popup-msg");e.disabled=!0,e.textContent="P\u0159ihla\u0161uji...";try{const s=window.API_CONFIG?.BASE_URL||"/api",l=await(await fetch(`${s}/csrf-token`,{credentials:"include"})).json(),v=l.csrfToken||l.token||"",c=await(await fetch(`${s}/newsletter/subscribe`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json","X-CSRF-Token":v},body:JSON.stringify({email:t,source:"web_popup"})})).json();c.success?(o.textContent="\u{1F31F} Skv\u011Bl\xE9! Brzy v\xE1m p\u0159ijde prvn\xED hv\u011Bzdn\xE1 zpr\xE1va.",o.className="mh-popup-msg mh-popup-msg--success",setTimeout(n,2500)):(o.textContent=c.error||"Chyba. Zkuste to znovu.",o.className="mh-popup-msg mh-popup-msg--error",e.disabled=!1,e.textContent="Odeb\xEDrat zdarma")}catch{o.textContent="Chyba p\u0159ipojen\xED. Zkuste to znovu.",o.className="mh-popup-msg mh-popup-msg--error",e.disabled=!1,e.textContent="Odeb\xEDrat zdarma"}}function d(){if(a||!m())return;a=!0,sessionStorage.setItem(i,"1");const t=document.createElement("div");t.id="mh-popup-overlay",t.className="mh-popup-overlay",t.addEventListener("click",n);const e=document.createElement("div");e.id="mh-newsletter-popup",e.className="mh-newsletter-popup",e.setAttribute("role","dialog"),e.setAttribute("aria-label","P\u0159ihl\xE1sit se k odb\u011Bru");const o=(()=>{const s=["\u2648","\u2649","\u264A","\u264B","\u264C","\u264D","\u264E","\u264F","\u2650","\u2651","\u2652","\u2653"],u=new Date().getMonth();return s[u]||"\u2B50"})();e.innerHTML=`
            <button id="mh-popup-close" class="mh-popup-close" aria-label="Zav\u0159\xEDt">\xD7</button>

            <div class="mh-popup-icon">${o} \u{1F319}</div>
            <h2 class="mh-popup-title">
                Hv\u011Bzdy v\xE1m p\xED\u0161\xED ka\u017Ed\xFD den
            </h2>
            <p class="mh-popup-text">
                Dost\xE1vejte denn\xED horoskop, v\xFDklad M\u011Bs\xEDce a esoterick\xE9 tipy p\u0159\xEDmo do va\u0161eho emailu. Zcela zdarma.
            </p>

            <div class="mh-popup-form">
                <input id="mh-popup-email" type="email" placeholder="v\xE1\u0161@email.cz"
                    class="mh-popup-email"
                />
                <button id="mh-popup-submit" class="mh-popup-submit">
                    Odeb\xEDrat zdarma \u2728
                </button>
            </div>
            <div id="mh-popup-msg" class="mh-popup-msg"></div>
            <p class="mh-popup-fineprint">
                \u017D\xE1dn\xFD spam. Odhl\xE1sit se m\u016F\u017Eete kdykoli jedn\xEDm kliknut\xEDm.
            </p>
        `,document.body.appendChild(t),document.body.appendChild(e),requestAnimationFrame(()=>{requestAnimationFrame(()=>{t.classList.add("is-visible"),e.classList.add("is-visible")})}),document.getElementById("mh-popup-close").addEventListener("click",n),document.getElementById("mh-popup-submit").addEventListener("click",()=>{const s=document.getElementById("mh-popup-email").value.trim();if(!s){document.getElementById("mh-popup-msg").textContent="Zadejte pros\xEDm emailovou adresu.",document.getElementById("mh-popup-msg").className="mh-popup-msg mh-popup-msg--error";return}f(s)}),document.getElementById("mh-popup-email").addEventListener("keydown",s=>{s.key==="Enter"&&document.getElementById("mh-popup-submit").click()}),window.matchMedia("(pointer: coarse)").matches||e.querySelector("#mh-popup-email").focus({preventScroll:!0})}function r(){m()&&(document.addEventListener("mouseleave",t=>{t.clientY<=0&&d()},{passive:!0}),setTimeout(d,45e3))}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r):r()})();})();
