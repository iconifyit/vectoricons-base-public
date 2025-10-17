const ImageEntity      = require('../ImageEntity');
const ImageRepository  = require('../ImageRepository');

/**
 * @module Images Domain
 * @fileoverview PreviewService - Service for managing preview images.
 */
class PreviewService {
    constructor({ imageRepository }) {
        if (!imageRepository) {
            throw new Error('PreviewService requires an imageRepository');
        }

        this.imageRepository = imageRepository;
    }

    /**
     * Returns up to `count` preview images for a given family
     * @param {number} familyId
     * @param {number} count
     * @returns {Promise<ImageEntity[]>}
     */
    async getRandomFamilyPreviews(familyId, count = 10) {
        const all = await this.imageRepository.findByEntity('family', familyId);
        return this.#randomSubset(all, count);
    }

    /**
     * Returns up to `count` preview images for a given set
     * @param {number} setId
     * @param {number} count
     * @returns {Promise<ImageEntity[]>}
     */
    async getRandomSetPreviews(setId, count = 10) {
        const all = await this.imageRepository.findByEntity('set', setId);
        return this.#randomSubset(all, count);
    }

    /**
     * Internal helper to select a random subset
     * @private
     */
    #randomSubset(arr, count) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Constructs an S3 path for a preview image
     * @param {number} userId
     * @param {string} familyId
     * @param {string} filename
     * @returns {string}
     */
    generateFamilyPreviewPath(userId, familyId, filename) {
        return `${userId}/previews/${familyId}/${filename}`;
    }
}

module.exports = PreviewService;