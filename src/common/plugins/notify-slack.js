 // plugins/messenger-plugin.js

const { EventBus, EventTypes } = require('../event-bus');
const SlackMessenger = require('../SlackMessenger.js');

const ExampleSlackEvent = {
    channel: '#your-channel-name',
    message: 'Some text',
}

/**
 * Generic message dispatcher
 * Accepts an event of shape:
 * {
 *     channel: '#your-channel-name',
 *     message: 'Some text'
 * }
 */
const handler = async (event) => {
    console.log('Notify Slack plugin handler triggered:', event);

    if (! event?.data) {
        console.log('Invalid Slack payload', event);
        throw new Error('Invalid Slack payload');
    }

    const { message, channel } = event.data || {};
        
    if (! message || ! channel) {
        console.log('Invalid Slack payload', config.channels.slack);
        return;
    }
    
    await SlackMessenger.sendMessage(channel, message);
};

// Register plugin once for unified notifications
EventBus.on(EventTypes.NOTIFY_SLACK, handler, {
    onError: { notify: ['slack', 'email'] },
});

module.exports = {
    handler,
    meta: {
        onError: { notify: ['slack', 'email'] },
    },
};