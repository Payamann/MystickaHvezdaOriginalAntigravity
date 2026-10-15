import { getPrimaryPhaseEvents, getNextPrimaryPhase } from './utils/lunar-state.js';

(function () {
    const DAY = 86400000;
    const names = ['Vlčí úplněk', 'Sněžný úplněk', 'Červový úplněk', 'Růžový úplněk', 'Květový úplněk', 'Jahodový úplněk', 'Jelenní úplněk', 'Jeseterní úplněk', 'Sklizňový úplněk', 'Lovecký úplněk', 'Bobrový úplněk', 'Chladný úplněk'];
    const fullMoons = getPrimaryPhaseEvents('Full Moon');
    const text = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
    const dateLabel = date => date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', timeZone: 'Europe/Prague' });

    function formatCountdown(date) {
        const diff = date - new Date();
        if (diff <= 0) return 'Proběhlo';
        const days = Math.floor(diff / DAY);
        const hours = Math.floor(diff % DAY / 3600000);
        const minutes = Math.floor(diff % 3600000 / 60000);
        return days > 0 ? `Za ${days} dní ${hours} h` : hours > 0 ? `Za ${hours} h ${minutes} min` : `Za ${minutes} minut`;
    }

    function updateCountdowns() {
        const now = Date.now();
        const nextNew = getNextPrimaryPhase('New Moon', new Date(now));
        if (nextNew) {
            const date = new Date(nextNew.at);
            text('countdown-new', formatCountdown(date));
            text('countdown-new-date', dateLabel(date));
        } else {
            text('countdown-new', 'Čas zatím není dostupný');
            text('countdown-new-date', 'Mimo rozsah tabulky');
        }
        const nextFull = fullMoons.find(event => event.time > now - DAY && event.time - now < 35 * DAY);
        if (!nextFull) {
            text('countdown-full', 'Čas zatím není dostupný');
            text('countdown-full-date', 'Mimo rozsah tabulky');
            text('full-moon-time', '—');
            text('full-moon-lidovy-nazev', '—');
            return;
        }
        const date = new Date(nextFull.at);
        text('countdown-full', formatCountdown(date));
        text('countdown-full-date', dateLabel(date));
        text('full-moon-time', date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague', timeZoneName: 'short' }));
        text('full-moon-znameni', 'Praha');
        const inMonth = fullMoons.filter(event => event.at.slice(0, 7) === nextFull.at.slice(0, 7));
        text('full-moon-lidovy-nazev', inMonth.length > 1 && inMonth.at(-1).at === nextFull.at ? 'Modrý úplněk' : names[Number(nextFull.at.slice(5, 7)) - 1]);
    }
    updateCountdowns();
    setInterval(updateCountdowns, 60000);
})();
