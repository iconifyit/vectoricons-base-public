const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

/**
 * Service for interacting with AWS S3.
 */
class S3Service {

    #client;

    /**
     * Creates an instance of S3Service.
     * @param {AWS.S3} client - An instance of AWS.S3
     */
    constructor(client = new AWS.S3({ region: 'us-east-1' })) {
        this.client = client;
    }

    get client() {
        return this.#client;
    }

    set client(value) {
        this.#client = value;
    }

    async fetch(bucket, key) {
        try {
            const params = { Bucket: bucket, Key: key };
            const objectData = await this.client.getObject(params).promise();
            console.log(`Fetched object from S3: ${bucket}/${key}`);
            return objectData;
        } 
        catch (error) {
            console.error('Error fetching object from S3:', error);
            throw new Error('Failed to fetch object from S3');
        }
    }

    async getObjectTags(bucket, key) {
        try {
            const params = { Bucket: bucket, Key: key };
            const tags = await this.client.getObjectTagging(params).promise();
            console.log(`Fetched tags for object ${bucket}/${key}`);
            return tags.TagSet;
        } 
        catch (error) {
            console.error('Error fetching tags from S3:', error);
            throw new Error('Failed to fetch tags from S3');
        }
    }

    async getObjectMetadata(bucket, key) {
        try {
            const params = { Bucket: bucket, Key: key };
            const metadata = await this.client.headObject(params).promise();
            return metadata;
        } 
        catch (error) {
            console.error('Error fetching metadata from S3:', error);
            throw new Error('Failed to fetch metadata from S3');
        }
    }

    async upload(bucket, key, body) {
        try {
            const params = { Bucket: bucket, Key: key, Body: body };
            const uploadResult = await this.client.upload(params).promise();
            console.log(`Uploaded object to S3: ${bucket}/${key}`);
            return uploadResult;
        }
        catch (error) {
            console.error('Error uploading object to S3:', error);
            throw new Error('Failed to upload object to S3');
        }
    }

    async headBucket(bucket) {
        try {
            const params = { Bucket: bucket };
            const result = await this.client.headBucket(params).promise();
            console.log(`Verified S3 bucket exists: ${bucket}`);
            return result;
        }
        catch (error) {
            console.error(`Error verifying S3 bucket ${bucket}:`, error);
            throw new Error(`Failed to verify S3 bucket: ${bucket}`);
        }
    }
}

module.exports = S3Service;