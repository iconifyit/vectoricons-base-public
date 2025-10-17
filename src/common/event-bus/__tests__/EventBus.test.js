const { EventBus } = require('../index');
const SlackNotifier = require('../../notifiers/slack-notifier');
const AdminEmailNotifier = require('../../notifiers/admin-email-notifier');

// Mock notifiers
jest.mock('../../notifiers/slack-notifier');
jest.mock('../../notifiers/admin-email-notifier');

describe('EventBus', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(SlackNotifier.prototype, 'notify').mockResolvedValue();
        jest.spyOn(AdminEmailNotifier.prototype, 'notify').mockResolvedValue();
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    it('should register and emit an event', async () => {
        const handler = jest.fn();
        EventBus.on('test.event', handler);
        EventBus.emit('test.event', { foo: 'bar' });

        // Give async handler a moment
        await new Promise(r => setTimeout(r, 10));

        expect(handler).toHaveBeenCalled();
    });

    it('should remove a registered handler', async () => {
        const handler = jest.fn();
        EventBus.on('remove.event', handler);
        EventBus.off('remove.event', handler);
        EventBus.emit('remove.event', { test: 123 });

        await new Promise(r => setTimeout(r, 10));

        expect(handler).not.toHaveBeenCalled();
    });

    it('should only fire once for once()', async () => {
        const handler = jest.fn();
        EventBus.once('once.event', handler);
        EventBus.emit('once.event', { val: 1 });
        EventBus.emit('once.event', { val: 2 });

        await new Promise(r => setTimeout(r, 10));

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not throw on missing arguments', () => {
        expect(() => EventBus.on()).not.toThrow();
        expect(() => EventBus.emit()).not.toThrow();
        expect(() => EventBus.off()).not.toThrow();
        expect(() => EventBus.once()).not.toThrow();
    });

    it('should call notifiers when handler throws', async () => {
        const errorHandler = jest.fn(() => { throw new Error('Boom'); });
        EventBus.on('error.event', errorHandler, {
            onError: {
                notify: ['slack', 'email'],
            },
        });

        EventBus.emit('error.event', { bad: true });

        await new Promise(r => setTimeout(r, 10));

        expect(SlackNotifier.prototype.notify).toHaveBeenCalled();
        expect(AdminEmailNotifier.prototype.notify).toHaveBeenCalled();
    });

    it('should clear all listeners', async () => {
        const handler = jest.fn();
        EventBus.on('clear.event', handler);
        EventBus.clear();
        EventBus.emit('clear.event', { clear: true });

        await new Promise(r => setTimeout(r, 10));

        expect(handler).not.toHaveBeenCalled();
    });
});