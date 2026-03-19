document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { sentience: 0, voyance: 0, audience: 0, cognizance: 0 };
    let currentStep = 1;
    const totalSteps = steps.length;

    const resultsData = {
        sentience: {
            title: "Jasnocit",
            subtitle: "Empat & Cítící duše",
            icon: "👐",
            desc: "Váš dar je schopnost cítit energii míst a lidí ve svém vlastním těle. Jste jako lidský barometr emocí. Víte, co druzí cítí dříve, než to vysloví.",
            advice: "Nezapomínejte na energetickou ochranu. Vaše citlivost je darem, pokud se naučíte nebrat si cizí emoce za své."
        },
        voyance: {
            title: "Jasnozřivost",
            subtitle: "Vizionář & Vnitřní oko",
            icon: "👁️",
            desc: "Vaše intuice promlouvá skrze obrazy, barvy a vize. Vidíte hlubší symboliku v událostech a máte dar předpovídat budoucí trendy.",
            advice: "Důvěřujte tomu, co vidíte v duchu. Rozvíjejte svou vizualizaci, protože je to váš přímý kanál k vyššímu vědění."
        },
        audience: {
            title: "Jasnoslyšení",
            subtitle: "Posluchač vesmíru",
            icon: "🔔",
            desc: "Vnímáte svět skrze vibrace a tóny. Často slyšíte vnitřní hlas, který vám radí, nebo k vám vesmír promlouvá skrze útržky vět a hudbu.",
            advice: "Dopřejte si čas v tichu. Právě v naprostém klidu dokážete zachytit ty nejdůležitější zprávy pro svou životní cestu."
        },
        cognizance: {
            title: "Jasnovědění",
            subtitle: "Kanál přímého vědění",
            icon: "⚡",
            desc: "Váš dar je 'náhlé vědění'. Prostě víte, aniž byste tušili jak. Informace k vám přicházejí jako hotové celky, které nemusíte studovat.",
            advice: "Nezpochybňujte své bleskové vhledy logikou. Váš dar je nejrychlejší cestou k pravdě, pokud se nebojíte ho následovat."
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

        window.lastResult = data.title;

        const resultHtml = `
            <div class="result-card" style="border-color: var(--color-ethereal-violet);">
                <div class="result-card__header">
                    <h4 class="result-card__title" style="color: var(--color-ethereal-violet);">${data.title}</h4>
                    <p style="color: rgba(255,255,255,0.6); font-size: 0.8rem;">Váš duchovní dar</p>
                </div>
                <div class="result-card__image animate-eye">${data.icon}</div>
                <div class="result-card__body">
                    <h5 style="margin-bottom: 0.5rem; color: #fff;">${data.subtitle}</h5>
                    <p style="font-size: 0.9rem; color: rgba(255,255,255,0.8); line-height: 1.4;">${data.desc}</p>
                </div>
                <div class="result-card__footer" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                    <p style="font-style: italic; font-size: 0.85rem; color: var(--color-mystic-gold);">"${data.advice}"</p>
                </div>
            </div>
            <div class="mt-xl">
                <h2 class="text-gradient">Váš dar byl aktivován</h2>
                <p>Důvěryhodnost svého daru <strong>${data.title}</strong> pocítíte v příštích dnech.</p>
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
        const text = `Můj duchovní dar je ${window.lastResult}! Odhal ten svůj na Mystické Hvězdě.`;
        if (navigator.share) {
            navigator.share({
                title: 'Můj Duchovní Dar',
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
