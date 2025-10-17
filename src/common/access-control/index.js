const AccessControlService = require('./AccessControlService');

const initAccessControlService = (opts) => {
    return new AccessControlService(opts);
}

module.exports = { AccessControlService, initAccessControlService };