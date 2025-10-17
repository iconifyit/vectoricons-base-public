const { EventBus, EventTypes } = require('../event-bus');
const SlackMessenger = require('../SlackMessenger.js');

/**
 * Plugin to send a cancellation notification to Slack.
 * This plugin listens for the 'cancel-subscription' event and sends a notification to a Slack channel.
 * @param {Object} user - The user object containing user details.
 * @return {Promise<void>} - A promise that resolves when the email is sent.
 * @throws {Error} - Throws an error if the email sending fails.
 */
const handler = async (event) => {
    const { user, order } = event?.data;
    if (! user?.display_name) {
        console.log(`${EventTypes.ORDER_PURCHASE_CREDITS} Slack notification not sent. User not found.`);
        return;
    }

    if (! order?.total) {
        console.log(`${EventTypes.ORDER_PURCHASE_CREDITS} Slack notification not sent. Order not found.`);
        throw new Error(`${EventTypes.ORDER_PURCHASE_CREDITS} Slack notification not sent. Order not found.`);
    }

    console.log(`Sending ${EventTypes.ORDER_PURCHASE_CREDITS} Slack notification`);

    await SlackMessenger.sendMessage(
        '#transactions',
        `Credits Purchase : ${user.display_name} purchased ${order.total} credits.`
    )
}

// Register the event handler
EventBus.on('order.credits.purchase', handler, {
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