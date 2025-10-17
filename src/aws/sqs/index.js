const SQSService = require('./SQSService');
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Initializes and returns an instance of SQSService.
 * @returns {SQSService}
 */
const initSQSService = () => {
    return new SQSService(
        new AWS.SQS({ apiVersion: '2012-11-05' })
    );
}

module.exports = initSQSService;