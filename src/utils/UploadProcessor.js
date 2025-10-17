// UploadProcessor Implementation

class UploadProcessor {
    async processUpload(event) {
        // Higher-level orchestration of the upload processing workflow
        try {
            const upload = new UploadEntity(event.bucket, event.key);
            await upload.fetchMetadata();
            await upload.fetchTags();
            upload.validateTags();
            if (!upload.isValidImage()) {
                throw new Error('Invalid image');
            }
            await this.sqsService.sendMessage(upload);
        } 
        catch (error) {
            console.error('Processing failed:', error);
            throw error;
        }
    }
}

module.exports = UploadProcessor;