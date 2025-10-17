/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const IconService = require('../IconService');
const IconEntity = require('../IconEntity');

let testCounter = 0;
let testSetId = null;

beforeAll(async () => {
    // Get an existing set_id for test data
    const set = await DB.sets.query().where({ is_deleted: false, is_active: true }).first();
    if (set) {
        testSetId = set.id;
    }
});

const seedIcon = async (overrides = {}) => {
    testCounter++;
    return {
        name: `Test Icon ${testCounter}`,
        width: 24,
        height: 24,
        set_id: testSetId || 1,
        license_id: 21,
        user_id: 1,
        price: 0, // Free by default
        popularity: Math.floor(Math.random() * 1000),
        is_active: true,
        is_deleted: false,
        ...overrides,
    };
};

describe('Cursor Pagination - Field-Based Sorting', () => {
    let service;
    let trx;

    beforeAll(() => {
        service = new IconService();
    });

    beforeEach(async () => {
        trx = await DB.knex.transaction();
    });

    afterEach(async () => {
        if (trx) {
            await trx.rollback();
            trx = null;
        }
    });

    describe('Basic Pagination (Newest)', () => {
        test('paginates icons with default sorting (newest first)', async () => {
            // Create 5 icons
            const icons = [];
            for (let i = 0; i < 5; i++) {
                const data = await seedIcon({ name: `Icon ${i}` });
                const icon = await service.create(data, { trx });
                icons.push(icon);
            }

            // Get first page (2 items)
            const page1 = await service.cursorPaginate({}, null, 2, 'createdAt', 'desc', { trx });

            expect(page1.results).toHaveLength(2);
            expect(page1.pageInfo.hasNextPage).toBe(true);
            expect(page1.pageInfo.hasPreviousPage).toBe(false);
            expect(page1.pageInfo.endCursor).toBeDefined();
            expect(page1.results.every(r => r instanceof IconEntity)).toBe(true);
        });

        test('returns empty results for no matches', async () => {
            const result = await service.cursorPaginate(
                { price: 'free', searchTerm: 'nonexistenticon123456' },
                null,
                20,
                'createdAt',
                'desc',
                { trx }
            );

            expect(result.results).toHaveLength(0);
            expect(result.pageInfo.hasNextPage).toBe(false);
            expect(result.pageInfo.hasPreviousPage).toBe(false);
            expect(result.pageInfo.startCursor).toBeNull();
            expect(result.pageInfo.endCursor).toBeNull();
        });

        test('navigates through multiple pages', async () => {
            // Create 10 icons
            const icons = [];
            for (let i = 0; i < 10; i++) {
                const data = await seedIcon({ name: `Page Icon ${i}` });
                const icon = await service.create(data, { trx });
                icons.push(icon);
            }

            // Page 1
            const page1 = await service.cursorPaginate({}, null, 3, 'createdAt', 'desc', { trx });
            expect(page1.results).toHaveLength(3);
            expect(page1.pageInfo.hasNextPage).toBe(true);

            // Page 2
            const page2 = await service.cursorPaginate(
                {},
                page1.pageInfo.endCursor,
                3,
                'createdAt',
                'desc',
                { trx }
            );
            expect(page2.results).toHaveLength(3);
            expect(page2.pageInfo.hasNextPage).toBe(true);
            expect(page2.pageInfo.hasPreviousPage).toBe(true);

            // Ensure no overlap between pages
            const page1Ids = page1.results.map(r => r.id);
            const page2Ids = page2.results.map(r => r.id);
            const intersection = page1Ids.filter(id => page2Ids.includes(id));
            expect(intersection).toHaveLength(0);
        });

        test('detects last page correctly', async () => {
            // Create exactly 5 icons
            for (let i = 0; i < 5; i++) {
                const data = await seedIcon({ name: `Last Page Icon ${i}` });
                await service.create(data, { trx });
            }

            // Get all 5 at once
            const result = await service.cursorPaginate(
                { searchTerm: 'Last Page Icon' },
                null,
                10,
                'createdAt',
                'desc',
                { trx }
            );

            expect(result.results).toHaveLength(5);
            expect(result.pageInfo.hasNextPage).toBe(false);
        });

        test('respects limit parameter', async () => {
            // Create 20 icons
            for (let i = 0; i < 20; i++) {
                const data = await seedIcon();
                await service.create(data, { trx });
            }

            const result5 = await service.cursorPaginate({}, null, 5, 'createdAt', 'desc', { trx });
            expect(result5.results).toHaveLength(5);

            const result10 = await service.cursorPaginate({}, null, 10, 'createdAt', 'desc', { trx });
            expect(result10.results).toHaveLength(10);
        });

        test('caps limit at 100', async () => {
            // Limit should be capped at 100 even if we request more
            const result = await service.cursorPaginate({}, null, 500, 'createdAt', 'desc', { trx });
            // Should not error, and should apply cap
            expect(result).toBeDefined();
            expect(result.results.length).toBeLessThanOrEqual(100);
        });
    });

    describe('Sorting Modes', () => {
        test('sorts by created_at descending (newest first)', async () => {
            // Create icons with delay to ensure different timestamps
            const icon1 = await service.create(await seedIcon({ name: 'First' }), { trx });
            await new Promise(resolve => setTimeout(resolve, 10));
            const icon2 = await service.create(await seedIcon({ name: 'Second' }), { trx });
            await new Promise(resolve => setTimeout(resolve, 10));
            const icon3 = await service.create(await seedIcon({ name: 'Third' }), { trx });

            const result = await service.cursorPaginate({}, null, 10, 'createdAt', 'desc', { trx });

            const ourIcons = result.results.filter(r =>
                r.id === icon1.id || r.id === icon2.id || r.id === icon3.id
            );

            // Should be in reverse chronological order (newest first)
            expect(ourIcons.length).toBe(3);
            const icon3Index = ourIcons.findIndex(i => i.id === icon3.id);
            const icon2Index = ourIcons.findIndex(i => i.id === icon2.id);
            const icon1Index = ourIcons.findIndex(i => i.id === icon1.id);

            expect(icon3Index).toBeLessThan(icon2Index);
            expect(icon2Index).toBeLessThan(icon1Index);
        });

        test('sorts by created_at ascending (oldest first)', async () => {
            const icon1 = await service.create(await seedIcon({ name: 'First' }), { trx });
            await new Promise(resolve => setTimeout(resolve, 10));
            const icon2 = await service.create(await seedIcon({ name: 'Second' }), { trx });
            await new Promise(resolve => setTimeout(resolve, 10));
            const icon3 = await service.create(await seedIcon({ name: 'Third' }), { trx });

            const result = await service.cursorPaginate({}, null, 10, 'createdAt', 'asc', { trx });

            const ourIcons = result.results.filter(r =>
                r.id === icon1.id || r.id === icon2.id || r.id === icon3.id
            );

            // Should be in chronological order (oldest first)
            expect(ourIcons.length).toBe(3);
            const icon1Index = ourIcons.findIndex(i => i.id === icon1.id);
            const icon2Index = ourIcons.findIndex(i => i.id === icon2.id);
            const icon3Index = ourIcons.findIndex(i => i.id === icon3.id);

            expect(icon1Index).toBeLessThan(icon2Index);
            expect(icon2Index).toBeLessThan(icon3Index);
        });

        test('sorts by popularity descending (bestsellers first)', async () => {
            const icon1 = await service.create(await seedIcon({ popularity: 100 }), { trx });
            const icon2 = await service.create(await seedIcon({ popularity: 500 }), { trx });
            const icon3 = await service.create(await seedIcon({ popularity: 300 }), { trx });

            const result = await service.cursorPaginate({}, null, 10, 'popularity', 'desc', { trx });

            const ourIcons = result.results.filter(r =>
                r.id === icon1.id || r.id === icon2.id || r.id === icon3.id
            );

            expect(ourIcons.length).toBe(3);
            expect(parseInt(ourIcons[0].popularity)).toBeGreaterThanOrEqual(parseInt(ourIcons[1].popularity));
            expect(parseInt(ourIcons[1].popularity)).toBeGreaterThanOrEqual(parseInt(ourIcons[2].popularity));
        });
    });

    describe('Search Facets', () => {
        test('filters by price (free)', async () => {
            await service.create(await seedIcon({ price: 0, name: 'Free Icon' }), { trx });
            await service.create(await seedIcon({ price: 9.99, name: 'Paid Icon' }), { trx });

            const result = await service.cursorPaginate(
                { price: 'free' },
                null,
                20,
                'createdAt',
                'desc',
                { trx }
            );

            const ourIcons = result.results.filter(r =>
                r.name === 'Free Icon' || r.name === 'Paid Icon'
            );

            expect(ourIcons.length).toBe(1);
            expect(ourIcons[0].name).toBe('Free Icon');
        });

        test('filters by price (premium)', async () => {
            await service.create(await seedIcon({ price: 0, name: 'Free Icon 2' }), { trx });
            const paidIcon = await service.create(await seedIcon({ price: 9.99, name: 'Paid Icon 2' }), { trx });

            const result = await service.cursorPaginate(
                { price: 'premium' },
                null,
                20,
                'createdAt',
                'desc',
                { trx }
            );

            const ourIcons = result.results.filter(r =>
                r.name === 'Free Icon 2' || r.name === 'Paid Icon 2'
            );

            expect(ourIcons.length).toBe(1);
            expect(ourIcons[0].name).toBe('Paid Icon 2');
            expect(parseFloat(ourIcons[0].price)).toBeGreaterThan(0);
        });

        test('filters by searchTerm (case insensitive)', async () => {
            await service.create(await seedIcon({ name: 'home-outline' }), { trx });
            await service.create(await seedIcon({ name: 'settings-gear' }), { trx });
            await service.create(await seedIcon({ name: 'home-filled' }), { trx });

            const result = await service.cursorPaginate(
                { searchTerm: 'home' },
                null,
                20,
                'createdAt',
                'desc',
                { trx }
            );

            const homeIcons = result.results.filter(r =>
                r.name === 'home-outline' || r.name === 'home-filled'
            );

            expect(homeIcons.length).toBe(2);
            expect(homeIcons.every(i => i.name.toLowerCase().includes('home'))).toBe(true);
        });

        test('filters by setId', async () => {
            const icon1 = await service.create(await seedIcon({ set_id: testSetId }), { trx });

            const result = await service.cursorPaginate(
                { setId: testSetId },
                null,
                20,
                'createdAt',
                'desc',
                { trx }
            );

            const ourIcon = result.results.find(r => r.id === icon1.id);
            expect(ourIcon).toBeDefined();
            expect(ourIcon.setId).toBe(testSetId);
        });

        test('filters by userId', async () => {
            await service.create(await seedIcon({ user_id: 1 }), { trx });
            await service.create(await seedIcon({ user_id: 2 }), { trx });

            const result = await service.cursorPaginate(
                { userId: 1 },
                null,
                20,
                'createdAt',
                'desc',
                { trx }
            );

            expect(result.results.every(r => r.userId === 1)).toBe(true);
        });

        test('combines multiple filters', async () => {
            await service.create(await seedIcon({
                price: 0,
                name: 'free-home-icon',
                set_id: testSetId,
            }), { trx });

            await service.create(await seedIcon({
                price: 9.99,
                name: 'paid-home-icon',
                set_id: testSetId,
            }), { trx });

            const result = await service.cursorPaginate(
                {
                    price: 'free',
                    searchTerm: 'home',
                    setId: testSetId,
                },
                null,
                20,
                'createdAt',
                'desc',
                { trx }
            );

            const ourIcon = result.results.find(r => r.name === 'free-home-icon');
            expect(ourIcon).toBeDefined();
            expect(result.results.find(r => r.name === 'paid-home-icon')).toBeUndefined();
        });
    });

    describe('Cursor Validation', () => {
        test('throws error for invalid cursor token', async () => {
            await expect(
                service.cursorPaginate({}, 'invalid_cursor', 20, 'createdAt', 'desc', { trx })
            ).rejects.toThrow();
        });

        test('handles null cursor (first page)', async () => {
            const result = await service.cursorPaginate({}, null, 20, 'createdAt', 'desc', { trx });
            expect(result).toBeDefined();
            expect(result.pageInfo.hasPreviousPage).toBe(false);
        });
    });

    describe('searchIcons Convenience Method', () => {
        test('uses newest sort by default', async () => {
            const result = await service.searchIcons({
                price: 'free',
                limit: 20,
            }, { trx });

            expect(result).toBeDefined();
            expect(result.results).toBeDefined();
            expect(result.pageInfo).toBeDefined();
        });

        test('supports bestseller sort', async () => {
            await service.create(await seedIcon({ popularity: 100 }), { trx });
            await service.create(await seedIcon({ popularity: 500 }), { trx });

            const result = await service.searchIcons({
                sort: 'bestseller',
                limit: 20,
            }, { trx });

            expect(result).toBeDefined();
            expect(result.results).toBeDefined();
        });

        test('paginates with cursor', async () => {
            for (let i = 0; i < 10; i++) {
                await service.create(await seedIcon(), { trx });
            }

            const page1 = await service.searchIcons({
                limit: 3,
            }, { trx });

            expect(page1.pageInfo.endCursor).toBeDefined();

            const page2 = await service.searchIcons({
                cursor: page1.pageInfo.endCursor,
                limit: 3,
            }, { trx });

            expect(page2.results).toHaveLength(3);
            expect(page2.pageInfo.hasPreviousPage).toBe(true);
        });
    });
});

describe('Cursor Pagination - Array Position Sorting (Relevance)', () => {
    let service;
    let trx;

    beforeAll(() => {
        service = new IconService();
    });

    beforeEach(async () => {
        trx = await DB.knex.transaction();
    });

    afterEach(async () => {
        if (trx) {
            await trx.rollback();
            trx = null;
        }
    });

    describe('Elasticsearch Relevance Sorting', () => {
        test('preserves Elasticsearch ranking order', async () => {
            // Create icons
            const icon1 = await service.create(await seedIcon({ name: 'icon-a' }), { trx });
            const icon2 = await service.create(await seedIcon({ name: 'icon-b' }), { trx });
            const icon3 = await service.create(await seedIcon({ name: 'icon-c' }), { trx });
            const icon4 = await service.create(await seedIcon({ name: 'icon-d' }), { trx });

            // Simulate Elasticsearch ranked results (icon3, icon1, icon4, icon2)
            const esRankedIds = [icon3.id, icon1.id, icon4.id, icon2.id];

            const result = await service.searchIcons({
                iconIds: esRankedIds,
                sort: 'relevance',
                limit: 10,
            }, { trx });

            expect(result.results).toHaveLength(4);

            // Verify order matches ES ranking
            expect(result.results[0].id).toBe(icon3.id);
            expect(result.results[1].id).toBe(icon1.id);
            expect(result.results[2].id).toBe(icon4.id);
            expect(result.results[3].id).toBe(icon2.id);
        });

        test('paginates through relevance-sorted results', async () => {
            // Create icons
            const icons = [];
            for (let i = 0; i < 10; i++) {
                const icon = await service.create(await seedIcon({ name: `rel-icon-${i}` }), { trx });
                icons.push(icon);
            }

            // Simulate ES ranking (reverse order for testing)
            const esRankedIds = icons.map(i => i.id).reverse();

            // Page 1
            const page1 = await service.searchIcons({
                iconIds: esRankedIds,
                sort: 'relevance',
                limit: 3,
            }, { trx });

            expect(page1.results).toHaveLength(3);
            expect(page1.pageInfo.hasNextPage).toBe(true);
            expect(page1.pageInfo.endCursor).toBeDefined();

            // Page 2 (must pass SAME iconIds to maintain order)
            const page2 = await service.searchIcons({
                iconIds: esRankedIds,
                sort: 'relevance',
                cursor: page1.pageInfo.endCursor,
                limit: 3,
            }, { trx });

            expect(page2.results).toHaveLength(3);
            expect(page2.pageInfo.hasPreviousPage).toBe(true);

            // Verify no overlap
            const page1Ids = page1.results.map(r => r.id);
            const page2Ids = page2.results.map(r => r.id);
            const intersection = page1Ids.filter(id => page2Ids.includes(id));
            expect(intersection).toHaveLength(0);
        });

        test('applies PostgreSQL filters on Elasticsearch results', async () => {
            // Create free and premium icons
            const freeIcon1 = await service.create(await seedIcon({ price: 0, name: 'free-a' }), { trx });
            const freeIcon2 = await service.create(await seedIcon({ price: 0, name: 'free-b' }), { trx });
            const paidIcon = await service.create(await seedIcon({ price: 9.99, name: 'paid-a' }), { trx });

            // ES returns all three
            const esRankedIds = [freeIcon1.id, paidIcon.id, freeIcon2.id];

            // Filter to free only
            const result = await service.searchIcons({
                iconIds: esRankedIds,
                price: 'free',
                sort: 'relevance',
                limit: 10,
            }, { trx });

            // Should only return free icons in ES order
            expect(result.results).toHaveLength(2);
            expect(result.results[0].id).toBe(freeIcon1.id);
            expect(result.results[1].id).toBe(freeIcon2.id);
            expect(result.results.every(r => parseFloat(r.price) === 0)).toBe(true);
        });

        test('combines ES relevance with text search filter', async () => {
            const homeIcon1 = await service.create(await seedIcon({ name: 'home-outline' }), { trx });
            const homeIcon2 = await service.create(await seedIcon({ name: 'home-filled' }), { trx });
            const settingsIcon = await service.create(await seedIcon({ name: 'settings-gear' }), { trx });

            // ES returns all three
            const esRankedIds = [settingsIcon.id, homeIcon2.id, homeIcon1.id];

            // Additional PostgreSQL filter for 'home'
            const result = await service.searchIcons({
                iconIds: esRankedIds,
                searchTerm: 'home',
                sort: 'relevance',
                limit: 10,
            }, { trx });

            // Should only return home icons, in ES order
            expect(result.results).toHaveLength(2);
            expect(result.results[0].id).toBe(homeIcon2.id);
            expect(result.results[1].id).toBe(homeIcon1.id);
        });

        test('handles empty Elasticsearch results', async () => {
            const result = await service.searchIcons({
                iconIds: [],
                sort: 'relevance',
                limit: 10,
            }, { trx });

            expect(result.results).toHaveLength(0);
            expect(result.pageInfo.hasNextPage).toBe(false);
        });

        test('falls back to newest when iconIds not provided for relevance', async () => {
            // Create icons
            const icon1 = await service.create(await seedIcon({ name: 'fallback-1' }), { trx });
            await new Promise(resolve => setTimeout(resolve, 10));
            const icon2 = await service.create(await seedIcon({ name: 'fallback-2' }), { trx });

            // Request relevance without iconIds - should fall back to newest
            const result = await service.searchIcons({
                sort: 'relevance',
                // No iconIds provided
                limit: 10,
            }, { trx });

            // Should still work, but use newest sorting instead
            expect(result.results).toBeDefined();
        });
    });

    describe('Cursor Structure for Relevance', () => {
        test('generates array position cursors', async () => {
            const icon1 = await service.create(await seedIcon(), { trx });
            const icon2 = await service.create(await seedIcon(), { trx });
            const icon3 = await service.create(await seedIcon(), { trx });

            const esRankedIds = [icon1.id, icon2.id, icon3.id];

            const result = await service.searchIcons({
                iconIds: esRankedIds,
                sort: 'relevance',
                limit: 2,
            }, { trx });

            expect(result.pageInfo.endCursor).toBeDefined();
            expect(result.pageInfo.startCursor).toBeDefined();

            // Cursor should be different from field-based cursors
            // (contains arrayPosition instead of createdAt/popularity)
            expect(result.pageInfo.endCursor).not.toContain('createdAt');
        });
    });
});

describe('Cursor Pagination - Performance', () => {
    let service;
    let trx;

    beforeAll(() => {
        service = new IconService();
    });

    beforeEach(async () => {
        trx = await DB.knex.transaction();
    });

    afterEach(async () => {
        if (trx) {
            await trx.rollback();
            trx = null;
        }
    });

    describe('Consistency', () => {
        test('maintains consistent results when data is added', async () => {
            // Create initial icons
            for (let i = 0; i < 5; i++) {
                await service.create(await seedIcon({ name: `Initial ${i}` }), { trx });
            }

            // Get first page
            const page1 = await service.cursorPaginate(
                { searchTerm: 'Initial' },
                null,
                2,
                'createdAt',
                'desc',
                { trx }
            );

            expect(page1.results).toHaveLength(2);
            const firstPageIds = page1.results.map(r => r.id);

            // Add more icons (simulates concurrent data changes)
            await service.create(await seedIcon({ name: 'Initial 999' }), { trx });

            // Get second page with cursor
            const page2 = await service.cursorPaginate(
                { searchTerm: 'Initial' },
                page1.pageInfo.endCursor,
                2,
                'createdAt',
                'desc',
                { trx }
            );

            // Should not see the newly added icon in page 2
            // (cursor pagination prevents page drift)
            const secondPageIds = page2.results.map(r => r.id);
            const hasOverlap = firstPageIds.some(id => secondPageIds.includes(id));
            expect(hasOverlap).toBe(false);
        });
    });
});
