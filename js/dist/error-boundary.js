(function(){window.addEventListener("error",function(e){console.error("Captured Global Error:",e.error),o(e.message)}),window.addEventListener("unhandledrejection",function(e){console.error("Captured Async Error:",e.reason),o("Probl\xE9m s p\u0159ipojen\xEDm k vesm\xEDrn\xFDm server\u016Fm.")});function o(e){const n=document.querySelector("main")||document.body;if(n&&n.innerHTML.length<500){const r=document.createElement("div");r.style.cssText=`
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: #0a0a1a; color: white; display: flex; flex-direction: column;
                justify-content: center; align-items: center; z-index: 9999;
                text-align: center; padding: 2rem; font-family: 'Cinzel', serif;
            `,r.innerHTML=`
                <div style="max-width: 600px; border: 1px solid rgba(212,175,55,0.3); padding: 3rem; border-radius: 20px; background: rgba(255,255,255,0.02); backdrop-filter: blur(20px);">
                    <h1 style="color: #d4af37; font-size: 2rem; margin-bottom: 1rem;">Omlouv\xE1me se, hv\u011Bzdy jsou do\u010Dasn\u011B v mlze.</h1>
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 2rem; font-family: 'Inter', sans-serif;">
                        Do\u0161lo k ne\u010Dekan\xE9 technick\xE9 chyb\u011B. Na\u0161i m\xE1gov\xE9 na n\xE1prav\u011B ji\u017E pracuj\xED.
                    </p>
                    <button onclick="window.location.reload()" style="cursor: pointer; background: #d4af37; border: none; padding: 1rem 2rem; border-radius: 10px; font-weight: bold; color: #0a0a1a; font-family: 'Inter', sans-serif;">
                        Zkusit znovu spojen\xED
                    </button>
                    <a href="/" style="display: block; margin-top: 1rem; color: rgba(255,255,255,0.4); text-decoration: none; font-size: 0.9rem;">Zp\u011Bt na hlavn\xED br\xE1nu</a>
                </div>
            `,document.body.appendChild(r)}}})();
