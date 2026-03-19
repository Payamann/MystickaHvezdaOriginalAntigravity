document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.question-step[data-step]');
    const progressBar = document.getElementById('progress-bar');
    const scores = { power: 0, control: 0, attention: 0, detachment: 0 };
    let currentStep = 1;
    const totalSteps = steps.length;

    const resultsData = {
        power: {
            title: "Stín Moci",
            subtitle: "Kontrolor & Tyran",
            icon: "🌑",
            desc: "Váš stín se projevuje silnou potřebou dominance. Pod maskou síly se často skrývá strach z bezmoci. Máte tendenci věci lámat přes koleno.",
            advice: "Skutečná síla spočívá v laskavosti a přijetí zranitelnosti. Zkuste druhým občas předat otěže a uvidíte, že svět se nezřítí."
        },
        control: {
            title: "Stín Řádu",
            subtitle: "Perfekcionista & Kritik",
            icon: "🧱",
            desc: "Váš stín vás nutí být neustále v pozoru. Bojíte se chaosu a nedostatku disciplíny. Svou kritikou často zraňujete sebe i okolí.",
            advice: "Dovolte si dělat chyby. V nedokonalosti se skrývá lidskost a skutečná krása. Nechte věci občas jen tak plynout bez vašeho dozoru."
        },
        attention: {
            title: "Stín Lesku",
            subtitle: "Zabiják uznání",
            icon: "🕯️",
            desc: "Váš stín si žádá neustálý aplaus. Potřebujete být v centru dění, abyste se cítili cenní. Vaše hodnota však nezávisí na potlesku ostatních.",
            advice: "Najděte uznání v sobě. Vaše vnitřní světlo svítí i tehdy, když se na něj nikdo nedívá. Zkuste občas zářit potichu."
        },
        detachment: {
            title: "Stín Odstupu",
            subtitle: "Ledová maska",
            icon: "❄️",
            desc: "Váš stín vás izoluje od hlubokých emocí. Bojíte se zranění, a proto si udržujete bezpečný odstup. Tím ale přicházíte o skutečnou blízkost.",
            advice: "Rozpusťte ledy. Dovolte lidem, aby vás skutečně poznali – i s vašimi slabostmi. Intimita je bránou k uzdravení vaší duše."
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

        // Store result
        window.lastResult = data.title;

        const resultHtml = `
            <div class="result-card" style="border-color: #6a0dad;">
                <div class="result-card__header">
                    <h4 class="result-card__title" style="color: #6a0dad;">${data.title}</h4>
                    <p style="color: rgba(157,78,221,0.6); font-size: 0.8rem;">Váš potlačený archetyp</p>
                </div>
                <div class="result-card__image animate-shadow">${data.icon}</div>
                <div class="result-card__body">
                    <h5 style="margin-bottom: 0.5rem; color: #fff;">${data.subtitle}</h5>
                    <p style="font-size: 0.9rem; color: rgba(255,255,255,0.8); line-height: 1.4;">${data.desc}</p>
                </div>
                <div class="result-card__footer" style="margin-top: 1rem; border-top: 1px solid rgba(157,78,221,0.2); padding-top: 1rem;">
                    <p style="font-style: italic; font-size: 0.85rem; color: #9d4edd;">"${data.advice}"</p>
                </div>
            </div>
            <div class="mt-xl">
                <h2 class="text-gradient">Stín byl osvětlen</h2>
                <p>Přijetí tohoto aspektu je prvním krokem k vaší celistvosti.</p>
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
        const text = `Odhalil/a jsem svůj stín: ${window.lastResult}. Poznej i ty skryté stránky svého znamení.`;
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
