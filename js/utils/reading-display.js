const fallbackMessages = {
    cs: 'Základní symbolický výklad. Osobní generování teď není dostupné.',
    sk: 'Základný symbolický výklad. Osobné generovanie teraz nie je dostupné.',
    pl: 'Podstawowa interpretacja symboliczna. Indywidualne generowanie jest teraz niedostępne.'
};

export function getFallbackMessage(language = 'cs') {
    return fallbackMessages[String(language).slice(0, 2)] || fallbackMessages.cs;
}

export function showFallbackNotice(container, fallback) {
    if (!container) return;
    container.querySelector('[data-reading-fallback-notice]')?.remove();
    if (!fallback) return;
    const notice = document.createElement('p');
    notice.dataset.readingFallbackNotice = 'true';
    notice.className = 'result-context-notice';
    notice.setAttribute('role', 'status');
    notice.textContent = getFallbackMessage(document.documentElement.lang);
    container.prepend(notice);
}

export function formatReadingHtml(value) {
    const text = String(value || '').replace(/```(?:html)?/g, '').trim();
    if (window.DOMPurify?.sanitize) {
        return window.DOMPurify.sanitize(text.replace(/\n/g, '<br>'), {
            ALLOWED_TAGS: ['h3', 'h4', 'h5', 'p', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'blockquote', 'br'],
            ALLOWED_ATTR: []
        });
    }
    const element = document.createElement('div');
    element.textContent = text.replace(/<[^>]*>/g, '');
    return element.innerHTML.replace(/\n/g, '<br>');
}
