/* eslint-env jest */

jest.setTimeout(10000);

const S3Service = require('../S3Service');
const fixtures = require('../../__tests__/fixtures');

describe('S3Service Integration Tests (Real AWS)', () => {
    let service;

    beforeAll(() => {
        service = new S3Service();
    });

    describe('headBucket - Verify buckets exist', () => {
        const buckets = fixtures.s3.buckets;

        if (buckets.length === 0) {
            it.skip('No S3 buckets configured in environment variables', () => {});
            return;
        }

        buckets.forEach((bucket) => {
            it(`should verify bucket exists: ${bucket}`, async () => {
                const result = await service.headBucket(bucket);

                // headBucket returns empty object on success
                expect(result).toBeDefined();
            });
        });

        it('should throw error for non-existent bucket', async () => {
            const nonExistentBucket = 'vectoricons-nonexistent-bucket-' + Date.now();

            await expect(service.headBucket(nonExistentBucket))
                .rejects.toThrow();
        });
    });
});
