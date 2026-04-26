document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { indigo: 0, gold: 0, green: 0, red: 0 };
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
        indigo: {
            title: "Indigo",
            subtitle: "Vizionář & Intuit",
            icon: "🔮",
            color: "#4b0082",
            desc: "Vaše aura září hlubokým odstínem indigo. Jste vysoce intuitivní bytost s velkým vhledem do budoucna. Vnímáte realitu za hranicí běžných smyslů.",
            advice: "Důvěřujte své neomylné intuici. Vaším úkolem je vnášet do světa pravdu, kterou ostatní zatím jen matně tuší."
        },
        gold: {
            title: "Zlatá",
            subtitle: "Osvícená duše",
            icon: "✨",
            color: "#ffd700",
            desc: "Zlatá aura značí vysokou úroveň vědomí a vnitřní moudrosti. Vyzařujete klid a lidé se ve vaší přítomnosti cítí přirozeně v bezpečí.",
            advice: "Udržujte si svůj vnitřní střed. Vaše světlo je nakažlivé a má schopnost čistit negativní energie v celém vašem okolí."
        },
        green: {
            title: "Zelená",
            subtitle: "Přírodní Léčitel",
            icon: "🌿",
            color: "#228b22",
            desc: "Zelené vyzařování je znakem harmonie a schopnosti léčit. Jste hluboce spojeni s přírodou a máte dar uklidnit jakýkoliv konflikt.",
            advice: "Nezapomínejte pečovat i o sebe. Jako léčitel vydáváte hodně energie, kterou musíte pravidelně doplňovat tichem v lese."
        },
        red: {
            title: "Červená",
            subtitle: "Tvůrce & Bojovník",
            icon: "🔥",
            color: "#cc0000",
            desc: "Vaše aura je nabitá vitalitou a vášní. Máte obrovskou schopnost dotahovat věci do konce a měnit svět kolem sebe skrze akci.",
            advice: "Směrujte svou vášeň konstruktivně. Vaše energie je jako silný oheň – může ohřát, ale i spálit, pokud ji neovládnete."
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

        window.lastResult = data.title;

        const resultHtml = `
            <div class="result-card quiz-result-card">
                <div class="result-card__header">
                    <h4 class="result-card__title quiz-result-title">${data.title}</h4>
                    <p class="quiz-result-kicker">Vaše dominantní záře</p>
                </div>
                <div class="result-card__image animate-aura">${data.icon}</div>
                <div class="result-card__body">
                    <h5 class="quiz-result-subtitle">${data.subtitle}</h5>
                    <p class="quiz-result-description">${data.desc}</p>
                </div>
                <div class="result-card__footer quiz-result-footer">
                    <p class="quiz-result-advice">"${data.advice}"</p>
                </div>
            </div>
            <div class="mt-xl">
                <h2 class="text-gradient">Vaše aura byla spatřena</h2>
                <p>Záříte barvou <strong>${data.title}</strong>, která ovlivňuje vaše okolí i osud.</p>
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
        const text = `Moje aura září barvou ${window.lastResult}! Odhal i ty svou energii na Mystické Hvězdě.`;
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
