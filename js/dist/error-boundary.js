(()=>{(function(){window.addEventListener("error",function(r){console.error("Captured Global Error:",r.error),o(r.message)}),window.addEventListener("unhandledrejection",function(r){console.error("Captured Async Error:",r.reason),o("Probl\xE9m s p\u0159ipojen\xEDm k vesm\xEDrn\xFDm server\u016Fm.")});function o(r){const n=document.querySelector("main")||document.body;if(n&&n.innerHTML.length<500){const e=document.createElement("div");e.className="mh-error-boundary",e.innerHTML=`
                <div class="mh-error-boundary__panel">
                    <h1 class="mh-error-boundary__title">Omlouv\xE1me se, hv\u011Bzdy jsou do\u010Dasn\u011B v mlze.</h1>
                    <p class="mh-error-boundary__text">
                        Do\u0161lo k ne\u010Dekan\xE9 technick\xE9 chyb\u011B. Na\u0161i m\xE1gov\xE9 na n\xE1prav\u011B ji\u017E pracuj\xED.
                    </p>
                    <button id="mh-error-reload" class="mh-error-boundary__button" type="button">
                        Zkusit znovu spojen\xED
                    </button>
                    <a href="/" class="mh-error-boundary__link">Zp\u011Bt na hlavn\xED br\xE1nu</a>
                </div>
            `,document.body.appendChild(e),document.getElementById("mh-error-reload")?.addEventListener("click",()=>{window.location.reload()})}}})();})();
