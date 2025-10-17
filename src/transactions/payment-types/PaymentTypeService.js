// Path : src/users/user-roles/UserToEmailsService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const PaymentTypeEntity = require('./PaymentTypeEntity');
const PaymentTypeRepository = require('./PaymentTypeRepository');

/**
 * Service class for managing payment types.
 * Extends BaseService to include common service functionality.
 * @see {@link ../../../refs/db-models/payment-types.js} Objection.js model for payment-types
 */
class PaymentTypeService extends BaseService {
    constructor({ 
        repository = new PaymentTypeRepository({ DB }), 
        entityClass = PaymentTypeEntity 
    } = {}) {
        super({ repository, entityClass });
    }
}

module.exports = PaymentTypeService;