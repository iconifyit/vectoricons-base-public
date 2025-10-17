'use strict';

const PaymentTypeService = require('./PaymentTypeService');
const PaymentTypeRepository = require('./PaymentTypeRepository');
const DB = require('@vectoricons.net/db');

/**
 * Initializes the PaymentTypeService with injected dependencies.
 * @returns {PaymentTypeService}
 */
const initPaymentTypeService = () => {
    return new PaymentTypeService({
        repository  : new PaymentTypeRepository({ DB }),
        entityClass : require('./PaymentTypeEntity'),
    });
};

module.exports = {
    PaymentTypeService,
    PaymentTypeRepository,
    initPaymentTypeService,
};