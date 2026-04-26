document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { fire: 0, water: 0, air: 0, earth: 0 };
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
        fire: {
            title: "Oheň",
            subtitle: "Energie & Proměna",
            icon: "🔥",
            desc: "Vládne vám živel ohně. Jste vášniví, odvážní a plní životní síly. Máte přirozené charisma a dokážete inspirovat ostatní svou akčností.",
            advice: "Pozor na vyhoření. Nezapomeňte svůj oheň občas ztlumit a dopřát si klid. Voda nebo země vám pomohou najít rovnováhu."
        },
        water: {
            title: "Voda",
            subtitle: "Emoce & Intuice",
            icon: "💧",
            desc: "Vaše podstata je tekutá a hluboká jako oceán. Jste velmi empatičtí, vnímaví a vaše intuice je vaším nejsilnějším kompasem.",
            advice: "Nenechte se zaplavit emocemi ostatních. Budujte si pevné břehy (hranice), aby se váš dar empatie nestal vaším vězením."
        },
        air: {
            title: "Vzduch",
            subtitle: "Inspirace & Svoboda",
            icon: "🌬️",
            desc: "Jste jako vítr – svobodní, bystří a neustále v pohybu. Milujete nápady, komunikaci a pohled na svět z nadhledu.",
            advice: "Neztrácejte se v oblacích. Občas je potřeba sestoupit na zem a proměnit své vize v činy. Uzemnění je pro vás klíčové."
        },
        earth: {
            title: "Země",
            subtitle: "Stabilita & Manifestace",
            icon: "🌿",
            desc: "Jste pevně spojeni se zemí. Praktičnost, trpělivost a schopnost tvořit trvalé hodnoty jsou vašimi největšími dary.",
            advice: "Nebojte se občasných změn. Stabilita je skvělá, ale i skála se může vlivem větru a vody proměnit. Otevřete se novým myšlenkám."
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

        // Store result
        window.lastResult = data.title;

        const resultHtml = `
            <div class="result-card quiz-result-card">
                <div class="result-card__header">
                    <h4 class="result-card__title">${data.title}</h4>
                    <p class="quiz-result-kicker">Váš dominantní živel</p>
                </div>
                <div class="result-card__image animate-glow">${data.icon}</div>
                <div class="result-card__body">
                    <h5 class="quiz-result-subtitle">${data.subtitle}</h5>
                    <p class="quiz-result-description">${data.desc}</p>
                </div>
                <div class="result-card__footer quiz-result-footer">
                    <p class="quiz-result-advice">"${data.advice}"</p>
                </div>
            </div>
            <div class="mt-xl">
                <h2 class="text-gradient">Živly ve vás nalezly shodu</h2>
                <p>Dominance živlu <strong>${data.title}</strong> ovlivňuje vaše rozhodování i energii.</p>
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
        const text = `Mým dominantním živlem je ${window.lastResult}! Zjisti ten svůj na Mystické Hvězdě.`;
        if (navigator.share) {
            navigator.share({
                title: 'Moje Živlová Rovnováha',
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
