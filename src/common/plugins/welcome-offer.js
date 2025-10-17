const { EventBus, EventTypes } = require('../event-bus');
const CouponCodeService = require('../../coupon-codes/CouponCodeService');
const mailService = require('../mail-service');
const { CouponCodeTypes, CouponCodeScopes } = require('../../utils/enums');
const { initCouponCodeService } = require('../../coupon-codes');

/**
 * Handler for sending a welcome offer email to new users.
 * This function is triggered when a user signs up.
 * It creates a coupon code and sends an email with the coupon code details.
 * @param {Object} user - The user object containing user details.
 * @return {Promise<void>} - A promise that resolves when the email is sent.
 * @throws {Error} - Throws an error if the email sending fails.
 */
const handler = async (event) => {
    // ===========================================================================
    // Create Coupon Code & Send welcome offer email
    // ===========================================================================
    const { data: user } = event;

    console.log('Welcome offer event triggered:', user);

    if (!user || !user?.email) {
        console.log('Welcome offer not sent. User not found.');
        throw new Error('Welcome offer not sent. User not found.');
    }

    console.log('Sending welcome offer email...');

    // const couponService = await CouponCodeService.getInstance();

    const couponService = initCouponCodeService();

    const couponCode = await couponService.createRandom({
        type: CouponCodeTypes.Fixed,
        scope: CouponCodeScopes.Subscription,
        amount: 10,
        max_uses: 1,
        min_purchase_amount: 5,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        entity_type: CouponCodeScopes.Subscription,
    }, 8);

    console.log('Coupon code created:', couponCode);

    // EventBus.emit(EventTypes.NOTIFY_EMAIL, {
    //     type: 'welcome-offer',
    //     user: user,
    //     data: {
    //         name: user?.display_name,
    //         coupon_code: couponCode?.code,
    //         amount: couponCode?.amount,
    //     },
    // });

    // EventBus.emit(EventTypes.NOTIFY_SLACK, {
    //     channel: '#transactions',
    //     message: `👋 Welcome offer sent to ${user.username}`,
    // });

    await mailService.maybeSendAutoResponder({
        type: 'welcome-offer',
        user: user,
        data: {
            name: user?.display_name,
            coupon_code: couponCode?.code,
            amount: couponCode?.amount,
        },
    });

    // console.log('Welcome offer email sent successfully.');
};

// Register the plugin with the event bus
EventBus.on(EventTypes.USER_VERIFY_EMAIL, handler, {
    onError: {
        notify: ['slack', 'email']
    }
});

module.exports = {
    handler,
    meta: {
        onError: {
            notify: ['slack', 'email']
        }
    }
};
