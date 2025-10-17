const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * SNSService provides methods to interact with AWS SNS.
 */
class SNSService {
    #client;

    /**
     * Creates an instance of SNSService.
     * @param {AWS.SNS} snsClient - An instance of AWS.SNS
     */
    constructor(client = new AWS.SNS({ region: 'us-east-1' })) {
        this.#client = client;
    }

    get client() {
        return this.#client;
    }

    set client(value) {
        this.#client = value;
    }

    /**
     * Publish a message to the specified SNS topic.
     * @param {string} topicArn - The ARN of the SNS topic.
     * @param {Object} messageBody - The message body to publish.
     * @returns {Promise<Object>} - The result from SNS.
     */
    async publishMessage(topicArn, messageBody) {
        try {
            const result = await this.client.publish({
                TopicArn : topicArn,
                Message  : JSON.stringify(messageBody),
            }).promise();

            console.log('Message published to SNS', result);
            
            return result;
        } 
        catch (error) {
            console.error('Error publishing message to SNS:', error);
            throw new Error('Failed to publish message to SNS');
        }
    }

    /**
     * Subscribe an endpoint to the specified SNS topic.
     * @param {string} topicArn - The ARN of the SNS topic.
     * @param {string} protocol - The protocol of the endpoint (e.g., 'email', 'sms', 'lambda', etc.).
     * @param {string} endpoint - The endpoint to subscribe (e.g., email address, phone number, Lambda ARN, etc.).
     * @returns {Promise<Object>} - The result from SNS.
     */
    async subscribe(topicArn, protocol, endpoint) {
        try {
            const result = await this.client.subscribe({
                TopicArn : topicArn,
                Protocol : protocol,
                Endpoint : endpoint,
            }).promise();

            console.log('Subscription created for SNS topic', result);
            
            return result;
        } 
        catch (error) {
            console.error('Error subscribing to SNS topic:', error);
            throw new Error('Failed to subscribe to SNS topic');
        }
    }

    /**
     * Unsubscribe an endpoint from the specified SNS topic.
     * @param {string} subscriptionArn - The ARN of the subscription to unsubscribe.
     * @returns {Promise<Object>} - The result from SNS.
     */
    async unsubscribe(subscriptionArn) {
        try {
            const result = await this.client.unsubscribe({
                SubscriptionArn : subscriptionArn,
            }).promise();

            console.log('Unsubscribed from SNS topic', result);

            return result;
        }
        catch (error) {
            console.error('Error unsubscribing from SNS topic:', error);
            throw new Error('Failed to unsubscribe from SNS topic');
        }
    }

    /**
     * Get attributes for the specified SNS topic to verify it exists.
     * @param {string} topicArn - The ARN of the SNS topic.
     * @returns {Promise<Object>} - The topic attributes.
     */
    async getTopicAttributes(topicArn) {
        try {
            const result = await this.client.getTopicAttributes({
                TopicArn : topicArn,
            }).promise();

            console.log('Verified SNS topic exists', result);

            return result;
        }
        catch (error) {
            console.error('Error getting SNS topic attributes:', error);
            throw new Error('Failed to get SNS topic attributes');
        }
    }
}

module.exports = SNSService;