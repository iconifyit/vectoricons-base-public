// server/plugins/reset-password.test.js
jest.mock('../mail-service');
jest.mock('../SlackMessenger', () => ({
    sendMessage: jest.fn(),
}));

const MailService = require('../mail-service');
const SlackMessenger = require('../SlackMessenger');
const { EventBus, EventTypes } = require('../event-bus');

MailService.sendEmail = jest.fn();
SlackMessenger.sendMessage = jest.fn();

// Register the plugin after mocks
require('./password-changed');

describe('Password Changed Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should send a password changed email to the user', async () => {
        const user = {
            first_name: 'User',
            email: 'test@example.com',
        };

        EventBus.emit(EventTypes.USER_PASSWORD_CHANGED, user);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(MailService.sendEmail).toHaveBeenCalledWith(
            user.email,
            'reset-confirmation',
            expect.objectContaining({
                name: user.first_name,
                SUBJECT: 'Your Password Has Been Changed',
            })
        );
    });

    it('should not send email if user is missing', async () => {
        EventBus.emit(EventTypes.USER_PASSWORD_CHANGED, null);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(MailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should send Slack error if MailService fails', async () => {
        MailService.sendEmail.mockRejectedValue(new Error('Mail failed'));

        EventBus.emit(EventTypes.USER_PASSWORD_CHANGED, {
            first_name: 'User',
            email: 'test@example.com',
        });

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should ignore unrelated events', async () => {
        EventBus.emit('some.unrelated.event', {
            name: 'Irrelevant User',
            email: 'not@used.com',
        });

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(MailService.sendEmail).not.toHaveBeenCalled();
    });
});