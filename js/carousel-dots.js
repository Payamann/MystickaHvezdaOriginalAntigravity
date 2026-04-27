(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var track = document.querySelector('.carousel-track');
        var container = document.querySelector('.carousel-container');
        if (!track || !container) return;

        var viewport = container.querySelector('.carousel-track-container');
        var slides = Array.from(track.querySelectorAll('.carousel-slide'));
        if (!viewport || !slides.length) return;

        var dots = document.createElement('div');
        dots.className = 'carousel-dots';

        var current = 0;
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function getStepSize() {
            var firstSlide = slides[0];
            var gap = parseFloat(getComputedStyle(track).gap) || 0;
            return firstSlide.getBoundingClientRect().width + gap;
        }

        function update(index, shouldScroll) {
            current = Math.max(0, Math.min(index, slides.length - 1));
            dots.querySelectorAll('.carousel-dot').forEach(function (dot, dotIndex) {
                var isActive = dotIndex === current;
                dot.classList.toggle('active', isActive);
                dot.setAttribute('aria-current', isActive ? 'true' : 'false');
                dot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            if (shouldScroll) {
                viewport.scrollTo({
                    left: getStepSize() * current,
                    behavior: reduceMotion ? 'auto' : 'smooth'
                });
            }
        }

        slides.forEach(function (_, index) {
            var dot = document.createElement('button');
            dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
            dot.type = 'button';
            dot.setAttribute('aria-label', 'Přejít na referenci ' + (index + 1));
            dot.setAttribute('aria-current', index === 0 ? 'true' : 'false');
            dot.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
            dot.addEventListener('click', function () { update(index, true); });
            dots.appendChild(dot);
        });

        container.after(dots);

        var ticking = false;

        viewport.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var step = getStepSize();
                if (step > 0) update(Math.round(viewport.scrollLeft / step), false);
                ticking = false;
            });
        }, { passive: true });
    });
})();
