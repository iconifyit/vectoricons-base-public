const SNSService = require('./SNSService');
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Initializes and returns an instance of SNSService.
 * @returns {SNSService}
 */
const initSNSService = () => {
    return new SNSService(
        new AWS.SNS({ region: 'us-east-1' })
    );
}

module.exports = initSNSService;