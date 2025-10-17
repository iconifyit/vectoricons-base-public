const CacheAdapter = require('../adapters/CacheAdapter');

describe('CacheAdapter', () => {
    let adapter;

    beforeEach(() => {
        adapter = new CacheAdapter();
    });

    it('should throw "Not implemented" for get()', async () => {
        await expect(adapter.get('testKey')).rejects.toThrow('Not implemented');
    });

    it('should throw "Not implemented" for set()', async () => {
        await expect(adapter.set('testKey', 'value', 60)).rejects.toThrow('Not implemented');
    });

    it('should throw "Not implemented" for del()', async () => {
        await expect(adapter.del('testKey')).rejects.toThrow('Not implemented');
    });

    it('should throw "Not implemented" for keys()', async () => {
        await expect(adapter.keys()).rejects.toThrow('Not implemented');
    });

    it('should be instantiable as a base class', () => {
        expect(adapter).toBeInstanceOf(CacheAdapter);
    });

    it('should allow subclasses to override methods', async () => {
        class TestAdapter extends CacheAdapter {
            async get(key) {
                return `mocked-${key}`;
            }
        }

        const testAdapter = new TestAdapter();
        const result = await testAdapter.get('foo');
        expect(result).toBe('mocked-foo');
    });
});
