(()=>{(function(){"use strict";const p=`
        <button class="share-result-btn" aria-label="Sd\xEDlet v\xFDsledek">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Sd\xEDlet v\xFDsledek
        </button>
        <div class="share-toast" role="status" aria-live="polite">\u2705 Odkaz zkop\xEDrov\xE1n do schr\xE1nky!</div>
    `,E=`
        .share-result-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.65rem 1.4rem;
            background: transparent;
            border: 1px solid rgba(212,175,55,0.5);
            border-radius: 50px;
            color: var(--color-mystic-gold, #d4af37);
            font-size: 0.9rem;
            cursor: pointer;
            transition: background 0.3s;
            margin-top: 1rem;
        }
        .share-result-btn:hover {
            background: rgba(212,175,55,0.1);
        }
        .share-toast {
            display: none;
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(20,15,40,0.95);
            border: 1px solid rgba(212,175,55,0.4);
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            color: white;
            font-size: 0.9rem;
            z-index: 9999;
            backdrop-filter: blur(10px);
        }
        .share-toast.visible {
            display: block;
            animation: shareToastIn 0.3s ease;
        }
        @keyframes shareToastIn {
            from { opacity: 0; transform: translateX(-50%) translateY(10px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
    `;function T(){}function m(t){const e=new URL(window.location.href);return e.searchParams.set("utm_source",t),e.searchParams.set("utm_medium","share"),e.searchParams.set("utm_campaign","result_share"),e.toString()}function a(t,e={}){window.MH_ANALYTICS?.trackEvent?.(t,{source:"result_share",page_path:window.location.pathname,...e})}const f=[".tarot-profile-cta",".tarot-yes-no-profile-cta",'[class*="profile-cta"]','[class*="signup-cta"]','[class*="register-cta"]'];function b(t){for(const e of f){const r=t.querySelector(e);if(r)return r}return null}function c(t,e){const r=b(t);return r&&r.parentElement?e.parentElement===r.parentElement&&e.nextElementSibling===r?!1:(r.parentElement.insertBefore(e,r),!0):t.lastElementChild!==e?(t.appendChild(e),!0):!1}function g(t,e,r){if(!t||t.querySelector(".share-result-btn"))return;const s=document.createElement("div");s.innerHTML=p;const l=t.querySelector("#detail-numbers");if(l){const n=l.closest("p")||l.parentElement;s.classList.add("share-result-wrapper","share-result-wrapper--horoscope"),n.insertAdjacentElement("afterend",s)}else s.classList.add("share-result-wrapper"),c(t,s);const w=s.querySelector(".share-result-btn"),_=s.querySelector(".share-toast");w.addEventListener("click",async()=>{const n=r||document.querySelector(".reading-text, .result-text, [data-share-text]")?.innerText?.slice(0,200)||"",d=e||document.title,h=/Android|iPhone|iPad/i.test(navigator.userAgent)?"mobile_share":"web_share",i=m(h),o={share_method:navigator.share?"native":"clipboard",utm_source:h,has_share_text:!!n};if(a("share_click",o),navigator.share)try{await navigator.share({title:d,text:n,url:i}),a("share_completed",{...o,share_method:"native"});return}catch{}try{await navigator.clipboard.writeText(`${d}

${i}`),y(_),a("share_completed",{...o,share_method:"clipboard"})}catch{a("share_fallback_prompted",o),prompt("Zkop\xEDrujte odkaz:",i)}})}function y(t){t.classList.add("visible"),setTimeout(()=>{t.classList.remove("visible")},3e3)}const v=[".reading-result",".ai-result",".result-section",".crystal-result",".natal-result",".numerology-result",".synastry-result",".mentor-result","#ai-reading",".oracle-response","#tarot-result","#tarot-results","#result-panel","#horoscope-result","#chart-results","#numerology-results","#phaseCard","#astro-results","#answer-container","#biorhythm-results","#aura-result","#messages-container"],k=new Set([]);function u(){v.forEach(t=>{const e=document.querySelector(t);if(!e||k.has(t)&&!e.dataset.loaded)return;const r=e.querySelector(".share-result-btn");if(r){const s=r.closest(".share-result-wrapper");s&&!s.classList.contains("share-result-wrapper--horoscope")&&c(e,s);return}if(e.children.length>0){const s=document.title.replace(" | Mystick\xE1 Hv\u011Bzda","");g(e,`M\u016Fj v\xFDsledek: ${s} | Mystick\xE1 Hv\u011Bzda`)}})}function x(){u(),new MutationObserver(u).observe(document.body,{childList:!0,subtree:!0})}document.addEventListener("DOMContentLoaded",()=>{x()})})();})();
