(function () {
    // Databáze skutečných úplňků (astronomicky ověřené UTC časy)
    // Zdroj: TimeandDate.com / Royal Observatory Greenwich / USNO
    const FULL_MOONS = [
        { utc: '2026-01-03T10:02:00Z', znameni: 'Rak',       lidovyNazev: 'Vlčí úplněk' },
        { utc: '2026-02-01T22:09:00Z', znameni: 'Lev',       lidovyNazev: 'Sněžný úplněk' },
        { utc: '2026-03-03T11:37:00Z', znameni: 'Panna',     lidovyNazev: 'Červový úplněk' },
        { utc: '2026-04-01T02:11:00Z', znameni: 'Váhy',      lidovyNazev: 'Růžový úplněk' },
        { utc: '2026-05-01T17:23:00Z', znameni: 'Štír',      lidovyNazev: 'Květový úplněk' },
        { utc: '2026-05-31T08:45:00Z', znameni: 'Střelec',   lidovyNazev: 'Modrý úplněk' },
        { utc: '2026-06-29T23:56:00Z', znameni: 'Kozoroh',   lidovyNazev: 'Jahodový úplněk' },
        { utc: '2026-07-29T14:35:00Z', znameni: 'Vodnář',    lidovyNazev: 'Jelenní úplněk' },
        { utc: '2026-08-28T04:18:00Z', znameni: 'Ryby',      lidovyNazev: 'Jeseterní úplněk' },
        { utc: '2026-09-26T16:49:00Z', znameni: 'Beran',     lidovyNazev: 'Sklizňový úplněk' },
        { utc: '2026-10-26T04:11:00Z', znameni: 'Býk',       lidovyNazev: 'Lovecký úplněk' },
        { utc: '2026-11-24T14:53:00Z', znameni: 'Blíženci',  lidovyNazev: 'Bobrový úplněk' },
        { utc: '2026-12-23T01:28:00Z', znameni: 'Rak',       lidovyNazev: 'Chladný úplněk' },
        { utc: '2027-01-22T13:17:00Z', znameni: 'Lev',       lidovyNazev: 'Vlčí úplněk' },
        { utc: '2027-02-21T00:23:00Z', znameni: 'Panna',     lidovyNazev: 'Sněžný úplněk' },
        { utc: '2027-03-22T11:43:00Z', znameni: 'Váhy',      lidovyNazev: 'Červový úplněk' },
        { utc: '2027-04-21T00:27:00Z', znameni: 'Štír',      lidovyNazev: 'Růžový úplněk' },
    ].map(m => ({ ...m, date: new Date(m.utc) }));

    // Novolunění pro fallback výpočet
    const LUNAR_CYCLE = 29.530588853;
    const KNOWN_NEW_MOON = new Date('2026-03-18T04:01:00Z');

    function getNextFullMoonData() {
        const now = new Date();
        // Najdi nejbližší budoucí úplněk v databázi (nebo právě probíhající — do 24h po)
        const upcoming = FULL_MOONS.find(m => m.date > new Date(now - 24 * 3600000));
        return upcoming || null;
    }

    function getNextNewMoonDate() {
        const now = new Date();
        const msPerDay = 86400000;
        const age = ((now - KNOWN_NEW_MOON) / msPerDay % LUNAR_CYCLE + LUNAR_CYCLE) % LUNAR_CYCLE;
        let daysUntil = -age;
        if (daysUntil <= 0.5) daysUntil += LUNAR_CYCLE;
        return new Date(now.getTime() + daysUntil * msPerDay);
    }

    function formatCountdown(target) {
        const diff = target - new Date();
        if (diff <= 0) return 'Dnes!';
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        if (d > 0) return `Za ${d} dní ${h} h`;
        if (h > 0) return `Za ${h} h ${m} min`;
        return `Za ${m} minut`;
    }

    function formatLocalTime(date) {
        return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    }

    function formatDateCZ(date) {
        return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' });
    }

    function updateCountdowns() {
        const nextNew = getNextNewMoonDate();
        const fullData = getNextFullMoonData();

        // Novolunění
        document.getElementById('countdown-new').textContent = formatCountdown(nextNew);
        document.getElementById('countdown-new-date').textContent = formatDateCZ(nextNew);

        if (!fullData) return;

        const fullDate = fullData.date;
        // Countdown
        document.getElementById('countdown-full').textContent = formatCountdown(fullDate);
        document.getElementById('countdown-full-date').textContent = formatDateCZ(fullDate);

        // Rozšířené info — zobrazíme jen pokud existují elementy
        const elTime   = document.getElementById('full-moon-time');
        const elZnak   = document.getElementById('full-moon-znameni');
        const elNazev  = document.getElementById('full-moon-lidovy-nazev');

        if (elTime)  elTime.textContent  = formatLocalTime(fullDate);
        if (elZnak)  elZnak.textContent  = fullData.znameni;
        if (elNazev) elNazev.textContent = fullData.lidovyNazev;
    }

    updateCountdowns();
    setInterval(updateCountdowns, 60000);
})();
