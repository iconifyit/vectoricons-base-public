// server/plugins/welcome-offer.test.js
const mockInitCouponCodeService = jest.fn();

jest.mock('../mail-service');
jest.mock('../../coupon-codes', () => ({
    initCouponCodeService: mockInitCouponCodeService,
}));
jest.mock('../SlackMessenger', () => ({
    sendMessage: jest.fn(),
}));

const mailService = require('../mail-service');
const { EventBus, EventTypes } = require('../event-bus');
const SlackMessenger = require('../SlackMessenger');

// Register the plugin after mocks
require('./welcome-offer');

describe('Welcome Offer Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should send welcome email with coupon', async () => {
        const fakeCoupon = { code: 'ABC123', amount: 10 };
        const user = { id: 'u1', email: 'test@example.com', first_name: 'Test', display_name: 'Tester' };

        mockInitCouponCodeService.mockReturnValue({
            createRandom: jest.fn().mockResolvedValue(fakeCoupon),
        });

        EventBus.emit(EventTypes.USER_VERIFY_EMAIL, user);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mailService.maybeSendAutoResponder).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'welcome-offer',
                user,
                data: expect.objectContaining({
                    coupon_code: fakeCoupon.code,
                    amount: fakeCoupon.amount,
                }),
            })
        );
    });

    it('should not send email if user is missing', async () => {
        EventBus.emit(EventTypes.USER_SIGNUP, {});

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mailService.maybeSendAutoResponder).not.toHaveBeenCalled();
    });

    it('should send Slack error notification if coupon creation fails', async () => {
        const user = { id: 'u1', email: 'test@example.com', display_name: 'Tester' };

        mockInitCouponCodeService.mockReturnValue({
            createRandom: jest.fn().mockRejectedValue(new Error('Boom')),
        });

        EventBus.emit(EventTypes.USER_VERIFY_EMAIL, user);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should send Slack error if mailService fails', async () => {
        const user = { id: 'u1', email: 'test@example.com', display_name: 'Tester' };
        const fakeCoupon = { code: 'XYZ999', amount: 10 };

        mockInitCouponCodeService.mockReturnValue({
            createRandom: jest.fn().mockResolvedValue(fakeCoupon),
        });

        mailService.maybeSendAutoResponder.mockRejectedValue(new Error('Mail fail'));

        EventBus.emit(EventTypes.USER_VERIFY_EMAIL, user);

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(SlackMessenger.sendMessage).toHaveBeenCalledWith(
            '#site-errors',
            expect.any(String)
        );
    });

    it('should not trigger for other events', async () => {
        EventBus.emit('some.other.event', { id: 'u2', email: 'me@examplecom' });

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mailService.maybeSendAutoResponder).not.toHaveBeenCalled();
    });
});