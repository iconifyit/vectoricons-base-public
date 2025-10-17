const DB = require('@vectoricons.net/db');
const { EventBus, EventTypes } = require('../event-bus');
const SlackMessenger = require('../SlackMessenger.js');
const { CouponCodeTypes, CouponCodeScopes } = require('../../utils/enums');
const CouponCodeService = require('../../coupon-codes/CouponCodeService');
const mailService = require('../mail-service');
const { v4: uuid } = require('uuid');
const { initCouponCodeService } = require('../../coupon-codes');

/**
 * Plugin to send a cancellation offer email to the user.
 * This plugin listens for the 'cancel-subscription' event and sends an email with a discount offer.
 * @param {Object} user - The user object containing user details.
 * @return {Promise<void>} - A promise that resolves when the email is sent.
 * @throws {Error} - Throws an error if the email sending fails.
 */
const handler = async (event) => {
    try {
        console.log('Cancel Subscription Offer Plugin', event);
        const { user, plan : subscription } = event?.data;

        if (event?.name !== EventTypes.ORDER_CANCEL_SUBSCRIPTION) {
            console.log(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} : ${event?.name}`);
            console.log(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} plugin not executed. Event type mismatch.`);
            return;
        }

        if (! user) {
            console.log(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} offer email not sent. User not found.`);
            throw new Error(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} offer email not sent. User not found.`)
        }

        if (! user?.email) {
            console.log(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} offer email not sent. User email not found.`);
            throw new Error(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} offer email not sent. User email not found.`)
        }

        console.log(`Sending ${EventTypes.ORDER_CANCEL_SUBSCRIPTION} offer email...`);

        // const couponService = await CouponCodeService.getInstance();
        
        const couponService = initCouponCodeService();

        const couponCode = await couponService.createRandom({
            type: CouponCodeTypes.Percentage,
            scope: CouponCodeScopes.Subscription,
            amount: 50,
            max_uses: 1,
            min_purchase_amount: 72,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            entity_type: CouponCodeScopes.Subscription,
        }, 8);

        const amount = couponCode?.amount;
        const plan = 'Yearly Pro Plan';

        await mailService.maybeSendAutoResponder({
            type: 'cancel-subscription',
            user: user,
            data: {
                name: user?.display_name,
                offer: `
                    Sign up now for a <span style="font-weight: 600">${plan}</span> and get 
                    <span style="font-weight: 600">${amount}%</span> off your first year!
                `,
                coupon_code: couponCode?.code,
            },
        });

        console.log(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} offer email sent successfully.`);

        return couponCode;
    }
    catch(err) {
        console.error(`Rethrow so EventBus can handle it: ${err.message}`);
        throw err;
    }
}

// Register the event handler
EventBus.on(EventTypes.ORDER_CANCEL_SUBSCRIPTION, handler, {
    onError: {
        notify: ['slack', 'email'] 
    }
});

// Export for unit testing.
module.exports = { handler, meta: {
    onError: {
        notify: ['slack', 'email'] 
    }
}};