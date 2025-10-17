const mitt = require('mitt');
const BaseEventBusAdapter = require('./BaseEventBusAdapter.js');

class MemoryEventBusAdapter extends BaseEventBusAdapter {
    constructor() {
        super();
        this.emitter = mitt();
    }

    on(event, handler) {
        this.emitter.on(event, handler);
    }

    off(event, handler) {
        this.emitter.off(event, handler);
    }

    once(event, handler) {
        const onceHandler = (payload) => {
            this.off(event, onceHandler);
            handler(payload);
        };
        this.on(event, onceHandler);
    }

    emit(event, payload) {
        this.emitter.emit(event, payload);
    }

    clear() {
        this.emitter.all.clear();
    }
}

module.exports = MemoryEventBusAdapter;