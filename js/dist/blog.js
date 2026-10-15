(()=>{document.addEventListener("DOMContentLoaded",async()=>{const s=document.getElementById("blogContainer"),i=document.getElementById("featuredContainer"),h=document.getElementById("categoryFilter"),r=document.getElementById("gridTitle"),d=document.getElementById("blog-load-more"),f=document.getElementById("blog-load-status"),c=12;let o=[],m=[],l=c;document.addEventListener("error",e=>{const a=e.target;a instanceof HTMLImageElement&&(!a.classList.contains("featured-post__image")&&!a.classList.contains("blog-card-image")||(a.hidden=!0,a.closest(".featured-post__image-wrapper, .blog-card-image-wrapper")?.classList.add("blog-image-fallback")))},!0);try{const e=await fetch("/data/blog-index.json?v=atlas-art-v1",{cache:"no-cache"});if(!e.ok)throw new Error("Data index nebyl nalezen");if(o=await e.json(),s.innerHTML="",o.length===0)throw new Error("\u017D\xE1dn\xE9 \u010Dl\xE1nky");const a=new Set;o.forEach(t=>{t.category&&a.add(t.category)}),a.forEach(t=>{const n=document.createElement("button");n.className="category-btn",n.dataset.category=t,n.textContent=t,h.appendChild(n)}),b(o)}catch(e){console.error(e),s.innerHTML='<div class="no-results">Zat\xEDm nebyly publikov\xE1ny \u017E\xE1dn\xE9 \u010Dl\xE1nky.</div>',i.hidden=!0,r.hidden=!0}h.addEventListener("click",e=>{if(e.target.classList.contains("category-btn")){document.querySelectorAll(".category-btn").forEach(t=>t.classList.remove("active")),e.target.classList.add("active");const a=e.target.dataset.category;if(l=c,a==="all")b(o);else{const t=o.filter(n=>n.category===a);y(t,a)}}}),d?.addEventListener("click",()=>{const e=Math.min(l,m.length);l+=c,u(m);const a=s.querySelectorAll(".blog-card")[e];a?.focus({preventScroll:!0}),a?.scrollIntoView({block:"start",behavior:"auto"})});function b(e){if(e.length===0)return;r.hidden=!1,i.hidden=!1,r.classList.add("mh-block-visible"),i.classList.add("mh-block-visible"),r.textContent="Nejnov\u011Bj\u0161\xED \u010Dl\xE1nky";const a=e[0],t=e.slice(1);p(a),l=Math.max(0,c-1),u(t)}function y(e,a){i.hidden=!0,i.classList.remove("mh-block-visible"),r.hidden=!1,r.classList.add("mh-block-visible"),r.textContent=`\u010Cl\xE1nky v kategorii: ${a}`,l=c,u(e)}function p(e){const a=new Date(e.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"long",day:"numeric"}),t=e.featured_image||"img/search-preview/blog.webp",n=e.readTime?`${e.readTime} min.`:"Zaj\xEDmavost";i.innerHTML=`
            <a href="blog/${e.slug}.html" class="featured-post">
                <div class="featured-post__image-wrapper">
                    <img src="${t}" alt="" role="presentation" class="featured-post__image" width="640" height="360" loading="eager" fetchpriority="high">
                </div>
                <div class="featured-post__content">
                    <div class="featured-post__meta">
                        <span>${e.category||"\u010Cl\xE1nek"}</span>
                        <span>\u2022</span>
                        <span>${a}</span>
                    </div>
                    <h2 class="featured-post__title">${e.title}</h2>
                    <p class="featured-post__desc">${e.short_description||""}</p>
                    <div class="featured-post__meta featured-post__meta--footer">
                        <span class="btn-read-more">\u010C\xEDst \u010Dl\xE1nek <span>\u203A</span></span>
                        <span>\u{1F4D6} ${n}</span>
                    </div>
                </div>
            </a>
        `}function u(e){if(m=e,s.innerHTML="",e.length===0){s.innerHTML='<div class="no-results">\u017D\xE1dn\xE9 dal\u0161\xED \u010Dl\xE1nky k zobrazen\xED.</div>',v(0,0);return}const a=e.slice(0,l);a.forEach(t=>{const n=new Date(t.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"short",day:"numeric"}),_=t.featured_image||"img/search-preview/blog.webp",k=t.readTime?`${t.readTime} min.`:"",g=document.createElement("a");g.href=`blog/${t.slug}.html`,g.className="blog-card",g.innerHTML=`
                <div class="blog-card-image-wrapper">
                    <img src="${_}" alt="" role="presentation" class="blog-card-image" width="480" height="270" loading="lazy">
                </div>
                <div class="blog-card-content">
                    <div class="blog-meta-small">
                        ${t.category||"\u010Cl\xE1nek"}
                    </div>
                    <div class="blog-title">${t.title}</div>
                    <div class="blog-desc">${t.short_description||""}</div>
                    <div class="blog-footer">
                        <span>\u{1F4C5} ${n}</span>
                        <span>\u{1F4D6} ${k}</span>
                    </div>
                </div>
            `,s.appendChild(g)}),v(a.length,e.length)}function v(e,a){if(f&&(f.textContent=`Zobrazeno ${e} z ${a} \u010Dl\xE1nk\u016F v seznamu.`),!d)return;const t=Math.max(0,a-e);d.hidden=t===0,d.textContent=t>0?`Na\u010D\xEDst dal\u0161\xED \u010Dl\xE1nky (${t})`:"V\u0161echny \u010Dl\xE1nky jsou zobrazen\xE9",d.setAttribute("aria-label",t>0?`Na\u010D\xEDst dal\u0161\xED \u010Dl\xE1nky. Zb\xFDv\xE1 ${t}`:"V\u0161echny \u010Dl\xE1nky jsou zobrazen\xE9")}});})();
