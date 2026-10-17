/**
 * Settings: Avatar picker, subscription management, profile & password update
 */

import { apiUrl, authHeaders, loadPlanManifest, normalizePlanType, formatPlanLabel, PROFILE_AVATARS, profileIconMarkup, renderProfileAvatar } from './shared.js';

let avatarSaving = false;
let subscriptionRequestVersion = 0;

function currentUserSnapshot(ownerId) {
    const current = { ...window.Auth?.user };
    try {
        const cached = JSON.parse(localStorage.getItem('auth_user') || 'null');
        if (cached?.id === ownerId) return { ...cached, ...current };
    } catch { /* A blocked cache must not discard the signed-in user. */ }
    return current;
}

function storeCurrentUser(user) {
    if (window.Auth) window.Auth.user = user;
    try { localStorage.setItem('auth_user', JSON.stringify(user)); } catch { /* Server save already succeeded. */ }
}

export function initAvatarPicker() {
    const grid = document.querySelector('.avatar-picker__grid');
    if (!grid) return;
    grid.innerHTML = PROFILE_AVATARS.map(avatar => `<button type="button" class="avatar-option" data-avatar="symbol:${avatar.symbol}" aria-label="Vybrat avatar: ${avatar.label}">${profileIconMarkup(avatar.symbol)}</button>`).join('');
}

function trackAnalytics(method, ...args) {
    try {
        window.MH_ANALYTICS?.[method]?.(...args);
    } catch (error) {
        console.warn(`[PROFILE] Analytics ${method} failed:`, error.message);
    }
}

function startProfileUpgradeCheckout(source = 'profile_subscription_card') {
    trackAnalytics('trackCTA', source, {
        plan_id: 'pruvodce',
        feature: 'subscription_management'
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout('pruvodce', {
            source,
            feature: 'subscription_management',
            metadata: {
                entry_source: source,
                entry_feature: 'subscription_management'
            },
            redirect: '/cenik.html',
            authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
        });
        return;
    }

    const pricingUrl = new URL('/cenik.html', window.location.origin);
    pricingUrl.searchParams.set('plan', 'pruvodce');
    pricingUrl.searchParams.set('source', source);
    pricingUrl.searchParams.set('feature', 'subscription_management');
    pricingUrl.searchParams.set('entry_source', source);
    pricingUrl.searchParams.set('entry_feature', 'subscription_management');
    window.location.href = `${pricingUrl.pathname}${pricingUrl.search}`;
}

export function initSettingsForm() {
    const user = window.Auth?.user;
    if (!user) return;

    const nameEl = document.getElementById('settings-name');
    const emailEl = document.getElementById('settings-email');
    const birthtimeEl = document.getElementById('settings-birthtime');
    const birthdateEl = document.getElementById('settings-birthdate');
    const birthplaceEl = document.getElementById('settings-birthplace');

    if (nameEl) nameEl.value = user.first_name || '';
    if (emailEl) emailEl.value = user.email || '';
    if (birthtimeEl) birthtimeEl.value = user.birth_time || '';
    if (birthdateEl) {
        birthdateEl.value = user.birth_date?.slice(0, 10) || '';
        const now = new Date();
        birthdateEl.max = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    if (birthplaceEl) birthplaceEl.value = user.birth_place || '';
}

export async function saveSettings() {
    const ownerId = window.Auth?.user?.id;
    if (!ownerId) return;
    const btn = document.getElementById('save-settings-btn');
    const settingsForm = document.querySelector('.settings-form');
    const formUx = window.MH_FORM_UX || {};

    formUx.clearFormSummary?.(settingsForm);
    ['settings-name', 'settings-birthdate', 'settings-birthtime', 'settings-birthplace'].forEach(id => {
        formUx.clearFieldError?.(document.getElementById(id));
    });

    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Ukládám...';
    }

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (ownerId !== window.Auth?.user?.id) return;
        const name = document.getElementById('settings-name')?.value.trim();
        const birthtime = document.getElementById('settings-birthtime')?.value;
        const birthplace = document.getElementById('settings-birthplace')?.value.trim();
        const birthdateEl = document.getElementById('settings-birthdate');
        if (birthdateEl && !birthdateEl.checkValidity()) {
            formUx.setFieldError?.(birthdateEl, 'Zadej platné datum narození, které není v budoucnosti.');
            birthdateEl.focus();
            throw new Error('Zadej platné datum narození, které není v budoucnosti.');
        }

        const profileBody = {};
        if (name) profileBody.first_name = name;
        else if (window.Auth?.user?.first_name) {
            const nameField = document.getElementById('settings-name');
            formUx.setFieldError?.(nameField, 'Vyplň jméno, které chceš v profilu používat.');
            nameField?.focus();
            throw new Error('Vyplň jméno, které chceš v profilu používat.');
        }
        if (birthdateEl) profileBody.birth_date = birthdateEl.value || null;
        if (birthtime !== undefined) profileBody.birth_time = birthtime || null;
        if (birthplace !== undefined) profileBody.birth_place = birthplace;

        const profileRes = await fetch(`${apiUrl()}/auth/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                ...authHeaders(true),
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify(profileBody)
        });

        if (!profileRes.ok) {
            const err = await profileRes.json().catch(() => ({}));
            throw new Error(err.error || 'Nepodařilo se uložit profil.');
        }

        const profileData = await profileRes.json();
        if (ownerId !== window.Auth?.user?.id) return;

        const cached = currentUserSnapshot(ownerId);

        // Merge only fields this form changed; a concurrent avatar save owns its field.
        Object.keys(profileBody).forEach(key => {
            cached[key] = profileData.user && Object.hasOwn(profileData.user, key) ? profileData.user[key] : profileBody[key];
        });
        storeCurrentUser(cached);

        document.dispatchEvent(new CustomEvent('profile:updated', { detail: { user: cached } }));
        window.Auth?.showToast?.('Uloženo', 'Tvoje údaje jsou uložené.', 'success');
    } catch (e) {
        console.error('Settings save error:', e);
        formUx.setFormSummary?.(settingsForm, e.message || 'Nepodařilo se uložit nastavení.');
        window.Auth?.showToast?.('Chyba', e.message || 'Nepodařilo se uložit nastavení.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Uložit změny';
        }
    }
}

export async function changePassword() {
    const btn = document.getElementById('change-password-btn');
    const form = document.querySelector('.settings-password-fields');
    const ux = window.MH_FORM_UX || {};
    const ids = ['settings-current-password', 'settings-password', 'settings-password-confirm'];
    const fields = ids.map(id => document.getElementById(id));
    ux.clearFormSummary?.(form);
    fields.forEach(field => ux.clearFieldError?.(field));
    try {
        const [currentPassword, password, password_confirm] = fields.map(field => field?.value || '');
        const invalid = !currentPassword ? [0, 'Zadej aktuální heslo.']
            : password.length < 8 ? [1, 'Nové heslo musí mít alespoň 8 znaků.']
            : password !== password_confirm ? [2, 'Nová hesla se neshodují.'] : null;
        if (invalid) {
            ux.setFieldError?.(fields[invalid[0]], invalid[1]);
            fields[invalid[0]]?.focus();
            throw new Error(invalid[1]);
        }
        if (btn) { btn.disabled = true; btn.textContent = 'Měním heslo…'; }
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        const response = await fetch(`${apiUrl()}/user/password`, {
            method: 'PUT', credentials: 'include',
            headers: { ...authHeaders(true), ...(csrfToken && { 'X-CSRF-Token': csrfToken }) },
            body: JSON.stringify({ currentPassword, password, password_confirm })
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Nepodařilo se změnit heslo.');
        }
        fields.forEach(field => { if (field) field.value = ''; });
        window.Auth?.showToast?.('Heslo změněno', 'Přihlas se znovu svým novým heslem.', 'success');
        setTimeout(() => window.Auth?.logout?.(), 2000);
    } catch (error) {
        ux.setFormSummary?.(form, error.message);
        window.Auth?.showToast?.('Změna hesla', error.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Změnit heslo'; }
    }
}

export function toggleAvatarPicker() {
    const picker = document.getElementById('avatar-picker');
    if (!picker) return;
    const isHidden = picker.hidden || !picker.classList.contains('profile-block-visible');
    picker.hidden = !isHidden;
    picker.classList.toggle('profile-block-visible', isHidden);

    if (isHidden) {
        const currentAvatar = window.Auth?.user?.avatar;
        picker.querySelectorAll('.avatar-option').forEach(opt => {
            opt.classList.toggle('avatar-option--active', opt.dataset.avatar === currentAvatar);
        });
    }
}

export async function selectAvatar(emoji) {
    if (avatarSaving || !PROFILE_AVATARS.some(avatar => `symbol:${avatar.symbol}` === emoji)) return;
    const ownerId = window.Auth?.user?.id;
    if (!ownerId) return;
    avatarSaving = true;
    const avatarEl = document.getElementById('user-avatar');
    const picker = document.getElementById('avatar-picker');
    const options = picker?.querySelectorAll('.avatar-option') || [];
    options.forEach(option => { option.disabled = true; });
    avatarEl?.setAttribute('aria-busy', 'true');

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (ownerId !== window.Auth?.user?.id) return;
        const res = await fetch(`${apiUrl()}/auth/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                ...authHeaders(true),
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({ avatar: emoji })
        });

        if (!res.ok) {
            throw new Error('Nepodařilo se uložit avatar.');
        }
        if (ownerId !== window.Auth?.user?.id) return;

        const currentUser = currentUserSnapshot(ownerId);
        currentUser.avatar = emoji;
        storeCurrentUser(currentUser);
        document.dispatchEvent(new CustomEvent('profile:updated', { detail: { user: currentUser } }));
        renderProfileAvatar(avatarEl, emoji);
        options.forEach(option => option.classList.toggle('avatar-option--active', option.dataset.avatar === emoji));
        if (picker) { picker.hidden = true; picker.classList.remove('profile-block-visible'); }
        window.Auth?.showToast?.('Avatar změněn', 'Nový symbol je uložený.', 'success');
    } catch (e) {
        console.error('Error saving avatar:', e);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se uložit avatar.', 'error');
    } finally {
        avatarSaving = false;
        options.forEach(option => { option.disabled = false; });
        avatarEl?.setAttribute('aria-busy', 'false');
    }
}

export async function loadSubscriptionStatus() {
    const version = ++subscriptionRequestVersion;
    const ownerId = window.Auth?.user?.id;
    const isCurrentRequest = () => version === subscriptionRequestVersion && ownerId === window.Auth?.user?.id;
    const container = document.getElementById('subscription-details');
    if (!container) return null;

    try {
        await loadPlanManifest();

        const res = await fetch(`${apiUrl()}/payment/subscription/status`, {
            credentials: 'include',
            headers: authHeaders()
        });

        if (!res.ok) throw new Error('Failed to load subscription');

        const data = await res.json();
        if (!isCurrentRequest()) return null;
        renderSubscriptionCard(data);
        document.dispatchEvent(new CustomEvent('subscription:updated', { detail: { userId: ownerId, subscription: data } }));
        return data;
    } catch (e) {
        if (!isCurrentRequest()) return null;
        document.dispatchEvent(new CustomEvent('subscription:updated', { detail: { userId: ownerId, subscription: null } }));
        console.error('Subscription status error:', e);
        container.innerHTML = `
            <div class="subscription-info">
                <div class="subscription-plan">
                    <span class="subscription-plan__name">Stav přístupu se nepodařilo načíst</span>
                </div>
                <div class="subscription-actions">
                    <button id="sub-retry-btn" type="button" class="btn btn--glass btn--sm">Zkusit znovu</button>
                </div>
            </div>
        `;
        document.getElementById('sub-retry-btn')?.addEventListener('click', loadSubscriptionStatus);
        return null;
    }
}

function renderSubscriptionCard(sub) {
    const container = document.getElementById('subscription-details');
    if (!container) return;
    const normalizedPlanType = normalizePlanType(sub.planType);

    const statusLabels = {
        active: { text: 'Aktivní', class: 'badge--success' },
        trialing: { text: 'Zkušební období', class: 'badge--info' },
        cancel_pending: { text: 'Končí na konci období', class: 'badge--warning' },
        past_due: { text: 'Platba selhala', class: 'badge--danger' },
        unpaid: { text: 'Platba není uhrazena', class: 'badge--danger' },
        incomplete: { text: 'Platbu je potřeba dokončit', class: 'badge--danger' },
        paused: { text: 'Pozastaveno', class: 'badge--warning' },
        cancelled: { text: 'Zrušeno', class: 'badge--danger' },
        canceled: { text: 'Zrušeno', class: 'badge--danger' },
        incomplete_expired: { text: 'Platba nebyla dokončena', class: 'badge--secondary' }
    };

    const planName = formatPlanLabel(normalizedPlanType, { freeSuffix: true });
    const statusInfo = Object.hasOwn(statusLabels, sub.status)
        ? statusLabels[sub.status]
        : { text: 'Neznámý stav', class: 'badge--secondary' };
    const isPremium = normalizedPlanType !== 'free';
    const canManagePayments = sub.canManagePayments === true;
    const hasBillingSubscription = typeof sub.hasBillingSubscription === 'boolean' ? sub.hasBillingSubscription : null;
    const rawPeriodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    const periodEnd = rawPeriodEnd && !Number.isNaN(rawPeriodEnd.getTime()) ? rawPeriodEnd : null;
    const periodEndStr = periodEnd ? periodEnd.toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric'
    }) : null;
    const pauseUntil = sub.pauseUntil ? new Date(sub.pauseUntil) : null;
    const pauseUntilStr = pauseUntil && !Number.isNaN(pauseUntil.getTime())
        ? pauseUntil.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;
    const needsPaymentUpdate = sub.needsPaymentUpdate === true || ['past_due', 'unpaid', 'incomplete'].includes(sub.status);
    const isPaused = sub.status === 'paused';

    let html = '<div class="subscription-info">';
    html += `
        <div class="subscription-plan">
            <span class="subscription-plan__name">${planName}</span>
            <span class="badge ${statusInfo.class}">${statusInfo.text}</span>
        </div>
    `;

    if (sub.status === 'trialing' && periodEnd) {
        const daysRemaining = Math.max(0, Math.ceil((periodEnd - new Date()) / 86400000));
        const dayWord = daysRemaining === 1 ? 'den' : (daysRemaining >= 2 && daysRemaining <= 4) ? 'dny' : 'dnů';
        html += `<div class="trial-countdown">
            <span class="trial-countdown__main">Zkušební období: zbývá <strong>${daysRemaining}</strong> ${dayWord}</span>
            <span class="trial-countdown__date">Končí: ${periodEndStr}</span>
        </div>`;
    }

    if (needsPaymentUpdate) {
        html += `<p class="subscription-period"><strong>Členství čeká na opravu platby.</strong> Aktualizuj platební metodu a Stripe se pokusí platbu bezpečně dokončit.</p>`;
    } else if (isPaused) {
        const pauseCopy = pauseUntilStr
            ? `Do ${pauseUntilStr} se nic neúčtuje a prémiový přístup je pozastavený. Obnovit ho můžeš kdykoliv.`
            : 'Během pauzy se nic neúčtuje a prémiový přístup je pozastavený. Obnovit ho můžeš kdykoliv.';
        html += `<p class="subscription-period"><strong>Předplatné je pozastavené.</strong> ${pauseCopy}</p>`;
    } else if (isPremium && hasBillingSubscription === false) {
        html += '<p class="subscription-period">Přístup je přidělený samostatně. Není u něj nastavená automatická platba.</p>';
        if (periodEnd && periodEnd.getFullYear() < 2090) html += `<p class="subscription-period">Platnost přístupu: <strong>${periodEndStr}</strong></p>`;
    } else if (isPremium && periodEndStr && sub.status !== 'trialing') {
        const label = sub.status === 'cancel_pending'
            ? 'Přístup končí'
            : hasBillingSubscription ? 'Konec aktuálního platebního období' : 'Platnost přístupu';
        html += `<p class="subscription-period">${label}: <strong>${periodEndStr}</strong></p>`;
    }

    html += '<div class="subscription-actions">';

    if (!isPremium) {
        html += '<button id="sub-upgrade-btn" type="button" class="btn btn--gold btn--sm">Prohlédnout členství</button>';
    } else {
        if (needsPaymentUpdate && canManagePayments) {
            html += '<button id="sub-payment-update-btn" type="button" class="btn btn--primary btn--sm">Aktualizovat kartu</button>';
            if (sub.canCancel) {
                html += '<button id="sub-cancel-btn" type="button" data-cancel-immediate="true" class="btn btn--sm btn--glass">Zrušit a zastavit další pokusy</button>';
            }
        } else if (isPaused && sub.canResume === true) {
            html += '<button id="sub-resume-btn" type="button" class="btn btn--primary btn--sm">Obnovit předplatné</button>';
        } else if (sub.canCancel && sub.status !== 'cancel_pending') {
            html += '<button id="sub-cancel-btn" type="button" class="btn btn--sm btn--glass">Zrušit předplatné</button>';
        }
        if (sub.status === 'cancel_pending' && hasBillingSubscription) {
            html += '<button id="sub-reactivate-btn" type="button" class="btn btn--sm btn--primary">Obnovit předplatné</button>';
        }
    }
    if (canManagePayments) html += `<button id="sub-portal-btn" type="button" class="btn btn--sm btn--glass">${isPremium && hasBillingSubscription ? 'Správa plateb' : 'Platební údaje a faktury'}</button>`;

    html += '</div></div>';
    container.innerHTML = html;

    document.getElementById('sub-upgrade-btn')?.addEventListener('click', () => {
        startProfileUpgradeCheckout('profile_subscription_card');
    });
    document.getElementById('sub-cancel-btn')?.addEventListener('click', cancelSubscription);
    document.getElementById('sub-reactivate-btn')?.addEventListener('click', reactivateSubscription);
    document.getElementById('sub-resume-btn')?.addEventListener('click', resumePausedSubscription);
    document.getElementById('sub-payment-update-btn')?.addEventListener('click', () => {
        openStripePortal('payment_method_update', 'sub-payment-update-btn');
    });
    document.getElementById('sub-portal-btn')?.addEventListener('click', () => openStripePortal());
}

async function cancelSubscription({ skipRetention = false } = {}) {
    const immediate = document.getElementById('sub-cancel-btn')?.dataset.cancelImmediate === 'true';
    if (!immediate && !skipRetention && window.MH_RETENTION?.showCancellationModal) {
        trackAnalytics('trackSubscriptionAction', 'cancel_flow_opened', {
            source: 'profile_settings'
        });
        window.MH_RETENTION.showCancellationModal(() => cancelSubscription({ skipRetention: true }));
        return;
    }

    if (!skipRetention) {
        const confirmed = confirm(immediate
            ? 'Opravdu chcete členství ihned zrušit a zastavit další pokusy o platbu?'
            : 'Opravdu chcete zrušit předplatné? Přístup vám zůstane do konce aktuálního období.');
        if (!confirmed) {
            return;
        }
    }

    const btn = document.getElementById('sub-cancel-btn');
    const originalLabel = btn?.textContent;
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Ruším...';
    }

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        const res = await fetch(`${apiUrl()}/payment/cancel`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                ...authHeaders(true),
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Cancel failed');
        trackAnalytics('trackSubscriptionAction', 'cancel_requested', { source: 'profile_settings', plan_type: 'premium' });

        window.Auth?.showToast?.('Zrušeno', data.message || 'Předplatné bude ukončeno na konci období.', 'success');
        await loadSubscriptionStatus();
    } catch (e) {
        console.error('Cancel error:', e);
        window.Auth?.showToast?.('Chyba', e.message || 'Nepodařilo se zrušit předplatné.', 'error');
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalLabel;
        }
    }
}

async function reactivateSubscription() {
    const btn = document.getElementById('sub-reactivate-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Obnovuji...';
    }

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        const res = await fetch(`${apiUrl()}/payment/reactivate`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                ...authHeaders(true),
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Reactivate failed');
        trackAnalytics('trackSubscriptionAction', 'reactivated', { source: 'profile_settings' });

        window.Auth?.showToast?.('Obnoveno', data.message || 'Předplatné bylo obnoveno.', 'success');
        await loadSubscriptionStatus();
    } catch (e) {
        console.error('Reactivate error:', e);
        window.Auth?.showToast?.('Chyba', e.message || 'Nepodařilo se obnovit předplatné.', 'error');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Obnovit předplatné';
        }
    }
}

async function resumePausedSubscription() {
    const btn = document.getElementById('sub-resume-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Obnovuji...';
    }

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        const res = await fetch(`${apiUrl()}/payment/subscription/resume`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                ...authHeaders(true),
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({})
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Resume failed');
        trackAnalytics('trackSubscriptionAction', 'pause_resumed', { source: 'profile_settings' });
        window.Auth?.showToast?.('Obnoveno', 'Předplatné je znovu aktivní.', 'success');
        await loadSubscriptionStatus();
    } catch (e) {
        console.error('Resume paused subscription error:', e);
        window.Auth?.showToast?.('Chyba', e.message || 'Nepodařilo se obnovit předplatné.', 'error');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Obnovit předplatné';
        }
    }
}

async function openStripePortal(flow = null, buttonId = 'sub-portal-btn') {
    const btn = document.getElementById(buttonId);
    const originalLabel = btn?.textContent || (flow === 'payment_method_update' ? 'Aktualizovat kartu' : 'Správa plateb');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Otevírám...';
    }

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        const res = await fetch(`${apiUrl()}/payment/portal`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                ...authHeaders(true),
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify(flow ? { flow } : {})
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Portal failed');

        if (data.url) {
            trackAnalytics('trackBillingPortalOpened', {
                source: 'profile_settings',
                flow: flow || 'portal_home'
            });
            window.location.href = data.url;
            return;
        }

        throw new Error('Platební portál nevrátil cílovou adresu.');
    } catch (e) {
        console.error('Portal error:', e);
        window.Auth?.showToast?.('Chyba', e.message || 'Nepodařilo se otevřít správu plateb.', 'error');
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalLabel;
        }
    }
}
