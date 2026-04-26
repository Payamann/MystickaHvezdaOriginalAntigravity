(()=>{(function(){"use strict";const n="mh_exit_shown",c={tarot:"tarot",horoskopy:"horoskopy","partnerska-shoda":"partnerska_detail",numerologie:"numerologie_vyklad",runy:"runy_hluboky_vyklad","natalni-karta":"natalni_interpretace",mentor:"hvezdny_mentor","shamanske-kolo":"shamanske_kolo_plne_cteni","minuly-zivot":"minuly_zivot","kristalova-koule":"kristalova_koule"};let u=Date.now(),s=!1;if(["/prihlaseni","/onboarding","/404","/profil"].some(e=>window.location.pathname.includes(e))||sessionStorage.getItem(n))return;function m(){return window.location.pathname.split("/").pop()?.replace(".html","")||"homepage"}function r(){const e=m();return{planId:"pruvodce",source:`exit_intent_${e}`,feature:c[e]||e,redirect:"/cenik.html",authMode:"register"}}function i(e,t={}){window.MH_ANALYTICS?.trackEvent?.(e,{location:window.location.pathname,...t})}function _(){const e=r(),t=document.createElement("div");t.id="exit-intent-modal",t.className="exit-intent-modal",t.innerHTML=`
            <div class="exit-intent-modal__panel">
                <button id="exit-close" class="exit-intent-modal__close" type="button" aria-label="Zav\u0159\xEDt">\xD7</button>

                <div class="exit-intent-modal__icon">\u{1F31F}</div>
                <h2 class="exit-intent-modal__title">
                    Tv\u016Fj v\xFDklad jde mnohem d\xE1l
                </h2>
                <div class="exit-intent-modal__features">
                    <div>\u{1F52E} Nat\xE1ln\xED karta a partnersk\xE1 shoda</div>
                    <div>\u{1F319} Horoskopy bez omezen\xED</div>
                    <div>\u2728 Tarot, runy, v\xFDklady a mnohem v\xEDc</div>
                </div>
                <p class="exit-intent-modal__text">
                    Pokud u\u017E c\xEDt\xED\u0161, \u017Ee chce\u0161 v\xEDc ne\u017E jen n\xE1hled, Hv\u011Bzdn\xFD Pr\u016Fvodce t\u011B vezme do hloubky.
                </p>

                <button id="exit-cta" class="exit-intent-modal__cta" type="button">
                    \u2728 Pokra\u010Dovat k pln\xE9mu p\u0159\xEDstupu \u2192
                </button>

                <button id="exit-dismiss" class="exit-intent-modal__dismiss" type="button">
                    Zat\xEDm ne, z\u016Fstanu u z\xE1kladn\xED verze
                </button>

                <p class="exit-intent-modal__privacy">
                    GDPR chr\xE1n\u011Bno
                </p>
            </div>
        `,document.body.appendChild(t);function o(a="overlay"){i("exit_intent_dismissed",{action:a,source:e.source,feature:e.feature}),t.classList.add("is-closing"),setTimeout(()=>t.remove(),200)}t.addEventListener("click",a=>{a.target===t&&o("overlay")}),document.getElementById("exit-close")?.addEventListener("click",()=>o("close_button")),document.getElementById("exit-dismiss")?.addEventListener("click",()=>o("dismiss_button")),document.getElementById("exit-cta")?.addEventListener("click",()=>{if(sessionStorage.setItem(n,"1"),i("exit_intent_cta_clicked",{plan_id:e.planId,source:e.source,feature:e.feature}),window.Auth?.startPlanCheckout){window.Auth.startPlanCheckout(e.planId,e);return}window.location.href=e.redirect})}function d(){if(s||Date.now()-u<15e3||window.Auth?.isPremium?.())return;const e=r();s=!0,sessionStorage.setItem(n,"1"),i("exit_intent_shown",{source:e.source,feature:e.feature,logged_in:!!window.Auth?.isLoggedIn?.()}),_()}document.addEventListener("mouseleave",e=>{e.clientY<=0&&d()});let l;document.addEventListener("visibilitychange",()=>{document.hidden?l=setTimeout(d,1e3):clearTimeout(l)})})();})();
