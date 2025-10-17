/* eslint-env jest */

jest.setTimeout(10000);

const SNSService = require('../SNSService');
const fixtures = require('../../__tests__/fixtures');

describe('SNSService Integration Tests (Real AWS)', () => {
    let service;

    beforeAll(() => {
        service = new SNSService();
    });

    describe('getTopicAttributes - Verify topics exist', () => {
        const topics = fixtures.sns.topics;

        if (topics.length === 0) {
            it.skip('No SNS topics configured in environment variables', () => {});
            return;
        }

        topics.forEach((topicArn) => {
            it(`should verify topic exists: ${topicArn}`, async () => {
                const result = await service.getTopicAttributes(topicArn);

                // getTopicAttributes returns attributes object
                expect(result).toBeDefined();
                expect(result.Attributes).toBeDefined();
                expect(result.Attributes.TopicArn).toBe(topicArn);
            });
        });

        it('should throw error for non-existent topic', async () => {
            const nonExistentTopic = 'arn:aws:sns:us-east-1:123456789012:nonexistent-topic-' + Date.now();

            await expect(service.getTopicAttributes(nonExistentTopic))
                .rejects.toThrow();
        });
    });
});
