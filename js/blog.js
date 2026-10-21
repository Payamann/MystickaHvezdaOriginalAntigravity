document.addEventListener('DOMContentLoaded', async () => {

    const container = document.getElementById('blogContainer');
    const featuredContainer = document.getElementById('featuredContainer');
    const filterContainer = document.getElementById('categoryFilter');
    const gridTitle = document.getElementById('gridTitle');
    const loadMoreButton = document.getElementById('blog-load-more');
    const loadStatus = document.getElementById('blog-load-status');

    const PAGE_SIZE = 8;
    let allPosts = [];
    let currentGridPosts = [];
    let visibleCount = PAGE_SIZE;
    const staticFeaturedMarkup = featuredContainer.innerHTML;
    const staticGridMarkup = container.innerHTML;
    const staticFilterMarkup = filterContainer.innerHTML;
    const staticGridTitle = gridTitle.textContent;

    function responsiveAtlasImageAttributes(imageSrc, displaySize) {
        const source = String(imageSrc || '').split(/[?#]/, 1)[0];
        const isEditorial = /(?:^|\/)img\/atlas\/editorial-v1\/[^/]+\.webp$/i.test(source);
        const isTarot = /(?:^|\/)img\/tarot-v2\/tarot_[^/]+\.webp$/i.test(source);
        if (isTarot) {
            const base = source.slice(0, -'.webp'.length);
            return ` srcset="${base}-240.webp 240w, ${base}-360.webp 360w, ${source} 600w" sizes="${displaySize}"`;
        }
        if (!isEditorial && !/(?:^|\/)img\/atlas\/(?:social|tools)-v1\/[^/]+\.webp$/i.test(source)) return '';

        const base = isEditorial
            ? source.replace(/-1200\.webp$/i, '')
            : source.slice(0, -'.webp'.length);
        const candidates = isEditorial
            ? `${base}-480.webp 480w, ${base}-960.webp 960w, ${source} 1200w`
            : `${base}-480.webp 480w, ${base}-800.webp 800w, ${source} ${source.includes('social-v1/') ? 1080 : 1200}w`;
        return ` srcset="${candidates}" sizes="${displaySize}"`;
    }

    document.addEventListener('error', (event) => {
        const image = event.target;
        if (!(image instanceof HTMLImageElement)) return;
        if (!image.classList.contains('featured-post__image') && !image.classList.contains('blog-card-image')) return;

        image.hidden = true;
        image.closest('.featured-post__image-wrapper, .blog-card-image-wrapper')?.classList.add('blog-image-fallback');
    }, true);

    try {
        const response = await fetch('/data/blog-index.json?v=atlas-art-v1', { cache: 'no-cache' });
        if (!response.ok) throw new Error('Data index nebyl nalezen');
        allPosts = await response.json();
        if (!Array.isArray(allPosts) || allPosts.length === 0) throw new Error('Seznam článků je prázdný');

        container.innerHTML = '';

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
        featuredContainer.innerHTML = staticFeaturedMarkup;
        featuredContainer.hidden = false;
        container.innerHTML = staticGridMarkup;
        filterContainer.innerHTML = staticFilterMarkup;
        gridTitle.textContent = staticGridTitle;
        gridTitle.hidden = false;
        loadMoreButton?.setAttribute('hidden', '');

        const fallbackMessage = document.createElement('p');
        fallbackMessage.className = 'no-results';
        fallbackMessage.setAttribute('role', 'status');
        fallbackMessage.textContent = 'Aktuální seznam článků se nepodařilo načíst. Níže najdeš dostupné články.';
        container.prepend(fallbackMessage);
    }

    filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const cat = e.target.dataset.category;
            visibleCount = PAGE_SIZE;
            if (cat === 'all') {
                renderAll(allPosts);
            } else {
                const filtered = allPosts.filter(p => p.category === cat);
                renderFilteredGrid(filtered, cat);
            }
        }
    });

    loadMoreButton?.addEventListener('click', () => {
        const firstNewIndex = Math.min(visibleCount, currentGridPosts.length);
        visibleCount += PAGE_SIZE;
        renderPostsGrid(currentGridPosts);
        const firstNewCard = container.querySelectorAll('.blog-card')[firstNewIndex];
        firstNewCard?.focus({ preventScroll: true });
        firstNewCard?.scrollIntoView({ block: 'start', behavior: 'auto' });
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
        visibleCount = Math.max(0, PAGE_SIZE - 1);
        renderPostsGrid(rest);
    }

    function renderFilteredGrid(posts, categoryStr) {
        featuredContainer.hidden = true;
        featuredContainer.classList.remove('mh-block-visible');
        gridTitle.hidden = false;
        gridTitle.classList.add('mh-block-visible');
        gridTitle.textContent = `Články v kategorii: ${categoryStr}`;
        visibleCount = PAGE_SIZE;
        renderPostsGrid(posts);
    }

    function renderFeaturedPost(post) {
        const date = new Date(post.published_at).toLocaleDateString('cs-CZ', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const imageSrc = post.featured_image || 'img/search-preview/blog.webp';
        const readTime = post.readTime ? `${post.readTime} min.` : 'Zajímavost';

        featuredContainer.innerHTML = `
            <a href="blog/${post.slug}.html" class="featured-post">
                <div class="featured-post__image-wrapper">
                    <img src="${imageSrc}" alt="" role="presentation" class="featured-post__image" width="640" height="360" loading="eager" fetchpriority="high"${responsiveAtlasImageAttributes(imageSrc, '(max-width: 720px) 88vw, 640px')}>
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
                        <span><svg class="mh-symbol mh-symbol--inline" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#book"></use></svg>${readTime}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function renderPostsGrid(posts) {
        currentGridPosts = posts;
        container.innerHTML = '';
        if (posts.length === 0) {
            container.innerHTML = '<div class="no-results">Žádné další články k zobrazení.</div>';
            updateLoadMore(0, 0);
            return;
        }

        const shownPosts = posts.slice(0, visibleCount);
        shownPosts.forEach(post => {
            const date = new Date(post.published_at).toLocaleDateString('cs-CZ', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
            const imageSrc = post.featured_image || 'img/search-preview/blog.webp';
            const readTime = post.readTime ? `${post.readTime} min.` : '';

            const el = document.createElement('a');
            el.href = `blog/${post.slug}.html`;
            el.className = 'blog-card';
            el.innerHTML = `
                <div class="blog-card-image-wrapper">
                    <img src="${imageSrc}" alt="" role="presentation" class="blog-card-image" width="480" height="270" loading="lazy"${responsiveAtlasImageAttributes(imageSrc, '(max-width: 720px) 88vw, 320px')}>
                </div>
                <div class="blog-card-content">
                    <div class="blog-meta-small">
                        ${post.category || 'Článek'}
                    </div>
                    <div class="blog-title">${post.title}</div>
                    <div class="blog-desc">${post.short_description || ''}</div>
                    <div class="blog-footer">
                        <span><svg class="mh-symbol mh-symbol--inline" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#calendar"></use></svg>${date}</span>
                        ${readTime ? '<span><svg class="mh-symbol mh-symbol--inline" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#book"></use></svg>' + readTime + '</span>' : ''}
                    </div>
                </div>
            `;
            container.appendChild(el);
        });

        updateLoadMore(shownPosts.length, posts.length);
    }

    function updateLoadMore(shown, total) {
        if (loadStatus) loadStatus.textContent = `Zobrazeno ${shown} z ${total} článků v seznamu.`;
        if (!loadMoreButton) return;

        const remaining = Math.max(0, total - shown);
        loadMoreButton.hidden = remaining === 0;
        loadMoreButton.textContent = remaining > 0
            ? `Načíst další články (${remaining})`
            : 'Všechny články jsou zobrazené';
        loadMoreButton.setAttribute('aria-label', remaining > 0
            ? `Načíst další články. Zbývá ${remaining}`
            : 'Všechny články jsou zobrazené');
    }

});
