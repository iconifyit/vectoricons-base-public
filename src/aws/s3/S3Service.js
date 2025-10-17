/**
 * @fileoverview S3Service - AWS S3 integration for file storage and retrieval.
 *
 * This service provides a clean abstraction over AWS S3 SDK for common file operations
 * used in the VectorIcons platform. Handles 750,000+ icon assets stored in S3 buckets
 * with CloudFront CDN distribution.
 *
 * **Production Use Cases:**
 * - Storing SVG source files for icons
 * - Storing generated image previews (PNG, WebP, etc.)
 * - Metadata storage for image processing pipelines
 * - CloudFront origin for global CDN delivery
 *
 * **Design Patterns:**
 * - Dependency injection (pass AWS.S3 client to constructor)
 * - Error wrapping (AWS errors → application errors)
 * - Promise-based API (not callbacks)
 * - Private client field (encapsulation)
 *
 * **Architecture Integration:**
 * ```
 * Lambda Functions (image processing)
 *      ↓
 * S3Service (this layer)
 *      ↓
 * AWS S3 SDK
 *      ↓
 * S3 Buckets → CloudFront CDN → Users
 * ```
 *
 * @example
 * // Basic usage
 * const s3 = new S3Service();
 *
 * // Upload icon SVG
 * await s3.upload('vectoricons-assets', 'icons/home.svg', svgBuffer);
 *
 * // Fetch for processing
 * const { Body } = await s3.fetch('vectoricons-assets', 'icons/home.svg');
 *
 * // Get metadata
 * const metadata = await s3.getObjectMetadata('vectoricons-assets', 'icons/home.svg');
 * console.log(metadata.ContentType); // 'image/svg+xml'
 *
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html AWS S3 SDK Documentation}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

/**
 * S3 service class providing file storage operations.
 *
 * Wraps AWS S3 SDK with application-specific error handling and logging.
 * Uses dependency injection for testability (pass mock S3 client in tests).
 *
 * **Key Features:**
 * - Upload files to S3 buckets
 * - Fetch files for processing
 * - Get object metadata (size, content-type, etc.)
 * - Get object tags (categorization, lifecycle rules)
 * - Verify bucket existence
 *
 * **Production Deployment:**
 * - Credentials via IAM roles (Lambda execution role)
 * - Bucket policies enforce encryption at rest
 * - CloudFront sits in front for global delivery
 * - S3 lifecycle policies move old files to Glacier
 *
 * @class S3Service
 */
class S3Service {

    #client;

    /**
     * Construct S3Service with AWS S3 client.
     *
     * Uses dependency injection to allow mocking in tests. In production,
     * credentials come from IAM role attached to Lambda execution role.
     *
     * @param {AWS.S3} [client] - AWS S3 client instance (default: new S3 client with us-east-1)
     *
     * @example
     * // Production usage (default client)
     * const s3 = new S3Service();
     *
     * @example
     * // Testing with mock client
     * const mockS3 = {
     *   getObject: jest.fn().mockReturnValue({ promise: () => Promise.resolve(...) }),
     *   upload: jest.fn().mockReturnValue({ promise: () => Promise.resolve(...) })
     * };
     * const s3 = new S3Service(mockS3);
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

    /**
     * Fetch an object from S3.
     *
     * Retrieves file contents from S3 bucket. Used for downloading icon assets,
     * reading metadata files, or fetching files for processing in Lambda functions.
     *
     * @param {string} bucket - S3 bucket name (e.g., 'vectoricons-assets')
     * @param {string} key - S3 object key (e.g., 'icons/home.svg')
     * @returns {Promise<AWS.S3.GetObjectOutput>} S3 object data with Body, ContentType, etc.
     * @throws {Error} If object doesn't exist or permission denied
     *
     * @example
     * const { Body, ContentType } = await s3.fetch('vectoricons-assets', 'icons/home.svg');
     * const svgContent = Body.toString('utf-8');
     * console.log(ContentType); // 'image/svg+xml'
     */
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

    /**
     * Get tags for an S3 object.
     *
     * Tags are used for categorization, cost allocation, and lifecycle rules.
     * Common tags: environment (prod/staging), asset-type (icon/illustration),
     * processing-status (pending/complete).
     *
     * @param {string} bucket - S3 bucket name
     * @param {string} key - S3 object key
     * @returns {Promise<AWS.S3.TagSet>} Array of { Key, Value } tag objects
     * @throws {Error} If object doesn't exist or permission denied
     *
     * @example
     * const tags = await s3.getObjectTags('vectoricons-assets', 'icons/home.svg');
     * // [{ Key: 'asset-type', Value: 'icon' }, { Key: 'status', Value: 'processed' }]
     * const assetType = tags.find(t => t.Key === 'asset-type')?.Value;
     */
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

    /**
     * Get metadata for an S3 object without downloading the body.
     *
     * Uses HEAD request (fast, no data transfer) to get object metadata like
     * content type, size, last modified date. Useful for checking if object
     * exists or getting info before download.
     *
     * @param {string} bucket - S3 bucket name
     * @param {string} key - S3 object key
     * @returns {Promise<AWS.S3.HeadObjectOutput>} Object metadata (ContentType, ContentLength, LastModified, etc.)
     * @throws {Error} If object doesn't exist or permission denied
     *
     * @example
     * const metadata = await s3.getObjectMetadata('vectoricons-assets', 'icons/home.svg');
     * console.log(metadata.ContentType);   // 'image/svg+xml'
     * console.log(metadata.ContentLength); // 1024 (bytes)
     * console.log(metadata.LastModified);  // Date object
     */
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

    /**
     * Upload a file to S3.
     *
     * Uploads file contents to S3 bucket. Supports buffers, streams, and strings.
     * Uses multipart upload automatically for large files (>5MB).
     *
     * **Production Pattern:**
     * After upload, CloudFront CDN serves files globally with low latency.
     * S3 lifecycle policies move old files to cheaper storage (Glacier).
     *
     * @param {string} bucket - S3 bucket name (e.g., 'vectoricons-assets')
     * @param {string} key - S3 object key (e.g., 'icons/home.svg')
     * @param {Buffer|Stream|string} body - File contents to upload
     * @returns {Promise<AWS.S3.ManagedUpload.SendData>} Upload result with Location, ETag, Bucket, Key
     * @throws {Error} If upload fails or permission denied
     *
     * @example
     * // Upload buffer
     * const svgBuffer = Buffer.from('<svg>...</svg>', 'utf-8');
     * const result = await s3.upload('vectoricons-assets', 'icons/new-icon.svg', svgBuffer);
     * console.log(result.Location); // 'https://vectoricons-assets.s3.amazonaws.com/icons/new-icon.svg'
     *
     * @example
     * // Upload stream (memory efficient for large files)
     * const fileStream = fs.createReadStream('/path/to/large-file.zip');
     * await s3.upload('vectoricons-assets', 'uploads/batch-123.zip', fileStream);
     */
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

    /**
     * Verify that an S3 bucket exists and is accessible.
     *
     * Uses HEAD request to check bucket existence without listing objects.
     * Useful for health checks or validation before batch operations.
     *
     * @param {string} bucket - S3 bucket name
     * @returns {Promise<AWS.S3.HeadBucketOutput>} Empty object (success = bucket exists)
     * @throws {Error} If bucket doesn't exist or access denied
     *
     * @example
     * try {
     *   await s3.headBucket('vectoricons-assets');
     *   console.log('Bucket exists and is accessible');
     * } catch (error) {
     *   console.error('Bucket not found or no permission');
     * }
     */
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