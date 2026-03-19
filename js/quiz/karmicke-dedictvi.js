document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { sage: 0, wanderer: 0, healer: 0, warrior: 0 };
    let currentStep = 1;
    const totalSteps = steps.length;

    const resultsData = {
        sage: {
            title: "Strážce Vědění",
            subtitle: "Filozof & Učenec",
            icon: "📜",
            desc: "Vaše duše v minulosti strávila staletí v tichu knihoven a chrámů. Jste nositelem prastaré moudrosti a vaší rolí v tomto životě je uchovávat a předávat informace.",
            advice: "Nezůstávejte jen u teorie. Vaše vědění má největší hodnotu tehdy, když ho prakticky využijete k pomoci druhým najít směr."
        },
        wanderer: {
            title: "Hvězdný Poutník",
            subtitle: "Objevitel & Svobodná duše",
            icon: "⛵",
            desc: "Váš karmický otisk je plný pohybu. Pravděpodobně jste byli mořeplavcem, kupcem nebo nomádem. Vaše duše nesnáší pouta a neustále hledá nové horizonty.",
            advice: "Hledejte domov uvnitř sebe. Vaše touha po dálkách je krásná, ale nezapomeňte, že i ta nejdelší cesta začíná tam, kde právě stojíte."
        },
        healer: {
            title: "Duchovní Léčitel",
            subtitle: "Empat & Alchymista",
            icon: "🌿",
            desc: "Vaše minulost je spojena s bylinkami, léčením a spirituálním doprovázením. Máte vrozenou schopnost vnímat bolest druhých a instinktivně víte, jak ji zmírnit.",
            advice: "Nezapomínejte léčit i sebe. Rozdáváte hodně energie, ale vaše vlastní nádoba se musí pravidelně doplňovat tichem a samotou v přírodě."
        },
        warrior: {
            title: "Ochránce Světla",
            subtitle: "Bojovník za spravedlnost",
            icon: "⚔️",
            desc: "Vaše duše nese šrámy i vyznamenání z dob, kdy jste bránili slabé a bojovali za čest. Máte v sobě pevnost, disciplínu a neochvějnou morální integritu.",
            advice: "V tomto životě nemusíte o vše bojovat. Použijte svou vnitřní odhodlanost k budování míru a ochraně těch, kteří nemají vlastní hlas."
        }
    };

    function updateProgress() {
        const percent = (currentStep / totalSteps) * 100;
        progressBar.style.width = percent + '%';
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
        progressBar.style.width = '100%';

        setTimeout(showResult, 2500);
    }

    function showResult() {
        const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const data = resultsData[winner];

        // Store result for sharing
        window.lastResult = data.title;

        const resultHtml = `
            <div class="result-card" style="border-color: #ffd700;">
                <div class="result-card__header">
                    <h4 class="result-card__title" style="color: #ffd700;">${data.title}</h4>
                    <p style="color: rgba(255,215,0,0.7); font-size: 0.8rem;">Váš karmický otisk</p>
                </div>
                <div class="result-card__image animate-spiral">${data.icon}</div>
                <div class="result-card__body">
                    <h5 style="margin-bottom: 0.5rem; color: #fff;">${data.subtitle}</h5>
                    <p style="font-size: 0.9rem; color: rgba(255,255,255,0.8); line-height: 1.4;">${data.desc}</p>
                </div>
                <div class="result-card__footer" style="margin-top: 1rem; border-top: 1px solid rgba(255,215,0,0.2); padding-top: 1rem;">
                    <p style="font-style: italic; font-size: 0.85rem; color: var(--color-mystic-gold);">"${data.advice}"</p>
                </div>
            </div>
            <div class="mt-xl">
                <h2 class="text-gradient">Závoj byl odhrnut</h2>
                <p>Vaše duše si pamatuje více, než si uvědomujete. <strong>${data.title}</strong> je součástí vašeho osudu.</p>
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
        const text = `Můj karmický otisk je ${window.lastResult}! Odhal ten svůj na Mystické Hvězdě.`;
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
