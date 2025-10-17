jest.mock('../mail-service');
jest.mock('jsonwebtoken');
jest.mock('../SlackMessenger', () => ({
    sendMessage: jest.fn(),
}));

// Load plugin AFTER mocks
require('./signup-verification-email');

const mailService = require('../mail-service');
const jwt = require('jsonwebtoken');
const SlackMessenger = require('../SlackMessenger');
const { EventBus, EventTypes } = require('../event-bus');

const getEmailCallByType = (type) =>
    mailService.sendEmail.mock.calls.find(call => call[1] === type);

describe('Signup Verification Email Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mailService.sendEmail = jest.fn();
        jwt.sign.mockReturnValue('mocked.jwt.token');
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should send verification email for valid user', async () => {
        const user = {
            id: 'u1',
            email: 'test@example.com',
            first_name: 'Test',
            is_verified: false,
            is_deleted: false,
        };

        EventBus.emit(EventTypes.USER_SIGNUP, user);
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(jwt.sign).toHaveBeenCalledWith(
            expect.objectContaining({ userId: user.id, email: user.email }),
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        expect(mailService.sendEmail).toHaveBeenCalledWith(
            user.email,
            'verify-email',
            expect.objectContaining({
                VERIFY_EMAIL_URL: expect.stringContaining('mocked.jwt.token')
            })
        );
    });

    it('should not run for non-signup events', async () => {
        EventBus.emit('some.other.event', {
            id: 'u1',
            email: 'test@example.com',
            first_name: 'Test',
        });

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should send Slack and email error notifications if user is missing', async () => {
        EventBus.emit(EventTypes.USER_SIGNUP, {});
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );

        expect(mailService.sendEmail).toHaveBeenCalledWith(
            process.env.ADMIN_EMAIL,
            'error-email',
            expect.objectContaining({
                message: expect.stringContaining('Error in plugin handler'),
            })
        );
    });

    it('should send Slack and email error notifications if email is missing', async () => {
        const user = { id: 'u1', first_name: 'Test', is_verified: false };
        EventBus.emit(EventTypes.USER_SIGNUP, user);
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );

        expect(mailService.sendEmail).toHaveBeenCalledWith(
            process.env.ADMIN_EMAIL,
            'error-email',
            expect.objectContaining({
                message: expect.stringContaining('Error in plugin handler'),
            })
        );
    });

    it('should send Slack error if sendEmail throws', async () => {
        const user = {
            id: 'u1',
            email: 'test@example.com',
            first_name: 'Test',
            is_verified: false,
            is_deleted: false,
        };

        mailService.sendEmail.mockRejectedValue(new Error('Mail fail'));

        EventBus.emit(EventTypes.USER_SIGNUP, user);
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should not send verification email if user is already verified', async () => {
        const user = {
            id: 'u1',
            email: 'test@example.com',
            first_name: 'Test',
            is_verified: true
        };

        EventBus.emit(EventTypes.USER_SIGNUP, user);
        await new Promise(resolve => setTimeout(resolve, 10));

        const userEmail = getEmailCallByType('verify-email');
        expect(userEmail).toBeUndefined();
    });

    it('should not send verification email if user is deleted', async () => {
        const user = {
            id: 'u1',
            email: 'test@example.com',
            first_name: 'Test',
            is_deleted: true
        };

        EventBus.emit(EventTypes.USER_SIGNUP, user);
        await new Promise(resolve => setTimeout(resolve, 10));

        const userEmail = getEmailCallByType('verify-email');
        expect(userEmail).toBeUndefined();
    });
});