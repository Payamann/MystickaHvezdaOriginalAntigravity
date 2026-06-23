/**
 * Reading history management
 */

import { escapeHtml, apiUrl, authHeaders, getReadingIcon, getReadingTitle } from './shared.js';

// State
let allReadings = [];
let currentFilter = 'all';
let displayedCount = 0;
const PAGE_SIZE = 10;
const FILTER_ALIASES = {
    'crystal-ball': ['crystal-ball', 'crystal'],
    'natal-chart': ['natal-chart', 'natal']
};
let emptyHistoryViewTracked = false;
let historyNextStepViewTracked = false;

// Getter for allReadings (used by modal.js)
export function getAllReadings() {
    return allReadings;
}

// Setter for updating a reading (used by modal.js)
export function updateReading(id, updates) {
    const reading = allReadings.find(r => r.id === id);
    if (reading) {
        Object.assign(reading, updates);
    }
}

export async function loadReadings() {
    const container = document.getElementById('readings-list');

    try {
        const response = await fetch(`${apiUrl()}/user/readings`, {
            credentials: 'include',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to load readings');

        const data = await response.json();
        allReadings = data.readings || [];
        displayedCount = 0;

        renderReadings();
        return allReadings;

    } catch (error) {
        console.error('Error loading readings:', error);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">⚠️</div>
                    <p class="empty-state__text">Nepodařilo se načíst historii.</p>
                    <button class="btn btn--glass btn--sm" data-readings-action="reload">Zkusit znovu</button>
                </div>
            `;
            container.querySelector('[data-readings-action="reload"]')?.addEventListener('click', () => location.reload());
        }
        return [];
    }
}

export function handleFilterChange(e) {
    currentFilter = e.target.value;
    displayedCount = 0;
    renderReadings();
}

function getFilteredReadings() {
    if (currentFilter === 'all') return allReadings;
    const acceptedTypes = FILTER_ALIASES[currentFilter] || [currentFilter];
    return allReadings.filter(r => acceptedTypes.includes(r.type));
}

function latestReading(readings) {
    return [...readings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
}

function normalizeReadingText(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') {
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }
    if (Array.isArray(value)) {
        return value.map(normalizeReadingText).join(' ');
    }
    if (typeof value === 'object') {
        return Object.values(value).map(normalizeReadingText).join(' ');
    }
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function isTarotYesNoReading(reading) {
    const data = reading?.data || {};
    return reading?.type === 'tarot' && (
        data.tool === 'tarot_yes_no' ||
        data.source === 'tarot_yes_no_result' ||
        reading?.source === 'tarot_yes_no_save_journal' ||
        reading?.feature === 'tarot_yes_no'
    );
}

function hasRelationshipSignal(reading) {
    const text = normalizeReadingText([
        reading?.title,
        reading?.source,
        reading?.feature,
        reading?.data
    ]);
    return [
        'vztah',
        'partner',
        'partnerka',
        'laska',
        'miluje',
        'milovat',
        'rozchod',
        'rande',
        'manzel',
        'manzelka',
        'ozvat',
        'sance'
    ].some((signal) => text.includes(signal));
}

function tarotYesNoSecondaryStep(reading) {
    if (hasRelationshipSignal(reading)) {
        return {
            href: 'partnerska-shoda.html?source=profile_history_next_step&feature=compatibility&intent=relationship_follow_up#form',
            label: 'Prověřit partnerskou shodu',
            feature: 'compatibility',
            intent: 'relationship_follow_up'
        };
    }

    return {
        href: 'tarot-tri-karty.html?source=profile_history_next_step&feature=tarot_multi_card&intent=three_cards_follow_up',
        label: 'Rozšířit na tři karty',
        feature: 'tarot_multi_card',
        intent: 'three_cards_follow_up'
    };
}

function historyNextStepConfig(reading) {
    const type = reading?.type || 'reading';

    if (isTarotYesNoReading(reading)) {
        return {
            title: 'Navázat na odpověď ano/ne',
            description: 'Uložená odpověď má největší hodnotu, když se k ní vrátíš jednou konkrétní navazující otázkou.',
            href: 'tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=yes_no_follow_up',
            label: 'Položit navazující otázku',
            feature: 'tarot_yes_no',
            intent: 'yes_no_follow_up',
            secondary: tarotYesNoSecondaryStep(reading)
        };
    }

    if (type === 'synastry') {
        return {
            title: 'Navázat jednou konkrétní vztahovou otázkou',
            description: 'Když už znáš dynamiku vztahu, další krok je krátká otázka ano/ne k tomu, co teď udělat.',
            href: 'tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=relationship_follow_up',
            label: 'Zeptat se tarotu ano/ne',
            feature: 'tarot_yes_no',
            intent: 'relationship_follow_up',
            secondary: {
                href: 'partnerska-shoda.html?source=profile_history_next_step&feature=compatibility&intent=relationship_context#form',
                label: 'Vrátit se ke shodě',
                feature: 'compatibility',
                intent: 'relationship_context'
            }
        };
    }

    if (type === 'tarot') {
        return {
            title: 'Položit navazující otázku',
            description: 'Deník má největší hodnotu, když na první odpověď navážeš jedním dalším konkrétním krokem.',
            href: 'tarot-ano-ne.html?source=profile_history_next_step&feature=tarot_yes_no&intent=follow_up',
            label: 'Položit další otázku',
            feature: 'tarot_yes_no',
            intent: 'follow_up',
            secondary: {
                href: 'tarot-tri-karty.html?source=profile_history_next_step&feature=tarot_multi_card&intent=three_cards_follow_up',
                label: 'Rozšířit na tři karty',
                feature: 'tarot_multi_card',
                intent: 'three_cards_follow_up'
            }
        };
    }

    return {
        title: 'Proměnit výklad v další krok',
        description: 'Vyber si jednu praktickou otázku a nech Deník držet souvislost mezi odpověďmi.',
        href: 'partnerska-shoda.html?source=profile_history_next_step&feature=partnerska_detail&intent=relationship_follow_up',
        label: 'Prověřit vztahové téma',
        feature: 'partnerska_detail',
        intent: 'relationship_follow_up',
        secondary: {
            href: 'tarot-tri-karty.html?source=profile_history_next_step&feature=tarot_multi_card&intent=three_cards_follow_up',
            label: 'Rozšířit na tři karty',
            feature: 'tarot_multi_card',
            intent: 'three_cards_follow_up'
        }
    };
}

function renderHistoryNextStep(readings) {
    if (currentFilter !== 'all' || readings.length === 0) return '';

    const latest = latestReading(readings);
    const nextStep = historyNextStepConfig(latest);

    if (!historyNextStepViewTracked) {
        historyNextStepViewTracked = true;
        window.MH_ANALYTICS?.trackEvent?.('profile_history_next_step_viewed', {
            source: 'profile_history',
            feature: 'profile_history',
            reading_count: readings.length,
            latest_type: latest?.type || null
        });
    }

    return `
        <div class="profile-history-next-step">
            <div class="profile-history-next-step__copy">
                <span class="profile-history-next-step__eyebrow">Další krok po uložení</span>
                <strong>${escapeHtml(nextStep.title)}</strong>
                <p>${escapeHtml(nextStep.description)}</p>
            </div>
            <div class="profile-history-next-step__actions">
                ${latest?.id ? `<button class="btn btn--glass btn--sm" data-reading-action="view" data-reading-id="${escapeHtml(latest.id)}">Vrátit se k poslednímu výkladu</button>` : ''}
                <a href="${escapeHtml(nextStep.href)}" class="btn btn--primary btn--sm" data-profile-history-next-step="${escapeHtml(nextStep.intent)}" data-analytics-cta="profile_history_next_step" data-analytics-feature="${escapeHtml(nextStep.feature)}">${escapeHtml(nextStep.label)}</a>
                ${nextStep.secondary ? `<a href="${escapeHtml(nextStep.secondary.href)}" class="btn btn--glass btn--sm" data-profile-history-next-step="${escapeHtml(nextStep.secondary.intent)}" data-analytics-cta="profile_history_next_step_secondary" data-analytics-feature="${escapeHtml(nextStep.secondary.feature)}">${escapeHtml(nextStep.secondary.label)}</a>` : ''}
            </div>
        </div>
    `;
}

export function renderReadings() {
    const container = document.getElementById('readings-list');
    if (!container) return;

    const filtered = getFilteredReadings();

    if (filtered.length === 0) {
        if (currentFilter === 'all' && !emptyHistoryViewTracked) {
            emptyHistoryViewTracked = true;
            window.MH_ANALYTICS?.trackEvent?.('profile_empty_history_viewed', {
                source: 'profile_history',
                feature: 'profile_history'
            });
        }

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🔮</div>
                <h4 class="empty-state__title">${currentFilter === 'all' ? 'Ulož první odpověď a vrať se k ní později' : 'Tady zatím není žádný výklad tohoto typu'}</h4>
                <p class="empty-state__text">${currentFilter === 'all'
                    ? 'Deník drží tvoje otázky, odpovědi a opakující se témata pohromadě. Začni krátkým výkladem ano/ne, ulož první odpověď a vrať se k ní, až budeš řešit další krok.'
                    : 'Filtr je prázdný. Zkus jiný typ výkladu nebo se vrať na celou historii.'}</p>
                ${currentFilter === 'all' ? `
                    <div class="empty-state__actions">
                        <a href="tarot-ano-ne.html?source=profile_history_empty&feature=tarot_yes_no&intent=yes_no" class="btn btn--primary btn--sm" data-analytics-cta="profile_empty_tarot_yes_no" data-analytics-feature="tarot_yes_no">Tarot ano/ne</a>
                        <a href="tarot-tri-karty.html?source=profile_history_empty&feature=tarot_multi_card&intent=three_cards" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_three_cards" data-analytics-feature="tarot_multi_card">Tři karty</a>
                        <a href="kristalova-koule.html?source=profile_history_empty&feature=kristalova_koule&intent=yes_no_question" class="btn btn--glass btn--sm" data-analytics-cta="profile_empty_crystal_ball" data-analytics-feature="kristalova_koule">Křišťálová koule</a>
                    </div>
                ` : ''}
            </div>
        `;
        updatePagination(0, 0);
        return;
    }

    // Show paginated results
    const toShow = filtered.slice(0, displayedCount + PAGE_SIZE);
    displayedCount = toShow.length;

    container.innerHTML = `${renderHistoryNextStep(filtered)}${toShow.map(reading => `
        <div class="reading-item card" data-reading-id="${escapeHtml(reading.id)}" role="button" tabindex="0">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${getReadingIcon(reading.type)}</span>
                    <div>
                        <strong>${escapeHtml(getReadingTitle(reading.type))}</strong>
                        <p class="reading-item__date">
                            ${new Date(reading.created_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" data-reading-action="favorite" data-reading-id="${escapeHtml(reading.id)}"
                        title="${reading.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}"
                        aria-label="${reading.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}">
                        ${reading.is_favorite ? '⭐' : '☆'}
                    </button>
                    <button class="btn btn--sm btn--glass" data-reading-action="view" data-reading-id="${escapeHtml(reading.id)}" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join('')}`;

    updatePagination(displayedCount, filtered.length);
}

export function showMoreReadings() {
    renderReadings();
}

function updatePagination(shown, total) {
    const paginationEl = document.getElementById('readings-pagination');
    if (!paginationEl) return;

    if (shown < total) {
        paginationEl.hidden = false;
        paginationEl.classList.add('profile-block-visible');
        const btn = document.getElementById('readings-load-more');
        if (btn) btn.textContent = `Načíst další (${total - shown} zbývá)`;
    } else {
        paginationEl.hidden = true;
        paginationEl.classList.remove('profile-block-visible');
    }
}
