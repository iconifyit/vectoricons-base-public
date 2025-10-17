
'use strict';

const BaseRepository = require('../../common/BaseRepository');
const PaymentTypeEntity = require('./PaymentTypeEntity');

/**
 * PaymentTypeRepository class
 * @class PaymentTypeRepository
 * @description This class is responsible for managing payment types data.
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