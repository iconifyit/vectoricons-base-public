/* eslint-env jest */

const PaymentTypeRepository = require('../PaymentTypeRepository');
const PaymentTypeEntity = require('../PaymentTypeEntity');
const repositoryContract = require('../../../__tests__/contracts/repository.contract');
const { seedOne, seedMany } = require('./seed');


const initRepository = () => {
    return new PaymentTypeRepository({
        DB : require('@vectoricons.net/db'),
    });
};

repositoryContract({
    name                : 'PaymentType',
    modelName           : 'paymentTypes',
    initRepository      : initRepository,
    Entity              : PaymentTypeEntity,
    seedOne             : seedOne,
    seedMany            : seedMany,
    whereForUnique      : (data) => {
        if (data.id) {
            return { id: data.id };
        }
        return {
            type : data.type
        };
    },
    whereForExisting    : (data) => {
        return {
            id : data.id
        };
    },
    supportsRelations: true,
    supportsFindAll: true,
    supportsPaginate: true,
    supportsExists: true
});
