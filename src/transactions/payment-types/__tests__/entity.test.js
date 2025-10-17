/* eslint-env jest */

const DB = require('@vectoricons.net/db');
const PaymentTypeEntity = require('../PaymentTypeEntity');
const entityContract = require('../../../__tests__/contracts/entity.contract');
const enums = require('../../../utils/enums');

let testCounter = 0;

const seedOne = () => {
    testCounter++;
    return {
        id: testCounter,
        type: enums.paymentType.PREPAID_CREDITS,
        description: `Test payment type ${testCounter}`,
    };
};

const makeRelations = () => {
    return {
        transaction: null,
    };
};

const updateOne = (entity) => {
    return {
        description: entity.description + ' updated',
    };
};

entityContract({
    name: 'PaymentType',
    Model: DB.paymentTypes,
    Entity: PaymentTypeEntity,
    seedOne: seedOne,
    makeRelations: makeRelations,
    updateOne: updateOne,
});
