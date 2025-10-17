// server/plugins/cancel-subscription-offer.test.js
const mockInitCouponCodeService = jest.fn();

jest.mock('../mail-service');
jest.mock('../../coupon-codes', () => ({
    initCouponCodeService: mockInitCouponCodeService,
}));
jest.mock('../SlackMessenger', () => ({
    sendMessage: jest.fn(),
}));

const mailService = require('../mail-service');
const SlackMessenger = require('../SlackMessenger');
const { EventBus, EventTypes } = require('../event-bus');

// Ensure the plugin is loaded
require('./cancel-subscription-offer');

describe('Cancel Subscription Offer Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should send cancellation offer email with coupon', async () => {
        const fakeCoupon = { code: 'SAVE50', amount: 50 };
        mockInitCouponCodeService.mockReturnValue({
            createRandom: jest.fn().mockResolvedValue(fakeCoupon),
        });

        const data = {
            user: {
                id: 'u1',
                display_name: 'Alex',
                email: 'alex@example.com',
            }, 
            plan: {
                id: '1',
                title: 'Basic Plan',
                description: 'Basic plan with limited features',
                price: 10,
            },
        }

        EventBus.emit(EventTypes.ORDER_CANCEL_SUBSCRIPTION, data);

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mailService.maybeSendAutoResponder).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'cancel-subscription',
                user: expect.objectContaining({ email: 'alex@example.com' }),
                data: expect.objectContaining({
                    coupon_code: 'SAVE50',
                    offer: expect.stringContaining('50%'),
                }),
            })
        );
    });

    it('should not run if event type is incorrect', async () => {
        EventBus.emit('not-cancel', { type: 'not-cancel', data: { id: 'u1' } });
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mailService.maybeSendAutoResponder).not.toHaveBeenCalled();
    });

    it('should skip if user is missing', async () => {
        EventBus.emit(EventTypes.ORDER_CANCEL_SUBSCRIPTION, { type: EventTypes.ORDER_CANCEL_SUBSCRIPTION, data: null });
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mailService.maybeSendAutoResponder).not.toHaveBeenCalled();
    });

    it('should skip if user email is missing', async () => {
        EventBus.emit(EventTypes.ORDER_CANCEL_SUBSCRIPTION, { type: EventTypes.ORDER_CANCEL_SUBSCRIPTION, data: { id: '1' } });
        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mailService.maybeSendAutoResponder).not.toHaveBeenCalled();
    });

    it('should send Slack error if coupon creation fails', async () => {
        mockInitCouponCodeService.mockReturnValue({
            createRandom: jest.fn().mockRejectedValue(new Error('Boom')),
        });

        const event = {
            id: 'u1',
            first_name: 'Alex',
            display_name: 'Alex',
            email: 'alex@example.com',
        };

        EventBus.emit(EventTypes.ORDER_CANCEL_SUBSCRIPTION, { type: EventTypes.ORDER_CANCEL_SUBSCRIPTION, data: event });

        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.stringContaining('order.cancel-subscription offer email not sent')
        );
    });
});