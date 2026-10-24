(()=>{document.addEventListener("DOMContentLoaded",async()=>{const c=document.getElementById("blogContainer"),g=document.getElementById("featuredContainer"),f=document.getElementById("categoryFilter"),l=document.getElementById("gridTitle"),r=document.getElementById("blogResultsCount"),i=document.getElementById("blogLoadMore"),v=document.getElementById("blogSearch");let d=[],m=6,u=[],o="all";const y=Array.from(c.querySelectorAll(".blog-card"));y.slice(6).forEach(e=>{e.hidden=!0}),i&&(i.hidden=!0),r&&(r.hidden=!0),document.addEventListener("error",e=>{const t=e.target;t instanceof HTMLImageElement&&(!t.classList.contains("featured-post__image")&&!t.classList.contains("blog-card-image")||(t.hidden=!0,t.closest(".featured-post__image-wrapper, .blog-card-image-wrapper")?.classList.add("blog-image-fallback")))},!0);try{const e=await fetch("/data/blog-index.json?v=atlas-art-v1",{cache:"no-cache"});if(!e.ok)throw new Error("Data index nebyl nalezen");if(d=await e.json(),d.length===0)throw new Error("\u017D\xE1dn\xE9 \u010Dl\xE1nky");c.innerHTML="";const t=new Set;d.forEach(n=>{n.category&&t.add(n.category)}),t.forEach(n=>{const s=document.createElement("button");s.className="category-btn",s.dataset.category=n,s.textContent=n,f.appendChild(s)}),f.hidden=!1;const a=v?.closest(".blog-search");a&&(a.hidden=!1),p(d)}catch(e){console.error(e),y.forEach(t=>{t.hidden=!1}),i&&(i.hidden=!0),r&&(r.hidden=!0)}f.addEventListener("click",e=>{e.target.classList.contains("category-btn")&&(document.querySelectorAll(".category-btn").forEach(t=>t.classList.remove("active")),e.target.classList.add("active"),o=e.target.dataset.category||"all",E())}),v?.addEventListener("input",E),i?.addEventListener("click",()=>{m+=6,b(u)});function p(e){if(e.length===0)return;l.hidden=!1,g.hidden=!1,l.classList.add("mh-block-visible"),g.classList.add("mh-block-visible"),l.textContent="Nejnov\u011Bj\u0161\xED \u010Dl\xE1nky";const t=e[0];u=e.slice(1),m=6,L(t),b(u)}function E(){const e=_(v?.value||"");if(o==="all"&&!e){p(d);return}const t=d.filter(a=>{const n=o==="all"||a.category===o,s=_(`${a.title||""} ${a.short_description||""} ${a.category||""}`);return n&&(!e||s.includes(e))});g.hidden=!0,g.classList.remove("mh-block-visible"),l.hidden=!1,l.classList.add("mh-block-visible"),l.textContent=e?o==="all"?"V\xFDsledky hled\xE1n\xED":`V\xFDsledky v kategorii: ${o}`:`\u010Cl\xE1nky v kategorii: ${o}`,u=t,m=6,b(u)}function L(e){const t=new Date(e.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"long",day:"numeric"}),a=e.featured_image||"img/search-preview/blog.webp",n=e.readTime?`${e.readTime} min.`:"Zaj\xEDmavost";g.innerHTML=`
            <a href="blog/${e.slug}.html" class="featured-post">
                <div class="featured-post__image-wrapper">
                    <img src="${a}" alt="" role="presentation" class="featured-post__image" width="640" height="360" loading="eager" fetchpriority="high">
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
        `}function b(e){if(c.innerHTML="",e.length===0){c.innerHTML='<div class="no-results">Tomuto hled\xE1n\xED neodpov\xEDd\xE1 \u017E\xE1dn\xFD \u010Dl\xE1nek.</div>',r&&(r.textContent="0 polo\u017Eek",r.hidden=!1),i&&(i.hidden=!0);return}e.slice(0,m).forEach(a=>{const n=new Date(a.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"short",day:"numeric"}),s=a.featured_image||"img/search-preview/blog.webp",$=a.readTime?`${a.readTime} min.`:"",h=document.createElement("a");h.href=`blog/${a.slug}.html`,h.className="blog-card",h.innerHTML=`
                <div class="blog-card-image-wrapper">
                    <img src="${s}" alt="" role="presentation" class="blog-card-image" width="480" height="270" loading="lazy">
                </div>
                <div class="blog-card-content">
                    <div class="blog-meta-small">
                        ${a.category||"\u010Cl\xE1nek"}
                    </div>
                    <div class="blog-title">${a.title}</div>
                    <div class="blog-desc">${a.short_description||""}</div>
                    <div class="blog-footer">
                        <span>\u{1F4C5} ${n}</span>
                        <span>\u{1F4D6} ${$}</span>
                    </div>
                </div>
            `,c.appendChild(h)});const t=Math.min(m,e.length);r&&(r.textContent=`Zobrazeno ${t} z ${e.length} polo\u017Eek`,r.hidden=!1),i&&(i.hidden=t>=e.length)}function _(e){return String(e||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g," ")}});})();
