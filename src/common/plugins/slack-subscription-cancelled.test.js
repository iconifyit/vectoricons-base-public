// server/plugins/cancel-subscription-offer.test.js
jest.mock('../mail-service');
jest.mock('../../coupon-codes/CouponCodeService');
jest.mock('../SlackMessenger', () => ({
    sendMessage: jest.fn(),
}));

const mailService = require('../mail-service');
const CouponCodeService = require('../../coupon-codes/CouponCodeService');
const SlackMessenger = require('../SlackMessenger');
const { EventBus, EventTypes } = require('../event-bus');

// Now require the plugin (after the mocks are in place)
require('./slack-subscription-cancelled');


describe('Slack Subscription Cancelled Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should send a Slack notification when user and subscriptionPlan are present', async () => {
        const data = {
            user: { username: 'scott' },
            subscriptionPlan: { description: 'Pro Plan Annual' },
        };

        EventBus.emit(EventTypes.ORDER_CANCEL_SUBSCRIPTION, data);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#transactions',
            'Subscription Cancelled : scott cancelled Pro Plan Annual.'
        );
    });

    it('should throw if user is missing', async () => {
        const data = {
            subscriptionPlan: { description: 'Pro Plan Annual' },
        };

        EventBus.emit(EventTypes.ORDER_CANCEL_SUBSCRIPTION, data);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should throw if subscriptionPlan is missing', async () => {
        const data = {
            user: { username: 'scott' },
        };

        EventBus.emit(EventTypes.ORDER_CANCEL_SUBSCRIPTION, data);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should send Slack error notification if event type is incorrect', async () => {
        const data = {
            user: { username: 'scott' },
            subscriptionPlan: { description: 'Pro Plan Annual' },
        };

        EventBus.emit('wrong.event', data);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).not.toHaveBeenCalled();
    });
});