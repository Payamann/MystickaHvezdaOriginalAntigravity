(()=>{document.addEventListener("DOMContentLoaded",async()=>{const r=document.getElementById("blogContainer"),i=document.getElementById("featuredContainer"),g=document.getElementById("categoryFilter"),s=document.getElementById("gridTitle"),c=document.getElementById("blog-load-more"),p=document.getElementById("blog-load-status"),m=8;let o=[],h=[],d=m;const $=i.innerHTML,L=r.innerHTML,_=g.innerHTML,E=s.textContent;function v(t,n){const e=String(t||"").split(/[?#]/,1)[0],a=/(?:^|\/)img\/atlas\/editorial-v1\/[^/]+\.webp$/i.test(e);if(/(?:^|\/)img\/tarot-v2\/tarot_[^/]+\.webp$/i.test(e)){const k=e.slice(0,-5);return` srcset="${k}-240.webp 240w, ${k}-360.webp 360w, ${e} 600w" sizes="${n}"`}if(!a&&!/(?:^|\/)img\/atlas\/(?:social|tools)-v1\/[^/]+\.webp$/i.test(e))return"";const l=a?e.replace(/-1200\.webp$/i,""):e.slice(0,-5);return` srcset="${a?`${l}-480.webp 480w, ${l}-960.webp 960w, ${e} 1200w`:`${l}-480.webp 480w, ${l}-800.webp 800w, ${e} ${e.includes("social-v1/")?1080:1200}w`}" sizes="${n}"`}document.addEventListener("error",t=>{const n=t.target;n instanceof HTMLImageElement&&(!n.classList.contains("featured-post__image")&&!n.classList.contains("blog-card-image")||(n.hidden=!0,n.closest(".featured-post__image-wrapper, .blog-card-image-wrapper")?.classList.add("blog-image-fallback")))},!0);try{const t=await fetch("/data/blog-index.json?v=atlas-art-v1",{cache:"no-cache"});if(!t.ok)throw new Error("Data index nebyl nalezen");if(o=await t.json(),!Array.isArray(o)||o.length===0)throw new Error("Seznam \u010Dl\xE1nk\u016F je pr\xE1zdn\xFD");r.innerHTML="";const n=new Set;o.forEach(e=>{e.category&&n.add(e.category)}),n.forEach(e=>{const a=document.createElement("button");a.className="category-btn",a.dataset.category=e,a.textContent=e,g.appendChild(a)}),w(o)}catch(t){console.error(t),i.innerHTML=$,i.hidden=!1,r.innerHTML=L,g.innerHTML=_,s.textContent=E,s.hidden=!1,c?.setAttribute("hidden","");const n=document.createElement("p");n.className="no-results",n.setAttribute("role","status"),n.textContent="Aktu\xE1ln\xED seznam \u010Dl\xE1nk\u016F se nepoda\u0159ilo na\u010D\xEDst. N\xED\u017Ee najde\u0161 dostupn\xE9 \u010Dl\xE1nky.",r.prepend(n)}g.addEventListener("click",t=>{if(t.target.classList.contains("category-btn")){document.querySelectorAll(".category-btn").forEach(e=>e.classList.remove("active")),t.target.classList.add("active");const n=t.target.dataset.category;if(d=m,n==="all")w(o);else{const e=o.filter(a=>a.category===n);T(e,n)}}}),c?.addEventListener("click",()=>{const t=Math.min(d,h.length);d+=m,b(h);const n=r.querySelectorAll(".blog-card")[t];n?.focus({preventScroll:!0}),n?.scrollIntoView({block:"start",behavior:"auto"})});function w(t){if(t.length===0)return;s.hidden=!1,i.hidden=!1,s.classList.add("mh-block-visible"),i.classList.add("mh-block-visible"),s.textContent="Nejnov\u011Bj\u0161\xED \u010Dl\xE1nky";const n=t[0],e=t.slice(1);x(n),d=Math.max(0,m-1),b(e)}function T(t,n){i.hidden=!0,i.classList.remove("mh-block-visible"),s.hidden=!1,s.classList.add("mh-block-visible"),s.textContent=`\u010Cl\xE1nky v kategorii: ${n}`,d=m,b(t)}function x(t){const n=new Date(t.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"long",day:"numeric"}),e=t.featured_image||"img/search-preview/blog.webp",a=t.readTime?`${t.readTime} min.`:"Zaj\xEDmavost";i.innerHTML=`
            <a href="blog/${t.slug}.html" class="featured-post">
                <div class="featured-post__image-wrapper">
                    <img src="${e}" alt="" role="presentation" class="featured-post__image" width="640" height="360" loading="eager" fetchpriority="high"${v(e,"(max-width: 720px) 88vw, 640px")}>
                </div>
                <div class="featured-post__content">
                    <div class="featured-post__meta">
                        <span>${t.category||"\u010Cl\xE1nek"}</span>
                        <span>\u2022</span>
                        <span>${n}</span>
                    </div>
                    <h2 class="featured-post__title">${t.title}</h2>
                    <p class="featured-post__desc">${t.short_description||""}</p>
                    <div class="featured-post__meta featured-post__meta--footer">
                        <span class="btn-read-more">\u010C\xEDst \u010Dl\xE1nek <span>\u203A</span></span>
                        <span><svg class="mh-symbol mh-symbol--inline" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#book"></use></svg>${a}</span>
                    </div>
                </div>
            </a>
        `}function b(t){if(h=t,r.innerHTML="",t.length===0){r.innerHTML='<div class="no-results">\u017D\xE1dn\xE9 dal\u0161\xED \u010Dl\xE1nky k zobrazen\xED.</div>',y(0,0);return}const n=t.slice(0,d);n.forEach(e=>{const a=new Date(e.published_at).toLocaleDateString("cs-CZ",{year:"numeric",month:"short",day:"numeric"}),f=e.featured_image||"img/search-preview/blog.webp",l=e.readTime?`${e.readTime} min.`:"",u=document.createElement("a");u.href=`blog/${e.slug}.html`,u.className="blog-card",u.innerHTML=`
                <div class="blog-card-image-wrapper">
                    <img src="${f}" alt="" role="presentation" class="blog-card-image" width="480" height="270" loading="lazy"${v(f,"(max-width: 720px) 88vw, 320px")}>
                </div>
                <div class="blog-card-content">
                    <div class="blog-meta-small">
                        ${e.category||"\u010Cl\xE1nek"}
                    </div>
                    <div class="blog-title">${e.title}</div>
                    <div class="blog-desc">${e.short_description||""}</div>
                    <div class="blog-footer">
                        <span><svg class="mh-symbol mh-symbol--inline" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#calendar"></use></svg>${a}</span>
                        ${l?'<span><svg class="mh-symbol mh-symbol--inline" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#book"></use></svg>'+l+"</span>":""}
                    </div>
                </div>
            `,r.appendChild(u)}),y(n.length,t.length)}function y(t,n){if(p&&(p.textContent=`Zobrazeno ${t} z ${n} \u010Dl\xE1nk\u016F v seznamu.`),!c)return;const e=Math.max(0,n-t);c.hidden=e===0,c.textContent=e>0?`Na\u010D\xEDst dal\u0161\xED \u010Dl\xE1nky (${e})`:"V\u0161echny \u010Dl\xE1nky jsou zobrazen\xE9",c.setAttribute("aria-label",e>0?`Na\u010D\xEDst dal\u0161\xED \u010Dl\xE1nky. Zb\xFDv\xE1 ${e}`:"V\u0161echny \u010Dl\xE1nky jsou zobrazen\xE9")}});})();
