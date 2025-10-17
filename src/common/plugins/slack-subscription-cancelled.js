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
    const { user, subscriptionPlan } = event?.data;
    if (! user) {
        console.log(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} Slack notification not sent. User not found.`);
        throw new Error(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} Slack notification not sent. User not found.`);
    }
    
    if (! subscriptionPlan) {
        console.log(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} Slack notification not sent. Subscription plan not found.`);
        throw new Error(`${EventTypes.ORDER_CANCEL_SUBSCRIPTION} Slack notification not sent. Subscription plan not found.`);
    }

    console.log(`Sending ${EventTypes.ORDER_CANCEL_SUBSCRIPTION} Slack notification`);

    await SlackMessenger.sendMessage(
        '#transactions',
        `Subscription Cancelled : ${user.username} cancelled ${subscriptionPlan?.description}.`
    )
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