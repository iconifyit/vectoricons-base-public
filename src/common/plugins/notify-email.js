                                         // plugins/messenger-plugin.js

const { EventBus, EventTypes } = require('../event-bus');
const MailService = require('../mail-service');

const SampleEmailNotifierEvent = {
    type: 'welcome-offer',
    user: {
        email: 'me@example.com',
        display_name: 'myname', 
        username: 'myname',
    },
    data: {
        name: 'myname',
        coupon_code: 'WELCOME123',
        amount: 10,
        type: 'fixed',
    },
};

/**
 * Generic message dispatcher
 * Accepts an event of shape:
 * {
 *   type: 'welcome-offer',
 *   user: { ... },
 *   data: {
 *     name: 'Scott',
 *     coupon_code: 'WELCOME123',
 *     amount: 10,
 *   }
 * }
 */
const handler = (event) => {
    console.log('Notify Email plugin handler triggered:', event);

    const { type, user, data } = event?.data || {};

    console.log('Notify Email plugin handler data:', type, user, data);
    
    if (!type || !user || !user?.email) throw new Error('Invalid email payload');
    
     MailService.maybeSendAutoResponder({ type, user, data });
};

// Register plugin once for unified notifications
EventBus.on(EventTypes.NOTIFY_EMAIL, handler, {
    onError: { notify: ['slack', 'email'] },
});

module.exports = {
    handler,
    meta: {
        onError: { notify: ['slack', 'email'] },
    },
};