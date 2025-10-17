'use strict';

const BaseRepository = require('../common/BaseRepository.js');
const TransactionEntity = require('./TransactionEntity.js');
const PaymentTypeEntity = require('./payment-types/PaymentTypeEntity.js');
const TransactionTypeEntity = require('./transaction-types/TransactionTypeEntity.js');
const TransactionCategoryEntity = require('./transaction-categories/TransactionCategoryEntity.js');
const enums = require('../utils/enums.js');


/**
 * @module Transactions Domain
 * @fileoverview TransactionRepository - Manages transactions data.
 * @class TransactionRepository
 */
class TransactionRepository extends BaseRepository {
    /**
     * @constructor
     * @param {Object} DB
     * @returns {TransactionRepository}
     */
    constructor({ DB }) {
        super({ 
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'transactions',
            entityClass: TransactionEntity,
        });
    }

    /**
     * Get a transaction by ID and fetch related data.
     * @param {Number} transactionId - The transaction ID.
     * @returns {Object} - The transaction object.
     * @throws {Error} - If an error occurs.
     */
    async getTransactionWithItems(transactionId) {
        console.log('TransactionRepository.getTransactionWithItems transactionId', transactionId);
        const transaction = await this.Table.query()
            .findById(transactionId)
            .withGraphFetched('[transactionItems, couponCode, discounts]');

        const result = await this.DB.knex.raw(`
            SELECT json_build_object(
                'transaction_id', dte_transaction.entity_id,
                'original_price', dte_transaction.original_price,
                'discounted_price', dte_transaction.discounted_price,
                'discount_amount', dte_transaction.discount_amount,
                'discount_type', dte_transaction.discount_type,
                'items', COALESCE(json_agg(json_build_object(
                    'transaction_item_id', dte_items.entity_id,
                    'original_price', dte_items.original_price,
                    'discounted_price', dte_items.discounted_price,
                    'discount_amount', dte_items.discount_amount,
                    'discount_type', dte_items.discount_type
                )) FILTER (WHERE dte_items.id IS NOT NULL), '[]')
            ) AS discount_tree
            FROM discounts_to_entities dte_transaction
            LEFT JOIN discounts_to_entities dte_items
                ON dte_items.parent_id = dte_transaction.id
            WHERE dte_transaction.entity_type = 'transaction'
            AND dte_transaction.entity_id = ${transactionId}
            GROUP BY dte_transaction.id;
        `);
        transaction.discounts = result?.rows[0]?.discount_tree || null;
        return transaction;
    }

    /**
     * Get a transaction by user ID.
     * @param {Number} userId - The user ID.
     * @returns {Object} - The transaction object.
     * @throws {Error} - If an error occurs.
     */
    async getTransactionByUserId(userId) {
        const transaction = await this.Table.query().findOne({
            user_id: userId,
            status: enums.transactionStatus.NotProcessed,
        });
        return this.getTransactionWithItems(transaction.id);
    }

    /**
     * Update the totals of a transaction.
     * @param {Number} transactionId - The transaction ID.
     * @returns {Number} - The transaction total.
     * @throws {Error} - If an error occurs.
     */
    async updateTotals(transactionId) {
        const transactionTotals = await this.DB.transactionTotalsView.query().findById(transactionId);
        const transactionTotal = Number(transactionTotals?.total_price || 0);
        await this.Table.query()
            .findById(transactionId)
            .patch({
                subtotal: Number(transactionTotal.toFixed(2)),
                total: Number(transactionTotal.toFixed(2)),
            });
        return transactionTotal;
    }

    /**
     * Get discounts for a transaction item.
     * @param {Number} transactionItemId - The transaction item ID.
     * @returns {Object} - The discounts object.
     * @throws {Error} - If an error occurs.
     */
    async insertDiscount(data) {
        return this.DB.discountsToEntities.query().insert(data).returning('*');
    }

    /**
     * Upsert a discount for a transaction or transaction item.
     * @param {Object} data - The discount data.
     * @param {string} data.entity_type - The entity type (transaction or transaction_item).
     * @param {number} data.entity_id - The entity ID.
     * @param {number} data.coupon_code_id - The coupon code ID.
     * @returns {Object} - The upserted discount object.
     * @throws {Error} - If an error occurs.
     */
    async upsertDiscount(data) {
        const { entity_type, entity_id, coupon_code_id } = data;

        if (!entity_type || !entity_id || !coupon_code_id) {
            throw new Error('Discount upsert requires entity_type, entity_id, and coupon_code_id');
        }

        const where = { entity_type, entity_id, coupon_code_id };
        const existing = await this.DB.discountsToEntities.query().findOne(where);

        if (existing) {
            await this.DB.discountsToEntities.query().findById(existing.id).patch(data);
            return await this.DB.discountsToEntities.query().findById(existing.id);
        }
        return await this.DB.discountsToEntities.query().insert(data);
    }

    /**
     * Get discounts for a transaction or transaction_item.
     * @param {Number} transactionId - The transaction ID.
     * @param {Number} couponCodeId - The coupon code ID.
     * @returns {Object} - The discounts object.
     * @throws {Error} - If an error occurs.
     */
    async getDiscount({entityType, entityId, couponCodeId = null}) {
        const query = this.DB.discountsToEntities.query().where({
            entity_type: entityType,
            entity_id: entityId,
        });

        if (couponCodeId) {
            query.andWhere('coupon_code_id', couponCodeId);
        }

        return await query.first();
    }

    /**
     * Get discounts for a transaction item.
     * @param {Number} transactionItemId - The transaction item ID.
     * @returns {Object} - The discounts object.
     * @throws {Error} - If an error occurs.
     */
    async getDiscountsForEntities(entityType, entityIds, couponCodeId = null) {
        const query = this.DB.discountsToEntities.query()
            .where('entity_type', entityType);
    
        if (Array.isArray(entityIds)) {
            query.whereIn('entity_id', entityIds);
        } 
        else {
            query.where('entity_id', entityIds);
        }
    
        if (couponCodeId) {
            query.andWhere('coupon_code_id', couponCodeId);
        }
    
        return await query;
    }

    /**
     * Get all payment types.
     * @returns {Array.<PaymentTypeEntity>} - An array of payment type entities.
     * @throws {Error} - If an error occurs.
     */
    async getPaymentTypes() {
        const paymentTypes = await this.DB.paymentTypes.query();
        const entities = [];
        for (const paymentType of paymentTypes) {
            const entity = new PaymentTypeEntity(paymentType);
            entities.push(entity);
        }
        return entities;
    }

    /**
     * Get all transaction types.
     * @returns {Array.<TransactionTypeEntity>} - An array of transaction type entities.
     * @throws {Error} - If an error occurs.
     */
    async getTransactionTypes() {
        const transactionTypes = await this.DB.transactionTypes.query();
        const entities = [];
        for (const transactionType of transactionTypes) {
            const entity = new TransactionTypeEntity(transactionType);
            entities.push(entity);
        }
        return entities;
    }

    /**
     * Get all transaction categories.
     * @returns {Array.<TransactionCategoryEntity>} - An array of transaction category entities.
     * @throws {Error} - If an error occurs.
     */
    async getTransactionCategories() {
        const transactionCategories = await this.DB.transactionCategories.query();
        const entities = [];
        for (const transactionCategory of transactionCategories) {
            const entity = new TransactionCategoryEntity(transactionCategory);
            entities.push(entity);
        }
        return entities;
    }

    #getTransactionDataQuery({ transactionId, orderId, cartId }) {
        let whereClause = '';

        if (transactionId) {
            whereClause = `o.id IN (
                SELECT t.order_id FROM transactions t WHERE t.id = ${Number(transactionId)}
            )`;
        } 
        else if (orderId) {
            whereClause = `o.id = ${Number(orderId)}`;
        } 
        else if (cartId) {
            whereClause = `o.cart_id = ${Number(cartId)}`;
        } 
        else {
            throw new Error('Must provide one of: transactionId, orderId, or cartId');
        }

        return `
            WITH transaction_data AS (
                SELECT 
                    t.id, 
                    o.id AS td_order_id,
                    c.id AS cart_id, 
                    t.amount, 
                    t.order_id, 
                    t.created_at, 
                    tc.label AS category, 
                    pt.type AS payment_type
                FROM transactions t
                LEFT JOIN orders o ON o.id = t.order_id 
                LEFT JOIN transaction_categories tc ON tc.id = t.transaction_category_id 
                LEFT JOIN payment_types pt ON pt.id = t.payment_type_id
                LEFT JOIN carts c ON c.id = o.cart_id
                LEFT JOIN transaction_items ti ON ti.transaction_id = t.id 
            )
            SELECT json_build_object(
                'date', o.created_at,
                'cart', json_build_object(
                    'id', c.id,
                    'user_id', c.user_id,
                    'subtotal', c.subtotal,
                    'total', c.total,
                    'status', c.status,
                    'created_at', c.created_at,
                    'updated_at', c.updated_at,
                    'cart_items', COALESCE((
                        SELECT json_agg(json_build_object(
                            'id', ci.id,
                            'cart_id', ci.cart_id,
                            'entity_type', ci.entity_type,
                            'entity_id', ci.entity_id,
                            'created_at', ci.created_at,
                            'updated_at', ci.updated_at,
                            'price', ci.price
                        ))
                        FROM cart_items ci
                        WHERE ci.cart_id = c.id
                    ), '[]')
                ),
                'order', json_build_object(
                    'id', o.id,
                    'cart_id', o.cart_id, 
                    'total_amount', o.total_amount,
                    'created_at', o.created_at,
                    'updated_at', o.updated_at,
                    'order_items', (
                        SELECT json_agg(json_build_object(
                            'id', oi.id,
                            'order_id', oi.order_id, 
                            'entity_type', oi.entity_type, 
                            'entity_id', oi.entity_id, 
                            'cart_item_id', oi.cart_item_id,
                            'created_at', oi.created_at, 
                            'updated_at', oi.updated_at,
                            'amount', oi.amount,
                            'entity_name', (
                                CASE 
                                    WHEN oi.entity_type = 'illustration' THEN (
                                        SELECT illustrations.name 
                                        FROM illustrations 
                                        WHERE illustrations.id = oi.entity_id
                                    )
                                    WHEN oi.entity_type = 'icon' THEN (
                                        SELECT icons.name 
                                        FROM icons 
                                        WHERE icons.id = oi.entity_id
                                    )
                                    ELSE NULL
                                END
                            )
                        ))
                        FROM order_items oi 
                        WHERE oi.order_id = o.id
                    )
                ),
                'transactions', (
                    SELECT json_agg(json_build_object(
                        'id', t.id,
                        'amount', t.amount,
                        'payment_type_id', t.payment_type_id,
                        'transaction_category_id', t.transaction_category_id, 
                        'created_at', t.created_at, 
                        'updated_at', t.updated_at,
                        'transaction_items', (
                            SELECT json_agg(json_build_object(
                                'id', ti.id,
                                'transaction_id', ti.transaction_id, 
                                'transaction_type_id', ti.transaction_type_id, 
                                'payment_type_id', ti.payment_type_id, 
                                'order_item_id', ti.order_item_id, 
                                'account_id', ti.account_id, 
                                'amount', coalesce(ti.amount, 0),
                                'commission_amount', coalesce(ti.commission_amount, 0),
                                'memo', ti.memo,
                                'created_at', ti.created_at, 
                                'updated_at', ti.updated_at
                            ))
                            FROM transaction_items ti 
                            WHERE ti.transaction_id = t.id
                        )
                    ))
                    FROM transactions t 
                    WHERE t.order_id = o.id
                )
            )
            FROM orders o
            JOIN carts c ON c.id = o.cart_id
            WHERE ${whereClause}
            ORDER BY o.created_at DESC;
        `;
    }

    /**
     * Get transaction data by transaction ID.
     * @param {Number} transactionId - The transaction ID.
     * @returns {Object} - The transaction data.
     * @throws {Error} - If an error occurs.
     */
    getTransactionDataByTransactionId(transactionId) {
        const query = this.#getTransactionDataQuery({ transactionId });
        return this.DB.knex.raw(query);
    }

    /**
     * Get transaction data by order ID.
     * @param {Number} orderId - The order ID.
     * @returns {Object} - The transaction data.
     * @throws {Error} - If an error occurs.
     */
    getTransactionDataByOrderId(orderId) {
        const query = this.#getTransactionDataQuery({ orderId });
        return this.DB.knex.raw(query);
    }

    /**
     * Get transaction data by cart ID.
     * @param {Number} cartId - The cart ID.
     * @returns {Object} - The transaction data.
     * @throws {Error} - If an error occurs.
     */
    getTransactionDataByCartId(cartId) {
        const query = this.#getTransactionDataQuery({ cartId });
        return this.DB.knex.raw(query);
    }

}

module.exports = TransactionRepository;