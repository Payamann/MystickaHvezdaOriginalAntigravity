(()=>{(function(){"use strict";const c=`
        <button class="share-result-btn" aria-label="Sd\xEDlet v\xFDsledek">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Sd\xEDlet v\xFDsledek
        </button>
        <div class="share-toast" role="status" aria-live="polite">\u2705 Odkaz zkop\xEDrov\xE1n do schr\xE1nky!</div>
    `,k=`
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
    `;function x(){}function u(e){const t=new URL(window.location.href);return t.searchParams.set("utm_source",e),t.searchParams.set("utm_medium","share"),t.searchParams.set("utm_campaign","result_share"),t.toString()}function d(e,t,s){if(!e||e.querySelector(".share-result-btn"))return;const r=document.createElement("div");r.innerHTML=c;const a=e.querySelector("#detail-numbers");if(a){const o=a.closest("p")||a.parentElement;r.classList.add("share-result-wrapper--horoscope"),o.insertAdjacentElement("afterend",r)}else e.appendChild(r);const y=r.querySelector(".share-result-btn"),g=r.querySelector(".share-toast");y.addEventListener("click",async()=>{const o=s||document.querySelector(".reading-text, .result-text, [data-share-text]")?.innerText?.slice(0,200)||"",i=t||document.title,v=/Android|iPhone|iPad/i.test(navigator.userAgent)?"mobile_share":"web_share",n=u(v);if(navigator.share)try{await navigator.share({title:i,text:o,url:n});return}catch{}try{await navigator.clipboard.writeText(`${i}

${n}`),h(g)}catch{prompt("Zkop\xEDrujte odkaz:",n)}})}function h(e){e.classList.add("visible"),setTimeout(()=>{e.classList.remove("visible")},3e3)}const m=[".reading-result",".ai-result",".result-section",".crystal-result",".natal-result",".numerology-result",".synastry-result",".mentor-result","#ai-reading",".oracle-response","#tarot-result","#tarot-results","#result-panel","#horoscope-result","#chart-results","#numerology-results","#phaseCard","#astro-results","#answer-container","#biorhythm-results","#aura-result","#messages-container"],b=new Set([]);function l(){m.forEach(e=>{const t=document.querySelector(e);if(!(!t||t.querySelector(".share-result-btn"))&&!(b.has(e)&&!t.dataset.loaded)&&t.children.length>0){const s=document.title.replace(" | Mystick\xE1 Hv\u011Bzda","");d(t,`M\u016Fj v\xFDsledek: ${s} | Mystick\xE1 Hv\u011Bzda`)}})}function p(){l(),new MutationObserver(l).observe(document.body,{childList:!0,subtree:!0})}document.addEventListener("DOMContentLoaded",()=>{p()})})();})();
