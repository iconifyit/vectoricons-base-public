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

    console.log(`${EventTypes.USER_PASSWORD_CHANGED} event triggered:`, user);

    if (! user?.email) {
        console.log(`Data for ${EventTypes.USER_PASSWORD_CHANGED} plugin not found`);
        return;
    }

    console.log(`Executing ${EventTypes.USER_PASSWORD_CHANGED} plugin ...`);

    await MailService.sendEmail(
        user.email, 
        'reset-confirmation', 
        { name: user.first_name, SUBJECT : 'Your Password Has Been Changed' }
    );
}

// Register the event handler
// The third argument is a config object for how EventBus handles errors.
// The options currently are 'slack' and 'email', which means if an error  
// occurs during the execution of the plugin, the error is non-blocking but
// the error will be logged and optionally notifications sent to Slack and/or
// admin email.
EventBus.on(EventTypes.USER_PASSWORD_CHANGED, handler, {
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