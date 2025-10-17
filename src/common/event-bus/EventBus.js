const Event = require('./Event.js');
const EventTypes = require('./EventTypes.js');
const SlackNotifier = require('../notifiers/slack-notifier');
const AdminEmailNotifier = require('../notifiers/admin-email-notifier');

const BaseEventBusAdapter = require('./adapters/BaseEventBusAdapter.js');
const MemoryEventBusAdapter = require('./adapters/MemoryAdapter.js');

// Singleton state
let adapter = new MemoryEventBusAdapter();

/**
 * Event-driven pub/sub system for decoupled module communication.
 *
 * Implements the observer pattern to enable loosely-coupled communication between
 * different parts of the application. Modules can emit events without knowing
 * which other modules are listening, and listeners don't need to know the source.
 *
 * Features:
 * - Adapter pattern for swappable backends (Memory, Redis, etc.)
 * - Error handling with optional notifications (Slack, Email)
 * - Event wrapping with metadata
 * - WeakMap for memory-efficient handler tracking
 * - Built-in error recovery
 *
 * @class EventBus
 * @example
 * // Subscribe to events
 * eventBus.on(EventTypes.USER_SIGNUP, async (user) => {
 *   await sendWelcomeEmail(user);
 * });
 *
 * @example
 * // Emit events
 * eventBus.emit(EventTypes.USER_SIGNUP, { id: 123, email: 'user@example.com' });
 *
 * @example
 * // With error notifications
 * eventBus.on(EventTypes.ORDER_COMPLETED, orderHandler, {
 *   onError: { notify: ['slack', 'email'] }
 * });
 */
class EventBus {
    /**
     * Creates an instance of EventBus.
     *
     * Sets up notifiers for error handling and initializes WeakMaps
     * for tracking handler configurations and wrapped handlers.
     *
     * @example
     * const eventBus = new EventBus();
     */
    constructor() {
        /**
         * Slack notifier for error alerts.
         * @type {SlackNotifier}
         * @private
         */
        this.slackNotifier = new SlackNotifier();

        /**
         * Email notifier for error alerts.
         * @type {AdminEmailNotifier}
         * @private
         */
        this.emailNotifier = new AdminEmailNotifier();

        /**
         * Maps handlers to their configuration options.
         * @type {WeakMap}
         * @private
         */
        this.handlerConfigs = new WeakMap();

        /**
         * Maps original handlers to their wrapped versions.
         * @type {WeakMap}
         * @private
         */
        this.wrappedHandlers = new WeakMap();
    }

    /**
     * Sets the event bus adapter (Memory, Redis, etc.).
     *
     * Allows swapping the underlying pub/sub implementation without
     * changing consumer code. Useful for switching from in-memory
     * events to distributed events via Redis.
     *
     * @param {BaseEventBusAdapter} nextAdapter - The new adapter instance
     * @throws {Error} If adapter is not a BaseEventBusAdapter instance
     *
     * @example
     * // Switch to Redis adapter
     * const redisAdapter = new RedisEventBusAdapter(redisClient);
     * eventBus.setAdapter(redisAdapter);
     *
     * @example
     * // Use memory adapter (default)
     * eventBus.setAdapter(new MemoryEventBusAdapter());
     */
    setAdapter(nextAdapter) {
        if (!(nextAdapter instanceof BaseEventBusAdapter)) {
            throw new Error('EventBus.setAdapter requires an BaseEventBusAdapter instance');
        }
        adapter = nextAdapter;
    }

    /**
     * Subscribes to an event with an async handler function.
     *
     * Handlers are automatically wrapped with error handling. Failed handlers
     * won't crash the application and can optionally notify via Slack/Email.
     *
     * @param {string} event - The event type to listen for (e.g., EventTypes.USER_SIGNUP)
     * @param {Function} handler - Async function to handle the event: `async (payload) => void`
     * @param {Object} [config={}] - Handler configuration
     * @param {Object} [config.onError] - Error handling configuration
     * @param {Array<string>} [config.onError.notify] - Notifiers to use on error: ['slack', 'email']
     *
     * @example
     * // Basic subscription
     * eventBus.on(EventTypes.USER_SIGNUP, async (user) => {
     *   console.log('New user:', user.email);
     *   await sendWelcomeEmail(user);
     * });
     *
     * @example
     * // With error notifications
     * eventBus.on(EventTypes.ORDER_COMPLETED, async (order) => {
     *   await processOrder(order);
     * }, {
     *   onError: { notify: ['slack', 'email'] }
     * });
     *
     * @example
     * // Multiple handlers for same event
     * eventBus.on(EventTypes.USER_VERIFY_EMAIL, sendWelcomeEmail);
     * eventBus.on(EventTypes.USER_VERIFY_EMAIL, createCouponCode);
     * eventBus.on(EventTypes.USER_VERIFY_EMAIL, notifySlack);
     */
    on(event, handler, config = {}) {
        if (!event || !handler) return;

        const wrapped = async (payload) => {
            await this.safeRun(event, handler, payload);
        };

        this.handlerConfigs.set(handler, config);
        this.wrappedHandlers.set(handler, wrapped);
        adapter.on(event, wrapped);
    }

    /**
     * Unsubscribes a handler from an event.
     *
     * Removes the handler registration and cleans up associated WeakMap entries.
     *
     * @param {string} event - The event type
     * @param {Function} handler - The original handler function passed to `on()`
     *
     * @example
     * const handler = async (user) => console.log(user);
     * eventBus.on(EventTypes.USER_SIGNUP, handler);
     *
     * // Later, unsubscribe
     * eventBus.off(EventTypes.USER_SIGNUP, handler);
     *
     * @example
     * // Conditional subscription
     * if (config.enableNotifications) {
     *   eventBus.on(EventTypes.ORDER_COMPLETED, notifyHandler);
     * } else {
     *   eventBus.off(EventTypes.ORDER_COMPLETED, notifyHandler);
     * }
     */
    off(event, handler) {
        if (!event || !handler) return;
        const wrapped = this.wrappedHandlers.get(handler);
        if (!wrapped) return;

        adapter.off(event, wrapped);
        this.handlerConfigs.delete(handler);
        this.wrappedHandlers.delete(handler);
    }

    /**
     * Subscribes to an event for a single execution.
     *
     * The handler will be automatically unsubscribed after it executes once.
     *
     * @param {string} event - The event type
     * @param {Function} handler - Async function to handle the event once
     * @param {Object} [config={}] - Handler configuration (same as `on()`)
     *
     * @example
     * // Execute only on first user signup
     * eventBus.once(EventTypes.USER_SIGNUP, async (user) => {
     *   console.log('First user signed up:', user.email);
     *   await sendFounderEmail(user);
     * });
     *
     * @example
     * // Wait for specific event (promise pattern)
     * function waitForOrderComplete(orderId) {
     *   return new Promise(resolve => {
     *     eventBus.once(EventTypes.ORDER_COMPLETED, (order) => {
     *       if (order.id === orderId) resolve(order);
     *     });
     *   });
     * }
     */
    once(event, handler, config = {}) {
        if (!event || !handler) return;

        const wrapped = async (payload) => {
            await this.safeRun(event, handler, payload);
        };

        this.handlerConfigs.set(handler, config);
        this.wrappedHandlers.set(handler, wrapped);
        adapter.once(event, wrapped);
    }

    /**
     * Emits an event with optional payload data.
     *
     * All registered handlers for this event will be called asynchronously.
     * Handlers run independently - one handler's failure won't affect others.
     *
     * @param {string} event - The event type to emit
     * @param {*} [payload] - Data to pass to handlers (any type)
     *
     * @returns {boolean} True if event was emitted, false if event name invalid
     *
     * @example
     * // Emit with object payload
     * eventBus.emit(EventTypes.USER_SIGNUP, {
     *   id: 123,
     *   email: 'user@example.com',
     *   displayName: 'John Doe'
     * });
     *
     * @example
     * // Emit without payload
     * eventBus.emit(EventTypes.SYSTEM_READY);
     *
     * @example
     * // Emit with primitive payload
     * eventBus.emit(EventTypes.ORDER_COMPLETED, orderId);
     *
     * @example
     * // Emit after database update
     * await iconService.createIcon(data);
     * eventBus.emit(EventTypes.ICON_CREATED, icon);
     * // All plugins listening to ICON_CREATED will execute
     */
    emit(event, payload) {
        if (!event) return false;
        adapter.emit(event, Event.create(event, payload));
        return true;
    }

    /**
     * Removes all event handlers and clears internal state.
     *
     * Useful for testing or resetting the event bus to a clean state.
     *
     * @example
     * // Clean up after tests
     * afterEach(() => {
     *   eventBus.clear();
     * });
     *
     * @example
     * // Reset event bus
     * eventBus.clear();
     * eventBus.on(EventTypes.USER_SIGNUP, newHandler);
     */
    clear() {
        adapter.clear();
        this.handlerConfigs = new WeakMap();
        this.wrappedHandlers = new WeakMap();
    }

    /**
     * Safely executes a handler with error handling and notifications.
     *
     * If the handler throws an error:
     * 1. Error is logged to console
     * 2. Configured notifiers are triggered (Slack, Email)
     * 3. Event bus continues operating normally
     *
     * This prevents one failing handler from crashing the application
     * or preventing other handlers from executing.
     *
     * @async
     * @param {string} eventName - The event name (for error reporting)
     * @param {Function} handler - The handler function to execute
     * @param {*} payload - The event payload to pass to handler
     *
     * @private
     *
     * @example
     * // This is called automatically by on(), once(), etc.
     * // You don't need to call it directly
     */
    async safeRun(eventName, handler, payload) {
        try {
            await handler(payload);
        }
        catch (error) {
            console.error(`Error in plugin handler for event "${eventName}":`, error);
            const config = this.handlerConfigs.get(handler) || {};
            const notifiers = config?.onError?.notify || [];
            const subject = `Error in plugin handler for ${eventName}`;
            const tasks = [];

            if (notifiers.includes('slack')) {
                tasks.push(this.slackNotifier.notify(subject, error));
            }
            if (notifiers.includes('email')) {
                tasks.push(this.emailNotifier.notify(subject, error));
            }

            await Promise.allSettled(tasks);
        }
    }
}

module.exports = EventBus;
