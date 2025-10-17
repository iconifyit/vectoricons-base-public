// Path : src/users/user-roles/UserToEmailsService.js
const DB = require('@vectoricons.net/db');
const BaseService = require('../../common/BaseService');
const PaymentTypeEntity = require('./PaymentTypeEntity');
const PaymentTypeRepository = require('./PaymentTypeRepository');

/**
 * @module Transactions Domain
 * @fileoverview PaymentTypeService - Service for managing payment types.
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