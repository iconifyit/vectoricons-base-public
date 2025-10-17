/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const TransactionsViewRepository = require('../TransactionsViewRepository');
const TransactionsViewEntity = require('../TransactionsViewEntity');
const { seedOne, seedMany } = require('./seed');

describe('TransactionsViewRepository', () => {
    let repository;

    beforeAll(() => {
        repository = new TransactionsViewRepository({ DB });
    });

    describe('findOne', () => {
        it('should find a single view record by transaction_uuid', async () => {
            let expectedViewData;
            await DB.knex.transaction(async (trx) => {
                expectedViewData = await seedOne({ trx });
                await trx.commit();
            });

            const result = await repository.findOne({
                transaction_uuid: expectedViewData.transaction_uuid
            });

            expect(result).toBeInstanceOf(TransactionsViewEntity);
            expect(result.userId).toBe(1);
            expect(result.accountId).toBe(expectedViewData.account_id);
            expect(result.entityId).toBe(expectedViewData.entity_id);
            expect(result.entityType).toBe(expectedViewData.entity_type);
            expect(result.transactionUuid).toBe(expectedViewData.transaction_uuid);
        });

        it('should find a view record by user_id and account_id', async () => {
            let expectedViewData;
            await DB.knex.transaction(async (trx) => {
                expectedViewData = await seedOne({ trx });
                await trx.commit();
            });

            const result = await repository.findOne({
                user_id: 1,
                account_id: expectedViewData.account_id
            });

            expect(result).toBeInstanceOf(TransactionsViewEntity);
            expect(result.userId).toBe(1);
            expect(result.accountId).toBe(expectedViewData.account_id);
        });
    });

    describe('findAll', () => {
        it('should return all view records for a user', async () => {
            await DB.knex.transaction(async (trx) => {
                await seedMany({ n: 3, trx });
                await trx.commit();
            });

            const results = await repository.findAll({ user_id: 1 });

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThanOrEqual(3);
            results.forEach(result => {
                expect(result).toBeInstanceOf(TransactionsViewEntity);
                expect(result.userId).toBe(1);
            });
        });

        it('should filter by entity_type', async () => {
            await DB.knex.transaction(async (trx) => {
                await seedMany({ n: 2, trx });
                await trx.commit();
            });

            const results = await repository.findAll({
                user_id: 1,
                entity_type: 'icon'
            });

            expect(Array.isArray(results)).toBe(true);
            results.forEach(result => {
                expect(result.entityType).toBe('icon');
            });
        });
    });

    describe('paginate', () => {
        it('should paginate view records', async () => {
            await DB.knex.transaction(async (trx) => {
                await seedMany({ n: 10, trx });
                await trx.commit();
            });

            const result = await repository.paginate({ user_id: 1 }, 1, 5);

            expect(result).toHaveProperty('results');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('pageSize');
            expect(result.results.length).toBeLessThanOrEqual(5);
            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(5);
        });
    });

    describe('exists', () => {
        it('should return true if view record exists', async () => {
            let expectedViewData;
            await DB.knex.transaction(async (trx) => {
                expectedViewData = await seedOne({ trx });
                await trx.commit();
            });

            const exists = await repository.exists({
                transaction_uuid: expectedViewData.transaction_uuid
            }, {});

            expect(exists).toBe(true);
        });

        it('should return false if view record does not exist', async () => {
            const exists = await repository.exists({
                transaction_uuid: '00000000-0000-0000-0000-000000000000'
            }, {});

            expect(exists).toBe(false);
        });
    });

    describe('relations', () => {
        it('should load user relation', async () => {
            let expectedViewData;
            await DB.knex.transaction(async (trx) => {
                expectedViewData = await seedOne({ trx });
                await trx.commit();
            });

            const result = await repository.findOneWithRelations(
                { transaction_uuid: expectedViewData.transaction_uuid },
                '[user]'
            );

            expect(result.user).toBeDefined();
            expect(result.user.id).toBe(1);
        });

        it('should load account relation', async () => {
            let expectedViewData;
            await DB.knex.transaction(async (trx) => {
                expectedViewData = await seedOne({ trx });
                await trx.commit();
            });

            const result = await repository.findOneWithRelations(
                { transaction_uuid: expectedViewData.transaction_uuid },
                '[account]'
            );

            expect(result.account).toBeDefined();
            expect(result.account.id).toBe(expectedViewData.account_id);
            expect(result.account.userId).toBe(1);
        });

        it('should load paymentType relation', async () => {
            let expectedViewData;
            await DB.knex.transaction(async (trx) => {
                expectedViewData = await seedOne({ trx });
                await trx.commit();
            });

            const result = await repository.findOneWithRelations(
                { transaction_uuid: expectedViewData.transaction_uuid },
                '[paymentType]'
            );

            expect(result.paymentType).toBeDefined();
            expect(result.paymentType.id).toBe(expectedViewData.payment_type_id);
        });

        it('should load transactionType relation', async () => {
            let expectedViewData;
            await DB.knex.transaction(async (trx) => {
                expectedViewData = await seedOne({ trx });
                await trx.commit();
            });

            const result = await repository.findOneWithRelations(
                { transaction_uuid: expectedViewData.transaction_uuid },
                '[transactionType]'
            );

            expect(result.transactionType).toBeDefined();
            expect(result.transactionType.id).toBe(expectedViewData.transaction_type_id);
        });

        it('should load transaction relation', async () => {
            let expectedViewData;
            await DB.knex.transaction(async (trx) => {
                expectedViewData = await seedOne({ trx });
                await trx.commit();
            });

            const result = await repository.findOneWithRelations(
                { transaction_uuid: expectedViewData.transaction_uuid },
                '[transaction]'
            );

            expect(result.transaction).toBeDefined();
            expect(result.transaction.uuid).toBe(expectedViewData.transaction_uuid);
        });

        it('should load multiple relations', async () => {
            let expectedViewData;
            await DB.knex.transaction(async (trx) => {
                expectedViewData = await seedOne({ trx });
                await trx.commit();
            });

            const result = await repository.findOneWithRelations(
                { transaction_uuid: expectedViewData.transaction_uuid },
                '[user, account, paymentType, transactionType, transaction]'
            );

            expect(result.user).toBeDefined();
            expect(result.account).toBeDefined();
            expect(result.paymentType).toBeDefined();
            expect(result.transactionType).toBeDefined();
            expect(result.transaction).toBeDefined();
        });
    });
});
