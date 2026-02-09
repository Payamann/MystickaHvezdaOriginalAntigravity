/**
 * Profile Settings - Save user settings and password changes
 */

async function saveSettings() {
    const saveBtn = document.getElementById('save-settings-btn');
    const newPassword = document.getElementById('settings-password').value;

    if (saveBtn) {
        saveBtn.classList.add('btn--loading');
        saveBtn.disabled = true;
    }

    const data = {
        first_name: document.getElementById('settings-name').value,
        birth_date: document.getElementById('settings-birthdate').value,
        birth_time: document.getElementById('settings-birthtime').value,
        birth_place: document.getElementById('settings-birthplace').value
    };

    if (newPassword) {
        try {
            const res = await fetch(`${window.API_CONFIG?.BASE_URL || 'http://localhost:3001/api'}/user/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.Auth?.token}`
                },
                body: JSON.stringify({ currentPassword: document.getElementById('settings-current-password')?.value || '', password: newPassword })
            });
            if (!res.ok) throw new Error('Password update failed');
        } catch (e) {
            console.error(e);
            window.Auth?.showToast?.('Chyba hesla', 'Heslo se nepodařilo změnit (min. 6 znaků).', 'error');
            if (saveBtn) {
                saveBtn.classList.remove('btn--loading');
                saveBtn.disabled = false;
            }
            return;
        }
    }

    try {
        const res = await fetch(`${window.API_CONFIG?.BASE_URL || 'http://localhost:3001/api'}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.Auth?.token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const updatedUser = await res.json();
            let currentUser = {};
            try { currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}'); } catch (e) { /* corrupted data */ }
            const newUser = { ...currentUser, ...updatedUser.user };
            localStorage.setItem('auth_user', JSON.stringify(newUser));
            window.Auth.user = newUser;

            window.Auth?.showToast?.('Uloženo', 'Profil byl úspěšně aktualizován.', 'success');

            if (data.birth_date) {
                initBiorhythms(data.birth_date);
            }

            setTimeout(() => location.reload(), 1500);
        } else {
            throw new Error('Update failed');
        }
    } catch (e) {
        console.error(e);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se uložit nastavení.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.classList.remove('btn--loading');
            saveBtn.disabled = false;
        }
    }
}

// Expose to global scope
window.saveSettings = saveSettings;
