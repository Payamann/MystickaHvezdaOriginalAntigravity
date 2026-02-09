/**
 * Profile Journal - Manifestation journal entries
 */

async function loadJournal() {
    const list = document.getElementById('journal-entries');
    if (!list) return;

    try {
        const response = await fetch(`${window.API_CONFIG?.BASE_URL || 'http://localhost:3001/api'}/user/readings`, {
            headers: { 'Authorization': `Bearer ${window.Auth?.token}` }
        });
        const data = await response.json();
        const entries = (data.readings || []).filter(r => r.type === 'journal');

        if (entries.length === 0) {
            list.innerHTML = `<p style="opacity: 0.5; text-align: center;">Zatím žádné záznamy. Napište své první přání...</p>`;
            return;
        }

        list.innerHTML = entries.map(e => `
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; border-left: 3px solid var(--color-mystic-gold);">
                <p style="font-size: 0.8rem; opacity: 0.6; margin-bottom: 0.3rem;">${new Date(e.created_at).toLocaleDateString()}</p>
                <p style="font-style: italic;">"${escapeHtml(e.data.text)}"</p>
            </div>
        `).join('');

    } catch (e) {
        console.error('Journal load error', e);
    }
}

async function saveJournalEntry() {
    const input = document.getElementById('journal-input');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    const btn = document.getElementById('journal-submit');

    if (btn) {
        btn.textContent = 'Odesílání...';
        btn.disabled = true;
    }

    input.style.transition = 'all 1s';
    input.style.transform = 'scale(0.95)';
    input.style.opacity = '0.5';

    try {
        const savedEntry = await window.Auth.saveReading('journal', { text });

        if (!savedEntry) throw new Error('Failed to save');

        if (window.Auth?.showToast) {
            window.Auth.showToast('Odesláno', 'Vaše přání bylo vysláno do Vesmíru', 'success');
        }

        const list = document.getElementById('journal-entries');
        if (list) {
            const emptyState = list.querySelector('p');
            if (emptyState && emptyState.textContent.includes('Zatím žádné záznamy')) {
                list.innerHTML = '';
            }

            const newEntry = document.createElement('div');
            newEntry.style.cssText = 'background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; border-left: 3px solid var(--color-mystic-gold); animation: fadeIn 0.5s;';

            const datePara = document.createElement('p');
            datePara.style.cssText = 'font-size: 0.8rem; opacity: 0.6; margin-bottom: 0.3rem;';
            datePara.textContent = new Date().toLocaleDateString('cs-CZ');

            const textPara = document.createElement('p');
            textPara.style.fontStyle = 'italic';
            textPara.textContent = `"${text}"`;

            newEntry.appendChild(datePara);
            newEntry.appendChild(textPara);
            list.insertBefore(newEntry, list.firstChild);
        }

        input.value = '';
        input.style.transform = 'scale(1)';
        input.style.opacity = '1';

        setTimeout(loadJournal, 1000);

    } catch (e) {
        console.error(e);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se uložit záznam.', 'error');
    } finally {
        if (btn) {
            btn.textContent = 'Vyslat přání';
            btn.disabled = false;
        }
    }
}

// Bind journal submit button
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('journal-submit');
    if (btn) btn.addEventListener('click', saveJournalEntry);
});

// Expose to global scope
window.loadJournal = loadJournal;
window.saveJournalEntry = saveJournalEntry;
