document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { power: 0, control: 0, attention: 0, detachment: 0 };
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
    "power": {
        "title": "Téma vlivu",
        "subtitle": "Rozhodovat a neovládat",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#balance\"></use></svg>",
        "desc": "Odpovědi otevírají téma vlivu a prosazování. Nejde o nálepku osobnosti; můžeš se podívat na konkrétní situaci, kde chceš výsledek příliš držet.",
        "advice": "U jednoho společného rozhodnutí nech druhému skutečnou možnost volby."
    },
    "control": {
        "title": "Téma jistoty",
        "subtitle": "Řád a pružnost",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#compass\"></use></svg>",
        "desc": "V kvízu vystupuje potřeba předvídatelnosti. Řád může pomáhat; někdy ale stojí víc sil než nejistota, kterou má odstranit.",
        "advice": "Rozliš jedno užitečné pravidlo od jednoho, které můžeš bezpečně uvolnit."
    },
    "attention": {
        "title": "Téma uznání",
        "subtitle": "Viditelnost a vlastní měřítko",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#star\"></use></svg>",
        "desc": "Tvoje volby se dotýkají přijetí a uznání. Kvíz neurčuje tvou hodnotu ani závislost na druhých.",
        "advice": "Oceň jeden vlastní výsledek podle konkrétního měřítka, ne podle počtu reakcí."
    },
    "detachment": {
        "title": "Téma odstupu",
        "subtitle": "Prostor a kontakt",
        "icon": "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><use href=\"/img/icons/mh-symbols.svg#dream\"></use></svg>",
        "desc": "V odpovědích se objevuje odstup. Může chránit vlastní prostor; stojí za to rozlišit potřebný klid od rozhovoru, který jen odkládáš.",
        "advice": "Vyber jeden bezpečný kontakt, který chceš udržet i při potřebě být chvíli bez společnosti."
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

        // Store result
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
        const text = `V symbolickém kvízu o stínové stránce znamení se s mými odpověďmi propojilo téma ${window.lastResult}.`;
        if (navigator.share) {
            navigator.share({
                title: 'Stín mého znamení',
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
