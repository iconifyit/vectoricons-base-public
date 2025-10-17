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
    const { data : user } = event;

    console.log(`User reset password event triggered:`, user);

    if (! user?.email) {
        console.log(`Data for ${EventTypes.USER_RESET_PASSWORD} plugin not found`);
        return;
    }

    console.log(`Executing ${EventTypes.USER_RESET_PASSWORD} plugin ...`);

    await MailService.sendEmail(
        user.email, 
        'reset-password', 
        { 
            name          : user.name,
            resetToken    : user.resetToken,
            SUBJECT       : 'Your Password Reset Request'
        }
    );
}

// Register the event handler
// The third argument is a config object for how EventBus handles errors.
// The options currently are 'slack' and 'email', which means if an error  
// occurs during the execution of the plugin, the error is non-blocking but
// the error will be logged and optionally notifications sent to Slack and/or
// admin email.
EventBus.on(EventTypes.USER_RESET_PASSWORD, handler, {
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