/**
 * @fileoverview Repository mixins - Composable data access concerns.
 *
 * Provides mixins for adding features to repository classes:
 * - withCursorPagination - Keyset-based pagination
 */

const withCursorPagination = require('./withCursorPagination');

module.exports = {
    withCursorPagination,
};
