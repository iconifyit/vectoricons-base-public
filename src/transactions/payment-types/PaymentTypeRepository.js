
'use strict';

const BaseRepository = require('../../common/BaseRepository');
const PaymentTypeEntity = require('./PaymentTypeEntity');

/**
 * @module Transactions Domain
 * @fileoverview PaymentTypeRepository - Manages payment types data.
 * @class PaymentTypeRepository
 */
class PaymentTypeRepository extends BaseRepository {
    constructor({ DB }) {
        super({
            DB : DB || require('@vectoricons.net/db'),
            modelName   : 'paymentTypes',
            entityClass : PaymentTypeEntity,
        });
    }
}

module.exports = PaymentTypeRepository;