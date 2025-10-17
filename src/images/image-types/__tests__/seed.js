let testCounter = 0;

/**
 * Generate test data for a single image type
 * @param {Object} opts
 * @returns {Promise<Object>} Plain object with snake_case keys
 */
const seedOne = async (opts = {}) => {
    testCounter++;
    return {
        label: `Test Image Type ${testCounter}`,
        value: `test_type_${testCounter}`,
        description: `Description for test type ${testCounter}`,
    };
};

module.exports = {
    seedOne,
};
