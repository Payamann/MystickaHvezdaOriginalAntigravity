import { jest } from '@jest/globals';

const verifyMock = jest.fn();
const forwardMock = jest.fn();

process.env.RESEND_API_KEY = 'test-resend-key';
process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
process.env.FROM_EMAIL = 'Mysticka Hvezda <noreply@mystickahvezda.cz>';
process.env.SUPPORT_FORWARD_EMAIL = 'owner@example.com';
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_EMAILS;
delete process.env.ALLOW_SAME_DOMAIN_SUPPORT_FORWARD;

jest.unstable_mockModule('resend', () => ({
    Resend: jest.fn(() => ({
        webhooks: {
            verify: verifyMock
        },
        emails: {
            receiving: {
                forward: forwardMock
            }
        }
    }))
}));

const { handleResendWebhook, getInboundForwardRecipients } = await import('../resend-webhook.js');

describe('Resend inbound email webhook', () => {
    beforeEach(() => {
        verifyMock.mockReset();
        forwardMock.mockReset();
        process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
        process.env.SUPPORT_FORWARD_EMAIL = 'owner@example.com';
        forwardMock.mockResolvedValue({ data: { id: 'email_forward_123' }, error: null });
    });

    test('verifies and forwards inbound support email to configured inbox', async () => {
        verifyMock.mockReturnValue({
            type: 'email.received',
            data: {
                email_id: 'received_email_123',
                to: ['support@mystickahvezda.cz'],
                from: 'customer@example.com',
                subject: 'Pomoc s uctem'
            }
        });

        const result = await handleResendWebhook(Buffer.from('{"type":"email.received"}'), {
            'svix-id': 'msg_123',
            'svix-timestamp': '1781720000',
            'svix-signature': 'v1,test'
        });

        expect(verifyMock).toHaveBeenCalledWith(expect.objectContaining({
            payload: '{"type":"email.received"}',
            webhookSecret: 'whsec_test'
        }));
        expect(forwardMock).toHaveBeenCalledWith({
            emailId: 'received_email_123',
            to: ['owner@example.com'],
            from: 'Mysticka Hvezda <noreply@mystickahvezda.cz>',
            passthrough: true
        });
        expect(result).toEqual({
            forwarded: true,
            emailId: 'received_email_123',
            forwardId: 'email_forward_123',
            to: ['owner@example.com']
        });
    });

    test('does not forward inbound mail back to the same root domain by default', () => {
        process.env.SUPPORT_FORWARD_EMAIL = 'support@mystickahvezda.cz,owner@example.com';

        expect(getInboundForwardRecipients(['support@mystickahvezda.cz'])).toEqual(['owner@example.com']);
    });

    test('fails closed when webhook signing secret is missing', async () => {
        delete process.env.RESEND_WEBHOOK_SECRET;

        await expect(handleResendWebhook(Buffer.from('{}'), {}))
            .rejects
            .toThrow('RESEND_WEBHOOK_SECRET is required');
        expect(forwardMock).not.toHaveBeenCalled();
    });

    test('routes verified delivery events using the signed event ID without forwarding', async () => {
        const event = { type: 'email.delivered', created_at: '2026-10-11T09:00:00Z', data: { email_id: 'email-1' } };
        verifyMock.mockReturnValue(event);
        const delivery = { recordEvent: jest.fn(async () => ({ recorded: true })) };
        await expect(handleResendWebhook(Buffer.from('{}'), { 'svix-id': 'msg-1' }, { delivery })).resolves.toEqual({ recorded: true });
        expect(delivery.recordEvent).toHaveBeenCalledWith(event, 'msg-1');
        expect(forwardMock).not.toHaveBeenCalled();
    });

    test('a rejected webhook signature cannot mutate delivery status', async () => {
        verifyMock.mockImplementation(() => { throw new Error('Invalid signature'); });
        const delivery = { recordEvent: jest.fn() };
        await expect(handleResendWebhook(Buffer.from('{}'), {}, { delivery })).rejects.toThrow('Invalid signature');
        expect(delivery.recordEvent).not.toHaveBeenCalled();
        expect(forwardMock).not.toHaveBeenCalled();
    });
});
