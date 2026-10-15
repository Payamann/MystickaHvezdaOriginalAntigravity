const prefix = 'mh_profile_journal_draft:';

export function readJournalDraft(userId) {
    if (!userId) return '';
    try { return sessionStorage.getItem(prefix + userId) || ''; }
    catch { return ''; }
}

export function writeJournalDraft(userId, text) {
    if (!userId) return;
    try {
        if (text) sessionStorage.setItem(prefix + userId, String(text).slice(0, 50000));
        else sessionStorage.removeItem(prefix + userId);
    } catch { /* The current form stays usable when browser storage is unavailable. */ }
}
