/**
 * AWS test fixtures using environment variables
 * These are real AWS resources that should exist in the configured account
 */
module.exports = {
    s3: {
        buckets: [
            process.env.AWS_S3_BUCKET_PNG,
            process.env.AWS_S3_BUCKET_SVG,
            process.env.AWS_S3_BUCKET_NAME,
        ].filter(Boolean), // Remove undefined values
    },
    sns: {
        topics: [
            process.env.FALLBACK_SNS_TOPIC_ARN,
            process.env.REMOTE_MESSENGER_TOPIC_ARN,
        ].filter(Boolean),
    },
    sqs: {
        queues: [
            process.env.SQS_IMAGE_PROCESSOR_QUEUE_URL,
            process.env.SQS_PREVIEW_MAKER_QUEUE_URL,
        ].filter(Boolean),
    },
};
