// server/plugins/signup-subscribe-newsletter.test.js
// jest.mock('../services/mailchimp');
// jest.mock('../services/mail-service');
// jest.mock('@vectopus.com/core', () => ({
//     SlackMessenger: {
//         sendMessage: jest.fn(),
//     },
// }));

// const mailchimp = require('../services/mailchimp');
// const mailService = require('../mail-service');
// const { SlackMessenger } = require('@vectopus.com/core');
const { EventBus, EventTypes } = require('../event-bus');

// Load plugin after mocks
require('./signup-subscribe-to-newsletter');


describe('Signup Subscribe to Newsletter Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // mailService.sendEmail = jest.fn();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should log "Not implemented" error when triggered', async () => {
        EventBus.emit(EventTypes.USER_SIGNUP, {});
    
        await new Promise((resolve) => setTimeout(resolve, 10));
    
        const errorArg = console.error.mock.calls[0][1];
        expect(errorArg.message).toBe('Not implemented');
    });

    // it('should subscribe user to Mailchimp newsletter when opted in', async () => {
    //     mailchimp.subscribeToNewsletter.mockResolvedValue({ status: 'subscribed' });

    //     const user = {
    //         id: 'u1',
    //         email: 'test@example.com',
    //         isSubscribed: true,
    //         is_deleted: false
    //     };

    //     EventBus.emit(EventTypes.USER_SIGNUP, user);

    //     await new Promise(resolve => setTimeout(resolve, 10));

    //     expect(mailchimp.subscribeToNewsletter).toHaveBeenCalledWith('test@example.com');
    // });

    // it('should do nothing if user did not opt-in', async () => {
    //     const user = {
    //         id: 'u2',
    //         email: 'nope@example.com',
    //         isSubscribed: false,
    //     };

    //     EventBus.emit(EventTypes.USER_SIGNUP, user);

    //     await new Promise(resolve => setTimeout(resolve, 10));

    //     expect(mailchimp.subscribeToNewsletter).not.toHaveBeenCalled();
    // });

    // it('should send Slack and email error if user is missing', async () => {
    //     EventBus.emit(EventTypes.USER_SIGNUP, {});

    //     await new Promise(resolve => setTimeout(resolve, 10));

    //     expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
    //         '#site-errors',
    //         expect.any(String)
    //     );

    //     expect(mailService.sendEmail).toHaveBeenCalledWith(
    //         process.env.ADMIN_EMAIL,
    //         'error-email',
    //         expect.any(Object)
    //     );
    // });

    // it('should not subscribe if user is marked as deleted', async () => {
    //     const user = {
    //         email: 'test@example.com',
    //         isSubscribed: true,
    //         is_deleted: true
    //     };

    //     EventBus.emit(EventTypes.USER_SIGNUP, user);

    //     await new Promise(resolve => setTimeout(resolve, 10));

    //     expect(mailchimp.subscribeToNewsletter).not.toHaveBeenCalled();
    //     expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
    //         '#site-errors',
    //         expect.any(String)
    //     );
    // });

    // it('should send error notifications if Mailchimp returns failure status', async () => {
    //     mailchimp.subscribeToNewsletter.mockResolvedValue({ status: 'error' });

    //     const user = {
    //         email: 'fail@example.com',
    //         isSubscribed: true
    //     };

    //     EventBus.emit(EventTypes.USER_SIGNUP, user);

    //     await new Promise(resolve => setTimeout(resolve, 10));

    //     expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
    //         '#site-errors',
    //         expect.any(String)
    //     );
    //     expect(mailService.sendEmail).toHaveBeenCalledWith(
    //         process.env.ADMIN_EMAIL,
    //         'error-email',
    //         expect.any(Object)
    //     );
    // });

    // it('should send error notifications if Mailchimp throws', async () => {
    //     mailchimp.subscribeToNewsletter.mockRejectedValue(new Error('Mailchimp failed'));

    //     const user = {
    //         email: 'throw@example.com',
    //         isSubscribed: true
    //     };

    //     EventBus.emit(EventTypes.USER_SIGNUP, user);

    //     await new Promise(resolve => setTimeout(resolve, 10));

    //     expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
    //         '#site-errors',
    //         expect.any(String)
    //     );
    //     expect(mailService.sendEmail).toHaveBeenCalledWith(
    //         process.env.ADMIN_EMAIL,
    //         'error-email',
    //         expect.any(Object)
    //     );
    // });
});