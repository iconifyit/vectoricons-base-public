const DB = require('@vectoricons.net/db');

const SetEntity = require('./SetEntity.js');
const SetRepository = require('./SetRepository.js');
const SetService = require('./SetService.js');

const initSetService = () => {
    return new SetService({
        repository: new SetRepository({ DB }),
        entityClass: SetEntity,
    });
};

module.exports.initSetService = initSetService;