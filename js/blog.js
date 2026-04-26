document.addEventListener('DOMContentLoaded', async () => {

    const container = document.getElementById('blogContainer');
    const featuredContainer = document.getElementById('featuredContainer');
    const filterContainer = document.getElementById('categoryFilter');
    const gridTitle = document.getElementById('gridTitle');

    let allPosts = [];

    document.addEventListener('error', (event) => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement)) return;
        if (!image.classList.contains('featured-post__image') && !image.classList.contains('blog-card-image')) return;

        image.hidden = true;
        image.closest('.featured-post__image-wrapper, .blog-card-image-wrapper')?.classList.add('blog-image-fallback');
    }, true);

    try {
        const response = await fetch('/data/blog-index.json');
        if (!response.ok) throw new Error('Data index nebyl nalezen');
        allPosts = await response.json();

        container.innerHTML = '';

        if (allPosts.length === 0) {
            throw new Error("Žádné články");
        }

        const categories = new Set();
        allPosts.forEach(p => { if (p.category) categories.add(p.category); });

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.dataset.category = cat;
            btn.textContent = cat;
            filterContainer.appendChild(btn);
        });

        renderAll(allPosts);

    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="no-results">Zatím nebyly publikovány žádné články.</div>';
        featuredContainer.hidden = true;
        gridTitle.hidden = true;
    }

    filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const cat = e.target.dataset.category;
            if (cat === 'all') {
                renderAll(allPosts);
            } else {
                const filtered = allPosts.filter(p => p.category === cat);
                renderFilteredGrid(filtered, cat);
            }
        }
    });

    function renderAll(posts) {
        if (posts.length === 0) return;

        gridTitle.hidden = false;
        featuredContainer.hidden = false;
        gridTitle.classList.add('mh-block-visible');
        featuredContainer.classList.add('mh-block-visible');
        gridTitle.textContent = "Nejnovější články";

        const featured = posts[0];
        const rest = posts.slice(1);

        renderFeaturedPost(featured);
        renderPostsGrid(rest);
    }

    function renderFilteredGrid(posts, categoryStr) {
        featuredContainer.hidden = true;
        featuredContainer.classList.remove('mh-block-visible');
        gridTitle.hidden = false;
        gridTitle.classList.add('mh-block-visible');
        gridTitle.textContent = `Články v kategorii: ${categoryStr}`;
        renderPostsGrid(posts);
    }

    function renderFeaturedPost(post) {
        const date = new Date(post.published_at).toLocaleDateString('cs-CZ', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const imageSrc = post.featured_image || 'img/hero-3d.webp';
        const readTime = post.readTime ? `${post.readTime} min.` : 'Zajímavost';

        featuredContainer.innerHTML = `
            <a href="blog/${post.slug}.html" class="featured-post">
                <div class="featured-post__image-wrapper">
                    <img src="${imageSrc}" alt="" role="presentation" class="featured-post__image" loading="lazy">
                </div>
                <div class="featured-post__content">
                    <div class="featured-post__meta">
                        <span>${post.category || 'Článek'}</span>
                        <span>•</span>
                        <span>${date}</span>
                    </div>
                    <h2 class="featured-post__title">${post.title}</h2>
                    <p class="featured-post__desc">${post.short_description || ''}</p>
                    <div class="featured-post__meta featured-post__meta--footer">
                        <span class="btn-read-more">Číst článek <span>›</span></span>
                        <span>📖 ${readTime}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function renderPostsGrid(posts) {
        container.innerHTML = '';
        if (posts.length === 0) {
            container.innerHTML = '<div class="no-results">Žádné další články k zobrazení.</div>';
            return;
        }

        posts.forEach(post => {
            const date = new Date(post.published_at).toLocaleDateString('cs-CZ', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            const imageSrc = post.featured_image || 'img/hero-3d.webp';
            const readTime = post.readTime ? `${post.readTime} min.` : '';

            const el = document.createElement('a');
            el.href = `blog/${post.slug}.html`;
            el.className = 'blog-card';
            el.innerHTML = `
                <div class="blog-card-image-wrapper">
                    <img src="${imageSrc}" alt="" role="presentation" class="blog-card-image" loading="lazy">
                </div>
                <div class="blog-card-content">
                    <div class="blog-meta-small">
                        ${post.category || 'Článek'}
                    </div>
                    <div class="blog-title">${post.title}</div>
                    <div class="blog-desc">${post.short_description || ''}</div>
                    <div class="blog-footer">
                        <span>📅 ${date}</span>
                        <span>📖 ${readTime}</span>
                    </div>
                </div>
            `;
            container.appendChild(el);
        });
    }

});
