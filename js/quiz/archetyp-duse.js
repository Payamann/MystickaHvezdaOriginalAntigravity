/**
 * Archetyp Vaší Duše Quiz
 * Interactive tarot archetype discovery test
 */

document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { magician: 0, priestess: 0, empress: 0, hermit: 0, star: 0 };
    let currentStep = 1;
    const totalSteps = steps.length;

    function setProgress(percent) {
        const rounded = Math.max(0, Math.min(100, Math.round(percent / 5) * 5));
        progressBar.setAttribute("aria-valuenow", String(rounded));
        progressBar.setAttribute("aria-valuetext", `${rounded}% dokončeno`);
        progressBar.classList.forEach((className) => {
            if (className.startsWith('progress-width-')) progressBar.classList.remove(className);
        });
        progressBar.classList.add(`progress-width-${rounded}`);
    }

    const resultsData = {
    "magician": {
        "title": "Mág",
        "subtitle": "Použít dostupné možnosti",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#tarot\"></use></svg>",
        "desc": "V odpovědích vystupuje iniciativa a chuť něco vytvářet. Mág může být obrazem práce s tím, co už máš po ruce.",
        "advice": "Vyber jeden nápad a první nástroj, kterým ho můžeš vyzkoušet."
    },
    "priestess": {
        "title": "Velekněžka",
        "subtitle": "Všímat si nejasného",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#dream\"></use></svg>",
        "desc": "Tvoje volby v kvízu se přiklánějí k pozorování a prostoru pro vlastní dojem. Dojem může otevřít otázku; není sám důkazem.",
        "advice": "Zapiš jeden postřeh a způsob, jak si ho ověřit."
    },
    "empress": {
        "title": "Císařovna",
        "subtitle": "Podmínky pro růst",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#flower\"></use></svg>",
        "desc": "V kvízu se objevuje motiv péče a tvořivosti. Císařovna ho může připomenout jako každodenní činnost, ne jako povinnost starat se o všechny.",
        "advice": "Věnuj chvíli něčemu, co chceš rozvíjet i pro sebe."
    },
    "hermit": {
        "title": "Poustevník",
        "subtitle": "Odstup a soustředění",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#compass\"></use></svg>",
        "desc": "Odpovědi zdůrazňují tiché hledání vlastního pohledu. Poustevník nabízí obraz soustředění, nikoliv příkaz izolovat se.",
        "advice": "Nech si deset nerušených minut na jednu vlastní otázku."
    },
    "star": {
        "title": "Hvězda",
        "subtitle": "Naděje s konkrétním základem",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#star\"></use></svg>",
        "desc": "Ve tvých odpovědích má místo naděje a představa dalšího směru. Symbol Hvězdy se dá spojit s drobným krokem, který opravdu můžeš ovlivnit.",
        "advice": "Připomeň si jeden doložený pokrok a navazující malý krok."
    }
};

    function updateProgress() {
        const percent = ((currentStep - 1) / totalSteps) * 100;
        setProgress(percent);
    }

    function showStep(stepNum) {
        steps.forEach(s => s.classList.remove('active'));
        const nextStep = document.querySelector(`.question-step[data-step="${stepNum}"]`);
        if (nextStep) {
            nextStep.classList.add('active');
            updateProgress();
            const heading = nextStep.querySelector('h3');
            heading?.focus({ preventScroll: true });
            heading?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start'
            });
        } else {
            setProgress(100);
            showResult();
        }
    }


    function showResult() {
        const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const data = resultsData[winner];
        const tied = Object.keys(scores).filter(key => scores[key] === scores[winner]);

        // Store result for sharing
        window.lastResult = data.title;

        const resultHtml = `
            <div class="result-card quiz-result-card">
                <div class="result-card__header">
                    <h4 class="result-card__title">${data.title}</h4>
                    <p class="quiz-result-kicker">Symbolické shrnutí tvých odpovědí</p>
                </div>
                <div class="result-card__image">${data.icon}</div>
                <div class="result-card__body">
                    ${tied.length > 1 ? `<p class="quiz-result-mixed">Více motivů má stejnou váhu: ${tied.map(key => resultsData[key].title).join(', ')}.</p>` : ''}
                    <h5 class="quiz-result-subtitle">${data.subtitle}</h5>
                    <p class="quiz-result-description">${data.desc}</p>
                </div>
                <div class="result-card__footer quiz-result-footer">
                    <p class="quiz-result-advice">"${data.advice}"</p>
                </div>
            </div>
            <div class="mt-xl"><p>Výsledek krátkého kvízu nabízí téma k zamyšlení. Nepotvrzuje schopnosti, osobnost ani budoucnost.</p></div>
        `;

        const resultStep = document.getElementById('result-step');
        document.getElementById('result-box').innerHTML = resultHtml;
        resultStep.classList.add('active');
        resultStep.setAttribute('tabindex', '-1');
        resultStep.focus({ preventScroll: true });
        resultStep.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }

    // Attach event listeners to option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.closest('.question-step')?.classList.contains('active')) return;
            const scoreKey = btn.dataset.score;
            if (!Object.hasOwn(scores, scoreKey)) return;
            scores[scoreKey]++;
            currentStep++;
            showStep(currentStep);
        });
    });

    // Event delegation for share and reload buttons
    document.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        if (action === 'shareResult') {
            window.shareResult();
        } else if (action === 'reloadPage') {
            location.reload();
        }
    });

    window.shareResult = () => {
        const text = `V symbolickém kvízu se s mými odpověďmi propojila karta ${window.lastResult}. Zkus si k ní najít vlastní význam.`;
        if (navigator.share) {
            navigator.share({
                title: 'Můj Tarotový Archetyp',
                text: text,
                url: window.location.href
            }).catch(console.error);
        } else {
            const dummy = document.createElement('input');
            document.body.appendChild(dummy);
            dummy.value = text + ' ' + window.location.href;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
            alert('Výsledek zkopírován do schránky!');
        }
    };
});
