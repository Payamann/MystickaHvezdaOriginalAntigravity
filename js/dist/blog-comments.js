(function(){"use strict";const a=document.getElementById("blog-comments-section");if(!a)return;const s=a.dataset.postSlug;if(!s)return;const m=window.API_CONFIG?.BASE_URL||"/api";function p(e){const n=e.author_name.split(" ").map(t=>t[0]).join("").toUpperCase().slice(0,2),o=new Date(e.created_at).toLocaleDateString("cs-CZ",{day:"numeric",month:"long",year:"numeric"});return`
            <div style="display:flex;gap:1rem;padding:1rem 0;border-bottom:1px solid rgba(255,255,255,0.05);" class="comment-item">
                <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#9b59b6,#d4af37);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0;">${n}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:0.5rem;flex-wrap:wrap;">
                        <span style="font-weight:600;font-size:0.92rem;color:#fff;">${l(e.author_name)}</span>
                        <span style="font-size:0.75rem;color:rgba(255,255,255,0.3);">${o}</span>
                    </div>
                    <p style="margin:0.4rem 0 0;color:rgba(255,255,255,0.75);line-height:1.7;font-size:0.9rem;">${l(e.content)}</p>
                </div>
            </div>
        `}function l(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}async function f(){const e=document.getElementById("comments-list"),n=document.getElementById("comments-count");e.innerHTML='<p style="color:rgba(255,255,255,0.3);font-size:0.85rem;text-align:center;padding:1rem;">Na\u010D\xEDt\xE1m koment\xE1\u0159e...</p>';try{const r=(await(await fetch(`${m}/comments?slug=${encodeURIComponent(s)}`)).json()).comments||[];n&&(n.textContent=r.length),r.length===0?e.innerHTML='<p style="color:rgba(255,255,255,0.3);font-size:0.85rem;text-align:center;padding:1rem;">Bu\u010Fte prvn\xED, kdo zanech\xE1 koment\xE1\u0159!</p>':e.innerHTML=r.map(p).join("")}catch{e.innerHTML='<p style="color:rgba(255,255,255,0.3);font-size:0.85rem;text-align:center;">Koment\xE1\u0159e se nepoda\u0159ilo na\u010D\xEDst.</p>'}}async function g(e){e.preventDefault();const n=e.target,o=n.querySelector("[type=submit]"),t=document.getElementById("comment-submit-msg"),r=n.querySelector("[name=name]").value.trim(),d=n.querySelector("[name=email]").value.trim(),i=n.querySelector("[name=content]").value.trim();if(!r||!d||!i){t.textContent="Vypl\u0148te pros\xEDm v\u0161echna pole.",t.style.color="#f87171";return}if(i.length<10){t.textContent="Koment\xE1\u0159 mus\xED m\xEDt alespo\u0148 10 znak\u016F.",t.style.color="#f87171";return}o.disabled=!0,o.textContent="Odes\xEDl\xE1m...",t.textContent="";try{const c=await(await fetch(`${m}/comments`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:s,author_name:r,author_email:d,content:i})})).json();c.success?(t.textContent="\u2705 Koment\xE1\u0159 odesl\xE1n a \u010Dek\xE1 na schv\xE1len\xED. D\u011Bkujeme!",t.style.color="#4ade80",n.reset()):(t.textContent=c.error||"Chyba p\u0159i odes\xEDl\xE1n\xED.",t.style.color="#f87171")}catch{t.textContent="Chyba p\u0159ipojen\xED. Zkuste to znovu.",t.style.color="#f87171"}finally{o.disabled=!1,o.textContent="Odeslat koment\xE1\u0159"}}a.innerHTML=`
        <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:2.5rem;margin-top:2.5rem;">
            <h3 style="font-family:'Cinzel',serif;color:#ebc066;font-size:1.2rem;margin:0 0 1.5rem;">
                Koment\xE1\u0159e <span id="comments-count" style="font-size:0.85rem;color:rgba(255,255,255,0.3);font-family:'Inter',sans-serif;font-weight:400;"></span>
            </h3>

            <div id="comments-list" style="margin-bottom:2rem;"></div>

            <!-- Comment form -->
            <div style="background:rgba(10,10,26,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.5rem;">
                <h4 style="margin:0 0 1.25rem;font-size:1rem;color:#fff;">P\u0159idat koment\xE1\u0159</h4>
                <form id="comment-form">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:0.75rem;">
                        <input name="name" type="text" placeholder="Va\u0161e jm\xE9no *" required style="
                            padding:0.75rem 1rem;background:rgba(255,255,255,0.06);
                            border:1px solid rgba(255,255,255,0.12);border-radius:10px;
                            color:#fff;font-size:0.9rem;font-family:'Inter',sans-serif;
                        ">
                        <input name="email" type="email" placeholder="Email (nezobraz\xED se) *" required style="
                            padding:0.75rem 1rem;background:rgba(255,255,255,0.06);
                            border:1px solid rgba(255,255,255,0.12);border-radius:10px;
                            color:#fff;font-size:0.9rem;font-family:'Inter',sans-serif;
                        ">
                    </div>
                    <textarea name="content" placeholder="V\xE1\u0161 koment\xE1\u0159 *" rows="4" required style="
                        width:100%;padding:0.75rem 1rem;background:rgba(255,255,255,0.06);
                        border:1px solid rgba(255,255,255,0.12);border-radius:10px;
                        color:#fff;font-size:0.9rem;font-family:'Inter',sans-serif;
                        resize:vertical;box-sizing:border-box;margin-bottom:0.75rem;
                    "></textarea>
                    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                        <button type="submit" class="btn btn--primary" style="font-size:0.9rem;">Odeslat koment\xE1\u0159</button>
                        <span id="comment-submit-msg" style="font-size:0.85rem;"></span>
                    </div>
                    <p style="font-size:0.75rem;color:rgba(255,255,255,0.25);margin:0.75rem 0 0;">
                        Koment\xE1\u0159e jsou schvalov\xE1ny ru\u010Dn\u011B. Email nebude zve\u0159ejn\u011Bn.
                    </p>
                </form>
            </div>
        </div>
    `,document.getElementById("comment-form").addEventListener("submit",g),f()})();
