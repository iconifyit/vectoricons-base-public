const S3Service = require('./S3Service');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

/**
 * Initializes and returns an instance of S3Service.
 * @returns {S3Service}
 */
const initS3Service = () => {
    return new S3Service(
        new AWS.S3({ region: 'us-east-1' })
    );
}

module.exports = initS3Service;