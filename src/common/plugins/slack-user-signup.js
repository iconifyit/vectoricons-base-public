const { EventBus, EventTypes } = require('../event-bus');
const SlackMessenger = require('../SlackMessenger.js');

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

    console.log(`${event.name} event triggered:`, event);

    if (! user?.email) {
        console.log(`${event.name} Slack notice not sent. User not found.`);
        throw new Error(`${event.name} Slack notice not sent. User not found.`);
    }

    console.log('Sending Slack notification for new user signup ...');

    // ============================================================================
    // Send Slack Message
    // ============================================================================
    await SlackMessenger.sendMessage(
        '#signups',
        JSON.stringify({
            name            : `${user.first_name} ${user.last_name}`,
            email           : user.email,
            username        : user.username,
            display_name    : user.display_name,
        }, null, 4)
    );

    console.log(`${event.name} Slack notice sent successfully.`);
};

// Register the plugin with the event bus
EventBus.on(EventTypes.USER_SIGNUP, handler, {
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
