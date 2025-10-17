  const { EventBus } = require('../event-bus');
const SlackMessenger = require('../SlackMessenger.js');
const mailService = require('../mail-service');

/**
 * Plugin to send a cancellation offer email to the user.
 * This plugin listens for the 'cancel-subscription' event and sends an email with a discount offer.
 * @param {Object} user - The user object containing user details.
 * @return {Promise<void>} - A promise that resolves when the email is sent.
 * @throws {Error} - Throws an error if the email sending fails.
 */
const handler = async (event) => {
    const { data } = event;
    if (! data) {
        console.log('Data for plugin XXX not found.');
        return;
    }

    console.log('Executing plugin XXX ...');

    // Plugin logic goes here.
}

// Register the event handler
// The third argument is a config object for how EventBus handles errors.
// The options currently are 'slack' and 'email', which means if an error  
// occurs during the execution of the plugin, the error is non-blocking but
// the error will be logged and optionally notifications sent to Slack and/or
// admin email.
EventBus.on('foo-bar', handler, {
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