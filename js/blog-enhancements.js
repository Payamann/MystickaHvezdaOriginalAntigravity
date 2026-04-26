(function () {
  function enhanceArticleLinks() {
    document.querySelectorAll('.blog-post a[href^="http"]').forEach((link) => {
      if (link.hostname === window.location.hostname) return;
      link.rel = 'noopener noreferrer';
      link.target = '_blank';
    });
  }

  function markLoaded() {
    document.documentElement.classList.add('blog-enhancements-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhanceArticleLinks();
      markLoaded();
    }, { once: true });
  } else {
    enhanceArticleLinks();
    markLoaded();
  }
})();
