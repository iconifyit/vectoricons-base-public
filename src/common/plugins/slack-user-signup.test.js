// server/plugins/slack-user-signup.test.js
jest.mock('../mail-service');
jest.mock('../SlackMessenger', () => ({
    sendMessage: jest.fn(),
}));

const mailService = require('../mail-service');
const SlackMessenger = require('../SlackMessenger');
const { EventBus, EventTypes } = require('../event-bus');

// Ensure the plugin is loaded
require('./slack-user-signup');

describe('Slack User Signup Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mailService.sendEmail = jest.fn();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should send Slack message for valid user', async () => {
        const data = {
            display_name: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            email: 'me@example.com',
        };

        EventBus.emit(EventTypes.USER_SIGNUP, data);

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#signups',
            expect.any(String)
        );
    });

    it('should send Slack and email error notifications if user is missing', async () => {
        EventBus.emit(EventTypes.USER_SIGNUP, {});

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should send admin email error notifications if user is missing', async () => {
        EventBus.emit(EventTypes.USER_SIGNUP, {});

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mailService.sendEmail).toHaveBeenCalledWith(
            process.env.ADMIN_EMAIL,
            'error-email',
            expect.any(Object)
        );
    });
});