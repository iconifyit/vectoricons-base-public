/**
 * @module Images Domain
 * @fileoverview ImageProcessorService - Validates and processes image uploads.
 */
class ImageProcessorService {
    static async getInstance() {
        return new ImageProcessorService();
    }

    isValidImage(uploadObject) {
        if (!uploadObject.metadata || !uploadObject.metadata.ContentType) {
            throw new Error('Metadata or ContentType missing');
        }

        const validMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
        const isValid = validMimeTypes.includes(uploadObject.metadata.ContentType);
        if (!isValid) {
            console.error(`Invalid image type: ${uploadObject.metadata.ContentType}`);
        }
        return isValid;
    }
}

module.exports = ImageProcessorService;