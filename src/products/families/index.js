const DB = require('@vectoricons.net/db');

const FamilyEntity = require('./FamilyEntity.js');
const FamilyRepository = require('./FamilyRepository.js');
const FamilyService = require('./FamilyService.js');

const initFamilyService = () => {
    return new FamilyService({
        repository: new FamilyRepository({ DB }),
        entityClass: FamilyEntity,
    });
};

module.exports.initFamilyService = initFamilyService;