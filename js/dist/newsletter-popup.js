(function(){"use strict";const i="mh_newsletter_dismissed";let a=!1;function d(){const t=localStorage.getItem(i);if(!t)return!0;const e=parseInt(t,10);return(Date.now()-e)/(1e3*60*60*24)>=7}function s(){localStorage.setItem(i,Date.now().toString());const t=document.getElementById("mh-newsletter-popup");t&&(t.style.opacity="0",t.style.transform="translate(-50%, -50%) scale(0.95)",setTimeout(()=>t.remove(),400));const e=document.getElementById("mh-popup-overlay");e&&(e.style.opacity="0",setTimeout(()=>e.remove(),400))}async function u(t){const e=document.getElementById("mh-popup-submit"),o=document.getElementById("mh-popup-msg");e.disabled=!0,e.textContent="P\u0159ihla\u0161uji...";try{const n=window.API_CONFIG?.BASE_URL||"/api",c=await(await fetch(`${n}/csrf-token`,{credentials:"include"})).json(),f=c.csrfToken||c.token||"",p=await(await fetch(`${n}/newsletter/subscribe`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json","X-CSRF-Token":f},body:JSON.stringify({email:t,source:"web_popup"})})).json();p.success?(o.textContent="\u{1F31F} Skv\u011Bl\xE9! Brzy v\xE1m p\u0159ijde prvn\xED hv\u011Bzdn\xE1 zpr\xE1va.",o.style.color="#4ade80",setTimeout(s,2500)):(o.textContent=p.error||"Chyba. Zkuste to znovu.",o.style.color="#f87171",e.disabled=!1,e.textContent="Odeb\xEDrat zdarma")}catch{o.textContent="Chyba p\u0159ipojen\xED. Zkuste to znovu.",o.style.color="#f87171",e.disabled=!1,e.textContent="Odeb\xEDrat zdarma"}}function r(){if(a||!d())return;a=!0;const t=document.createElement("div");t.id="mh-popup-overlay",t.style.cssText=`
            position:fixed; inset:0; background:rgba(0,0,0,0.65);
            z-index:9998; opacity:0; transition:opacity 0.4s ease;
            backdrop-filter:blur(4px);
        `,t.addEventListener("click",s);const e=document.createElement("div");e.id="mh-newsletter-popup",e.setAttribute("role","dialog"),e.setAttribute("aria-label","P\u0159ihl\xE1sit se k odb\u011Bru"),e.style.cssText=`
            position:fixed; top:50%; left:50%; z-index:9999;
            transform:translate(-50%, -50%) scale(0.92);
            background:linear-gradient(135deg,#0f0a1f,#1a0a2e);
            border:1px solid rgba(235,192,102,0.35);
            border-radius:24px; padding:2.5rem;
            max-width:440px; width:90%;
            box-shadow:0 30px 80px rgba(0,0,0,0.8), 0 0 60px rgba(235,192,102,0.08);
            opacity:0; transition:opacity 0.4s ease, transform 0.4s ease;
            text-align:center; font-family:'Inter',sans-serif;
        `;const o=(()=>{const n=["\u2648","\u2649","\u264A","\u264B","\u264C","\u264D","\u264E","\u264F","\u2650","\u2651","\u2652","\u2653"],m=new Date().getMonth();return n[m]||"\u2B50"})();e.innerHTML=`
            <button id="mh-popup-close" aria-label="Zav\u0159\xEDt" style="
                position:absolute;top:1rem;right:1rem;background:none;border:none;
                color:rgba(255,255,255,0.5);font-size:1.5rem;cursor:pointer;line-height:1;
                transition:color 0.2s;
            " onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.5)'">\xD7</button>

            <div style="font-size:3rem;margin-bottom:0.5rem;">${o} \u{1F319}</div>
            <h2 style="font-family:'Cinzel',serif;color:#ebc066;font-size:1.5rem;margin:0 0 0.75rem;font-weight:600;">
                Hv\u011Bzdy v\xE1m p\xED\u0161\xED ka\u017Ed\xFD den
            </h2>
            <p style="color:rgba(255,255,255,0.7);line-height:1.6;margin:0 0 1.5rem;font-size:0.95rem;">
                Dost\xE1vejte denn\xED horoskop, v\xFDklad M\u011Bs\xEDce a esoterick\xE9 tipy p\u0159\xEDmo do va\u0161eho emailu. Zcela zdarma.
            </p>

            <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;flex-wrap:wrap;">
                <input id="mh-popup-email" type="email" placeholder="v\xE1\u0161@email.cz"
                    style="
                        flex:1;min-width:0;padding:0.85rem 1.2rem;
                        background:rgba(255,255,255,0.07);
                        border:1px solid rgba(235,192,102,0.3);
                        border-radius:50px;color:#fff;font-size:0.95rem;
                        outline:none;transition:border-color 0.2s;
                    "
                    onfocus="this.style.borderColor='rgba(235,192,102,0.7)'"
                    onblur="this.style.borderColor='rgba(235,192,102,0.3)'"
                />
                <button id="mh-popup-submit" style="
                    padding:0.85rem 1.5rem; white-space:nowrap;
                    background:linear-gradient(135deg,#d4af37,#b8860b);
                    border:none;border-radius:50px;color:#0f0a1f;
                    font-weight:700;font-size:0.95rem;cursor:pointer;
                    transition:transform 0.2s,box-shadow 0.2s;
                "
                onmouseover="this.style.transform='scale(1.04)';this.style.boxShadow='0 0 20px rgba(212,175,55,0.4)'"
                onmouseout="this.style.transform='';this.style.boxShadow=''">
                    Odeb\xEDrat zdarma \u2728
                </button>
            </div>
            <div id="mh-popup-msg" style="font-size:0.85rem;min-height:1.2em;color:rgba(255,255,255,0.5);"></div>
            <p style="font-size:0.75rem;color:rgba(255,255,255,0.3);margin:1rem 0 0;">
                \u017D\xE1dn\xFD spam. Odhl\xE1sit se m\u016F\u017Eete kdykoli jedn\xEDm kliknut\xEDm.
            </p>
        `,document.body.appendChild(t),document.body.appendChild(e),requestAnimationFrame(()=>{requestAnimationFrame(()=>{t.style.opacity="1",e.style.opacity="1",e.style.transform="translate(-50%, -50%) scale(1)"})}),document.getElementById("mh-popup-close").addEventListener("click",s),document.getElementById("mh-popup-submit").addEventListener("click",()=>{const n=document.getElementById("mh-popup-email").value.trim();if(!n){document.getElementById("mh-popup-msg").textContent="Zadejte pros\xEDm emailovou adresu.",document.getElementById("mh-popup-msg").style.color="#f87171";return}u(n)}),document.getElementById("mh-popup-email").addEventListener("keydown",n=>{n.key==="Enter"&&document.getElementById("mh-popup-submit").click()}),e.querySelector("#mh-popup-email").focus()}function l(){if(!d())return;document.addEventListener("mouseleave",e=>{e.clientY<=0&&r()},{passive:!0}),setTimeout(r,45e3);let t=!1;window.addEventListener("scroll",()=>{if(t)return;window.scrollY/(document.body.scrollHeight-window.innerHeight)>.7&&(t=!0,setTimeout(r,2e3))},{passive:!0})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",l):l()})();
