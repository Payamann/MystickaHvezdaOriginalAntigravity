import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

const sendEmail = jest.fn();
jest.unstable_mockModule('../email-service.js', () => ({ sendEmail }));

const { default: contactRouter } = await import('../contact.js');
const app = express();
app.use(express.json());
app.use('/', contactRouter);

describe('Contact form delivery confirmation', () => {
    beforeEach(() => {
        sendEmail.mockReset();
    });

    test('returns success only after the notification provider accepts the message', async () => {
        sendEmail.mockResolvedValue({ success: true, emailId: 'contact-test-id' });

        const response = await request(app).post('/').send({
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test subject',
            message: 'A test message for delivery confirmation.'
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    test('returns a retryable error when notification delivery fails', async () => {
        sendEmail.mockRejectedValue(new Error('provider unavailable'));

        const response = await request(app).post('/').send({
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test subject',
            message: 'A test message for delivery confirmation.'
        });

        expect(response.status).toBe(503);
        expect(response.body.success).toBe(false);
        expect(response.body.error).not.toContain('provider unavailable');
    });

    test('does not call the email provider for invalid submissions', async () => {
        const response = await request(app).post('/').send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(sendEmail).not.toHaveBeenCalled();
    });
});
