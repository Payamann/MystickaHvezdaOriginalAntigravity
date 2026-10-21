import practices from '../../data/generated/tarot-daily-practice.js';
import descriptions from '../../data/generated/tarot-card-hub.js';
import { getPragueDateKey } from './prague-date.js';

export { getPragueDateKey };

export function getDailyCardIndex(cardCount, date = new Date()) {
    const key = getPragueDateKey(date);
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    return Math.abs(hash) % cardCount;
}

export function getDailyCardPractice(name) {
    const practice = practices[name];
    if (!practice || !descriptions[name]) throw new Error('Daily card practice unavailable');
    return { question: practice[0], action: practice[1], observation: descriptions[name].interpretation, meaning: descriptions[name].meaning };
}
