document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { wolf: 0, eagle: 0, deer: 0, bear: 0 };
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
        wolf: {
            title: "Vlk",
            subtitle: "Strážce Smečky",
            icon: "🐺",
            desc: "Váš totem je Vlk – symbol intuice, věrnosti a divoké inteligence. Jste silně propojeni se svými city a instinkty. Ceníte si společenství, ale dokážete být i silným samotářem.",
            advice: "Důvěřujte své vnitřní moudrosti. Vaše smečka (rodina, přátelé) je vaší největší silou, ale nezapomeňte pečovat i o svou vlastní divokou podstatu."
        },
        eagle: {
            title: "Orel",
            subtitle: "Posel Nebes",
            icon: "🦅",
            desc: "Vaším průvodcem je Orel. Daruje vám jasné vidění a schopnost povznést se nad malichernosti. Máte vizi a odvahu létat ve výškách, kterých se jiní bojí.",
            advice: "Neztrácejte ze zřetele detaily na zemi, zatímco hledíte do dáli. Váš nadhled je darem, který vám pomůže najít pravdu tam, kde jiní tápou."
        },
        deer: {
            title: "Jelen",
            subtitle: "Král Hvozdů",
            icon: "🦌",
            desc: "Jelen je vaším jemným ochráncem. Jste vysoce citliví, ušlechtilí a dokážete transformovat negativitu v tvořivou energii. Vaše přítomnost přináší klid.",
            advice: "Vaše jemnost není slabost, ale největší síla. Chraňte svou energii před drsným světem, ale neschovávejte své světlo před těmi, kteří ho potřebují."
        },
        bear: {
            title: "Medvěd",
            subtitle: "Tichá Síla",
            icon: "🐻",
            desc: "Průvodce Medvěd vám dává odvahu, stabilitu a hluboké uzemnění. Jste přirozeným léčitelem a ochráncem. Víte, kdy je čas na akci a kdy na vnitřní klid.",
            advice: "Nezapomeňte na důležitost introspekce – vašeho 'zimního spánku'. Síla, kterou čerpáte z ticha, je to, co vás činí nezlomnými v bouřích života."
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
        steps.forEach(s => s.classList.remove('active'));
        document.getElementById('loading-step').classList.add('active');
        setProgress(100);

        setTimeout(showResult, 2500);
    }

    function showResult() {
        const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const data = resultsData[winner];

        // Set metadata for sharing
        window.lastResult = data.title;

        const resultHtml = `
            <div class="result-card quiz-result-card">
                <div class="result-card__header">
                    <h4 class="result-card__title quiz-result-title">${data.title}</h4>
                    <p class="quiz-result-kicker">Váš totemový průvodce</p>
                </div>
                <div class="result-card__image animate-sway">${data.icon}</div>
                <div class="result-card__body">
                    <h5 class="quiz-result-subtitle">${data.subtitle}</h5>
                    <p class="quiz-result-description">${data.desc}</p>
                </div>
                <div class="result-card__footer quiz-result-footer">
                    <p class="quiz-result-advice">"${data.advice}"</p>
                </div>
            </div>
            <div class="mt-xl">
                <h2 class="text-gradient">Síla přírody promlouvá</h2>
                <p>Váš průvodce z říše zvířat <strong>${data.title}</strong> stojí nyní po vašem boku.</p>
            </div>
        `;

        document.getElementById('loading-step').classList.remove('active');
        const resultStep = document.getElementById('result-step');
        document.getElementById('result-box').innerHTML = resultHtml;
        resultStep.classList.add('active');
    }

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const scoreKey = btn.dataset.score;
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
        const text = `Moje totemové zvíře je ${window.lastResult}! Zjisti to své na Mystické Hvězdě.`;
        if (navigator.share) {
            navigator.share({
                title: 'Můj Totemový Průvodce',
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
