const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

// const s3 = new AWS.S3({ region: 'us-east-1' });
// const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

class SQSService {
    #client;

    /**
     * Creates an instance of SQSService.
     * @param {AWS.SQS} sqsClient - An instance of AWS.SQS
     */
    constructor(client = new AWS.SQS({ region: 'us-east-1' })) {
        this.#client = client;
    }

    get client() {
        return this.#client;
    }

    set client(value) {
        this.#client = value;
    }

    /**
     * Send a message to the specified SQS queue.
     * @param {string} queueUrl - The URL of the SQS queue.
     * @param {Object} messageBody - The message body to send.
     * @returns {Promise<Object>} - The result from SQS.
     */
    async sendMessage(queueUrl, messageBody) {
        try {
            const result = await this.client.sendMessage({
                QueueUrl    : queueUrl,
                MessageBody : JSON.stringify(messageBody),
            }).promise();

            console.log('Message sent to SQS', result);
            
            return result;
        } 
        catch (error) {
            console.error('Error sending message to SQS:', error);
            throw new Error('Failed to send message to SQS');
        }
    }

    /**
     * Receive messages from the specified SQS queue.
     * @param {string} queueUrl - The URL of the SQS queue.
     * @param {number} [maxNumberOfMessages=1] - Max number of messages to retrieve.
     * @returns {Promise<Array>} - Array of messages received.
     */
    async receiveMessages(queueUrl, maxNumberOfMessages = 1) {
        try {
            const result = await this.client.receiveMessage({
                QueueUrl              : queueUrl,
                MaxNumberOfMessages   : maxNumberOfMessages,
                WaitTimeSeconds       : 10, // Long polling
            }).promise();

            console.log('Messages received from SQS', result);
            
            return result.Messages || [];
        } 
        catch (error) {
            console.error('Error receiving messages from SQS:', error);
            throw new Error('Failed to receive messages from SQS');
        }
    }

    /**
     * Delete a message from the specified SQS queue.
     * @param {string} queueUrl - The URL of the SQS queue.
     * @param {string} receiptHandle - The receipt handle of the message to delete.
     * @returns {Promise<Object>} - The result from SQS.
     */
    async deleteMessage(queueUrl, receiptHandle) {
        try {
            const result = await this.client.deleteMessage({
                QueueUrl      : queueUrl,
                ReceiptHandle : receiptHandle,
            }).promise();

            console.log('Message deleted from SQS', result);
            
            return result;
        } 
        catch (error) {
            console.error('Error deleting message from SQS:', error);
            throw new Error('Failed to delete message from SQS');
        }
    }

    /**
     * Count the approximate number of messages in the specified SQS queue.
     * @param {string} queueUrl - The URL of the SQS queue.
     * @returns {Promise<number>} - The approximate number of messages.
     */
    async countMessages(queueUrl) {
        try {
            const result = await this.client.getQueueAttributes({
                QueueUrl       : queueUrl,
                AttributeNames : ['ApproximateNumberOfMessages'],
            }).promise();

            const count = parseInt(result.Attributes.ApproximateNumberOfMessages, 10) || 0;

            console.log(`Approximate number of messages in SQS queue: ${count}`);
            
            return count;
        } 
        catch (error) {
            console.error('Error counting messages in SQS:', error);
            throw new Error('Failed to count messages in SQS');
        }
    }

    /**
     * Purge all messages from the specified SQS queue.
     * @param {string} queueUrl - The URL of the SQS queue.
     * @returns {Promise<Object>} - The result from SQS.
     */
    async purgeQueue(queueUrl) {
        try {
            const result = await this.client.purgeQueue({
                QueueUrl : queueUrl,
            }).promise();

            console.log('SQS queue purged', result);
            
            return result;
        } 
        catch (error) {
            console.error('Error purging SQS queue:', error);
            throw new Error('Failed to purge SQS queue');
        }
    }
}

module.exports = SQSService;