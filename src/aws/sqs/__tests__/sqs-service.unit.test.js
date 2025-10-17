/* eslint-env jest */

jest.setTimeout(10000);

const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');
const SQSService = require('../SQSService');

// Mock AWS SDK before importing services
AWSMock.setSDKInstance(AWS);

describe('SQSService Unit Tests (Mocked)', () => {
    afterEach(() => {
        AWSMock.restore();
    });

    describe('constructor', () => {
        it('should create an instance with default client', () => {
            const service = new SQSService();
            expect(service).toBeInstanceOf(SQSService);
            expect(service.client).toBeDefined();
        });

        it('should create an instance with provided client', () => {
            const mockClient = new AWS.SQS();
            const customService = new SQSService(mockClient);
            expect(customService.client).toBe(mockClient);
        });
    });

    describe('sendMessage', () => {
        it('should send message to SQS queue successfully', async () => {
            const mockResult = {
                MessageId: '12345-abcde-67890',
                MD5OfMessageBody: 'abc123def456',
            };
            AWSMock.mock('SQS', 'sendMessage', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
            const messageBody = { event: 'test', data: 'sample data' };

            const result = await service.sendMessage(queueUrl, messageBody);

            expect(result).toEqual(mockResult);
            expect(result.MessageId).toBeDefined();
        });

        it('should throw error when send fails', async () => {
            AWSMock.mock('SQS', 'sendMessage', (params, callback) => {
                callback(new Error('InvalidParameterValue'));
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
            const messageBody = { event: 'test' };

            await expect(service.sendMessage(queueUrl, messageBody))
                .rejects.toThrow('Failed to send message to SQS');
        });
    });

    describe('receiveMessages', () => {
        it('should receive messages from SQS queue successfully', async () => {
            const mockResult = {
                Messages: [
                    {
                        MessageId: '12345',
                        ReceiptHandle: 'handle-12345',
                        Body: JSON.stringify({ event: 'test1' }),
                    },
                    {
                        MessageId: '67890',
                        ReceiptHandle: 'handle-67890',
                        Body: JSON.stringify({ event: 'test2' }),
                    },
                ],
            };
            AWSMock.mock('SQS', 'receiveMessage', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';

            const result = await service.receiveMessages(queueUrl, 2);

            expect(result).toEqual(mockResult.Messages);
            expect(result).toHaveLength(2);
        });

        it('should return empty array when no messages available', async () => {
            const mockResult = {}; // No Messages property
            AWSMock.mock('SQS', 'receiveMessage', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';

            const result = await service.receiveMessages(queueUrl);

            expect(result).toEqual([]);
        });

        it('should throw error when receive fails', async () => {
            AWSMock.mock('SQS', 'receiveMessage', (params, callback) => {
                callback(new Error('QueueDoesNotExist'));
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';

            await expect(service.receiveMessages(queueUrl))
                .rejects.toThrow('Failed to receive messages from SQS');
        });
    });

    describe('deleteMessage', () => {
        it('should delete message from SQS queue successfully', async () => {
            const mockResult = {};
            AWSMock.mock('SQS', 'deleteMessage', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
            const receiptHandle = 'handle-12345';

            const result = await service.deleteMessage(queueUrl, receiptHandle);

            expect(result).toEqual(mockResult);
        });

        it('should throw error when delete fails', async () => {
            AWSMock.mock('SQS', 'deleteMessage', (params, callback) => {
                callback(new Error('ReceiptHandleIsInvalid'));
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
            const receiptHandle = 'invalid-handle';

            await expect(service.deleteMessage(queueUrl, receiptHandle))
                .rejects.toThrow('Failed to delete message from SQS');
        });
    });

    describe('countMessages', () => {
        it('should count messages in SQS queue successfully', async () => {
            const mockResult = {
                Attributes: {
                    ApproximateNumberOfMessages: '42',
                },
            };
            AWSMock.mock('SQS', 'getQueueAttributes', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';

            const result = await service.countMessages(queueUrl);

            expect(result).toBe(42);
        });

        it('should return 0 when no messages in queue', async () => {
            const mockResult = {
                Attributes: {
                    ApproximateNumberOfMessages: '0',
                },
            };
            AWSMock.mock('SQS', 'getQueueAttributes', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';

            const result = await service.countMessages(queueUrl);

            expect(result).toBe(0);
        });

        it('should throw error when count fails', async () => {
            AWSMock.mock('SQS', 'getQueueAttributes', (params, callback) => {
                callback(new Error('QueueDoesNotExist'));
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';

            await expect(service.countMessages(queueUrl))
                .rejects.toThrow('Failed to count messages in SQS');
        });
    });

    describe('purgeQueue', () => {
        it('should purge SQS queue successfully', async () => {
            const mockResult = {};
            AWSMock.mock('SQS', 'purgeQueue', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';

            const result = await service.purgeQueue(queueUrl);

            expect(result).toEqual(mockResult);
        });

        it('should throw error when purge fails', async () => {
            AWSMock.mock('SQS', 'purgeQueue', (params, callback) => {
                callback(new Error('PurgeQueueInProgress'));
            });

            const service = new SQSService();
            const queueUrl = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';

            await expect(service.purgeQueue(queueUrl))
                .rejects.toThrow('Failed to purge SQS queue');
        });
    });
});
