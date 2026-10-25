import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(process.cwd());

describe('Mentor paywall copy contract', () => {
    const source = fs.readFileSync(path.join(ROOT_DIR, 'js', 'mentor.js'), 'utf8');

    test('quota notice explains the unavailable answer without an invented personal teaser', () => {
        expect(source).toContain('K této otázce zatím nevznikla odpověď.');
        expect(source).not.toContain('Průvodce zachytil vzorec');
        expect(source).not.toContain('showTeaserResponse');
        expect(source).toContain('Podívat se na členství');
        expect(source).toContain('feature: \'mentor\'');
        expect(source).toContain('MENTOR_PAYMENT_REASSURANCE');
        expect(source).toContain('199 Kč/měsíc');
        expect(source).toContain('K aktivaci je potřeba karta.');
        expect(source).toContain('mentor-paywall__reassurance');
    });

    test('membership remains optional and prior chat answers stay readable', () => {
        expect(source).toContain("buildMentorUpgradeUrl('mentor_paywall_overlay')");
        expect(source).toContain('Tvoje dosavadní zprávy zůstávají přístupné.');
        expect(source).not.toContain("classList.add('chat-messages--blurred')");
        expect(source).not.toContain('checkUsageLimit()');
        expect(source).toContain('response.status === 402');
    });
});
