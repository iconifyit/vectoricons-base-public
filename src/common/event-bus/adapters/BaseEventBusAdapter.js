// Minimal adapter interface. Implementations must provide these methods.
class BaseEventBusAdapter {
    on(event, handler) { throw new Error('on() not implemented'); }
    off(event, handler) { throw new Error('off() not implemented'); }
    once(event, handler) { throw new Error('once() not implemented'); }
    emit(event, payload) { throw new Error('emit() not implemented'); }
    clear() { throw new Error('clear() not implemented'); }
}

module.exports = BaseEventBusAdapter;