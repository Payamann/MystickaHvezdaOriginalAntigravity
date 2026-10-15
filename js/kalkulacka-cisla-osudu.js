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



        document.getElementById('calc-btn').addEventListener('click', () => {

            const day = parseInt(document.getElementById('inp-day').value);

            const month = parseInt(document.getElementById('inp-month').value);

            const year = parseInt(document.getElementById('inp-year').value);

            const err = document.getElementById('calc-error');

            err.textContent = '';



            const currentYear = new Date().getFullYear();

            if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > currentYear) {

                err.textContent = 'Zadejte prosím platné datum narození.';

                return;

            }



            currentNumber = reduceToLifeNumber(day, month, year);

            const data = NUMBERS[currentNumber];



            document.getElementById('res-number').textContent = currentNumber;

            document.getElementById('res-name').textContent = data.name;

            document.getElementById('res-traits').innerHTML = data.traits.map(t => `<span class="trait-chip">${t}</span>`).join('');

            document.getElementById('res-text').textContent = data.text;

            const result = document.getElementById('calc-result');

            result.hidden = false;

            result.classList.add('mh-block-visible');

            result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });



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
            const action = e.target.getAttribute('data-action');
            if (action === 'shareResult') {
                const platform = e.target.getAttribute('data-platform');
                shareResult(platform);
            }
        });

        function openShareWindow(url) {
            const opened = window.open(url, '_blank', 'noopener,noreferrer');
            if (opened) opened.opener = null;
        }

        function shareResult(platform) {

            if (!currentNumber) return;

            const data = NUMBERS[currentNumber];

            const text = `Moje Číslo Osudu je ${currentNumber} – ${data.name}! Zjistěte vaše na Mystické Hvězdě 🌟`;

            const url = 'https://www.mystickahvezda.cz/kalkulacka-cisla-osudu.html';



            if (platform === 'twitter') {

                openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);

            } else if (platform === 'facebook') {

                openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`);

            } else if (platform === 'copy') {

                navigator.clipboard.writeText(`${text} ${url}`).then(() => {

                    const btn = document.getElementById('copy-btn');

                    btn.textContent = '✅ Zkopírováno!';

                    setTimeout(() => btn.textContent = '📋 Kopírovat', 2000);

                });

            }

        }
