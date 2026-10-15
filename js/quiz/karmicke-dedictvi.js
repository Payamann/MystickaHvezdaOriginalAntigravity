document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { sage: 0, wanderer: 0, healer: 0, warrior: 0 };
    let currentStep = 1;
    const totalSteps = steps.length;

    function setProgress(percent) {
        const rounded = Math.max(0, Math.min(100, Math.round(percent / 5) * 5));
        progressBar.classList.forEach((className) => {
            if (className.startsWith('progress-width-')) progressBar.classList.remove(className);
        });
        progressBar.classList.add(`progress-width-${rounded}`);
    }

    const resultsData = {
    "sage": {
        "title": "Strážce vědění",
        "subtitle": "Učení a předávání",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#book\"></use></svg>",
        "desc": "Tvoje odpovědi se v tomto kvízu pojí s poznáváním a předáváním zkušeností. Název je příběhový archetyp, ne důkaz minulého života.",
        "advice": "Vyber jednu zkušenost, kterou můžeš sdílet jednoduše a bez poučování."
    },
    "wanderer": {
        "title": "Poutník",
        "subtitle": "Hledání a proměna",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#compass\"></use></svg>",
        "desc": "V kvízu se objevuje motiv nového prostředí a vlastní cesty. Nemusí znamenat, že potřebuješ převrátit současný život.",
        "advice": "Vyzkoušej malou změnu běžné trasy nebo postupu a všimni si rozdílu."
    },
    "healer": {
        "title": "Pečující",
        "subtitle": "Podpora s hranicemi",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#leaf\"></use></svg>",
        "desc": "Odpovědi zdůrazňují péči o druhé. Kvíz z toho nevyvozuje léčitelskou schopnost ani povinnost někoho zachraňovat.",
        "advice": "Nabídni jednu konkrétní pomoc v rozsahu, který zvládneš."
    },
    "warrior": {
        "title": "Ochránce",
        "subtitle": "Hranice a odpovědnost",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#balance\"></use></svg>",
        "desc": "V tvých volbách vystupuje ochrana hodnot a zastání se druhých. Jde o motiv k zamyšlení, nikoliv popis tvého osudu.",
        "advice": "Pojmenuj jednu hranici, kterou chceš klidně a srozumitelně hájit."
    }
};

    function updateProgress() {
        const percent = (currentStep / totalSteps) * 100;
        setProgress(percent);
    }

    function showStep(stepNum) {
        steps.forEach(s => s.classList.remove('active'));
        const nextStep = document.querySelector(`.question-step[data-step="${stepNum}"]`);
        if (nextStep) {
            nextStep.classList.add('active');
            updateProgress();
        } else {
            showLoading();
        }
    }

    function showLoading() {
        setProgress(100);
        showResult();
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

        document.getElementById('loading-step').classList.remove('active');
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
        const text = `V symbolickém kvízu inspirovaném karmou a minulými životy se s mými odpověďmi propojil motiv ${window.lastResult}.`;
        if (navigator.share) {
            navigator.share({
                title: 'Moje Karmické Dědictví',
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
