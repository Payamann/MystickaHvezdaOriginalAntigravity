document.addEventListener('click', (event) => {
    const actionTarget = event.target.closest ? event.target.closest('[data-action]') : null;
    const action = actionTarget ? actionTarget.getAttribute('data-action') : null;

    if (action === 'loadUsers') {
        loadUsers();
    }
    if (action === 'loadFunnel') {
        loadFunnel();
    }
    if (action === 'loadAdminData') {
        loadAdminData();
    }
});

document.addEventListener('change', (event) => {
    if (event.target && event.target.id === 'funnel-range-days') {
        loadFunnel();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAccess();
});

const integerFormatter = new Intl.NumberFormat('cs-CZ');
const currencyFormatter = new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
});

async function checkAdminAccess() {
    const profile = await window.Auth.getProfile();

    if (!profile) {
        window.location.href = 'prihlaseni.html?redirect=admin.html';
        return;
    }

    document.getElementById('admin-email').textContent = profile.email;
    loadAdminData();
}

async function loadAdminData() {
    await Promise.all([
        loadUsers(),
        loadFunnel()
    ]);
}

async function loadUsers() {
    const tbody = document.querySelector('#users-table tbody');
    const errorMsg = document.getElementById('error-msg');

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/admin/users`, {
            credentials: 'include'
        });

        if (response.status === 403) {
            tbody.replaceChildren(createTableMessageRow(6, 'Přístup odepřen (nejste admin).', 'admin-table-error'));
            return;
        }

        const data = await response.json();

        if (!data.success) throw new Error(data.error);

        renderUsers(data.users);
        errorMsg.textContent = '';
    } catch (error) {
        console.error(error);
        errorMsg.textContent = 'Chyba při načítání uživatelů: ' + error.message;
    }
}

function renderUsers(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.replaceChildren();

    if (!users || users.length === 0) {
        tbody.appendChild(createTableMessageRow(6, 'Zatím tu nejsou žádní uživatelé.'));
        return;
    }

    users.forEach(user => {
        const sub = (user.subscriptions && user.subscriptions.length > 0)
            ? user.subscriptions[0]
            : (typeof user.subscriptions === 'object' ? user.subscriptions : {});
        const plan = sub.plan_type || 'free';
        const credits = sub.credits || 0;
        const safeClass = plan.split('_')[0].replace(/[^a-z]/g, '');

        const tr = document.createElement('tr');

        const tdEmail = document.createElement('td');
        tdEmail.textContent = user.email;

        const tdId = document.createElement('td');
        tdId.className = 'admin-user-id';
        tdId.textContent = user.id.substring(0, 8) + '...';

        const tdPlan = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `status-badge status-${safeClass}`;
        badge.textContent = plan;
        tdPlan.appendChild(badge);

        const tdCredits = document.createElement('td');
        tdCredits.textContent = credits;

        const tdDate = document.createElement('td');
        tdDate.textContent = new Date(user.created_at).toLocaleDateString();

        const tdActions = document.createElement('td');
        ['premium_monthly', 'vip_majestrat', 'free'].forEach((nextPlan, index) => {
            const btn = document.createElement('button');
            btn.className = `action-btn${index === 0 ? ' btn-promote' : (index === 2 ? ' btn-demote' : '')}`;
            btn.textContent = index === 0 ? 'Premium' : (index === 1 ? 'VIP Majestát' : 'Free');
            btn.addEventListener('click', () => updateSub(user.id, nextPlan));
            tdActions.appendChild(btn);
        });

        tr.append(tdEmail, tdId, tdPlan, tdCredits, tdDate, tdActions);
        tbody.appendChild(tr);
    });
}

async function loadFunnel() {
    const daysSelect = document.getElementById('funnel-range-days');
    const days = daysSelect ? daysSelect.value : '30';
    const summary = document.getElementById('funnel-summary');
    const tbody = document.querySelector('#funnel-events-table tbody');
    const errorMsg = document.getElementById('error-msg');

    summary.replaceChildren(createLoadingBlock('Načítám funnel...'));
    tbody.replaceChildren(createTableMessageRow(5, 'Načítám data...'));

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/admin/funnel?days=${encodeURIComponent(days)}`, {
            credentials: 'include'
        });

        if (response.status === 403) {
            summary.replaceChildren(createLoadingBlock('Přístup odepřen (nejste admin).'));
            tbody.replaceChildren(createTableMessageRow(5, 'Přístup odepřen.', 'admin-table-error'));
            return;
        }

        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderFunnel(data.report);
        errorMsg.textContent = '';
    } catch (error) {
        console.error(error);
        summary.replaceChildren(createLoadingBlock('Funnel se nepodařilo načíst.'));
        tbody.replaceChildren(createTableMessageRow(5, 'Funnel report není dostupný.', 'admin-table-error'));
        errorMsg.textContent = 'Chyba při načítání funnelu: ' + error.message;
    }
}

function renderFunnel(report) {
    const metrics = report.metrics || {};
    const summary = document.getElementById('funnel-summary');
    const metricCards = [
        ['Paywall views', formatInteger(metrics.paywallViewed), `${formatPercent(metrics.paywallToCheckoutRate)} pokračuje do checkoutu`],
        ['Checkouty', formatInteger(metrics.checkoutStarted), 'Zahájené Stripe checkout sessions'],
        ['Premium konverze', formatInteger(metrics.subscriptionCompleted), `${formatPercent(metrics.conversionRate)} z checkoutů`],
        ['Jednorázové nákupy', formatInteger(metrics.oneTimeCompleted), 'Roční horoskop a další produkty'],
        ['Selhání', formatInteger(metrics.failures), 'Validace, Stripe nebo platba'],
        ['Refundy', formatInteger(metrics.refunds), 'Vrácené platby'],
        ['Odhad hodnoty', formatCurrency(metrics.estimatedValueCzk), `Za posledních ${report.days} dní`],
    ];

    summary.replaceChildren(...metricCards.map(([label, value, hint]) => createMetric(label, value, hint)));
    renderBreakdown('funnel-sources', report.topSources);
    renderBreakdown('funnel-features', report.topFeatures);
    renderBreakdown('funnel-plans', report.topPlans);
    renderFunnelEvents(report.recentEvents || []);
}

function renderBreakdown(elementId, rows) {
    const list = document.getElementById(elementId);
    list.replaceChildren();

    if (!rows || rows.length === 0) {
        const empty = document.createElement('li');
        empty.textContent = 'Žádná data.';
        list.appendChild(empty);
        return;
    }

    rows.forEach(row => {
        const item = document.createElement('li');

        const label = document.createElement('strong');
        label.textContent = formatDimension(row.key);

        const count = document.createElement('span');
        count.textContent = formatInteger(row.count);

        item.append(label, count);
        list.appendChild(item);
    });
}

function renderFunnelEvents(events) {
    const tbody = document.querySelector('#funnel-events-table tbody');
    tbody.replaceChildren();

    if (events.length === 0) {
        tbody.appendChild(createTableMessageRow(5, 'Zatím tu nejsou žádné funnel události.'));
        return;
    }

    events.forEach(event => {
        const tr = document.createElement('tr');
        appendCell(tr, formatDateTime(event.createdAt));
        appendCell(tr, event.eventName || '-');
        appendCell(tr, formatDimension(event.source));
        appendCell(tr, formatDimension(event.feature));
        appendCell(tr, formatDimension(event.planId || event.planType));
        tbody.appendChild(tr);
    });
}

function createMetric(label, value, hint) {
    const metric = document.createElement('div');
    metric.className = 'admin-metric';

    const labelNode = document.createElement('span');
    labelNode.className = 'admin-metric__label';
    labelNode.textContent = label;

    const valueNode = document.createElement('strong');
    valueNode.className = 'admin-metric__value';
    valueNode.textContent = value;

    const hintNode = document.createElement('span');
    hintNode.className = 'admin-metric__hint';
    hintNode.textContent = hint;

    metric.append(labelNode, valueNode, hintNode);
    return metric;
}

function createLoadingBlock(text) {
    const block = document.createElement('div');
    block.className = 'admin-loading';
    block.textContent = text;
    return block;
}

function createTableMessageRow(colspan, text, className = '') {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colspan;
    if (className) td.className = className;
    td.textContent = text;
    tr.appendChild(td);
    return tr;
}

function appendCell(row, text, className = '') {
    const cell = document.createElement('td');
    if (className) cell.className = className;
    cell.textContent = text;
    row.appendChild(cell);
}

function formatInteger(value) {
    return integerFormatter.format(Number(value) || 0);
}

function formatCurrency(value) {
    return currencyFormatter.format(Number(value) || 0);
}

function formatPercent(value) {
    return `${integerFormatter.format(Number(value) || 0)} %`;
}

function formatDimension(value) {
    if (!value || value === '(nezadano)') return 'Nezadáno';
    if (value === '(direct)') return 'Direct';
    return value;
}

function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('cs-CZ', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
}

window.updateSub = async function updateSub(userId, plan) {
    if (!confirm(`Opravdu změnit plán na ${plan} pro uživatele ${userId}?`)) return;

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        const response = await fetch(`${API_CONFIG.BASE_URL}/admin/user/${userId}/subscription`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
            },
            body: JSON.stringify({ plan_type: plan })
        });

        const data = await response.json();
        if (data.success) {
            alert('Aktualizováno.');
            loadAdminData();
        } else {
            alert('Chyba: ' + data.error);
        }
    } catch (e) {
        alert('Chyba spojení.');
    }
};
