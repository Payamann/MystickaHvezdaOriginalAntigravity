document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { indigo: 0, gold: 0, green: 0, red: 0 };
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
    "indigo": {
        "title": "Indigo",
        "subtitle": "Odstup a pozornost",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#eye\"></use></svg>",
        "desc": "V kvízu převažuje motiv pozorování a vnitřního prostoru. Indigo je jeho symbolická barva; nejde o měření aury.",
        "advice": "Odděl u jedné situace vlastní dojem od známých faktů."
    },
    "gold": {
        "title": "Zlatá",
        "subtitle": "Vyjádření a záměr",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#star\"></use></svg>",
        "desc": "Tvoje odpovědi se přiklánějí k viditelnému projevu a iniciativě. Zlatá zde tvoří obraz tohoto motivu, ne potvrzení zvláštní energie.",
        "advice": "Sdílej jeden nápad a nech si prostor pro odezvu."
    },
    "green": {
        "title": "Zelená",
        "subtitle": "Péče a vzájemnost",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#leaf\"></use></svg>",
        "desc": "V odpovědích vystupuje blízkost a péče. Zelená může tento motiv připomínat; kvíz neposuzuje zdraví ani léčivé schopnosti.",
        "advice": "Zeptej se jednoho blízkého, co by mu pomohlo, a pojmenuj i vlastní potřebu."
    },
    "red": {
        "title": "Červená",
        "subtitle": "Pohyb a rozhodnutí",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#flame\"></use></svg>",
        "desc": "Volby v kvízu dávají prostor činnosti a přímému jednání. Červená je symbol takto popsaného přístupu, nikoliv fyzický nález.",
        "advice": "Vyber jeden praktický úkol a bezpečný první krok."
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

        window.lastResult = data.title;

        const resultHtml = `
            <div class="result-card quiz-result-card">
                <div class="result-card__header">
                    <h4 class="result-card__title quiz-result-title">${data.title}</h4>
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
    document.addEventListener("click", (e) => {
        const action = e.target.getAttribute("data-action");
        if (action === "shareResult") {
            window.shareResult();
        } else if (action === "reloadPage") {
            location.reload();
        }
    });
    window.shareResult = () => {
        const text = `V symbolickém kvízu se s mými odpověďmi propojil barevný motiv ${window.lastResult}.`;
        if (navigator.share) {
            navigator.share({
                title: 'Moje Aura',
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
