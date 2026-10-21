import { calculateLifePath } from './utils/numerology-logic.js';


const NUMBERS = {
    "1": {
        "name": "Samostatnost",
        "traits": [
            "Iniciativa",
            "Odvaha",
            "Vlastní směr"
        ],
        "text": "Jednička v numerologii představuje začátek a samostatné rozhodování. Kde by pomohlo udělat první krok po svém? Vyber jednu drobnost, se kterou můžeš začít bez čekání na souhlas okolí."
    },
    "2": {
        "name": "Spolupráce",
        "traits": [
            "Naslouchání",
            "Ohleduplnost",
            "Dohoda"
        ],
        "text": "Dvojka je symbolem spolupráce a citlivosti k druhým. Zkus pojmenovat jednu společnou potřebu i jednu vlastní hranici. V dobré dohodě má místo obojí."
    },
    "3": {
        "name": "Tvořivost",
        "traits": [
            "Vyjádření",
            "Nápady",
            "Hravost"
        ],
        "text": "Trojka připomíná prostor pro tvořivost a vyjádření. Vezmi jeden nápad, který ti běží hlavou, a dej mu malou konkrétní podobu: větu, skicu nebo krátký pokus."
    },
    "4": {
        "name": "Pevný základ",
        "traits": [
            "Řád",
            "Vytrvalost",
            "Spolehlivost"
        ],
        "text": "Čtyřka symbolizuje pevný základ a pravidelnost. Která jednoduchá rutina by ti ulehčila den? Začni u jedné činnosti, která opravdu pomáhá, místo dalšího seznamu povinností."
    },
    "5": {
        "name": "Prostor pro změnu",
        "traits": [
            "Zvídavost",
            "Pohyb",
            "Zkušenost"
        ],
        "text": "Pětka otevírá téma svobody a nových zkušeností. Nemusíš měnit všechno. Zkus jednu bezpečnou odchylku od běžného dne a všimni si, co ti přinese."
    },
    "6": {
        "name": "Péče a hranice",
        "traits": [
            "Péče",
            "Domov",
            "Odpovědnost"
        ],
        "text": "Šestka patří k symbolům péče a blízkosti. Zeptej se, co můžeš nabídnout druhým a co právě potřebuješ pro sebe. Vyber jednu pomoc, kterou zvládneš bez vyčerpání."
    },
    "7": {
        "name": "Prostor pro otázky",
        "traits": [
            "Hloubka",
            "Pozornost",
            "Poznávání"
        ],
        "text": "Sedmička připomíná zkoumání a chvíli odstupu. Vyber otázku, kterou chceš lépe pochopit. Odděl, co o ní skutečně víš, od toho, co si zatím jen domýšlíš."
    },
    "8": {
        "name": "Směr a odpovědnost",
        "traits": [
            "Rozhodování",
            "Praktičnost",
            "Záměr"
        ],
        "text": "Osmička symbolicky spojuje záměr s tím, jak zacházíme s prostředky a vlivem. U jednoho cíle si napiš, co pro něj můžeš udělat a jakou cenu už za něj platit nechceš."
    },
    "9": {
        "name": "Dokončení",
        "traits": [
            "Nadhled",
            "Uzavření",
            "Soucit"
        ],
        "text": "Devítka představuje dokončení a širší pohled. Co už splnilo svůj účel? Uzavři jednu drobnou rozpracovanou věc. Nemusíš hned vyřešit celý život."
    },
    "11": {
        "name": "Citlivost a inspirace",
        "traits": [
            "Vnímavost",
            "Nápad",
            "Uzemnění"
        ],
        "text": "Jedenáctku některé numerologické školy ponechávají jako mistrovské číslo. Je to symbol inspirace a citlivosti, ne důkaz zvláštních schopností. Vyber jeden podnět a ověř ho malým praktickým krokem."
    },
    "22": {
        "name": "Od nápadu k základu",
        "traits": [
            "Vize",
            "Plán",
            "Trpělivost"
        ],
        "text": "Dvaadvacítka symbolicky propojuje velký záměr s každodenní prací. Jak by vypadal nejmenší proveditelný začátek tvého plánu? Sepiš první krok a potřebné prostředky."
    },
    "33": {
        "name": "Péče s mírou",
        "traits": [
            "Sdílení",
            "Podpora",
            "Hranice"
        ],
        "text": "Třiatřicítka bývá spojována s učením a podporou druhých. Nejde o povinnost někoho zachraňovat. Zvaž jednu zkušenost, kterou můžeš sdílet, a nech druhému prostor rozhodnout se po svém."
    }
};



        function reduceToLifeNumber(day, month, year) {
            return calculateLifePath(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        }

        let currentNumber = null;
        let copyStatusTimer = null;

        const dayInput = document.getElementById('inp-day');
        const monthInput = document.getElementById('inp-month');
        const yearInput = document.getElementById('inp-year');
        const dateInputs = [dayInput, monthInput, yearInput];
        const errorMessage = document.getElementById('calc-error');
        const resultContainer = document.getElementById('calc-result');
        const resultHeading = document.getElementById('calc-result-heading');
        const resultStatus = document.getElementById('calc-result-status');
        const numerologyIntentCard = document.querySelector('[data-life-number-intent="numerology"]');
        const lifeNumberIntentGrid = document.querySelector('.life-number-intent-grid');
        yearInput.max = String(new Date().getFullYear());

        function clearLifeNumberResult() {
            currentNumber = null;
            resultContainer.hidden = true;
            if (resultStatus) resultStatus.textContent = '';
            if (numerologyIntentCard) numerologyIntentCard.hidden = false;
            if (lifeNumberIntentGrid) lifeNumberIntentGrid.classList.remove('life-number-intent-grid--result-visible');
            resultContainer.classList.remove('mh-block-visible');
            document.getElementById('res-number').textContent = '';
            document.getElementById('res-name').textContent = '';
            document.getElementById('res-traits').replaceChildren();
            document.getElementById('res-text').textContent = '';
        }

        function clearLifeNumberError() {
            errorMessage.textContent = '';
            dateInputs.forEach(input => input.removeAttribute('aria-invalid'));
        }

        dateInputs.forEach(input => {
            input.addEventListener('input', () => {
                clearLifeNumberError();
                clearLifeNumberResult();
            });
            input.addEventListener('change', () => {
                clearLifeNumberError();
                clearLifeNumberResult();
            });
        });


        document.getElementById('calc-btn').addEventListener('click', () => {

            const day = Number(dayInput.value);

            const month = Number(monthInput.value);

            const year = Number(yearInput.value);

            clearLifeNumberError();
            clearLifeNumberResult();



            const currentYear = new Date().getFullYear();
            const today = new Date();

            const date = new Date(Date.UTC(year, month - 1, day));
            const hasValidDate = Number.isInteger(day) && Number.isInteger(month) && Number.isInteger(year)
                && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
            const isFutureDate = hasValidDate
                && Date.UTC(year, month - 1, day) > Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

            if (!hasValidDate || day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > currentYear || isFutureDate) {

                const invalidInput = !Number.isInteger(day) || day < 1 || day > 31
                    ? dayInput
                    : !Number.isInteger(month) || month < 1 || month > 12
                        ? monthInput
                        : !Number.isInteger(year) || year < 1900 || year > currentYear || isFutureDate
                            ? yearInput
                            : dayInput;
                invalidInput.setAttribute('aria-invalid', 'true');
                errorMessage.textContent = 'Zkontroluj den, měsíc a rok. Zadej skutečné datum narození, které není v budoucnosti.';
                invalidInput.focus();

                return;

            }



            currentNumber = reduceToLifeNumber(day, month, year);

            const data = NUMBERS[currentNumber];



            document.getElementById('res-number').textContent = currentNumber;

            document.getElementById('res-name').textContent = data.name;

            document.getElementById('res-traits').innerHTML = data.traits.map(t => `<span class="trait-chip">${t}</span>`).join('');

            document.getElementById('res-text').textContent = data.text;

            resultContainer.hidden = false;
            if (numerologyIntentCard) numerologyIntentCard.hidden = true;
            if (lifeNumberIntentGrid) lifeNumberIntentGrid.classList.add('life-number-intent-grid--result-visible');

            resultContainer.classList.add('mh-block-visible');

            if (resultStatus) resultStatus.textContent = `Výsledek připraven: životní číslo ${currentNumber}, ${data.name}.`;
            resultHeading?.focus({ preventScroll: true });

            resultContainer.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });



            // Save sign for personalization

            if (window.MH_PERSONALIZATION) {

                window.MH_PERSONALIZATION.set({ lifeNumber: currentNumber });

            }

        });



        // Enter key support

        ['inp-day', 'inp-month', 'inp-year'].forEach(id => {

            document.getElementById(id).addEventListener('keydown', e => {

                if (e.key === 'Enter') document.getElementById('calc-btn').click();

            });

        });



        // Event delegation for share buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action="shareResult"]');
            if (button) shareResult(button.getAttribute('data-platform'));
        });

        function openShareWindow(url) {
            const opened = window.open(url, '_blank', 'noopener,noreferrer');
            if (opened) opened.opener = null;
        }

        function setCopyButtonState(symbolId, label, announcement) {
            const btn = document.getElementById('copy-btn');
            const status = document.getElementById('copy-status');
            if (!btn) return;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'mh-symbol mh-symbol--inline');
            svg.setAttribute('viewBox', '0 0 48 48');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '1.8');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');

            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttribute('href', `/img/icons/mh-symbols.svg?v=20261018#${symbolId}`);
            svg.appendChild(use);
            btn.replaceChildren(svg, document.createTextNode(label));
            if (status) status.textContent = announcement;
        }

        async function shareResult(platform) {

            if (!currentNumber) return;

            const data = NUMBERS[currentNumber];

            const text = `Moje číslo životní cesty je ${currentNumber} – ${data.name}. Spočítej si svoje na Mystické Hvězdě.`;

            const url = 'https://www.mystickahvezda.cz/kalkulacka-cisla-osudu.html';



            if (platform === 'twitter') {

                openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);

            } else if (platform === 'facebook') {

                openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`);

            } else if (platform === 'copy') {

                window.clearTimeout(copyStatusTimer);
                try {
                    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
                    await navigator.clipboard.writeText(`${text} ${url}`);
                    setCopyButtonState('check', 'Zkopírováno!', 'Odkaz byl zkopírován.');
                } catch {
                    setCopyButtonState('error', 'Nelze kopírovat', 'Kopírování se nezdařilo. Zkus adresu zkopírovat ručně.');
                }

                copyStatusTimer = window.setTimeout(() => setCopyButtonState('copy', 'Kopírovat', ''), 2500);

            }

        }
