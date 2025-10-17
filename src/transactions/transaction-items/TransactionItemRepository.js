'use strict';

const BaseRepository = require('../../common/BaseRepository');
const TransactionItemEntity = require('./TransactionItemEntity');

/**
 * @module Transactions Domain
 * @fileoverview TransactionItemRepository - Manages transaction items data.
 * @class TransactionItemRepository
 */
class TransactionItemRepository extends BaseRepository {
    constructor({ DB }) {
        super({ 
            DB : DB || require('@vectoricons.net/db'),
            modelName: 'transactionItems',
            entityClass: TransactionItemEntity,
        });
    }

    // async upsert(data) {
    //     const { transaction_id, entity_id, entity_type } = data;
    
    //     if (!transaction_id || !entity_id || !entity_type) {
    //         throw new Error('TransactionItem upsert requires transaction_id, entity_id, and entity_type');
    //     }
    
    //     const where = { transaction_id, entity_id, entity_type };
    //     const existing = await this.Table.query().findOne(where);
    
    //     if (existing) {
    //         await this.Table.query().findById(existing.id).patch(data);
    //         return await this.Table.query().findById(existing.id);
    //     } 
    //     return await this.Table.query().insert(data);
    // }
}

module.exports = TransactionItemRepository;