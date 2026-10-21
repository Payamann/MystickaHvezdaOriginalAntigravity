(()=>{(function(){window.addEventListener("error",function(r){console.error("Captured Global Error:",r.error),e()}),window.addEventListener("unhandledrejection",function(r){console.error("Captured Async Error:",r.reason),e()});function e(){const r=document.querySelector("main")||document.body;if(r&&r.innerHTML.length<500){const o=document.createElement("div");o.className="mh-error-boundary",o.innerHTML=`
                <div class="mh-error-boundary__panel">
                    <h1 class="mh-error-boundary__title">Str\xE1nku se nepoda\u0159ilo na\u010D\xEDst.</h1>
                    <p class="mh-error-boundary__text">
                        M\u016F\u017Ee j\xEDt o kr\xE1tk\xFD v\xFDpadek. Zkus str\xE1nku obnovit; pokud pot\xED\u017Ee p\u0159etrvaj\xED, vra\u0165 se pozd\u011Bji.
                    </p>
                    <button id="mh-error-reload" class="mh-error-boundary__button" type="button">
                        Obnovit str\xE1nku
                    </button>
                    <a href="/" class="mh-error-boundary__link">Zp\u011Bt na hlavn\xED str\xE1nku</a>
                </div>
            `,document.body.appendChild(o),document.getElementById("mh-error-reload")?.addEventListener("click",()=>{window.location.reload()})}}})();})();
