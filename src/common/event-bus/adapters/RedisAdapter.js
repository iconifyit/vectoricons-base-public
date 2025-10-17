// Example Redis adapter (pub/sub). Requires a Redis client (e.g., ioredis).
// You can flesh this out when you’re ready to use Redis in prod.
//
// NOTE: This is a simple channel-per-event approach. For large scale you’d
// want serialization, backpressure, and graceful reconnection handling.

const BaseEventBusAdapter = require('./BaseEventBusAdapter.js');

class RedisEventBusAdapter extends BaseEventBusAdapter {
    constructor({ publisher, subscriber, channelPrefix = 'eventbus:' }) {
        super();
        this.publisher = publisher;
        this.subscriber = subscriber;
        this.channelPrefix = channelPrefix;
        this.handlers = new Map(); // event -> Set<handler>

        this.subscriber.on('message', (channel, message) => {
            const event = channel.replace(this.channelPrefix, '');
            const payload = this._safeParse(message);
            const set = this.handlers.get(event);
            if (!set) return;
            for (const fn of set) fn(payload);
        });
    }

    _safeParse(message) {
        try { return JSON.parse(message); } catch { return message; }
    }

    _channel(event) {
        return `${this.channelPrefix}${event}`;
    }

    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
            this.subscriber.subscribe(this._channel(event));
        }
        this.handlers.get(event).add(handler);
    }

    off(event, handler) {
        const set = this.handlers.get(event);
        if (!set) return;
        set.delete(handler);
        if (set.size === 0) {
            this.subscriber.unsubscribe(this._channel(event));
            this.handlers.delete(event);
        }
    }

    once(event, handler) {
        const onceHandler = (payload) => {
            this.off(event, onceHandler);
            handler(payload);
        };
        this.on(event, onceHandler);
    }

    emit(event, payload) {
        this.publisher.publish(this._channel(event), JSON.stringify(payload));
    }

    clear() {
        for (const event of this.handlers.keys()) {
            this.subscriber.unsubscribe(this._channel(event));
        }
        this.handlers.clear();
    }
}

module.exports = RedisEventBusAdapter;