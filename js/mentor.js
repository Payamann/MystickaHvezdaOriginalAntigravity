/**
 * Hvězdný Průvodce - Frontend Logic
 */

// DOM elementy — inicializujeme v DOMContentLoaded (bezpečná inicializace)
let chatInput, sendBtn, messagesContainer, typingIndicator;
const MENTOR_PENDING_PROMPT_KEY = 'mentor_pending_prompt_v1';
const MENTOR_PENDING_PROMPT_MAX_AGE_MS = 30 * 60 * 1000;
const MENTOR_PAYMENT_REASSURANCE = '7 dní za 0 Kč, potom automaticky 199 Kč/měsíc, pokud nezrušíš. K aktivaci je potřeba karta. Zrušení v profilu.';

let mentorOwner;
let mentorRevision = 0;
let mentorHistoryLoading = false;
let mentorSending = false;
let mentorHistoryStatus;

function currentMentorOwner() {
    return window.Auth?.isLoggedIn?.() ? window.Auth.user?.id || null : null;
}

function isCurrentMentorRequest(owner, revision) {
    return owner === currentMentorOwner() && owner === mentorOwner && revision === mentorRevision;
}

function updateMentorSendButton() {
    if (sendBtn) sendBtn.disabled = mentorHistoryLoading || mentorSending || !chatInput?.value.trim();
}

function syncMentorAccount() {
    const owner = currentMentorOwner();
    if (owner === mentorOwner) return;
    const previousOwner = mentorOwner;
    mentorOwner = owner;
    mentorRevision += 1;
    mentorSending = false;
    mentorHistoryLoading = false;
    showTyping(false);
    if (previousOwner !== undefined) {
        messagesContainer?.querySelectorAll('.message').forEach(message => message.remove());
        resetChatInput();
        try { sessionStorage.removeItem(MENTOR_PENDING_PROMPT_KEY); } catch {}
    }
    mentorHistoryStatus.hidden = true;
    if (chatInput) chatInput.disabled = false;
    window.isPremium = Boolean(owner && window.Auth?.isPremium?.());
    if (owner) {
        loadHistory(owner, mentorRevision);
        if (previousOwner === undefined) restorePendingMentorPrompt();
    }
    updateMentorSendButton();
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
    updateMentorSendButton();
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
    updateMentorSendButton();
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

function trackMentorPaywallDismissed(source) {
    window.MH_ANALYTICS?.trackAction?.('paywall_dismissed', {
        source,
        feature: 'mentor'
    });
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

function keepMentorFree(source, overlay = null) {
    trackMentorPaywallDismissed(source);
    overlay?.classList.remove('limit-reached-overlay--visible');
    messagesContainer?.classList.remove('chat-messages--blurred');

    if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = 'Denní limit zdarma je vyčerpaný. Ke starším odpovědím se můžeš vrátit tady.';
    }
    if (sendBtn) sendBtn.disabled = true;
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializuj DOM elementy — musí být uvnitř DOMContentLoaded
    chatInput = document.getElementById('chat-input');
    sendBtn = document.getElementById('send-btn');
    messagesContainer = document.getElementById('chat-messages');
    typingIndicator = document.getElementById('typing-indicator');
    mentorHistoryStatus = document.createElement('p');
    mentorHistoryStatus.id = 'mentor-history-status';
    mentorHistoryStatus.setAttribute('role', 'status');
    mentorHistoryStatus.hidden = true;
    messagesContainer?.before(mentorHistoryStatus);
    setupMentorPromptStarters();

    // Připoj event listenery až po inicializaci DOM
    if (chatInput) {
        chatInput.addEventListener('input', function () {
            resizeChatInput();

            updateMentorSendButton();
        });

        chatInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    document.addEventListener('auth:changed', syncMentorAccount);
    syncMentorAccount();
    chatInput?.focus();
});

async function loadHistory(owner, revision) {
    mentorHistoryLoading = true;
    mentorHistoryStatus.textContent = 'Načítám předchozí konverzaci…';
    mentorHistoryStatus.hidden = false;
    updateMentorSendButton();
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/mentor/history?expectedUserId=${encodeURIComponent(owner)}`, {
            credentials: 'include'
        });
        if (!isCurrentMentorRequest(owner, revision)) return;
        if (!response.ok) throw new Error('History unavailable');
        const data = await response.json();
        if (!isCurrentMentorRequest(owner, revision)) return;
        if (!data.success || !Array.isArray(data.history)) throw new Error('Invalid history');
        if (data.history.length) {
            messagesContainer?.querySelectorAll('.message').forEach(message => message.remove());
            data.history.forEach(msg => addMessage(msg.content, msg.role, false));
            scrollToBottom();
        }
        mentorHistoryStatus.hidden = true;
    } catch (error) {
        if (!isCurrentMentorRequest(owner, revision)) return;
        mentorHistoryStatus.textContent = 'Předchozí konverzaci se nepodařilo načíst. Novou otázku můžeš poslat i tak.';
        mentorHistoryStatus.hidden = false;
    } finally {
        if (isCurrentMentorRequest(owner, revision)) {
            mentorHistoryLoading = false;
            updateMentorSendButton();
        }
    }
}

async function sendMessage() {
    if (!chatInput || !sendBtn || !messagesContainer || !typingIndicator) return;
    syncMentorAccount();
    const text = chatInput.value.trim();
    if (!text || mentorHistoryLoading || mentorSending) return;

    if (!window.Auth?.isLoggedIn()) {
        window.Auth?.showToast?.('Účet zdarma uloží otázku', 'Vytvořte si účet a Průvodce se vrátí přesně k této otázce.', 'info');
        startMentorSignupFlow(text, 'mentor_entry_auth_gate');
        return;
    }
    const owner = currentMentorOwner();
    if (!owner) return; // Never dispatch private content with an unknown account.
    const revision = mentorRevision;
    mentorSending = true;
    updateMentorSendButton();
    showTyping(true);

    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!isCurrentMentorRequest(owner, revision)) return;
        const response = await fetch(`${API_CONFIG.BASE_URL}/mentor/chat`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({ message: text, expectedUserId: owner })
        });
        if (!isCurrentMentorRequest(owner, revision)) return;
        const data = await response.json();
        if (!isCurrentMentorRequest(owner, revision)) return;
        if (!response.ok) {
            if (response.status === 402) {
                showPaywall();
                return;
            }
            addMessage(data.error || 'Požadavek se nepodařilo dokončit. Zkus to prosím za chvíli.', 'mentor');
            return;
        }
        if (typeof data.reply !== 'string' || !data.reply.trim()) {
            throw new Error('Empty reply');
        }
        addMessage(text, 'user');
        addMessage(data.reply, 'mentor');
        if (chatInput.value.trim() === text) resetChatInput();
        if (data.historySaved === false) {
            mentorHistoryStatus.textContent = 'Odpověď je hotová, ale nepodařilo se ji uložit do historie. Před zavřením stránky si ji zkopíruj.';
            mentorHistoryStatus.hidden = false;
        }
    } catch (error) {
        if (!isCurrentMentorRequest(owner, revision)) return;
        console.error('Chat error:', error);
        addMessage('Omlouvám se, hvězdné spojení bylo přerušeno. Zkus to prosím za chvíli.', 'mentor');
    } finally {
        if (isCurrentMentorRequest(owner, revision)) {
            mentorSending = false;
            showTyping(false);
            updateMentorSendButton();
        }
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
