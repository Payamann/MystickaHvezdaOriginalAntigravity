(()=>{document.addEventListener("DOMContentLoaded",async()=>{const d=document.getElementById("blogContainer"),s=document.getElementById("featuredContainer"),o=document.getElementById("categoryFilter"),r=document.getElementById("gridTitle");let i=[];document.addEventListener("error",e=>{const t=e.target;t instanceof HTMLImageElement&&(!t.classList.contains("featured-post__image")&&!t.classList.contains("blog-card-image")||(t.hidden=!0,t.closest(".featured-post__image-wrapper, .blog-card-image-wrapper")?.classList.add("blog-image-fallback")))},!0);try{const e=await fetch("/data/blog-index.json");if(!e.ok)throw new Error("Data index nebyl nalezen");if(i=await e.json(),d.innerHTML="",i.length===0)throw new Error("\u017D\xE1dn\xE9 \u010Dl\xE1nky");const t=new Set;i.forEach(a=>{a.category&&t.add(a.category)}),t.forEach(a=>{const n=document.createElement("button");n.className="category-btn",n.dataset.category=a,n.textContent=a,o.appendChild(n)}),c(i)}catch(e){console.error(e),d.innerHTML='<div class="no-results">Zat\xEDm nebyly publikov\xE1ny \u017E\xE1dn\xE9 \u010Dl\xE1nky.</div>',s.hidden=!0,r.hidden=!0}o.addEventListener("click",e=>{if(e.target.classList.contains("category-btn")){document.querySelectorAll(".category-btn").forEach(a=>a.classList.remove("active")),e.target.classList.add("active");const t=e.target.dataset.category;if(t==="all")c(i);else{const a=i.filter(n=>n.category===t);m(a,t)}}});function c(e){if(e.length===0)return;r.hidden=!1,s.hidden=!1,r.classList.add("mh-block-visible"),s.classList.add("mh-block-visible"),r.textContent="Nejnov\u011Bj\u0161\xED \u010Dl\xE1nky";const t=e[0],a=e.slice(1);u(t),g(a)}function m(e,t){s.hidden=!0,s.classList.remove("mh-block-visible"),r.hidden=!1,r.classList.add("mh-block-visible"),r.textContent=`\u010Cl\xE1nky v kategorii: ${t}`,g(e)}function u(e){const t=new Date(e.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"long",day:"numeric"}),a=e.featured_image||"img/hero-3d.webp",n=e.readTime?`${e.readTime} min.`:"Zaj\xEDmavost";s.innerHTML=`
            <a href="blog/${e.slug}.html" class="featured-post">
                <div class="featured-post__image-wrapper">
                    <img src="${a}" alt="" role="presentation" class="featured-post__image" loading="lazy">
                </div>
                <div class="featured-post__content">
                    <div class="featured-post__meta">
                        <span>${e.category||"\u010Cl\xE1nek"}</span>
                        <span>\u2022</span>
                        <span>${t}</span>
                    </div>
                    <h2 class="featured-post__title">${e.title}</h2>
                    <p class="featured-post__desc">${e.short_description||""}</p>
                    <div class="featured-post__meta featured-post__meta--footer">
                        <span class="btn-read-more">\u010C\xEDst \u010Dl\xE1nek <span>\u203A</span></span>
                        <span>\u{1F4D6} ${n}</span>
                    </div>
                </div>
            </a>
        `}function g(e){if(d.innerHTML="",e.length===0){d.innerHTML='<div class="no-results">\u017D\xE1dn\xE9 dal\u0161\xED \u010Dl\xE1nky k zobrazen\xED.</div>';return}e.forEach(t=>{const a=new Date(t.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"short",day:"numeric"}),n=t.featured_image||"img/hero-3d.webp",f=t.readTime?`${t.readTime} min.`:"",l=document.createElement("a");l.href=`blog/${t.slug}.html`,l.className="blog-card",l.innerHTML=`
                <div class="blog-card-image-wrapper">
                    <img src="${n}" alt="" role="presentation" class="blog-card-image" loading="lazy">
                </div>
                <div class="blog-card-content">
                    <div class="blog-meta-small">
                        ${t.category||"\u010Cl\xE1nek"}
                    </div>
                    <div class="blog-title">${t.title}</div>
                    <div class="blog-desc">${t.short_description||""}</div>
                    <div class="blog-footer">
                        <span>\u{1F4C5} ${a}</span>
                        <span>\u{1F4D6} ${f}</span>
                    </div>
                </div>
            `,d.appendChild(l)})}});})();
