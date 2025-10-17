const DB = require('@vectopus.com/db');

/**
 * Maps query types to their respective cursor queries
 * @type {Object}
 */
const CursorQueryMap = {
    newest: {
        icons           : DB.iconsPaginationCursors,
        sets            : DB.setsPaginationCursors,
        families        : DB.familiesPaginationCursors,
        illustrations   : DB.illustrationsPaginationCursors,
    },
    bestseller: {
        icons           : DB.iconsPopularityCursors,
        sets            : DB.setsPopularityCursors,
        families        : DB.familiesPopularityCursors,
        illustrations   : DB.illustrationsPopularityCursors,
    }
}
module.exports.CursorQueryMap = CursorQueryMap;

/**
 * Maps entity types to their respective cursor types
 * @type {Object}
 */
const CursorEntityTypes = {
    icons           : 'icons',
    sets            : 'sets',
    families        : 'families',
    illustrations   : 'illustrations',
    icon            : 'icons',
    set             : 'sets',
    family          : 'families',
    illustration    : 'illustrations',
}
module.exports.CursorEntityTypes = CursorEntityTypes;

/**
 * Maps sort types to their respective cursor types
 * @type {Object}
 */
const SortTypes = {
    newest        : 'newest',
    bestseller    : 'bestseller',
}
module.exports.SortTypes = SortTypes;

/**
 * Gets the cursor for a given entity type, page number, and sort
 * @param {string} entityType - The type of entity
 * @param {number} pageNumber - The page number
 * @param {string} sort - The sort type
 * @return {Object} - The cursor
 */
const getCursor_v0 = async (entityType, start=0, sort=SortTypes.newest) => {
    let cursorQuery;
    sort = sort || SortTypes.newest;
    if (! start) start = 0;

    console.log('getCursor', entityType, start, sort);
    
    // if (! CursorQueryMap[sort][CursorEntityTypes[entityType]] ) {
    //     throw new Error(`Invalid entity type: ${entityType}`);
    // }

    if (! ['newest', 'bestseller'].includes(sort)) {
        throw new Error(`Invalid sort type: ${sort}`);
    }

    entityType = CursorEntityTypes[entityType];

    console.log('getCursor', entityType, start, sort, CursorEntityTypes[entityType]);
    
    cursorQuery = await CursorQueryMap.newest[entityType];
    if (sort === 'bestseller') {
        cursorQuery = await CursorQueryMap.bestseller[entityType];
    }
    return await cursorQuery.query().where('page_number', start).first();
}

const getCursor = async (entityType, start=0, sort) => {
    let cursorQuery;
    if (! sort) sort = 'newest';
    if (! start) start = 1;
        
    if (! ['newest', 'bestseller'].includes(sort)) {
        throw new Error(`Invalid sort type: ${sort}`);
    }

    let cursor = {};

    entityType = CursorEntityTypes[entityType];

    console.log('getCursor', entityType, start, sort, CursorEntityTypes[entityType]);
    
    cursorQuery = await CursorQueryMap.newest[entityType];
    if (sort === 'bestseller') {
        cursorQuery = await CursorQueryMap.bestseller[entityType];
        cursor = await cursorQuery.query().where('page_number', start).first();
    }
    else {
        // let _start = await cursorQuery.query().where('page_number', start).first();
        // let _end = await cursorQuery.query().where('page_number', start+1).first();
        // cursor = {
        //     ..._start,
        //     start_date: _start.created_at,
        //     end_date: _end.created_at,
        // }
        let _start;
        while (! (_start = await cursorQuery.query().where('page_number', start).first())) {
            start--;
            if (start < 1) break;
            _start = await cursorQuery.query().where('page_number', start).first();
        }

        if (! _start) return null;
        
        let _end = await cursorQuery.query().where('page_number', start+1).first();
        if (! _end) {
            _end = _start;
        }

        cursor = {
            ..._start,
            start_date: _start.created_at,
            end_date: _end.created_at,
        }
    }

    return cursor;
}
module.exports.getCursor = getCursor;

