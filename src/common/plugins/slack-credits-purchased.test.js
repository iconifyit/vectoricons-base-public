// server/plugins/cancel-subscription-offer.test.js
jest.mock('../mail-service');
jest.mock('../SlackMessenger', () => ({
    sendMessage: jest.fn(),
}));

const mailService = require('../mail-service');
const SlackMessenger = require('../SlackMessenger');
const { EventBus, EventTypes } = require('../event-bus');

// Ensure the plugin is loaded
require('./slack-credits-purchased');


describe('Slack Credits Purchased Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });


    it('should send Slack message for valid user and order', async () => {
        const data = {
            user: { display_name: 'testuser' },
            order: { total: 100 },
        };

        EventBus.emit(EventTypes.ORDER_PURCHASE_CREDITS, data);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#transactions',
            expect.any(String)
        );
    });

    it('should send Slack error if order is missing', async () => {
        const data = {
            user: { display_name: 'testuser' },
        };

        EventBus.emit(EventTypes.ORDER_PURCHASE_CREDITS, data);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should not send Slack message if user is missing (logs only)', async () => {
        const data = {
            order: { total: 100 },
        };

        EventBus.emit(EventTypes.ORDER_PURCHASE_CREDITS, data);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).not.toHaveBeenCalled();
    });
});