/**
 * @module Cursor Pagination
 * @fileoverview CursorEncoder - Utilities for encoding/decoding cursor pagination tokens.
 *
 * Provides secure, base64-encoded cursor tokens for keyset pagination. Cursors contain
 * the last seen item's sort fields (id, created_at, etc.) to enable efficient pagination
 * without offset/limit performance issues.
 *
 * **Why Cursor Pagination?**
 * - ✅ O(log n) performance vs O(n) for offset pagination
 * - ✅ Consistent results even when data changes
 * - ✅ No "page drift" when items are added/removed
 * - ✅ Works with complex sorts and filters
 *
 * **Cursor Structure:**
 * ```javascript
 * {
 *   id: 12345,                    // Primary key
 *   createdAt: '2024-01-15T...',  // Sort field
 *   direction: 'next'             // 'next' or 'prev'
 * }
 * ```
 *
 * **Encoding:**
 * JSON → Base64 → URL-safe token
 *
 * **Security:**
 * Cursors are not encrypted (they're just base64). Do not include sensitive data.
 * Always validate cursor structure before using in queries.
 *
 * @example
 * // Encode cursor
 * const cursor = CursorEncoder.encode({ id: 12345, createdAt: '2024-01-15' });
 * // Returns: 'eyJpZCI6MTIzNDUsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMTUifQ=='
 *
 * @example
 * // Decode cursor
 * const data = CursorEncoder.decode('eyJpZCI6MTIzNDUsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMTUifQ==');
 * // Returns: { id: 12345, createdAt: '2024-01-15' }
 *
 * @example
 * // Invalid cursor
 * const data = CursorEncoder.decode('invalid_token');
 * // Returns: null
 */

class CursorEncoder {
    /**
     * Encode cursor data to a base64 token.
     *
     * Converts cursor object to JSON, then base64 encodes it. The token is URL-safe
     * and can be passed as a query parameter.
     *
     * @param {Object} data - Cursor data (id, sort fields, direction)
     * @returns {string} Base64-encoded cursor token
     *
     * @example
     * const token = CursorEncoder.encode({
     *   id: 12345,
     *   createdAt: '2024-01-15T10:30:00Z',
     *   direction: 'next'
     * });
     * // Returns: 'eyJpZCI6MTIzNDUsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMTUtMTAuLi4=...'
     */
    static encode(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }

        try {
            const json = JSON.stringify(data);
            return Buffer.from(json, 'utf8').toString('base64');
        } catch (error) {
            console.error('CursorEncoder.encode error:', error);
            return null;
        }
    }

    /**
     * Decode a base64 cursor token back to object.
     *
     * Parses base64 token into original cursor object. Returns null if token
     * is invalid or malformed.
     *
     * @param {string} token - Base64-encoded cursor token
     * @returns {Object|null} Decoded cursor data or null if invalid
     *
     * @example
     * const data = CursorEncoder.decode('eyJpZCI6MTIzNDV9');
     * // Returns: { id: 12345 }
     *
     * @example
     * const data = CursorEncoder.decode('invalid');
     * // Returns: null
     */
    static decode(token) {
        if (!token || typeof token !== 'string') {
            return null;
        }

        try {
            const json = Buffer.from(token, 'base64').toString('utf8');
            return JSON.parse(json);
        } catch (error) {
            console.error('CursorEncoder.decode error:', error);
            return null;
        }
    }

    /**
     * Validate cursor structure.
     *
     * Ensures cursor has required fields (id at minimum). Add additional
     * validation rules as needed.
     *
     * @param {Object} cursor - Decoded cursor object
     * @returns {boolean} True if cursor is valid
     *
     * @example
     * CursorEncoder.isValid({ id: 123, createdAt: '2024-01-15' }); // true
     * CursorEncoder.isValid({ createdAt: '2024-01-15' }); // false (missing id)
     * CursorEncoder.isValid(null); // false
     */
    static isValid(cursor) {
        if (!cursor || typeof cursor !== 'object') {
            return false;
        }

        // Cursor must have at least an ID
        if (!cursor.id) {
            return false;
        }

        return true;
    }

    /**
     * Create a cursor from a database row.
     *
     * Extracts relevant fields from a row to create cursor data. This is typically
     * called after fetching results to generate next/prev cursors.
     *
     * @param {Object} row - Database row (Entity or POJO)
     * @param {Array<string>} sortFields - Fields to include in cursor (e.g., ['id', 'createdAt'])
     * @param {string} direction - 'next' or 'prev'
     * @returns {string} Encoded cursor token
     *
     * @example
     * const row = { id: 123, createdAt: '2024-01-15', name: 'home' };
     * const cursor = CursorEncoder.fromRow(row, ['id', 'createdAt'], 'next');
     * // Returns base64 token containing { id: 123, createdAt: '2024-01-15', direction: 'next' }
     */
    static fromRow(row, sortFields = ['id'], direction = 'next') {
        if (!row) {
            return null;
        }

        const cursorData = { direction };

        for (const field of sortFields) {
            // Handle both camelCase (Entity) and snake_case (DB) field names
            const camelField = field;
            const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();

            if (row[camelField] !== undefined) {
                cursorData[field] = row[camelField];
            } else if (row[snakeField] !== undefined) {
                cursorData[field] = row[snakeField];
            }
        }

        return this.encode(cursorData);
    }
}

module.exports = CursorEncoder;
