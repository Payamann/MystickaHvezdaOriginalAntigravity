/**
 * Hvězdný Průvodce - Frontend Logic
 */

// DOM elementy — inicializujeme v DOMContentLoaded (bezpečná inicializace)
let chatInput, sendBtn, messagesContainer, typingIndicator;
let messagePending = false;
const MENTOR_PENDING_PROMPT_KEY = 'mentor_pending_prompt_v1';
const MENTOR_PENDING_PROMPT_MAX_AGE_MS = 30 * 60 * 1000;
const MENTOR_PAYMENT_REASSURANCE = 'Cena se zobraz\u00ed ve Stripe p\u0159ed potvrzen\u00edm. Zru\u0161en\u00ed najdete v profilu.';

function getMentorUsageStorageKey(date = new Date()) {
    return `mh_daily_mentor_${window.Auth?.user?.id || 'guest'}_${date.toDateString()}`;
}

function readMentorUsageCount(date = new Date()) {
    try {
        return Math.max(0, Number.parseInt(localStorage.getItem(getMentorUsageStorageKey(date)) || '0', 10) || 0);
    } catch {
        return 0;
    }
}

function writeMentorUsageCount(count, date = new Date()) {
    try {
        localStorage.setItem(getMentorUsageStorageKey(date), String(Math.max(0, count)));
    } catch {
        // Storage can fail in strict privacy modes; server-side quota still protects the limit.
    }
}

function resizeChatInput() {
    if (!chatInput) return;
    const lineEstimate = chatInput.value.split('\n').length + Math.floor(chatInput.value.length / 70);
    chatInput.rows = Math.max(1, Math.min(6, lineEstimate));
}

function resetChatInput() {
    if (!chatInput) return;
    chatInput.value = '';
    chatInput.rows = 1;
}

function fillMentorPrompt(prompt, promptType = 'unknown') {
    if (!chatInput || !prompt) return;

    chatInput.value = prompt;
    resizeChatInput();
    sendBtn?.removeAttribute('disabled');
    chatInput.focus();
    chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.MH_ANALYTICS?.trackCTA?.('mentor_prompt_starter', {
        feature: 'mentor',
        prompt_type: promptType
    });
}

function setupMentorPromptStarters() {
    document.querySelectorAll('[data-mentor-prompt]').forEach((button) => {
        if (button.dataset.mentorPromptBound === 'true') return;
        button.dataset.mentorPromptBound = 'true';
        button.addEventListener('click', () => {
            fillMentorPrompt(button.dataset.mentorPrompt || '', button.dataset.mentorPromptType || 'unknown');
        });
    });
}

function buildMentorUpgradeUrl(source = 'mentor_inline_upsell') {
    const pricingUrl = new URL('/cenik.html', window.location.origin);
    pricingUrl.searchParams.set('plan', 'pruvodce');
    pricingUrl.searchParams.set('source', source);
    pricingUrl.searchParams.set('feature', 'mentor');
    pricingUrl.searchParams.set('entry_source', source);
    pricingUrl.searchParams.set('entry_feature', 'mentor');
    return `${pricingUrl.pathname}${pricingUrl.search}`;
}

function buildMentorSignupUrl(source = 'mentor_entry_auth_gate') {
    const signupUrl = new URL('/prihlaseni.html', window.location.origin);
    signupUrl.searchParams.set('mode', 'register');
    signupUrl.searchParams.set('redirect', '/mentor.html');
    signupUrl.searchParams.set('source', source);
    signupUrl.searchParams.set('feature', 'mentor');
    return `${signupUrl.pathname}${signupUrl.search}`;
}

function savePendingMentorPrompt(prompt, source = 'mentor_entry_auth_gate') {
    const cleanPrompt = String(prompt || '').trim().slice(0, 2000);
    if (!cleanPrompt) return;

    try {
        sessionStorage.setItem(MENTOR_PENDING_PROMPT_KEY, JSON.stringify({
            prompt: cleanPrompt,
            source,
            createdAt: Date.now()
        }));
    } catch {
        // Losing the pending prompt is preferable to blocking signup.
    }
}

function restorePendingMentorPrompt() {
    if (!chatInput) return;

    let pending;
    try {
        pending = JSON.parse(sessionStorage.getItem(MENTOR_PENDING_PROMPT_KEY) || 'null');
    } catch {
        pending = null;
    }

    if (!pending?.prompt || (Date.now() - Number(pending.createdAt || 0)) > MENTOR_PENDING_PROMPT_MAX_AGE_MS) {
        try { sessionStorage.removeItem(MENTOR_PENDING_PROMPT_KEY); } catch {}
        return;
    }

    chatInput.value = pending.prompt;
    resizeChatInput();
    sendBtn?.removeAttribute('disabled');
    chatInput.focus();
    chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try { sessionStorage.removeItem(MENTOR_PENDING_PROMPT_KEY); } catch {}
    window.MH_ANALYTICS?.trackAction?.('mentor_prompt_restored_after_signup', {
        source: pending.source || 'mentor_entry_auth_gate',
        feature: 'mentor'
    });
}

function startMentorSignupFlow(prompt, source = 'mentor_entry_auth_gate') {
    savePendingMentorPrompt(prompt, source);
    window.MH_ANALYTICS?.trackCTA?.(source, {
        feature: 'mentor',
        destination: '/prihlaseni.html',
        auth_mode: 'register'
    });
    window.location.href = buildMentorSignupUrl(source);
}

function startMentorUpgradeFlow(source = 'mentor_inline_upsell') {
    window.MH_ANALYTICS?.trackCTA?.(source, {
        plan_id: 'pruvodce',
        feature: 'mentor'
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout('pruvodce', {
            source,
            feature: 'mentor',
            metadata: {
                entry_source: source,
                entry_feature: 'mentor'
            },
            redirect: '/cenik.html',
            authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
        });
        return;
    }

    window.location.href = buildMentorUpgradeUrl(source);
}

function runAfterComponentsLoaded(callback) {
    let hasRun = false;
    const run = () => {
        if (hasRun) return;
        hasRun = true;
        callback();
    };
    if (document.readyState === 'complete' && document.getElementById('auth-btn')) {
        run();
        return;
    }
    document.addEventListener('components:loaded', run, { once: true });
    window.setTimeout(run, 1200);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializuj DOM elementy — musí být uvnitř DOMContentLoaded
    chatInput = document.getElementById('chat-input');
    sendBtn = document.getElementById('send-btn');
    messagesContainer = document.getElementById('chat-messages');
    typingIndicator = document.getElementById('typing-indicator');
    setupMentorPromptStarters();

    // Připoj event listenery až po inicializaci DOM
    if (chatInput) {
        chatInput.addEventListener('input', function () {
            resizeChatInput();
            if (messagePending) return;

            if (this.value.trim().length > 0) {
                sendBtn?.removeAttribute('disabled');
            } else {
                sendBtn?.setAttribute('disabled', 'true');
            }
        });

        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    // Wait for auth-client to initialize (if needed) but we can check token directly.
    // Odhlášený návštěvník má nejdřív vidět hodnotu: starter otázky a chat input.
    // Registrace se spouští až při odeslání otázky, kdy prompt uložíme pro návrat.
    if (!window.Auth?.isLoggedIn()) {
        document.addEventListener('auth:changed', () => {
            if (window.Auth?.isLoggedIn()) window.location.reload();
        }, { once: true });
        window.isPremium = false;
        return;
    }

    // Check Premium Status
    try {
        const userProfile = await window.Auth.getProfile();
        // Allow everyone to enter, but use the shared Auth helper for plan status.
        window.isPremium = Boolean(userProfile && window.Auth?.isPremium?.());

        // Initialize usage tracking for free users
        if (!window.isPremium) {
            initUsageTracking();
        }

        // Load History for everyone (if any)
        loadHistory();
        restorePendingMentorPrompt();

    } catch (error) {
        console.error('Failed to verify subscription:', error);
    }

    // Auto-focus input
    chatInput?.focus();
});

function initUsageTracking() {
    writeMentorUsageCount(readMentorUsageCount());
}

async function loadHistory() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/mentor/history`, {
            credentials: 'include'
        });

        const data = await response.json();
        if (data.success && data.history) {
            // Remove the default welcome message if we have history?
            // Or keep it as a header? Let's keep it for now or maybe clear container.
            // Actually, if we have history, it might feel weird to have the default greeting at top.
            // Let's remove default greeting if we have history.
            if (data.history.length > 0) {
                const welcomeMsg = messagesContainer.querySelector('.message--mentor');
                if (welcomeMsg && welcomeMsg.innerText.includes('Vítej, poutníku')) {
                    welcomeMsg.remove();
                }

                data.history.forEach(msg => {
                    addMessage(msg.content, msg.role, false); // false = do not scroll yet
                });
                scrollToBottom();
            }

        }
    } catch (e) {
        console.warn('Failed to load history', e);
    }
}

async function sendMessage() {
    if (messagePending || !chatInput || !sendBtn || !messagesContainer || !typingIndicator) return;
    const text = chatInput.value.trim();
    if (!text) return;
    if (text.length > 2000) {
        window.Auth?.showToast?.('Dlouhá zpráva', 'Zkrať zprávu na nejvýš 2000 znaků.', 'info');
        return;
    }
    if (!window.Auth?.isLoggedIn()) {
        window.Auth?.showToast?.('Účet pro vlastní chat', 'Vytvoř si účet, aby ses mohl k otázce a odpovědi vrátit.', 'info');
        startMentorSignupFlow(text, 'mentor_entry_auth_gate');
        return;
    }
    const ownerId = window.Auth.user.id;
    const currentUser = () => ownerId === window.Auth?.user?.id;
    messagePending = true;
    sendBtn.disabled = true;
    sendBtn.setAttribute('aria-busy', 'true');
    showTyping(true);
    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!currentUser()) return;
        const response = await fetch(`${API_CONFIG.BASE_URL}/mentor/chat`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...(csrfToken && { 'X-CSRF-Token': csrfToken }) },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        if (!currentUser()) return;
        if (response.status === 402 || response.status === 403) {
            showPaywall();
            return;
        }
        if (!response.ok || typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Mentor response unavailable');
        addMessage(text, 'user');
        addMessage(data.reply, 'mentor');
        if (chatInput.value.trim() === text) resetChatInput();
        if (!window.isPremium) writeMentorUsageCount(readMentorUsageCount() + 1);
    } catch (error) {
        console.warn('Chat request failed:', error.message);
        if (currentUser()) {
            const notice = addMessage('Odpověď se nepodařilo načíst. Otázka zůstává v poli; můžeš ji poslat znovu.', 'mentor');
            notice?.setAttribute('role', 'status');
        }
    } finally {
        messagePending = false;
        showTyping(false);
        sendBtn.removeAttribute('aria-busy');
        sendBtn.disabled = !chatInput.value.trim() || chatInput.disabled;
    }
}

function addMessage(text, type, shouldScroll = true) {
    const div = document.createElement('div');
    div.className = `message message--${type}`;

    // Safely render text and simple markdown (bold/italic)
    // 1. Escape HTML by setting textContent
    div.textContent = text;
    let html = div.innerHTML;

    // 2. Convert newlines to <br>
    html = html.replace(/\n/g, '<br>');

    // 3. Render Markdown bold **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // 4. Render Markdown italic *text* or _text_ (ensure we don't catch bold parts)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/(_)(.*?)(_)/g, '<em>$2</em>');

    div.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : html.replace(/<[^>]*>/g, '');

    // Insert before typing indicator
    messagesContainer?.insertBefore(div, typingIndicator);

    // Scroll to bottom
    if (shouldScroll) {
        scrollToBottom();
    }
    return div;
}

function showTyping(show) {
    if (show) {
        if (typingIndicator) {
            typingIndicator.hidden = false;
            typingIndicator.classList.add('mh-flex-visible');
        }
        scrollToBottom();
    } else {
        if (typingIndicator) {
            typingIndicator.hidden = true;
            typingIndicator.classList.remove('mh-flex-visible');
        }
    }
}

function scrollToBottom() {
    if (!messagesContainer) return;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showPaywall() {
    // Existing answers remain readable; no generated answer is hidden here.
    document.querySelector('.limit-reached-overlay')?.classList.remove('limit-reached-overlay--visible');
    messagesContainer?.classList.remove('chat-messages--blurred');
    if (messagesContainer?.querySelector('[data-mentor-limit]')) return;
    const notice = document.createElement('div');
    notice.className = 'message message--mentor';
    notice.dataset.mentorLimit = 'true';
    notice.setAttribute('role', 'status');
    notice.innerHTML = `
        <h3>Další odpověď teď není dostupná</h3>
        <p>Bezplatný účet má 3 zprávy denně. Při vyčerpaném limitu můžeš pokračovat po jeho obnovení nebo se podívat na členství. I členství podléhá provozním limitům.</p>
        <p>K této otázce zatím nevznikla odpověď. Tvoje dosavadní zprávy zůstávají přístupné.</p>
        <a href="${buildMentorUpgradeUrl('mentor_paywall_overlay')}" class="btn btn--glass btn--sm mentor-paywall-upgrade-btn">Podívat se na členství</a>
        <p class="mentor-paywall__reassurance">${MENTOR_PAYMENT_REASSURANCE}</p>`;
    notice.querySelector('a')?.addEventListener('click', event => {
        event.preventDefault(); startMentorUpgradeFlow('mentor_paywall_overlay');
    });
    messagesContainer?.insertBefore(notice, typingIndicator);
    scrollToBottom();
}
