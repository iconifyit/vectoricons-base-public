/* eslint-env jest */

jest.setTimeout(10000);

const AWS = require('aws-sdk');
const AWSMock = require('aws-sdk-mock');
const S3Service = require('../S3Service');

// Mock AWS SDK before importing services
AWSMock.setSDKInstance(AWS);

describe('S3Service Unit Tests (Mocked)', () => {
    afterEach(() => {
        AWSMock.restore();
    });

    describe('constructor', () => {
        it('should create an instance with default client', () => {
            const service = new S3Service();
            expect(service).toBeInstanceOf(S3Service);
            expect(service.client).toBeDefined();
        });

        it('should create an instance with provided client', () => {
            const mockClient = new AWS.S3();
            const customService = new S3Service(mockClient);
            expect(customService.client).toBe(mockClient);
        });
    });

    describe('fetch', () => {
        it('should fetch object from S3 successfully', async () => {
            const mockData = { Body: Buffer.from('test content') };
            AWSMock.mock('S3', 'getObject', (params, callback) => {
                callback(null, mockData);
            });

            const service = new S3Service();
            const result = await service.fetch('test-bucket', 'test-key.txt');

            expect(result).toEqual(mockData);
        });

        it('should throw error when fetch fails', async () => {
            AWSMock.mock('S3', 'getObject', (params, callback) => {
                callback(new Error('Access Denied'));
            });

            const service = new S3Service();
            await expect(service.fetch('test-bucket', 'test-key.txt'))
                .rejects.toThrow('Failed to fetch object from S3');
        });
    });

    describe('getObjectTags', () => {
        it('should fetch object tags successfully', async () => {
            const mockTags = {
                TagSet: [
                    { Key: 'Environment', Value: 'test' },
                    { Key: 'Owner', Value: 'admin' },
                ],
            };
            AWSMock.mock('S3', 'getObjectTagging', (params, callback) => {
                callback(null, mockTags);
            });

            const service = new S3Service();
            const result = await service.getObjectTags('test-bucket', 'test-key.txt');

            expect(result).toEqual(mockTags.TagSet);
            expect(result).toHaveLength(2);
        });

        it('should throw error when fetching tags fails', async () => {
            AWSMock.mock('S3', 'getObjectTagging', (params, callback) => {
                callback(new Error('NoSuchKey'));
            });

            const service = new S3Service();
            await expect(service.getObjectTags('test-bucket', 'test-key.txt'))
                .rejects.toThrow('Failed to fetch tags from S3');
        });
    });

    describe('getObjectMetadata', () => {
        it('should fetch object metadata successfully', async () => {
            const mockMetadata = {
                ContentLength: 1024,
                ContentType: 'text/plain',
                ETag: '"abc123"',
                LastModified: new Date('2024-01-01'),
            };
            AWSMock.mock('S3', 'headObject', (params, callback) => {
                callback(null, mockMetadata);
            });

            const service = new S3Service();
            const result = await service.getObjectMetadata('test-bucket', 'test-key.txt');

            expect(result).toEqual(mockMetadata);
            expect(result.ContentLength).toBe(1024);
        });

        it('should throw error when fetching metadata fails', async () => {
            AWSMock.mock('S3', 'headObject', (params, callback) => {
                callback(new Error('NotFound'));
            });

            const service = new S3Service();
            await expect(service.getObjectMetadata('test-bucket', 'test-key.txt'))
                .rejects.toThrow('Failed to fetch metadata from S3');
        });
    });

    describe('upload', () => {
        it('should upload object to S3 successfully', async () => {
            const mockResult = {
                Location: 'https://test-bucket.s3.amazonaws.com/test-key.txt',
                Bucket: 'test-bucket',
                Key: 'test-key.txt',
                ETag: '"abc123"',
            };
            AWSMock.mock('S3', 'upload', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new S3Service();
            const result = await service.upload('test-bucket', 'test-key.txt', 'test content');

            expect(result).toEqual(mockResult);
            expect(result.Location).toContain('test-bucket');
        });

        it('should throw error when upload fails', async () => {
            AWSMock.mock('S3', 'upload', (params, callback) => {
                callback(new Error('Upload failed'));
            });

            const service = new S3Service();
            await expect(service.upload('test-bucket', 'test-key.txt', 'test content'))
                .rejects.toThrow('Failed to upload object to S3');
        });
    });

    describe('headBucket', () => {
        it('should verify bucket exists successfully', async () => {
            const mockResult = {};
            AWSMock.mock('S3', 'headBucket', (params, callback) => {
                callback(null, mockResult);
            });

            const service = new S3Service();
            const result = await service.headBucket('test-bucket');

            expect(result).toEqual(mockResult);
        });

        it('should throw error when bucket does not exist', async () => {
            AWSMock.mock('S3', 'headBucket', (params, callback) => {
                callback(new Error('NoSuchBucket'));
            });

            const service = new S3Service();
            await expect(service.headBucket('nonexistent-bucket'))
                .rejects.toThrow('Failed to verify S3 bucket: nonexistent-bucket');
        });
    });
});
