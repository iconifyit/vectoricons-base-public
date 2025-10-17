const { EventBus, EventTypes } = require('../event-bus');

const handler = async (event) => {
    // console.log('hello-world event', event);
    console.log('hello-world called', event?.data);
};

// Register the plugin with the event bus
EventBus.on(EventTypes.APP_START, handler);

// Export for unit testing.
module.exports = { handler };