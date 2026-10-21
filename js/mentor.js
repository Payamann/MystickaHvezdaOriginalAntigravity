/**
 * Hvězdný Průvodce - Frontend Logic
 */

// DOM elementy — inicializujeme v DOMContentLoaded (bezpečná inicializace)
let chatInput, sendBtn, messagesContainer, typingIndicator, readingConsentOption, readingConsentInput;
let messagePending = false;
let historyLoading = false;
let mentorSessionId = null;
let mentorSessionInitialized = false;
let mentorSessionGeneration = 0;
let mentorHistoryController = null;
let mentorChatController = null;
let mentorWelcomeTemplate = null;
const MENTOR_PENDING_PROMPT_KEY = 'mentor_pending_prompt_v1';
const MENTOR_PENDING_PROMPT_MAX_AGE_MS = 30 * 60 * 1000;
const MENTOR_PAYMENT_REASSURANCE = 'Cena se zobraz\u00ed ve Stripe p\u0159ed potvrzen\u00edm. Zru\u0161en\u00ed najdete v profilu.';

function getMentorSessionId() {
    if (!window.Auth?.isLoggedIn?.()) return null;
    const id = window.Auth?.user?.id;
    return typeof id === 'string' && id ? id : null;
}

function isMentorSessionCurrent(sessionId, generation) {
    return generation === mentorSessionGeneration
        && sessionId === mentorSessionId
        && sessionId === getMentorSessionId();
}

function clearMentorConversation() {
    messagesContainer?.querySelectorAll('.message').forEach(message => message.remove());
    if (mentorWelcomeTemplate && messagesContainer) {
        messagesContainer.insertBefore(mentorWelcomeTemplate.cloneNode(true), typingIndicator);
    }
    document.querySelector('.limit-reached-overlay')?.classList.remove('limit-reached-overlay--visible');
    messagesContainer?.classList.remove('chat-messages--blurred');
    showTyping(false);
}

function clearPendingMentorPrompt() {
    try { sessionStorage.removeItem(MENTOR_PENDING_PROMPT_KEY); } catch {}
}

function syncMentorSession() {
    const nextSessionId = getMentorSessionId();
    if (readingConsentOption) readingConsentOption.hidden = !nextSessionId;
    if (!nextSessionId && readingConsentInput) readingConsentInput.checked = false;
    if (!mentorSessionInitialized) {
        mentorSessionInitialized = true;
        mentorSessionId = nextSessionId;
        if (nextSessionId) void loadMentorSession(nextSessionId, { restorePendingPrompt: true });
        return;
    }
    if (nextSessionId === mentorSessionId) return;

    const previousSessionId = mentorSessionId;
    mentorSessionId = nextSessionId;
    if (readingConsentInput) readingConsentInput.checked = false;
    mentorSessionGeneration += 1;
    mentorHistoryController?.abort();
    mentorChatController?.abort();
    mentorHistoryController = null;
    mentorChatController = null;
    messagePending = false;
    historyLoading = false;
    window.isPremium = false;
    clearMentorConversation();
    messagesContainer?.removeAttribute('aria-busy');
    sendBtn?.removeAttribute('aria-busy');

    if (previousSessionId) {
        clearPendingMentorPrompt();
        resetChatInput();
    }

    if (nextSessionId) {
        void loadMentorSession(nextSessionId, { restorePendingPrompt: !previousSessionId });
    } else if (sendBtn) {
        sendBtn.disabled = !chatInput?.value.trim() || Boolean(chatInput?.disabled);
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
    chatInput.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
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
    chatInput.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });

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
    mentorWelcomeTemplate = messagesContainer?.querySelector('.message--mentor')?.cloneNode(true) || null;
    readingConsentOption = document.getElementById('mentor-reading-consent-option');
    readingConsentInput = document.getElementById('mentor-reading-consent');
    setupMentorPromptStarters();

    // Připoj event listenery až po inicializaci DOM
    if (chatInput) {
        chatInput.addEventListener('input', function () {
            resizeChatInput();
            if (messagePending || historyLoading) return;

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
    document.addEventListener('auth:changed', syncMentorSession);
    window.addEventListener('storage', event => {
        if (event.key === 'auth_user') syncMentorSession();
    });

    mentorSessionId = getMentorSessionId();
    mentorSessionInitialized = true;
    if (readingConsentOption) readingConsentOption.hidden = !mentorSessionId;
    if (!mentorSessionId) {
        if (readingConsentInput) readingConsentInput.checked = false;
        window.isPremium = false;
        return;
    }

    await loadMentorSession(mentorSessionId, { restorePendingPrompt: true });
});

async function loadMentorSession(sessionId, { restorePendingPrompt = false } = {}) {
    const generation = mentorSessionGeneration;
    mentorHistoryController?.abort();
    const controller = new AbortController();
    mentorHistoryController = controller;
    historyLoading = true;
    sendBtn?.setAttribute('disabled', 'true');
    sendBtn?.setAttribute('aria-busy', 'true');
    messagesContainer?.setAttribute('aria-busy', 'true');
    const historyStatus = document.createElement('div');
    historyStatus.id = 'mentor-history-status';
    historyStatus.className = 'message message--mentor';
    historyStatus.setAttribute('role', 'status');
    historyStatus.setAttribute('aria-live', 'polite');
    historyStatus.textContent = 'Načítám předchozí konverzaci…';
    messagesContainer?.insertBefore(historyStatus, typingIndicator);

    try {
        const userProfile = await window.Auth.getProfile();
        if (!isMentorSessionCurrent(sessionId, generation)) return;
        window.isPremium = Boolean(userProfile && window.Auth?.isPremium?.());
    } catch (error) {
        if (!isMentorSessionCurrent(sessionId, generation)) return;
        console.error('Failed to verify subscription:', error);
    }

    // Load the signed-in user's history before allowing a new message.
    const historyLoaded = await loadHistory(sessionId, generation, controller.signal);
    if (!isMentorSessionCurrent(sessionId, generation)) return;
    if (!historyLoaded && historyStatus.isConnected) {
        historyStatus.textContent = 'Předchozí konverzaci se nepodařilo načíst. Novou otázku můžeš poslat i tak.';
    } else {
        historyStatus.remove();
    }
    historyLoading = false;
    messagesContainer?.removeAttribute('aria-busy');
    sendBtn?.removeAttribute('aria-busy');
    if (sendBtn) sendBtn.disabled = !chatInput?.value.trim() || Boolean(chatInput?.disabled);
    if (restorePendingPrompt) restorePendingMentorPrompt();
    chatInput?.focus();
}

async function loadHistory(sessionId, generation, signal) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/mentor/history`, {
            credentials: 'include',
            signal
        });
        if (!isMentorSessionCurrent(sessionId, generation)) return false;
        if (!response.ok) throw new Error(`History request failed (${response.status})`);

        const data = await response.json();
        if (!isMentorSessionCurrent(sessionId, generation)) return false;
        if (data.success && Array.isArray(data.history)) {
            // Remove the default welcome message if we have history?
            // Or keep it as a header? Let's keep it for now or maybe clear container.
            // Actually, if we have history, it might feel weird to have the default greeting at top.
            // Let's remove default greeting if we have history.
            if (data.history.length > 0) {
                messagesContainer.querySelector('[data-mentor-welcome]')?.remove();

                data.history.forEach(msg => {
                    addMessage(msg.content, msg.role, false); // false = do not scroll yet
                });
                scrollToBottom();
            }
            return true;
        }
        throw new Error('Invalid mentor history response');
    } catch (e) {
        if (e.name !== 'AbortError' && isMentorSessionCurrent(sessionId, generation)) {
            console.warn('Failed to load history', e);
        }
        return false;
    }
}

async function sendMessage() {
    if (messagePending || historyLoading || !chatInput || !sendBtn || !messagesContainer || !typingIndicator) return;
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
    const generation = mentorSessionGeneration;
    const currentUser = () => isMentorSessionCurrent(ownerId, generation);
    const controller = new AbortController();
    mentorChatController = controller;
    messagePending = true;
    sendBtn.disabled = true;
    sendBtn.setAttribute('aria-busy', 'true');
    showTyping(true);
    let failureMessage = 'Odpověď se nepodařilo načíst. Otázka zůstává v poli; můžeš ji poslat znovu.';
    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!currentUser()) return;
        const response = await fetch(`${API_CONFIG.BASE_URL}/mentor/chat`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json', ...(csrfToken && { 'X-CSRF-Token': csrfToken }) },
            body: JSON.stringify({
                message: text,
                lang: document.documentElement.lang || 'cs',
                includeReadingContext: readingConsentInput?.checked === true
            }),
            signal: controller.signal
        });
        if (!currentUser()) return;
        const data = await response.json().catch(() => ({}));
        if (!currentUser()) return;
        if (response.status === 402) {
            showPaywall();
            return;
        }
        if (!response.ok) {
            if (typeof data.error === 'string' && data.error.trim()) failureMessage = data.error.trim().slice(0, 300);
            throw new Error('Mentor response unavailable');
        }
        if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Mentor response unavailable');
        addMessage(text, 'user');
        addMessage(data.reply, 'mentor');
        if (chatInput.value.trim() === text) resetChatInput();
        if (data.historySaved === false) {
            const notice = addMessage('Odpověď je hotová, ale konverzaci se nepodařilo uložit. Před zavřením stránky si ji prosím zkopíruj.', 'mentor');
            notice?.setAttribute('role', 'status');
        }
    } catch (error) {
        if (error.name !== 'AbortError' && currentUser()) console.warn('Chat request failed:', error.message);
        if (currentUser()) {
            const notice = addMessage(failureMessage, 'mentor');
            notice?.setAttribute('role', 'status');
        }
    } finally {
        if (currentUser()) {
            messagePending = false;
            mentorChatController = null;
            showTyping(false);
            sendBtn.removeAttribute('aria-busy');
            sendBtn.disabled = !chatInput.value.trim() || chatInput.disabled;
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
