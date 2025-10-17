/* eslint-env jest */

jest.setTimeout(10000);

const SQSService = require('../SQSService');
const fixtures = require('../../__tests__/fixtures');

describe('SQSService Integration Tests (Real AWS)', () => {
    let service;

    beforeAll(() => {
        service = new SQSService();
    });

    describe('countMessages - Verify queues exist', () => {
        const queues = fixtures.sqs.queues;

        if (queues.length === 0) {
            it.skip('No SQS queues configured in environment variables', () => {});
            return;
        }

        queues.forEach((queueUrl) => {
            it(`should verify queue exists and count messages: ${queueUrl}`, async () => {
                const result = await service.countMessages(queueUrl);

                // countMessages returns a number (0 or more)
                expect(typeof result).toBe('number');
                expect(result).toBeGreaterThanOrEqual(0);
            });
        });

        it('should throw error for non-existent queue', async () => {
            const nonExistentQueue = 'https://sqs.us-east-1.amazonaws.com/123456789012/nonexistent-queue-' + Date.now();

            await expect(service.countMessages(nonExistentQueue))
                .rejects.toThrow();
        });
    });
});
