/* eslint-env jest */

jest.setTimeout(10000);

const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');
const SNSService = require('../SNSService');

// Mock AWS SDK before importing services
AWSMock.setSDKInstance(AWS);

describe('SNSService Unit Tests (Mocked)', () => {
    afterEach(() => {
        AWSMock.restore();
    });

    describe('constructor', () => {
        it('should create an instance with default client', () => {
            const service = new SNSService();
            expect(service).toBeInstanceOf(SNSService);
            expect(service.client).toBeDefined();
        });

        it('should create an instance with provided client', () => {
            const mockClient = new AWS.SNS();
            const customService = new SNSService(mockClient);
            expect(customService.client).toBe(mockClient);
        });
    });

    describe('publishMessage', () => {
        it('should publish message to SNS topic successfully', async () => {
            const mockResult = {
                MessageId: '12345-abcde-67890',
            };
            AWSMock.mock('SNS', 'publish', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SNSService();
            const topicArn = 'arn:aws:sns:us-east-1:123456789012:test-topic';
            const messageBody = { event: 'test', data: 'sample data' };

            const result = await service.publishMessage(topicArn, messageBody);

            expect(result).toEqual(mockResult);
            expect(result.MessageId).toBeDefined();
        });

        it('should throw error when publish fails', async () => {
            AWSMock.mock('SNS', 'publish', (params, callback) => {
                callback(new Error('InvalidParameter'));
            });

            const service = new SNSService();
            const topicArn = 'arn:aws:sns:us-east-1:123456789012:test-topic';
            const messageBody = { event: 'test' };

            await expect(service.publishMessage(topicArn, messageBody))
                .rejects.toThrow('Failed to publish message to SNS');
        });
    });

    describe('subscribe', () => {
        it('should subscribe to SNS topic successfully', async () => {
            const mockResult = {
                SubscriptionArn: 'arn:aws:sns:us-east-1:123456789012:test-topic:uuid',
            };
            AWSMock.mock('SNS', 'subscribe', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SNSService();
            const topicArn = 'arn:aws:sns:us-east-1:123456789012:test-topic';
            const protocol = 'email';
            const endpoint = 'test@example.com';

            const result = await service.subscribe(topicArn, protocol, endpoint);

            expect(result).toEqual(mockResult);
            expect(result.SubscriptionArn).toBeDefined();
        });

        it('should throw error when subscribe fails', async () => {
            AWSMock.mock('SNS', 'subscribe', (params, callback) => {
                callback(new Error('InvalidParameter'));
            });

            const service = new SNSService();
            const topicArn = 'arn:aws:sns:us-east-1:123456789012:test-topic';

            await expect(service.subscribe(topicArn, 'email', 'invalid'))
                .rejects.toThrow('Failed to subscribe to SNS topic');
        });
    });

    describe('unsubscribe', () => {
        it('should unsubscribe from SNS topic successfully', async () => {
            const mockResult = {};
            AWSMock.mock('SNS', 'unsubscribe', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SNSService();
            const subscriptionArn = 'arn:aws:sns:us-east-1:123456789012:test-topic:uuid';

            const result = await service.unsubscribe(subscriptionArn);

            expect(result).toEqual(mockResult);
        });

        it('should throw error when unsubscribe fails', async () => {
            AWSMock.mock('SNS', 'unsubscribe', (params, callback) => {
                callback(new Error('NotFound'));
            });

            const service = new SNSService();
            const subscriptionArn = 'arn:aws:sns:us-east-1:123456789012:test-topic:uuid';

            await expect(service.unsubscribe(subscriptionArn))
                .rejects.toThrow('Failed to unsubscribe from SNS topic');
        });
    });

    describe('getTopicAttributes', () => {
        it('should get topic attributes successfully', async () => {
            const mockResult = {
                Attributes: {
                    TopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
                    DisplayName: 'Test Topic',
                    SubscriptionsConfirmed: '5',
                    SubscriptionsPending: '2',
                },
            };
            AWSMock.mock('SNS', 'getTopicAttributes', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SNSService();
            const topicArn = 'arn:aws:sns:us-east-1:123456789012:test-topic';

            const result = await service.getTopicAttributes(topicArn);

            expect(result).toEqual(mockResult);
            expect(result.Attributes).toBeDefined();
        });

        it('should throw error when topic does not exist', async () => {
            AWSMock.mock('SNS', 'getTopicAttributes', (params, callback) => {
                callback(new Error('NotFound'));
            });

            const service = new SNSService();
            const topicArn = 'arn:aws:sns:us-east-1:123456789012:nonexistent-topic';

            await expect(service.getTopicAttributes(topicArn))
                .rejects.toThrow('Failed to get SNS topic attributes');
        });
    });
});
