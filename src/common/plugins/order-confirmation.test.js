// server/plugins/order-confirmation.test.js
jest.mock('../mail-service');
jest.mock('../SlackMessenger', () => ({
    sendMessage: jest.fn(),
}));

const mailService = require('../mail-service');
const { EventBus, EventTypes } = require('../event-bus');
const SlackMessenger = require('../SlackMessenger');

// Make sure plugin is registered
require('./order-confirmation');

describe('Order Confirmation Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should send order confirmation email', async () => {
        const data = {
            user: {
                id: 'u1',
                display_name: 'Buyer',
                email: 'buyer@example.com',
            },
            order: { amount: 25 },
        };

        EventBus.emit(EventTypes.ORDER_CONFIRMATION, data);

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mailService.sendEmail).toHaveBeenCalledWith(
            data.user.email,
            'order-confirmation',
            expect.objectContaining({
                name    : data.user.display_name,
                amount  : data.order.amount,
                SUBJECT : 'Order Confirmation',
            })
        );
    });

    it('should send Slack error if user is missing', async () => {
        EventBus.emit(EventTypes.ORDER_CONFIRMATION, { order: { amount: 10 } });

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should send Slack error if user email is missing', async () => {
        EventBus.emit(EventTypes.ORDER_CONFIRMATION, {
            user: {},
            order: { amount: 10 },
        });

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should send Slack error if email sending fails', async () => {
        mailService.sendEmail.mockImplementation(() => {
            throw new Error('SMTP is down');
        });

        const data = {
            user: { display_name: 'Faily', email: 'faily@example.com' },
            order: { amount: 50 },
        };

        EventBus.emit(EventTypes.ORDER_CONFIRMATION, data);

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });
});