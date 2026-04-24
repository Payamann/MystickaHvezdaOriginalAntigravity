document.addEventListener('DOMContentLoaded', () => {
    document.title = 'Můj profil | Mystická Hvězda';

    const setMeta = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', 'Váš osobní profil na Mystické Hvězdě. Historie výkladů, oblíbené, nastavení účtu a správa předplatného.');
    setMeta('meta[name="keywords"]', 'profil, účet, historie výkladů, předplatné, nastavení');
    setMeta('meta[property="og:title"]', 'Můj profil | Mystická Hvězda');
    setMeta('meta[property="og:description"]', 'Osobní dashboard s historií výkladů, nastavením a správou předplatného.');

    const setText = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    };

    const setAttr = (selector, attr, value) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute(attr, value);
    };

    setText('.skip-link', 'Přeskočit na obsah');
    setText('.hero__title', 'Můj profil');
    const heroTitle = document.querySelector('.hero__title');
    if (heroTitle) {
        heroTitle.innerHTML = 'Můj <span class="text-gradient">profil</span>';
    }

    setText('#login-required h2', 'Přihlášení je potřeba');
    setText('#login-required p', 'Pro zobrazení vašeho profilu se prosím přihlaste.');
    const planWrap = document.querySelector('.profile-user-plan');
    if (planWrap && !document.getElementById('user-plan')) {
        planWrap.innerHTML = 'Předplatné: <span id="user-plan" class="badge">-</span>';
    }

    setAttr('#user-avatar', 'aria-label', 'Změnit avatar');
    setAttr('#user-avatar', 'title', 'Klikněte pro změnu avataru');
    setText('#logout-btn', 'Odhlásit');

    const statLabels = document.querySelectorAll('.stat-label');
    const statTexts = ['Celkem výkladů', 'Tento měsíc', 'Oblíbené', 'Denní série'];
    statLabels.forEach((label, index) => {
        if (statTexts[index]) label.textContent = statTexts[index];
    });

    setText('.card-title', 'Manifestační deník');
    setAttr('#journal-input', 'placeholder', 'Napište své přání vesmíru...');
    setText('#journal-submit', 'Vyslat přání');
    setText('.journal-recent-title', 'Poslední záznamy');
    setText('.journal-empty', 'Zatím prázdno...');

    const tabTexts = {
        '#tab-btn-history .profile-tab-label': 'Historie výkladů',
        '#tab-btn-favorites .profile-tab-label': 'Oblíbené',
        '#tab-btn-settings .profile-tab-label': 'Nastavení'
    };
    Object.entries(tabTexts).forEach(([selector, value]) => setText(selector, value));

    setText('#tab-history h3', 'Vaše poslední výklady');
    setText('#readings-filter option[value="all"]', 'Vše');
    setText('#readings-filter option[value="crystal"]', 'Křišťálová koule');
    setText('#readings-filter option[value="natal"]', 'Natální karta');
    setText('#readings-filter option[value="synastry"]', 'Partnerská shoda');
    setText('#readings-list p', 'Načítám historii...');
    setText('#readings-load-more', 'Načíst další');

    setText('#tab-favorites h3', 'Uložené výklady');
    setText('.empty-state__title', 'Zatím žádné oblíbené');
    setText('.empty-state__text', 'Klikněte na hvězdu u výkladu a uložte si ho sem.');

    const settingsCard = document.querySelector('#tab-settings .card.glass-card h3');
    if (settingsCard) settingsCard.textContent = 'Nastavení účtu';
    const settingsSections = document.querySelectorAll('.settings-section-title');
    if (settingsSections[0]) settingsSections[0].textContent = 'Osobní údaje';
    if (settingsSections[1]) settingsSections[1].textContent = 'Účet';
    setText('label[for="settings-name"]', 'Jméno / přezdívka');
    setAttr('#settings-name', 'placeholder', 'Vaše jméno');
    setText('label[for="settings-birthtime"]', 'Čas narození');
    setText('label[for="settings-birthplace"]', 'Místo narození');
    setAttr('#settings-birthplace', 'placeholder', 'Např. Praha');
    setAttr('#settings-email', 'title', 'Email nelze změnit');
    setText('label[for="settings-current-password"]', 'Aktuální heslo');
    setAttr('#settings-current-password', 'placeholder', 'Vyžadováno pro změnu hesla');
    setText('label[for="settings-password"]', 'Nové heslo');
    setAttr('#settings-password', 'placeholder', 'Min. 8 znaků');
    setText('label[for="settings-password-confirm"]', 'Potvrdit nové heslo');
    setAttr('#settings-password-confirm', 'placeholder', 'Zopakujte nové heslo');
    setText('#save-settings-btn', 'Uložit změny');
    setText('#subscription-card h3', 'Správa předplatného');
    setText('#subscription-details p', 'Načítám...');

    setAttr('#reading-modal', 'aria-label', 'Detail výkladu');
    setAttr('#reading-modal-close', 'aria-label', 'Zavřít');
    setText('#reading-modal-content p', 'Načítám...');
    setAttr('#modal-favorite-btn', 'aria-label', 'Přidat do oblíbených');
    setText('#modal-favorite-btn', 'Přidat do oblíbených');
    setAttr('#modal-delete-btn', 'aria-label', 'Smazat výklad');
    setText('#modal-delete-btn', 'Smazat');
});
