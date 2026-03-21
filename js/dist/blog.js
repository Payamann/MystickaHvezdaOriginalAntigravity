document.addEventListener("DOMContentLoaded",async()=>{const s=document.getElementById("blogContainer"),l=document.getElementById("featuredContainer"),d=document.getElementById("categoryFilter"),i=document.getElementById("gridTitle");let r=[];try{const e=await fetch("/data/blog-index.json");if(!e.ok)throw new Error("Data index nebyl nalezen");if(r=await e.json(),s.innerHTML="",r.length===0)throw new Error("\u017D\xE1dn\xE9 \u010Dl\xE1nky");const t=new Set;r.forEach(n=>{n.category&&t.add(n.category)}),t.forEach(n=>{const a=document.createElement("button");a.className="category-btn",a.dataset.category=n,a.textContent=n,d.appendChild(a)}),c(r)}catch(e){console.error(e),s.innerHTML='<div class="no-results">Zat\xEDm nebyly publikov\xE1ny \u017E\xE1dn\xE9 \u010Dl\xE1nky.</div>',l.style.display="none",i.style.display="none"}d.addEventListener("click",e=>{if(e.target.classList.contains("category-btn")){document.querySelectorAll(".category-btn").forEach(n=>n.classList.remove("active")),e.target.classList.add("active");const t=e.target.dataset.category;if(t==="all")c(r);else{const n=r.filter(a=>a.category===t);m(n,t)}}});function c(e){if(e.length===0)return;i.style.display="block",l.style.display="block",i.textContent="Nejnov\u011Bj\u0161\xED \u010Dl\xE1nky";const t=e[0],n=e.slice(1);y(t),g(n)}function m(e,t){l.style.display="none",i.style.display="block",i.textContent=`\u010Cl\xE1nky v kategorii: ${t}`,g(e)}function y(e){const t=new Date(e.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"long",day:"numeric"}),n=e.featured_image||"img/hero-3d.webp",a=e.readTime?`${e.readTime} min.`:"Zaj\xEDmavost";l.innerHTML=`
            <a href="blog/${e.slug}.html" class="featured-post">
                <div class="featured-post__image-wrapper">
                    <img src="${n}" alt="" role="presentation" class="featured-post__image" loading="lazy"
                        onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg,#1a0a2e,#2d1747)';">
                </div>
                <div class="featured-post__content">
                    <div class="featured-post__meta">
                        <span>${e.category||"\u010Cl\xE1nek"}</span>
                        <span>\u2022</span>
                        <span>${t}</span>
                    </div>
                    <h2 class="featured-post__title">${e.title}</h2>
                    <p class="featured-post__desc">${e.short_description||""}</p>
                    <div class="featured-post__meta" style="margin-bottom:0; justify-content:space-between; align-items:center;">
                        <span class="btn-read-more">\u010C\xEDst \u010Dl\xE1nek <span>\u203A</span></span>
                        <span>\u{1F4D6} ${a}</span>
                    </div>
                </div>
            </a>
        `}function g(e){if(s.innerHTML="",e.length===0){s.innerHTML='<div class="no-results">\u017D\xE1dn\xE9 dal\u0161\xED \u010Dl\xE1nky k zobrazen\xED.</div>';return}e.forEach(t=>{const n=new Date(t.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"short",day:"numeric"}),a=t.featured_image||"img/hero-3d.webp",u=t.readTime?`${t.readTime} min.`:"",o=document.createElement("a");o.href=`blog/${t.slug}.html`,o.className="blog-card",o.innerHTML=`
                <div style="overflow:hidden; border-radius:16px 16px 0 0;">
                    <img src="${a}" alt="" role="presentation" class="blog-card-image" loading="lazy"
                        onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg,#1a0a2e,#2d1747)'; this.parentElement.style.height='185px';">
                </div>
                <div class="blog-card-content">
                    <div class="blog-meta-small">
                        ${t.category||"\u010Cl\xE1nek"}
                    </div>
                    <div class="blog-title">${t.title}</div>
                    <div class="blog-desc">${t.short_description||""}</div>
                    <div class="blog-footer">
                        <span>\u{1F4C5} ${n}</span>
                        <span>\u{1F4D6} ${u}</span>
                    </div>
                </div>
            `,s.appendChild(o)})}});
