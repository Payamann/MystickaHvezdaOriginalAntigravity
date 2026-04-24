(function(){"use strict";const a="mh_visit_count",n="mh_push_subscribed";if(!("serviceWorker"in navigator)||!("PushManager"in window))return;function l(){return parseInt(localStorage.getItem(a)||"0",10)}function u(){const t=l()+1;return localStorage.setItem(a,t),t}async function d(){try{if(await Notification.requestPermission()!=="granted")return localStorage.setItem(n,"denied"),!1;const e=await navigator.serviceWorker.ready;let o;try{o=await e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:m(window.VAPID_PUBLIC_KEY||"BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBrqLHy9-Ndgo292mkiw")})}catch{return localStorage.setItem(n,"intent"),!0}const r=window.API_CONFIG?.BASE_URL||"/api",i=window.getCSRFToken?await window.getCSRFToken():null;return await fetch(`${r}/push/subscribe`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...i&&{"X-CSRF-Token":i}},body:JSON.stringify({subscription:o})}),localStorage.setItem(n,"active"),!0}catch(t){return console.warn("[Push] Subscription failed:",t),!1}}function m(t){const e="=".repeat((4-t.length%4)%4),o=(t+e).replace(/-/g,"+").replace(/_/g,"/"),r=atob(o);return new Uint8Array([...r].map(i=>i.charCodeAt(0)))}function c(){const t=localStorage.getItem(n);if(t==="active"||t==="denied")return;const e=document.createElement("div");e.id="mh-push-banner",e.style.cssText=`
            position:fixed; bottom:1.5rem; left:50%; transform:translateX(-50%);
            z-index:8888; background:linear-gradient(135deg,#1a0a2e,#0f0a1f);
            border:1px solid rgba(235,192,102,0.3); border-radius:16px;
            padding:1rem 1.5rem; max-width:420px; width:90%;
            box-shadow:0 20px 60px rgba(0,0,0,0.7);
            display:flex; align-items:center; gap:1rem;
            animation:slideUp 0.4s ease;
            font-family:'Inter',sans-serif;
        `;const o=window.MH_PERSONALIZATION?.getSign(),r=o&&window.SIGNS_CZ?.[o]?`pro ${window.SIGNS_CZ[o].label}`:"";e.innerHTML=`
            <div style="font-size:2rem; flex-shrink:0;">\u{1F514}</div>
            <div style="flex:1; min-width:0;">
                <div style="color:#ebc066; font-weight:600; font-size:0.9rem; margin-bottom:0.2rem;">
                    Denn\xED horoskop ${r} do notifikac\xED?
                </div>
                <div style="color:rgba(255,255,255,0.5); font-size:0.78rem;">
                    Ka\u017Ed\xFD den r\xE1no v 8:00 \u2013 bez emailu
                </div>
            </div>
            <div style="display:flex; gap:0.5rem; flex-shrink:0;">
                <button id="mh-push-yes" style="
                    padding:0.5rem 1rem; background:linear-gradient(135deg,#d4af37,#b8860b);
                    border:none; border-radius:50px; color:#0f0a1f;
                    font-weight:700; font-size:0.83rem; cursor:pointer; white-space:nowrap;
                ">Zapnout</button>
                <button id="mh-push-no" style="
                    padding:0.5rem 0.7rem; background:none;
                    border:1px solid rgba(255,255,255,0.15); border-radius:50px;
                    color:rgba(255,255,255,0.4); font-size:0.78rem; cursor:pointer;
                ">Ne</button>
            </div>
        `;const i=document.createElement("style");i.textContent="@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}",document.head.appendChild(i),document.body.appendChild(e),document.getElementById("mh-push-yes").addEventListener("click",async()=>{if(e.remove(),await d()){const s=document.createElement("div");s.style.cssText="position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:9999;background:#166534;color:#fff;padding:0.75rem 1.5rem;border-radius:50px;font-size:0.9rem;font-family:'Inter',sans-serif;",s.textContent="\u{1F514} Notifikace zapnuty! Uvid\xEDme se z\xEDtra r\xE1no.",document.body.appendChild(s),setTimeout(()=>s.remove(),3e3)}}),document.getElementById("mh-push-no").addEventListener("click",()=>{localStorage.setItem(n,"denied"),e.remove()}),setTimeout(()=>e?.remove(),12e3)}window.addEventListener("DOMContentLoaded",()=>{const t=u(),e=document.getElementById("subscribe-push-btn");if(e&&(localStorage.getItem(n)==="active"&&(e.innerHTML="\u{1F515} Zru\u0161it odb\u011Br horoskopu",e.classList.add("btn--active")),e.addEventListener("click",async()=>{localStorage.getItem(n)==="active"?(localStorage.removeItem(n),e.innerHTML="\u{1F514} Odeb\xEDrat denn\xED horoskop",e.classList.remove("btn--active"),window.Auth?.showToast&&window.Auth.showToast("Info","Odb\u011Br horoskopu byl zru\u0161en.","info")):await d()&&(e.innerHTML="\u{1F515} Zru\u0161it odb\u011Br horoskopu",e.classList.add("btn--active"),window.Auth?.showToast&&window.Auth.showToast("\xDAsp\u011Bch","Odb\u011Br horoskopu byl aktivov\xE1n.","success"))})),t>=2)if(localStorage.getItem("cookieConsent"))setTimeout(c,5e3);else{const r=setInterval(()=>{localStorage.getItem("cookieConsent")&&(clearInterval(r),setTimeout(c,3e3))},500)}})})();
