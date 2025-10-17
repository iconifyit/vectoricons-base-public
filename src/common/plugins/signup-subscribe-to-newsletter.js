const { EventBus, EventTypes } = require('../event-bus');

/**
 * Handler for optional newsletter subscription on user signup.
 * @param {Object} event - The event object containing user data.
 * @param {Object} event.data - The user data.
 * @returns {Promise<void>} - A promise that resolves when the email is sent.
 * @throws {Error} - Throws an error if the user is not found or if the email cannot be sent.
 */
const handler = async (event) => {    
    // ===========================================================================
    // Create Coupon Code & Send welcome offer email
    // ===========================================================================
    const { data: user } = event;

    throw new Error('Not implemented');

    console.log('User Signup Subscribe to newsletter triggered:', user);

    if (! user?.email) {
        console.log('Subscribe to newsletter failed. User not found.');
        throw new Error('Subscribe to newsletter failed. User not found.');
    }

    if (user?.is_deleted) {
        throw new Error('User not found');
    }

    if (! user?.isSubscribed) {
        console.log('User not subscribed to newsletter.');
        return;
    }

    console.log('Subscribe to newsletter ...');

    // ============================================================================
    // Subscribe to newsletter
    // ============================================================================
    const result = await mailchimp.subscribeToNewsletter(user.email);
    console.log('Subscribe to newsletter result:', result);
    if (result.status !== 'subscribed') {
        console.log('Subscribe to newsletter failed:', result);
        throw new Error('Subscribe to newsletter failed');
    }

    console.log('Subscribe to newsletter was successful.');
};

// Register the plugin with the event bus
EventBus.on(EventTypes.USER_SIGNUP, handler);

module.exports = {
    handler,
    // meta: {
    //     onError: {
    //         notify: ['slack', 'email']
    //     }
    // }
};