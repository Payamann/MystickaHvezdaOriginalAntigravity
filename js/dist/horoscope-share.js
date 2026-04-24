(function(){"use strict";const k="https://www.mystickahvezda.cz",A="#050510",D="#0d0620",T="rgba(90,40,160,0.45)",W="rgba(50,20,100,0.35)",v="#ebc066",E="rgba(235,192,102,0.15)",$="#ffffff",S="rgba(255,255,255,0.75)",U="rgba(255,255,255,0.7)";function I(e,n,r,s=120){e.save();for(let a=0;a<s;a++){const o=Math.random()*n,t=Math.random()*r*.75,l=Math.random()*1.5+.3,i=Math.random()*.6+.2;e.beginPath(),e.arc(o,t,l,0,Math.PI*2),e.fillStyle=`rgba(255,255,255,${i})`,e.fill()}e.restore()}function w(e,n,r,s,a,o,t){const l=n.split(" ");let i="",c=0;for(let d=0;d<l.length;d++){const h=i+l[d]+" ";if(e.measureText(h).width>a&&d>0){if(c>=t-1){e.fillText(i.trimEnd()+"\u2026",r,s);return}e.fillText(i.trimEnd(),r,s),i=l[d]+" ",s+=o,c++}else i=h}i.trim()&&e.fillText(i.trimEnd(),r,s)}function z(e,n,r,s,a){const o=document.createElement("canvas");o.width=1080,o.height=1350;const t=o.getContext("2d"),l=t.createLinearGradient(0,0,0,1350);l.addColorStop(0,A),l.addColorStop(.5,"#0b0418"),l.addColorStop(1,D),t.fillStyle=l,t.fillRect(0,0,1080,1350);const i=t.createRadialGradient(1080*.3,1350*.25,0,1080*.3,1350*.25,1080*.55);i.addColorStop(0,T),i.addColorStop(1,"transparent"),t.fillStyle=i,t.fillRect(0,0,1080,1350);const c=t.createRadialGradient(1080*.75,1350*.45,0,1080*.75,1350*.45,1080*.45);c.addColorStop(0,W),c.addColorStop(1,"transparent"),t.fillStyle=c,t.fillRect(0,0,1080,1350),I(t,1080,1350,140);const d=1080/2,h=420,m=210,f=t.createRadialGradient(d,h,60,d,h,m);f.addColorStop(0,"rgba(235,192,102,0.18)"),f.addColorStop(.6,"rgba(235,192,102,0.06)"),f.addColorStop(1,"transparent"),t.fillStyle=f,t.beginPath(),t.arc(d,h,m,0,Math.PI*2),t.fill(),t.beginPath(),t.arc(d,h,m-10,0,Math.PI*2),t.strokeStyle="rgba(235,192,102,0.25)",t.lineWidth=1.5,t.stroke();const g=100;t.font="500 34px Inter, sans-serif",t.letterSpacing="6px",t.fillStyle=v,t.textAlign="center",t.fillText("DENN\xCD HOROSKOP",1080/2,g),t.letterSpacing="0px",t.beginPath(),t.moveTo(1080/2-160,g+18),t.lineTo(1080/2+160,g+18),t.strokeStyle="rgba(235,192,102,0.4)",t.lineWidth=1,t.stroke(),t.font="300 30px Inter, sans-serif",t.fillStyle=S,t.textAlign="center",t.fillText(r,1080/2,g+58),t.font="180px serif",t.textAlign="center",t.fillText(e,1080/2,h+65),t.font="bold 88px Cinzel, Georgia, serif",t.fillStyle=v,t.textAlign="center",t.fillText(n.toUpperCase(),1080/2,680);const p=710,u=300;t.beginPath(),t.moveTo(1080/2-u/2,p),t.lineTo(1080/2+u/2,p),t.strokeStyle="rgba(235,192,102,0.5)",t.lineWidth=1.5,t.stroke(),t.save(),t.translate(1080/2,p),t.rotate(Math.PI/4),t.fillStyle=v,t.fillRect(-5,-5,10,10),t.restore();const b=90,C=900,x=790;t.font="400 38px Inter, sans-serif",t.fillStyle=$,t.textAlign="left",w(t,s,b,x,C,58,5),a&&(t.fillStyle=E,_(t,b-20,1064,C+40,130,16),t.fill(),t.strokeStyle="rgba(235,192,102,0.3)",t.lineWidth=1,_(t,b-20,1064,C+40,130,16),t.stroke(),t.font="500 30px Inter, sans-serif",t.fillStyle=v,t.textAlign="left",t.fillText("\u2728 Afirmace",b,1110),t.font="italic 34px Inter, sans-serif",t.fillStyle=S,w(t,`"${a}"`,b,1156,C,46,2));const y=1290;return t.beginPath(),t.moveTo(90,y-30),t.lineTo(990,y-30),t.strokeStyle="rgba(235,192,102,0.2)",t.lineWidth=1,t.stroke(),t.font="32px serif",t.textAlign="center",t.fillStyle=v,t.fillText("\u2605",1080/2-220,y),t.font="500 32px Cinzel, Georgia, serif",t.fillStyle=v,t.textAlign="center",t.fillText("mystickahvezda.cz",1080/2,y),t.font="32px serif",t.fillText("\u2605",1080/2+220,y),o}function _(e,n,r,s,a,o){e.beginPath(),e.moveTo(n+o,r),e.lineTo(n+s-o,r),e.quadraticCurveTo(n+s,r,n+s,r+o),e.lineTo(n+s,r+a-o),e.quadraticCurveTo(n+s,r+a,n+s-o,r+a),e.lineTo(n+o,r+a),e.quadraticCurveTo(n,r+a,n,r+a-o),e.lineTo(n,r+o),e.quadraticCurveTo(n,r,n+o,r),e.closePath()}function H(e,n,r,s){const a=(l,i)=>{let c=document.querySelector(`meta[property="${l}"]`);c||(c=document.createElement("meta"),c.setAttribute("property",l),document.head.appendChild(c)),c.setAttribute("content",i)},o=`Horoskop ${e} \u2014 ${new Date().toLocaleDateString("cs-CZ",{day:"numeric",month:"long"})} | Mystick\xE1 Hv\u011Bzda`,t=n.slice(0,200).trimEnd()+(n.length>200?"\u2026":"");a("og:title",o),a("og:description",t),a("og:url",r),a("og:type","article"),a("og:site_name","Mystick\xE1 Hv\u011Bzda"),a("og:image",`${k}/img/og/horoskop-${s}.jpg`),a("og:image:width","1200"),a("og:image:height","630"),a("og:image:alt",`Horoskop ${e} \u2014 Mystick\xE1 Hv\u011Bzda`)}function M(e,n,r,s,a){const o=document.getElementById("horoscope-share-panel");o&&o.remove();const t=document.createElement("div");t.id="horoscope-share-panel";const l=document.createElement("canvas");l.width=270,l.height=338,l.getContext("2d").drawImage(e,0,0,270,338),l.style.cssText=`
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(235,192,102,0.2);
            display: block;
            margin: 0 auto 1.5rem;
        `;const c=a||s,d=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(s)}`,h=`https://wa.me/?text=${encodeURIComponent(`${r} M\u016Fj dne\u0161n\xED horoskop pro ${n}: ${c}`)}`,m=!!(navigator.canShare&&navigator.canShare({files:[new File([""],"test.jpg",{type:"image/jpeg"})]}));t.innerHTML=`
            <div class="hs-inner">
                <p class="hs-title">\u2728 Sd\xEDlet horoskop ${r} ${n}</p>
                <div class="hs-preview-wrap"></div>
                <div class="hs-main-btn-wrap">
                    <button class="hs-btn hs-btn--primary" id="hs-share-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        Sd\xEDlet horoskop
                        <svg class="hs-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6,9 12,15 18,9"/></svg>
                    </button>
                </div>
                <div class="hs-options" id="hs-options" aria-hidden="true">
                    <div class="hs-options-inner">
                        ${m?`
                        <button class="hs-opt" id="hs-native-btn">
                            <span class="hs-opt-icon">\u{1F4F2}</span>
                            <span>Instagram / TikTok / WhatsApp</span>
                        </button>`:""}
                        <a class="hs-opt" href="${d}" target="_blank" rel="noopener">
                            <span class="hs-opt-icon" style="background:#1877f2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                            </span>
                            <span>Facebook</span>
                        </a>
                        <a class="hs-opt" href="${h}" target="_blank" rel="noopener">
                            <span class="hs-opt-icon" style="background:#25d366">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                            </span>
                            <span>WhatsApp</span>
                        </a>
                        <button class="hs-opt" id="hs-copy-btn">
                            <span class="hs-opt-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </span>
                            <span>Kop\xEDrovat odkaz</span>
                        </button>
                        <button class="hs-opt" id="hs-download-btn">
                            <span class="hs-opt-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </span>
                            <span>Ulo\u017Eit obr\xE1zek</span>
                        </button>
                    </div>
                </div>
                <div class="hs-toast" id="hs-toast" role="status" aria-live="polite">\u2705 Odkaz zkop\xEDrov\xE1n!</div>
            </div>
        `,t.querySelector(".hs-preview-wrap").appendChild(l);const f=t.querySelector("#hs-share-btn"),g=t.querySelector("#hs-options");return f.addEventListener("click",()=>{const p=g.classList.toggle("hs-options--open");g.setAttribute("aria-hidden",String(!p)),f.querySelector(".hs-chevron").style.transform=p?"rotate(180deg)":""}),t.querySelector("#hs-native-btn")?.addEventListener("click",async()=>{const p=`horoskop-${n.toLowerCase().replace(/\s+/g,"-")}-${new Date().toISOString().split("T")[0]}.jpg`,u=e.toDataURL("image/jpeg",.92);try{const C=await(await fetch(u)).blob(),x=new File([C],p,{type:"image/jpeg"});await navigator.share({files:[x],title:`Horoskop ${n} \u2014 Mystick\xE1 Hv\u011Bzda`,text:`${r} M\u016Fj dne\u0161n\xED horoskop: ${c}`})}catch{}}),t.querySelector("#hs-download-btn").addEventListener("click",()=>{const p=document.createElement("a");p.download=`horoskop-${n.toLowerCase().replace(/\s+/g,"-")}-${new Date().toISOString().split("T")[0]}.jpg`,p.href=e.toDataURL("image/jpeg",.92),p.click()}),t.querySelector("#hs-copy-btn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(c)}catch{prompt("Zkop\xEDrujte odkaz:",c);return}const p=t.querySelector("#hs-toast");p.classList.add("visible"),setTimeout(()=>p.classList.remove("visible"),3e3)}),t}function L(){if(document.getElementById("hs-styles"))return;const e=document.createElement("style");e.id="hs-styles",e.textContent=`
            #horoscope-share-panel {
                margin-top: 2.5rem;
                padding: 2rem 1.5rem;
                background: rgba(10,6,28,0.7);
                border: 1px solid rgba(235,192,102,0.2);
                border-radius: 20px;
                backdrop-filter: blur(12px);
                text-align: center;
            }
            .hs-inner { max-width: 420px; margin: 0 auto; }
            .hs-title {
                font-family: 'Cinzel', serif;
                color: #ebc066;
                font-size: 1.1rem;
                margin-bottom: 1.25rem;
                letter-spacing: 0.03em;
            }
            .hs-main-btn-wrap { text-align: center; }
            .hs-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.6rem;
                padding: 0.8rem 1.8rem;
                border-radius: 50px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s, transform 0.15s;
                text-decoration: none;
                border: none;
            }
            .hs-btn--primary {
                background: linear-gradient(135deg, #ebc066, #c89b3c);
                color: #0a0a1a;
            }
            .hs-btn--primary:hover { opacity: 0.9; transform: translateY(-1px); }
            .hs-chevron { transition: transform 0.25s; margin-left: 2px; }

            /* Rozbalovac\xED mo\u017Enosti */
            .hs-options {
                display: grid;
                grid-template-rows: 0fr;
                transition: grid-template-rows 0.3s ease, margin-top 0.3s ease;
                margin-top: 0;
            }
            .hs-options-inner {
                overflow: hidden;
                min-height: 0;
            }
            .hs-options--open {
                grid-template-rows: 1fr;
                margin-top: 0.75rem;
            }
            .hs-opt {
                display: flex;
                align-items: center;
                gap: 0.85rem;
                width: 100%;
                padding: 0.7rem 1rem;
                border-radius: 12px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.07);
                color: rgba(255,255,255,0.85);
                font-size: 0.9rem;
                cursor: pointer;
                text-decoration: none;
                transition: background 0.2s;
                margin-bottom: 0.4rem;
                text-align: left;
            }
            .hs-opt:last-child { margin-bottom: 0; }
            .hs-opt:hover { background: rgba(255,255,255,0.09); }
            .hs-opt-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 30px;
                height: 30px;
                border-radius: 8px;
                background: rgba(235,192,102,0.15);
                flex-shrink: 0;
                font-size: 16px;
            }
            .hs-toast {
                display: none;
                margin-top: 1rem;
                padding: 0.6rem 1.2rem;
                background: rgba(20,15,40,0.95);
                border: 1px solid rgba(235,192,102,0.3);
                border-radius: 50px;
                color: #fff;
                font-size: 0.85rem;
                backdrop-filter: blur(10px);
            }
            .hs-toast.visible { display: inline-block; }
        `,document.head.appendChild(e)}function R(){L();const e=document.getElementById("horoscope-detail-section");if(!e)return;const n="Klikn\u011Bte na karti\u010Dku";let r=null;function s(){const o=document.getElementById("detail-name")?.innerText?.trim(),t=document.getElementById("detail-symbol")?.innerText?.trim(),l=document.getElementById("detail-date")?.innerText?.trim(),i=document.getElementById("detail-text")?.innerText?.trim(),c=document.getElementById("detail-work")?.innerText?.replace(/^✨\s*Afirmace:\s*/i,"").trim();if(!o||o==="Zv\u011Brokruh"||!i||i.startsWith(n)||i.length<40||i.includes("Zkuste se zti\u0161it")||r===o+i.slice(0,20))return;r=o+i.slice(0,20);const d=o.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-"),h=`${k}/horoskopy.html?znak=${encodeURIComponent(d)}`,m=`${k}/horoskopy.html?znak=${encodeURIComponent(d)}&utm_source=social&utm_medium=share&utm_campaign=horoscope#${d}`;H(o,i,h,d);const f=z(t,o,l||"",i,c||""),g=e.querySelector(".horoscope-content");if(!g)return;const p=M(f,o,t,h,m),u=g.querySelector("#horoscope-share-panel");u&&u.remove(),g.appendChild(p)}new MutationObserver(s).observe(e,{attributes:!0,attributeFilter:["data-loaded"],childList:!0,subtree:!0,characterData:!0})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",R):R()})();
