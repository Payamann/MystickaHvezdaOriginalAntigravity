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
        progressBar.classList.forEach((className) => {
            if (className.startsWith('progress-width-')) progressBar.classList.remove(className);
        });
        progressBar.classList.add(`progress-width-${rounded}`);
    }

    const resultsData = {
        magician: {
            title: "Máh",
            subtitle: "Tvůrce reality",
            icon: "🪄",
            desc: "Váš archetyp je postava plná potenciálu. Máte schopnost manifestovat své myšlenky do hmotné reality. Vaše vůle je vaším nejmocnějším nástrojem.",
            advice: "Nezapomeňte, že s velkou mocí přichází zodpovědnost. Zaměřte svou energii na to, co skutečně milujete."
        },
        priestess: {
            title: "Velekněžka",
            subtitle: "Strážkyně tajemství",
            icon: "🌒",
            desc: "Váš archetyp je ztělesněním hluboké intuice a vnitřního vědění. Rozumíte věcem, které zůstávají ostatním skryty, a pohybujete se s lehkostí v říši snů.",
            advice: "Důvěřujte svému vnitřnímu hlasu i tehdy, když mu logika okolního světa nerozumí. Vaše ticho je vaší silou."
        },
        empress: {
            title: "Císařovna",
            subtitle: "Matka hojnosti",
            icon: "🌿",
            desc: "Vaše duše promlouvá skrze tvořivost, lásku a spojení s přírodou. Jste zdrojem inspirace a péče pro všechny ve vašem okolí.",
            advice: "Dovolte si rozkvétat. Pečujte o sebe stejně tak, jako pečujete o svět kolem sebe. Hojnost je váš přirozený stav."
        },
        hermit: {
            title: "Poustevník",
            subtitle: "Hledač pravdy",
            icon: "💡",
            desc: "Váš archetyp dává přednost hloubce před povrchností. Hledáte odpovědi ve svém nitru a vaše osamělá cesta vás vede k nejvyšším vrcholům moudrosti.",
            advice: "Nebojte se své samoty. Je to prostor, kde se rodí vaše největší pravdy. Staňte se světlem pro ty, kteří ještě bloudí."
        },
        star: {
            title: "Hvězda",
            subtitle: "Maják naděje",
            icon: "✨",
            desc: "Vaše duše je plná světla, optimismu a duchovní čistoty. Přinášíte naději tam, kde je tma, a inspirujete ostatní k lepším zítřkům.",
            advice: "Zůstaňte napojeni na vesmírné proudy. Vaše vize jsou důležité. Důvěřujte procesu života a nechte své světlo zářit."
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

        // Store result for sharing
        window.lastResult = data.title;

        const resultHtml = `
            <div class="result-card quiz-result-card">
                <div class="result-card__header">
                    <h4 class="result-card__title">${data.title}</h4>
                    <p class="quiz-result-kicker">Váš duchovní archetyp</p>
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
                <h2 class="text-gradient">Vaše cesta je osvětlena</h2>
                <p>Tento archetyp vám ukazuje cestu v příštích měsících.</p>
            </div>
        `;

        document.getElementById('loading-step').classList.remove('active');
        const resultStep = document.getElementById('result-step');
        document.getElementById('result-box').innerHTML = resultHtml;
        resultStep.classList.add('active');
    }

    // Attach event listeners to option buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const scoreKey = btn.dataset.score;
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
        const text = `Mým tarotovým archetypem je ${window.lastResult}! Odhal ten svůj na Mystické Hvězdě.`;
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
