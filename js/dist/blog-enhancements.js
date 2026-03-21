(function(){"use strict";function a(){const e=document.createElement("div");e.id="scroll-progress-bar",e.style.cssText=`
            position: fixed; top: 0; left: 0; height: 3px; width: 0%;
            background: linear-gradient(90deg, #9b59b6, #d4af37, #9b59b6);
            background-size: 200% 100%;
            z-index: 9999; transition: width 0.1s linear;
            animation: shimmer 3s linear infinite;
        `,document.head.insertAdjacentHTML("beforeend",`<style>
            @keyframes shimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        </style>`),document.body.prepend(e);const o=document.querySelector(".blog-content, article, main");o&&window.addEventListener("scroll",()=>{const t=o.offsetTop,s=o.offsetHeight,i=window.scrollY-t,n=Math.min(100,Math.max(0,i/s*100));e.style.width=n+"%"},{passive:!0})}function c(){const e=document.querySelector(".blog-content, article");if(!e)return;const t=(e.innerText||"").trim().split(/\s+/).length,s=Math.max(1,Math.ceil(t/200)),i=document.querySelector("h1, .blog-header__title, .post-title");if(!i)return;const n=document.createElement("div");n.style.cssText=`
            display: inline-flex; align-items: center; gap: 0.5rem;
            color: rgba(255,255,255,0.5); font-size: 0.85rem;
            margin-top: 0.75rem; margin-bottom: 1.5rem;
        `,n.innerHTML=`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${s} min \u010Dten\xED &nbsp;\u2022&nbsp;
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            ${t.toLocaleString("cs-CZ")} slov
        `,i.insertAdjacentElement("afterend",n)}function d(){const e=document.querySelector(".blog-content");if(!e)return;const o=[...e.querySelectorAll("h2, h3")];if(o.length<3)return;o.forEach((n,r)=>{n.id||(n.id="section-"+r)});const t=document.createElement("div");t.id="table-of-contents",t.style.cssText=`
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(212,175,55,0.2);
            border-left: 3px solid #d4af37;
            border-radius: 12px;
            padding: 1.25rem 1.5rem;
            margin: 2rem 0;
        `;const s=o.map(n=>{const r=n.tagName==="H3";return`<li style="margin: 0.4rem 0 0.4rem ${r?"1.5rem":"0"}; list-style: ${r?"circle":"disc"};">
                <a href="#${n.id}" style="color: ${r?"rgba(255,255,255,0.6)":"#d4af37"}; text-decoration: none; font-size: ${r?"0.88rem":"0.95rem"}; transition: color 0.2s;"
                   onmouseover="this.style.color='#f5d17f'" onmouseout="this.style.color='${r?"rgba(255,255,255,0.6)":"#d4af37"}'">
                    ${n.textContent.trim()}
                </a>
            </li>`}).join("");t.innerHTML=`
            <p style="font-family:'Cinzel',serif; color:#d4af37; font-size:0.9rem; font-weight:600; margin:0 0 0.75rem; display:flex; align-items:center; gap:0.5rem;">
                \u{1F4CB} Obsah \u010Dl\xE1nku
            </p>
            <ul style="margin:0; padding:0 0 0 1.25rem; color:rgba(255,255,255,0.7);">
                ${s}
            </ul>
        `;const i=e.querySelector("p");i&&i.nextSibling?i.insertAdjacentElement("afterend",t):e.prepend(t)}function m(){if(typeof window.Auth<"u"&&window.Auth.isPremium?.())return;const e=document.createElement("div");e.id="sticky-blog-cta",e.style.cssText=`
            position: fixed; bottom: 1.5rem; right: 1.5rem;
            background: linear-gradient(135deg, #1e1040, #2d1060);
            border: 1px solid rgba(212,175,55,0.4);
            border-radius: 50px;
            padding: 0.65rem 1.25rem;
            display: flex; align-items: center; gap: 0.6rem;
            z-index: 888;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            transform: translateY(100px); opacity: 0;
            transition: transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s;
            cursor: pointer;
        `,e.innerHTML=`
            <span style="font-size: 1.1rem;">\u2728</span>
            <a href="../cenik.html" style="color:#d4af37; font-size:0.85rem; font-weight:600; text-decoration:none; white-space:nowrap;">
                7 dn\xED zdarma
            </a>
            <button onclick="document.getElementById('sticky-blog-cta').remove()" style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:1rem;padding:0;margin-left:0.25rem;line-height:1;" aria-label="Zav\u0159\xEDt">\xD7</button>
        `,document.body.appendChild(e);let o=!1;window.addEventListener("scroll",()=>{const t=window.scrollY/(document.body.scrollHeight-window.innerHeight)*100;!o&&t>50&&(o=!0,e.style.transform="translateY(0)",e.style.opacity="1")},{passive:!0})}function p(){const e=document.title.replace(" | Blog Mystick\xE1 Hv\u011Bzda","").replace(" | Mystick\xE1 Hv\u011Bzda",""),o=window.location.pathname.split("/").pop().replace(".html",""),t=document.createElement("nav");t.setAttribute("aria-label","Breadcrumb"),t.style.cssText="margin-bottom: 1.5rem; font-size: 0.85rem;",t.innerHTML=`
            <ol style="list-style:none; padding:0; margin:0; display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; color:rgba(255,255,255,0.45);">
                <li><a href="../index.html" style="color:rgba(255,255,255,0.45); text-decoration:none;" onmouseover="this.style.color='#d4af37'" onmouseout="this.style.color='rgba(255,255,255,0.45)'">Dom\u016F</a></li>
                <li>\u203A</li>
                <li><a href="../blog.html" style="color:rgba(255,255,255,0.45); text-decoration:none;" onmouseover="this.style.color='#d4af37'" onmouseout="this.style.color='rgba(255,255,255,0.45)'">Blog</a></li>
                <li>\u203A</li>
                <li style="color:rgba(255,255,255,0.7); max-width:320px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${e}">${e}</li>
            </ol>
        `;const s=document.querySelector("main, #main-content, .blog-post"),i=document.querySelector(".blog-header, h1");i?i.insertAdjacentElement("beforebegin",t):s&&s.prepend(t);const n={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Dom\u016F",item:"https://mystickahvezda.cz/"},{"@type":"ListItem",position:2,name:"Blog",item:"https://mystickahvezda.cz/blog.html"},{"@type":"ListItem",position:3,name:e,item:"https://mystickahvezda.cz/blog/"+o+".html"}]},r=document.createElement("script");r.type="application/ld+json",r.textContent=JSON.stringify(n),document.head.appendChild(r)}function l(){window.location.pathname.includes("/blog/")&&(a(),c(),d(),m(),p())}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",l):l()})();
