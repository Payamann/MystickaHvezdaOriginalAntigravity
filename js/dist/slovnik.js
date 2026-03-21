document.addEventListener("DOMContentLoaded",async()=>{const o=document.getElementById("termsContainer"),d=document.getElementById("searchInput");let s=[];try{const e=await fetch("/data/dictionary-index.json");if(!e.ok)throw new Error("Data index nebyl nalezen");s=await e.json(),a(s)}catch(e){console.error(e),o.innerHTML='<div class="no-results">Zat\xEDm nebyly p\u0159id\xE1ny \u017E\xE1dn\xE9 pojmy. Hv\u011Bzdy ml\u010D\xED.</div>'}d.addEventListener("input",e=>{const n=e.target.value.toLowerCase(),t=s.filter(r=>r.title.toLowerCase().includes(n)||r.short_description&&r.short_description.toLowerCase().includes(n)||r.category&&r.category.toLowerCase().includes(n));a(t)});function a(e){if(o.innerHTML="",e.length===0){o.innerHTML='<div class="no-results">Nebyl nalezen \u017E\xE1dn\xFD pojem odpov\xEDdaj\xEDc\xED va\u0161emu zad\xE1n\xED.</div>';return}e.forEach(n=>{const t=document.createElement("a");t.href=`slovnik/${n.slug}.html`,t.className="term-card",t.innerHTML=`

                        <div class="term-category">${n.category||"Obecn\xE9"}</div>

                        <div class="term-title">${n.title}</div>

                        <div class="term-desc">${n.short_description||""}</div>

                    `,o.appendChild(t)})}});
