(function () {
    document.addEventListener('DOMContentLoaded', function () {
        var track = document.querySelector('.carousel-track');
        var container = document.querySelector('.carousel-container');
        if (!track || !container) return;

        var slides = Array.from(track.querySelectorAll('.carousel-slide'));
        if (!slides.length) return;

        var dots = document.createElement('div');
        dots.className = 'carousel-dots';

        var current = 0;

        function update(index) {
            current = index;
            dots.querySelectorAll('.carousel-dot').forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === index);
            });
        }

        slides.forEach(function (_, index) {
            var dot = document.createElement('button');
            dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Slide ' + (index + 1));
            dot.addEventListener('click', function () { update(index); });
            dots.appendChild(dot);
        });

        container.after(dots);

        var prev = container.querySelector('.carousel-btn.prev');
        var next = container.querySelector('.carousel-btn.next');

        if (prev) prev.addEventListener('click', function () { update(Math.max(0, current - 1)); });
        if (next) next.addEventListener('click', function () { update(Math.min(slides.length - 1, current + 1)); });
    });
})();
