const EventBusClass = require('./EventBus.js');
const EventTypes = require('./EventTypes.js');
const MemoryAdapter = require('./adapters/MemoryAdapter.js');

let singleton = null;

/**
 * initEventBus(options) -> EventBus (singleton)
 * Call once to initialize; subsequent calls return the same instance.
 *
 * @param {Object} [options]
 * @param {Class}  [options.adapter=MemoryAdapter] Adapter class (constructor) to use.
 * @returns {EventBus}
 */
const initEventBus = ({ adapter = MemoryAdapter } = {}) => {
    if (singleton) return singleton;
    singleton = new EventBusClass(new adapter());
    return singleton;
};

// Export both the init function and the singleton instance
module.exports = initEventBus;
module.exports.EventBus = singleton || initEventBus();
module.exports.EventTypes = EventTypes;