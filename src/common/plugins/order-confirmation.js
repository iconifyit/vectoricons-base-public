const { EventBus, EventTypes } = require('../event-bus');
const MailService = require('../mail-service');

/**
 * Plugin to send a cancellation offer email to the user.
 * This plugin listens for the 'cancel-subscription' event and sends an email with a discount offer.
 * @param {Object} user - The user object containing user details.
 * @return {Promise<void>} - A promise that resolves when the email is sent.
 * @throws {Error} - Throws an error if the email sending fails.
 */
const handler = async (event) => {
    // User and order are required.
    const user        = event?.data?.user;
    const order       = event?.data?.order;

    console.log('Order confirmation event triggered:', user, order);

    if (! user?.email) {
        throw new Error('Order confirmation not sent. User email not found.');
    }

    if (! order?.amount) {
        throw new Error('Order confirmation not sent. Order amount not found.');
    }

    // TODO: Add enhancment to add a more robust description to the email.

    console.log('Order confirmation email...');

    await MailService.sendEmail(
        user.email,
        'order-confirmation', 
        {
            name          : user?.display_name || 'User',
            amount        : order?.amount,
            SUBJECT       : 'Order Confirmation',
        }
    );
}

// Register the event handler
EventBus.on(EventTypes.ORDER_CONFIRMATION, handler, {
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