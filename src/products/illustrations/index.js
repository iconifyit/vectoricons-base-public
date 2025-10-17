const DB = require('@vectoricons.net/db');

const IllustrationEntity = require('./IllustrationEntity.js');
const IllustrationRepository = require('./IllustrationRepository.js');
const IllustrationService = require('./IllustrationService.js');

const initIllustrationService = () => {
    return new IllustrationService({
        repository: new IllustrationRepository({ DB }),
        entityClass: IllustrationEntity,
    });
};

module.exports.initIllustrationService = initIllustrationService;
