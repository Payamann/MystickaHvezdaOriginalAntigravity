(function () {
  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text || '';
    return element;
  }

  function getCurrentSlug() {
    const fileName = window.location.pathname.split('/').pop() || '';
    return decodeURIComponent(fileName.replace(/\.html$/i, ''));
  }

  function buildRelatedPosts(posts, currentSlug) {
    const currentPost = posts.find((post) => post.slug === currentSlug);
    const candidates = posts.filter((post) => post.slug !== currentSlug);

    if (!currentPost?.category) {
      return candidates.slice(0, 3);
    }

    const sameCategory = candidates.filter((post) => post.category === currentPost.category);
    const fallback = candidates.filter((post) => post.category !== currentPost.category);

    return [...sameCategory, ...fallback].slice(0, 3);
  }

  function renderPostCard(post) {
    const link = document.createElement('a');
    link.className = 'related-post-card';
    link.href = `/blog/${post.slug}.html`;

    link.appendChild(createTextElement('span', 'related-post-card__category', post.category || 'Clanek'));
    link.appendChild(createTextElement('strong', 'related-post-card__title', post.title));
    link.appendChild(createTextElement('span', 'related-post-card__cta', 'Cist dal'));

    return link;
  }

  async function initRelatedPosts() {
    const grid = document.getElementById('related-posts-grid');
    const section = document.getElementById('related-posts-section');
    if (!grid) return;

    try {
      const response = await fetch('/data/blog-index.json', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Blog index unavailable');

      const posts = await response.json();
      const relatedPosts = buildRelatedPosts(posts, getCurrentSlug());

      if (!relatedPosts.length) {
        if (section) section.hidden = true;
        return;
      }

      grid.textContent = '';
      relatedPosts.forEach((post) => grid.appendChild(renderPostCard(post)));
    } catch (error) {
      console.warn('[blog-related] Related posts unavailable', error);
      if (section) section.hidden = true;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRelatedPosts, { once: true });
  } else {
    initRelatedPosts();
  }
})();
