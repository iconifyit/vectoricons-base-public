const fs = require('fs');
const path = require('path');
const exec = require('child_process').execSync;
const express = require('express');
const router = express.Router();
const dotenv = require('dotenv')
const { body } = require('express-validator');
const { raw } = require('objection');
const mkdirp = require('mkdirp');
const { validate } = require('../../generics/helpers');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const contextCheck = require('../../middleware/context-check');
const DB = require('@vectopus.com/db');
const config = require('../../config/server.config');
const utils = require('../../utils');
const enums = require('../../helpers/enums');
const { 
    queryHelper, 
    prepareImagesResponse, 
    manageTagsOnEntityUpdate, 
    manageTagsOnEntityRemove, 
    getSingleImageRawSubQuery,
    getAllImagesRawSubQuery,
    getAllImagesRawQuery,
    hasSVGImageRawQuery,
    isFavoriteRawQuery,
    getTagsRawQuery,
    leftJoinLikesRawQuery,
    getEntitiesCountRawSubQuery,
} = require('../../helpers/queryHelper')
const captureSearchActivity = require('../../middleware/captureSearchActivity');
const AppError = require('../../helpers/appError');
const catchAsync = require('../../helpers/catchAsync');
const { 
    DatabaseActions, 
    ArchiveActions, 
    ImageActions,
    S3Actions, 
    utils: coreUtils 
} = require('@vectopus.com/core');

const { doElasticSearchIcons } = require('../../helpers/elastic-search');
const fn = require('../../helpers/decorators');
const cursors = require('../../helpers/cursors');
// ============================================================================
// Multer file uploader
// ============================================================================
const multer = require('multer');
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.match(/^image\/.*/)) {
    return cb(new Error('Invalid file type'));
  }
  cb(null, file);
};

const upload = multer({
    fileFilter,
    storage,
    limits: {
        files: 200,
        fileSize: 50 * 1024 * 1024, // 50 MB
    }
});
// ============================================================================

dotenv.config();

const kVECTOPUS_TMP_DIR = process.env.VECTOPUS_TMP_DIR;
const kPUBLIC_S3_HOST = process.env.PUBLIC_S3_HOST;
const kVECTOPUS_CDN_HOST = process.env.VECTOPUS_CDN_HOST;

mkdirp.sync(kVECTOPUS_TMP_DIR);

// ============================================================================
// Helpers
// ============================================================================

const uniqueIconIdsOnly = (ids) => {
    const uniqueIds = [];
    for (const id of ids) {
        if (!uniqueIds.includes(id)) {
            uniqueIds.push(id);
        }
    }
    return uniqueIds;
}

/**
 * Get the icon field validations.
 */
const getIconsValidations = (req, res, next) => {
    return validate([
        body('user_id').not().isEmpty().withMessage('user_id is required.'),
        body('set_id').not().isEmpty().withMessage('Icon set_id is required.'),
    ])
}

/**
 * Prepare the query for icons
 * @param {object} query parameters
 * @returns
 */
/**
 * Prepare the query for icons
 * @param {object} query parameters
 * @returns
 */
// const iconsData_v0 = async ({ start = 0, limit = 200, price, teamId, iconId, searchTerm, sort, ...rest }) => {
    
//     // ========================================================================
//     // Build the base query.
//     // ========================================================================

//     let $query = DB.icons.query()
//         .withGraphFetched('[set, license, style, user]')
//         .select(
//             'icons.*',
//             raw('COALESCE(f.likes, 0) > 0 AS likes'),
//             raw(` 
//                 json_build_object(
//                     'id', families.id, 
//                     'name', families.name
//                 ) as family
//             `),
//             raw(getAllImagesRawSubQuery(enums.entityType.Icon, 'icons.id', true, '')),
//             raw(hasSVGImageRawQuery(enums.entityType.Icon, 'icons.id')),
//             raw(isFavoriteRawQuery(enums.entityType.Icon, 'icons.id', rest?.user?.id)),
//             raw(getTagsRawQuery(enums.entityType.Icon, 'icons.id')),
//             (() => {
//                 try { 
//                     return raw('CAST(icons.color_data AS JSON) as color_data');
//                  } catch (e) {  return '[]' }
//             })()
//         )
//         .joinRaw(leftJoinLikesRawQuery(enums.entityType.Icon, 'icons.id', rest?.user?.id))
//         .leftJoin('sets', 'icons.set_id', 'sets.id')
//         .leftJoin('families', 'sets.family_id', 'families.id')

//         // ========================================================================
//         // Match tags.
//         // ========================================================================

//         .where(builder => {
//             if (rest.tagIds) {
//                 builder.whereIn('tags.id', rest.tagIds)
//             }
//         })

//         // ========================================================================
//         // Add user details.
//         // ========================================================================

//         .modifyGraph('user', builder => {
//             builder.select(
//                 'id', 'username', 'first_name', 'last_name',
//                 raw(`COALESCE(NULLIF(display_name, ''), username) AS display_name`),
//                 raw(getSingleImageRawSubQuery(enums.entityType.User, 'users.id', true, '')),
//             )
//             builder.select(
//                 raw( isFavoriteRawQuery(enums.entityType.User, 'users.id', rest?.user?.id) ),
//                 raw( getEntitiesCountRawSubQuery('icons', 'users.id', 'icons_count', true) ),
//                 raw( getEntitiesCountRawSubQuery('icons', 'users.id', 'icons_count', true) )
//             )
//         })

//         // ========================================================================
//         // Group results.
//         // ========================================================================

//         .groupBy('icons.id', 'f.likes', 'families.id', 'families.name')

//     // ========================================================================
//     // Elastic Search ID Match
//     // ========================================================================
//     // This is so we can match elastic search results to 
//     // the icons table and our API response structure.
//     if (rest?.iconIds && rest?.iconIds?.length > 0) {
//         $query.whereIn('icons.id', rest?.iconIds);
//     } 

//     // ========================================================================
//     // Sort by newest or bestseller
//     // ========================================================================
//     if (sort === 'newest') {
//         sortByNewest($query, 'icons', price);
//     }
//     else if (sort === 'bestseller') {
//         sortByBestSellers($query, 'icons', enums.entityType.Icon, price);
//     }

//     // ========================================================================
//     // Apply the queryHelper filters.
//     // ========================================================================
//     $query = queryHelper({ 
//         query         : $query,
//         price         : price,
//         teamId        : teamId,
//         id            : iconId,
//         searchTerm    : searchTerm,
//         table         : 'icons', 
//         ...rest
//     })

//     // ========================================================================
//     // Now, clone the query AFTER queryHelper has been applied
//     // ========================================================================
//     const totalMatches = await $query.clone().resultSize();

//     // ========================================================================
//     // Apply pagination (LIMIT and OFFSET) to the original query
//     // ========================================================================
//     if (start) $query.offset(start);
//     if (limit) $query.limit(limit);

//     // ========================================================================
//     // Execute the query and add details to the results.
//     // ========================================================================

//     const finalQuery = await $query
//         .then(async (result) => {
//             if (! result) {
//                 throw new AppError(config.ITEM_NOT_FOUND_ERROR, 404);
//             }

//             // ========================================================================
//             // If the result is a single icon, add additional data & return
//             // ========================================================================

//             if (iconId) {
//                 // result.hasPurchased = await checkForPurchasedEntity(
//                 //     iconId, 
//                 //     enums.entityType.Icon, 
//                 //     result?.set?.family_id, 
//                 //     result.set_id, 
//                 //     rest?.user,
//                 // )
//                 // result.isInCart = await checkForEntityInCart(iconId, enums.entityType.Icon, rest?.user);

//                 result.hasPurchased = await fn.hasPurchased(
//                     iconId, 
//                     enums.entityType.Icon, 
//                     result?.set?.family_id, 
//                     result.set_id, 
//                     rest?.user,
//                 )
//                 result.isInCart = await fn.isInCart(iconId, enums.entityType.Icon, rest?.user);
//                 result.images = await prepareImagesResponse(result?.images, result.hasPurchased, rest?.user, result?.user_id);
//                 return result;
//             }

//             // ========================================================================
//             // If the result is an array of icons, loop through and add additional data
//             // ========================================================================

//             for (const icon of result) {
//                 icons.isInCart = await fn.isInCart(icon.id, enums.entityType.Icon, rest?.user);
//                 icons.hasPurchased = await fn.hasPurchased(
//                     icon.id,
//                     enums.entityType.Icon,
//                     icon?.set?.family_id,
//                     icon.set_id,
//                     rest?.user,
//                 );
//                 // icon.hasPurchased = await checkForPurchasedEntity(
//                 //     icon.id, 
//                 //     enums.entityType.Icon, 
//                 //     icon?.set?.family_id, 
//                 //     icon.set_id, 
//                 //     rest?.user,
//                 // )
//                 // icon.isInCart = await checkForEntityInCart(icon.id, enums.entityType.Icon, rest?.user);
//                 icon.images = await prepareImagesResponse(icon.images, icon.hasPurchased, rest?.user, icon.user_id);
//             }
//             return result;
//         })
//         .catch((err) => { 
//             console.log('iconsData err', err)
//             throw new AppError(config.ITEM_NOT_FOUND_ERROR, 404);    
//         });

//     // DO NOT DELETE THIS - EVER!
//     // console.log('iconsData SQL QUERY', $query.toKnexQuery().toString())

//     // fs.writeFileSync('./scratch-out.sql', $query.toKnexQuery().toString());

//     return {
//         data  : finalQuery,
//         count : totalMatches,
//     }
// }

/*
let { data : icons, count } = await iconsData({ 
    start             : 0, // foundIds.length ? 0 : start,
    limit             : limit,
    searchTerm        : '', // foundIds.length > 0 ? '' : searchTerm,
    price             : null, price,
    user              : req?.user,
    styleId           : null, // styleId,
    sort              : sort,
    iconIds           : [...new Set(foundIds)],
    table             : 'icons',
    tagIds            : tagIds,
})
*/

const iconsData = async ({ start = 0, limit = 200, price, teamId, iconId, searchTerm, sort, ...rest }) => {
    
    // ========================================================================
    // Get the last-seen cursor.
    // !!! NOTE !!!
    // DO NOT use offset & limit to do pagination. It is very, very slow 
    // because it has to scan the entire table to get to the offset.
    // We are using keyset pagination to get the next set of results.
    // The pagination uses a materialized view to pre-calculate the cursors.
    // A pg_cron job runs every 4 hours to re-calc the cursors.
    // This means that new content won't show up in the cursors until the
    // next cron job runs but the trade-off is super fast pagination.
    // ========================================================================

    const cursor = await cursors.getCursor('icons', start || 0, sort || 'newest');

    console.log('ICONS CURSOR', cursor);

    // ========================================================================
    // Build the base query.
    // ========================================================================

    let $query = DB.icons.query()
        .withGraphFetched('[set, license, style, user, popularity]')
        .select(
            'icons.*',
            raw('COALESCE(f.likes, 0) > 0 AS likes'),
            raw(` 
                json_build_object(
                    'id', families.id, 
                    'name', families.name
                ) as family
            `),
            raw(getAllImagesRawSubQuery(enums.entityType.Icon, 'icons.id', true, '')),
            raw(hasSVGImageRawQuery(enums.entityType.Icon, 'icons.id')),
            raw(isFavoriteRawQuery(enums.entityType.Icon, 'icons.id', rest?.user?.id)),
            raw(getTagsRawQuery(enums.entityType.Icon, 'icons.id')),
            (() => {
                try { 
                    return raw('CAST(icons.color_data AS JSON) as color_data');
                 } catch (e) {  return '[]' }
            })()
        )
        .joinRaw(leftJoinLikesRawQuery(enums.entityType.Icon, 'icons.id', rest?.user?.id))
        .leftJoin('sets', 'icons.set_id', 'sets.id')
        .leftJoin('families', 'sets.family_id', 'families.id')

        // ========================================================================
        // Select by the cursor
        // ========================================================================
        .where(builder => {
            if (cursor) {
                if (sort === 'newest') {
                    builder.where('icons.created_at', '<=', cursor.created_at);
                }
                else {
                    builder.where('icons.id', '<', cursor.cursor_id);
                }
            }
        })

        // ========================================================================
        // Match tags.
        // ========================================================================

        .where(builder => {
            if (rest.tagIds) {
                builder.whereIn('tags.id', rest.tagIds)
            }
        })

        // ========================================================================
        // Add user details.
        // ========================================================================

        .modifyGraph('user', builder => {
            builder.select(
                'id', 'username', 'first_name', 'last_name',
                raw(`COALESCE(NULLIF(display_name, ''), username) AS display_name`),
                raw(getSingleImageRawSubQuery(enums.entityType.User, 'users.id', true, '')),
            )
            builder.select(
                raw( isFavoriteRawQuery(enums.entityType.User, 'users.id', rest?.user?.id) ),
                raw( getEntitiesCountRawSubQuery('icons', 'users.id', 'icons_count', true) ),
                raw( getEntitiesCountRawSubQuery('icons', 'users.id', 'icons_count', true) )
            )
        })

        // ========================================================================
        // Group results.
        // ========================================================================

        .groupBy('icons.id', 'f.likes', 'families.id', 'families.name')

    // ========================================================================
    // Elastic Search ID Match
    // ========================================================================
    // This is so we can match elastic search results to 
    // the icons table and our API response structure.
    if (rest?.iconIds && rest?.iconIds?.length > 0) {
        $query.whereIn('icons.id', rest?.iconIds);
    } 

    // ========================================================================
    // Apply the queryHelper filters.
    // ========================================================================
    $query = queryHelper({ 
        query         : $query,
        price         : price,
        teamId        : teamId,
        id            : iconId,
        searchTerm    : searchTerm,
        table         : 'icons', 
        ...rest
    })

    // ========================================================================
    // Now, clone the query AFTER queryHelper has been applied
    // ========================================================================
    const totalMatches = await $query.clone().resultSize();

    // ========================================================================
    // Apply pagination (LIMIT and OFFSET) to the original query
    // ========================================================================
    if (limit) $query.limit(limit);

    // ========================================================================
    // Execute the query and add details to the results.
    // ========================================================================

    const finalQuery = await $query
        .then(async (result) => {
            if (! result) {
                throw new AppError(config.ITEM_NOT_FOUND_ERROR, 404);
            }

            // ========================================================================
            // If the result is a single icon, add additional data & return
            // ========================================================================

            if (iconId) {
                result.hasPurchased = await fn.hasPurchased(
                    iconId, 
                    enums.entityType.Icon, 
                    result?.set?.family_id, 
                    result.set_id, 
                    rest?.user,
                )
                console.log('result.hasPurchased', result.hasPurchased)
                result.isInCart = await fn.checkForEntityInCart(iconId, enums.entityType.Icon, rest?.user);
                console.log('result.isInCart', result.isInCart)
                result.images = await prepareImagesResponse(
                    result?.images, 
                    result.hasPurchased, 
                    rest?.user, 
                    result?.user_id,
                ); 
                console.log('result.images', result.images)
                return result;
            }

            // ========================================================================
            // If the result is an array of icons, loop through and add additional data
            // ========================================================================

            for (const icon of result) {
                icon.hasPurchased = await fn.hasPurchased(
                    icon.id, 
                    enums.entityType.Icon, 
                    icon?.set?.family_id, 
                    icon.set_id, 
                    rest?.user,
                )
                console.log('icon.hasPurchased', icon.hasPurchased)
                icon.isInCart = await fn.isInCart(icon.id, enums.entityType.Icon, rest?.user);
                console.log('icon.isInCart', icon.isInCart)
                icon.images = await prepareImagesResponse(icon.images, icon.hasPurchased, rest?.user, icon.user_id);
                console.log('icon.images', icon.images)
            }
            return result;
        })
        .catch((err) => { 
            console.log('iconsData err', err)
            throw new AppError(config.ITEM_NOT_FOUND_ERROR, 404);    
        });

    // ========================================================================
    // DO NOT DELETE THIS - EVER!
    // ========================================================================
    // console.log('QUERY PRE')
    // utils.showQuery($query)
    // console.log('QUERY POST')

    return {
        data  : finalQuery,
        count : totalMatches,
    }
}

/**
 * Prepare the query for icons
 * @param {string} price - The price of the icon (free, premium, null)
 * @returns {function} - The query function
 */
const searchQuery = (price=null) => {
    return async (req, res) => {
        const { start, limit, offset, searchTerm, styleId, sort } = utils.getRequestVars(req);

        console.log('searchQuery', { start, limit, offset, searchTerm, styleId, sort, price })

        // ========================================================================
        // Do Elastic Search
        // ========================================================================
        const results  = await doElasticSearchIcons(searchTerm, start, limit, price, styleId, sort);
        const hits     = results?.hits?.hits;
        const foundIds = hits.map(hit => hit._source.icon_id);

        console.log('doElasticSearchIcons results', hits);
        console.log('doElasticSearchIcons results', hits);
        console.log('foundIds', foundIds.length);
        console.log('uniqueIds', uniqueIconIdsOnly(foundIds).length);

        let queryCount = 0;

        if (foundIds.length === 0) {
            return res.status(200).json({
                icons         : [],
                queryTotal    : 0,
                start         : start,
                limit         : limit,
                offset        : offset,
                totalResults  : 0,
            })
        }

        // ========================================================================
        // Get icons by IDs
        // ========================================================================
        let { data : icons, count } = await iconsData({ 
            start             : 0, // foundIds.length ? 0 : start,
            limit             : limit,
            searchTerm        : '', // foundIds.length > 0 ? '' : searchTerm,
            price             : null, price,
            user              : req?.user,
            styleId           : null, // styleId,
            sort              : sort,
            iconIds           : [...new Set(foundIds)],
        })

        console.log('results', { icons, count })

        icons.forEach(icon => {
            if (foundIds.includes(icon.id)) {
                icon.exact_match = true;
            }
        })

        queryCount += results?.hits?.total?.value;

        return res.status(200).json({
            icons         : icons, // icons.slice(0, limit),
            queryTotal    : queryCount,
            start         : start,
            limit         : limit,
            offset        : offset,
            totalResults  : count,
        })
    }
}

// ============================================================================
// Routes
// ============================================================================

/**
 * Get all icon IDs for front-end pre-render.
 */
router.get('/ids', 
    auth,
    role.checkRole(
        role.ROLES.System,
    ),
    catchAsync(async (req, res) => {
        const ids = await DB.icons.query().select('id').where('is_deleted', false);
        if ((ids || []).length === 0) {
            return res.status(200).json({ ids: [] });
        }
        return res.status(200).json({
            ids: ids.map(id => id.id)
        });
    })
);

/**
 * List icons.
 * @example
 * GET /api/icon/list/1/10
 */
router.get(
    '/list/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const { start, limit, offset, styleId, sort } = utils.getRequestVars(req);
        const { data : icons, count } = await iconsData({ start, limit, styleId, sort, user: req?.user })
        return res.status(200).json({
            icons   : icons,
            total   : count,
            start   : start,
            limit   : limit,
            offset  : offset,
            sort    : sort
        });
    })
)

/**
 * List items by price.
 * @example
 * GET /api/icon/price/FREE/1/10
 * GET /api/icon/price/PREMIUM/1/10
 */
router.get(
    '/price/:price(free|premium|all)/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const { start, limit, offset, styleId } = utils.getRequestVars(req);
        const { data : icons, count } = await iconsData({ 
            start, 
            limit, 
            price: req?.params?.price, 
            user: req?.user, 
            styleId,
        })
        return res.status(200).json({
            icons   : icons,
            total   : count,
            start   : start,
            limit   : limit,
            offset  : offset
        });
    })
);

/**
 * List items by popularity.
 * @example
 * GET /api/icon/popular/1/10
 */
router.get(
    '/popular/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const { start, limit, offset } = utils.getRequestVars(req);
        const { data : icons, count } = await iconsData({ start, limit, likes: true, user: req?.user })
        return res.status(200).json({
            icons   : icons,
            total   : count,
            start   : start,
            limit   : limit,
            offset  : offset
        });
    })
);

/**
 * List items by team.
 * @example
 * GET /api/icon/user/58/1/10
 */
router.get(
    '/user/:userId([0-9]+)/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const { start, limit, offset, searchTerm, userId } = utils.getRequestVars(req);
        console.log('GET /icon/user/:userId/:start/:limit', { start, limit, offset, searchTerm, userId })
        if (! userId) {
            throw new AppError(config.BAD_REQUEST_ERROR, 400);
        }
        const { data : icons, count }  = await iconsData({ start, limit, userId, searchTerm, user: req?.user })
        return res.status(200).json({
            icons   : icons,
            total   : count,
            start   : start,
            limit   : limit,
            offset  : offset,
        });
    })
);

/**
 * List items by tags.
 * @example
 * GET /api/icon/tags/foo,bar,baz/1/10
 */
router.get(
    '/tags/:tags?/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const { start, limit, offset, tagIds } = utils.getRequestVars(req);
        const { data : icons, count }  = await iconsData({ 
            start   : start,
            limit   : limit,
            tags    : true,
            table   : 'icons',
            tagIds  : tagIds,
            user    : req?.user
        })
        return res.status(200).json({
            icons   : icons,
            total   : count,
            start   : start,
            limit   : limit,
            offset  : offset,
        });
    })
);

/**
 * List icons for HTML select element.
 * @example
 * GET /api/icon/select-list/1/10
 */
router.get(
    '/select-list/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const { start, limit, offset, search } = utils.getRequestVars(req);

        // ========================================================================
        // Create the base query.
        // ========================================================================
        const $query = DB.icons.query()
            .select( 'id', 'name' )
            .where(builder => {
                if (search) {
                    builder.whereRaw('LOWER(name) LIKE ?', [`%${search}%`])
                }
            })
            .whereRaw('COALESCE(is_deleted, false) = false')

        // ========================================================================
        // Clone query to get total count.
        // ========================================================================
        const count = await $query.clone().resultSize();

        // ========================================================================
        // Apply pagination (LIMIT and OFFSET) to the original query.
        // ========================================================================
        $query.offset(start).limit(limit)

        // ========================================================================
        // Execute the query and return the results.
        // ========================================================================
        const icons = await $query;
        
        return res.status(200).json({
            icons   : icons,
            total   : count,
            start   : start,
            limit   : limit,
            offset  : offset,
        });
    })
);

/**
 * Count all items.
 * @example
 * GET /api/icon/count
 * @returns {
 *     count: {
 *         icons    : Number,
 *         icons    : Number,
 *         families : Number,
 *         sets     : Number,
 *     }
 * }
 */
router.get(
    '/count',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        return res.status(200).json(await utils.countAllItems());
    })
);

/**
 * Get Icon by ID.
 * @example
 * GET /api/icon/60
 */
router.get('/:id([0-9]+)',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const itemId = utils.$get(req, 'params.id', null);
        if (! itemId) {
            throw new AppError(config.BAD_REQUEST_ERROR, 400);
        }

        // ========================================================================
        // Get the icon by ID
        // ========================================================================
        const { data : icon, count } = await iconsData({ iconId: itemId, user: req?.user })

        if (! icon) {
            throw new AppError(config.ITEM_NOT_FOUND_ERROR, 404);
        }

        // ========================================================================
        // Get the family for the icon
        // ========================================================================
        const family = await DatabaseActions.getFirst('families', { id: icon?.set?.family_id });
        
        // ========================================================================
        // Fetch related icons from the same family
        // ========================================================================
        const relatedIcons = await DB.icons.query()
            .whereExists(function () {
                this.select('*')
                    .select(raw('COALESCE(sets.is_deleted, false) AS is_deleted'))
                    .from('sets')
                    .whereRaw('sets.id = icons.set_id')
                    .andWhere('sets.family_id', icon?.set?.family_id);
            })
            .whereRaw(`COALESCE(icons.is_deleted, false) = false`)
            .whereNot('id', itemId)
            .limit(5)
            .then(async (result) => {
                for (const relatedIcon of result) {
                    const result = await DatabaseActions.knex.raw(
                        getAllImagesRawQuery(enums.entityType.Icon, relatedIcon.id, true, "AND file_type = 'png'")
                    );
                    relatedIcon.images = result?.rows ?? [];
                    relatedIcon.color_data = JSON.parse(relatedIcon.color_data);
                }
                return result;
            });

        // ========================================================================
        // Fetch illustrations matching design styles
        // ========================================================================
        const illustrations = await DB.illustrations.query()
            .where('illustrations.style_id', icon?.style_id)
            .whereRaw(`COALESCE(illustrations.is_deleted, false) = false`)
            .limit(5)
            .then(async (result) => {
                for (const illustration of result) {
                    const result = await DatabaseActions.knex.raw(
                        getAllImagesRawQuery(
                            enums.entityType.Illustration, 
                            illustration.id, 
                            true, 
                            "AND file_type = 'png'"
                        )
                    );
                    illustration.images = result?.rows || [];
                    illustration.color_data = JSON.parse(illustration.color_data);
                }
                return result;
            });

        return res.status(200).json({ 
            icon            : icon,
            relatedIcons    : relatedIcons,
            illustrations   : illustrations,
            family          : family,
        });
    })
);

/**
 * List by Set.
 * @example
 * GET /api/icon/siblings/54/1/10
 */
router.get(
    '/set/:parentId([0-9]+)?/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const parentId = parseInt(utils.$get(req, 'params.parentId', -1));
        const { start, limit, offset } = utils.getRequestVars(req);
        const { data : icons, count }  = await iconsData({ 
            start, 
            limit, 
            setId: parentId, 
            user: req?.user,
        })
        return res.status(200).json({
            icons   : icons,
            total   : count,
            start   : start,
            limit   : limit,
            offset  : offset,
        });
    })
);

/**
 * Search only free icons (free & premium)
 * @example
 * GET /api/icon/search/0/50/free/?sort=newest&search=cat
 */
router.get(
    '/search/free/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    captureSearchActivity,
    catchAsync(searchQuery('free'))
);

/**
 * Search only premium icons.
 * @example
 * GET /api/icon/search/premium/0/50/?sort=newest&search=cat
 */
router.get(
    '/search/premium/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    captureSearchActivity,
    catchAsync(searchQuery('premium'))
);

/**
 * Search all icons (free & premium)
 * @example
 * GET /api/icon/search/0/50/?sort=newest&search=cat
 */
router.get(
    '/search/:start([0-9]+)?/:limit([0-9]+)?',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
        role.ROLES.Customer,
        role.ROLES.Guest,
        role.ROLES.Subscriber,
    ),
    contextCheck,
    captureSearchActivity,
    catchAsync(searchQuery('all'))
);

/**
 * Add Icon.
 * @example
 * POST /api/icon/add
*/
router.post('/add',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
    ),
    upload.single('image'),
    getIconsValidations(),
    contextCheck,
    catchAsync(async (req, res) => {
        let { tags, ...body } = utils.$get(req, 'body', {});
        
        if (Object.keys(body).length === 0) {
            throw new AppError(`Icon create values are empty`);
        }
        
        // ====================================================================
        // Get Set
        // ====================================================================
        const { set_id, user_id } = body;
        const set = await DB.sets.query().where('id', set_id).first();
        if (! set) {
            throw new AppError(config.ITEM_NOT_FOUND_ERROR, 404);
        }

        // ====================================================================
        // Get Uploaded image
        // ====================================================================
        const uploadedImage = req?.file;
        if (! uploadedImage) {
            throw new AppError(`No image uploaded`, 400);
        }

        // ====================================================================
        // Generate unique ID to keep track of the upload & to prevent 
        // collisions with other uploads.
        // ====================================================================
        const uniqueId = coreUtils.generateUniqueId(12);

        // ====================================================================
        // This is the base folder for all other files in this upload session. 
        // This ensures that the upload and work location is 100% unique and 
        // does not have collisions with other uploads.
        // ====================================================================
        const uniqueTmpDir    = path.join(kVECTOPUS_TMP_DIR, uniqueId);

        // ====================================================================
        // All other folders are relative to uniqueTmpDir.
        // ====================================================================
        const uploadPath      = path.join(uniqueTmpDir, 'uploads');
        const zipArchiveDir   = path.join(uniqueTmpDir, 'archive');
        const workDir         = path.join(uniqueTmpDir, 'work');
        const zipArchivePath  = path.join(zipArchiveDir, 'uploads.zip');

        // ====================================================================
        // Create the required directories
        // ====================================================================
        mkdirp.sync(uniqueTmpDir)
        mkdirp.sync(uploadPath);
        mkdirp.sync(zipArchiveDir);
        mkdirp.sync(workDir);

        // ====================================================================
        // Getting only filename without extension
        // ====================================================================
        const name = path.parse(uploadedImage?.originalname).name;
        const { username: user_name } = await DB.users.query().findById(user_id);

        // ====================================================================
        // Get tags
        // ====================================================================
        tags = utils.getMinimalTags(tags);

        // ====================================================================
        // Upload file path
        // ====================================================================
        const newFilePath = path.join(uploadPath, uploadedImage.originalname);
        fs.writeFileSync(newFilePath, uploadedImage.buffer);

        // ====================================================================
        // Create the ZIP archive
        // ====================================================================
        await ArchiveActions.makeZipFromIconsFolder(
            uploadPath, 
            workDir, 
            zipArchiveDir,
            {imagesTags: tags}
        );

        // ====================================================================
        // Insert the icon into the database
        // ====================================================================
        const icon = await DB.icons
            .query()
            .withGraphFetched("[set.family]")
            .insert({
                name        : name,
                price       : enums.productPrice.PRODUCT_PRICE_ICON,
                set_id      : +set_id,
                style_id    : set?.style_id,
                user_id     : +user_id,
                unique_id   : uniqueId,
        });
        
        // ====================================================================
        // Update tags
        // ====================================================================
        try {
            const tagsResult = await DatabaseActions.addTags(
                icon?.id, 
                enums.entityType.Icon, 
                tags
            );
        }
        catch(err) { console.log('tagsResult err', err) }

        // ====================================================================
        // Check if family_unique_id or set_unique_id is missing and throw 
        // an error if it's not set
        // ====================================================================
        if (!icon?.unique_id || !icon?.set?.family?.unique_id || !icon?.set?.unique_id) {
            throw new AppError(config.BAD_REQUEST_ERROR);
        }

        // ====================================================================
        // Upload images ZIP to S3
        // ====================================================================
        const metadata = {
            item_unique_id    : icon?.unique_id,
            family_unique_id  : icon?.set?.family?.unique_id,
            set_unique_id     : icon?.set?.unique_id,
            style_id          : icon?.set?.style_id,
            product_type      : enums.productType.PRODUCT_TYPE_ICON,
            user_id           : +user_id,
            user_name         : user_name,
            license_id        : license_id,
        }

        // Upload the ZIP archive to S3
        await S3Actions.upload(
            process.env.AWS_S3_IMAGE_PROCESSING_DIR, 
            `${uniqueId}-archive.zip`, 
            zipArchivePath, 
            metadata
        )

        // ====================================================================
        // This will delete all sub-directories as well
        // ====================================================================
        utils.deleteDirectory(uniqueTmpDir);

        return res.status(200).json({
            success   : true,
            message   : `Icon has been added successfully!`,
            icon      : icon,
        });
    })
);

/**
 * Update Icon.
 * @example
 * PUT /api/icon/60
 */
router.put(
    '/:id([0-9]+)',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
    ),
    upload.single('image'),
    getIconsValidations(),
    contextCheck,
    catchAsync(async (req, res) => {
        let { tags, action } = utils.$get(req, 'body', {});

        // ====================================================================
        // IMPORTANT!!!
        // DO NOT USE user_id from the body. This will set the icon.user_id 
        // to the id fo the current user, which is wrong if the current user 
        // is using the Admin UI.
        // ====================================================================

        // ====================================================================
        // Verify item exists.
        // ====================================================================
        const itemId = utils.$get(req, 'params.id', null);
        if (! itemId) {
            throw new AppError(config.BAD_REQUEST_ERROR, 400);
        }

        const item = await DB.icons.query().findById(itemId);
        if (! item) {
            throw new AppError(config.ITEM_NOT_FOUND_ERROR, 404);
        }

        const user = await DB.users.query().findById(item?.user_id);
        const { username: user_name, user_id } = await DB.users.query().findById(user?.id);

        // ====================================================================
        // Verify set exists
        // ====================================================================
        const set_id = utils.$get(item, 'set_id', null);

        const set = await DB.sets.query().findById(+set_id);
        if (! set) {
            throw new AppError(config.ITEM_NOT_FOUND_ERROR, 404);
        }

        let { name } = item;
        let zipArchivePath;
        let uploadPath;
        let zipArchiveDir;
        let workDir;
        let uniqueTmpDir;

        // ====================================================================
        // Get tags
        // ====================================================================
        tags = utils.getMinimalTags(tags, name);

        // ====================================================================
        // Generate unique ID to keep track of the upload & to prevent 
        // collisions with other uploads.
        // ====================================================================
        const uniqueId = item?.unique_id;
        let colorData;

        const uploadedImage = req?.file;
        if (uploadedImage) {
            name = path.basename(uploadedImage.originalname);
            // ====================================================================
            // This is the base folder for all other files in this upload session. 
            // This ensures that the upload and work location is 100% unique and 
            // does not have collisions with other uploads.
            // ====================================================================
            uniqueTmpDir = path.join(kVECTOPUS_TMP_DIR, uniqueId);

            if (fs.existsSync(uniqueTmpDir)) {
                exec(`rm -rf ${uniqueTmpDir}`);
            }

            // ====================================================================
            // All other folders are relative to uniqueTmpDir.
            // ====================================================================
            uploadPath        = path.join(uniqueTmpDir, 'uploads');
            zipArchiveDir     = path.join(uniqueTmpDir, 'archive');
            workDir           = path.join(uniqueTmpDir, 'work');
            zipArchivePath    = path.join(zipArchiveDir, 'uploads.zip');

            // ====================================================================
            // Create the required directories Using mkdirp is safter 
            // than mkdir. MkDir will throw an error if the directory 
            // already exists. mkdirp will only create the directory 
            // if it does not exist and won't throw an error if it does.
            // ====================================================================
            mkdirp.sync(uniqueTmpDir)
            mkdirp.sync(uploadPath);
            mkdirp.sync(zipArchiveDir);
            mkdirp.sync(workDir);
            
            // ====================================================================
            // Write the uploaded files to the uploads directory
            // ====================================================================
            const newFilePath = path.join(uploadPath, uploadedImage.originalname);
            fs.writeFileSync(newFilePath, uploadedImage.buffer);

            // ====================================================================
            // Create the ZIP archive
            // ====================================================================
            await ArchiveActions.makeZipFromIconsFolder(
                uploadPath,
                workDir, 
                zipArchiveDir, 
                {imagesTags: tags}
            );

            colorData = await ImageActions.extractColorCodesFromSVG(
                fs.readFileSync(newFilePath, 'utf8')
            );
        }

        // ====================================================================
        // Remove duplicates from colorData
        // ====================================================================
        if (colorData && colorData.length > 0) {
            colorData = colorData.filter((v,i,a)=>a.findIndex(t=>(t.hex === v.hex))===i);
        }

        // ====================================================================
        // Update the icon in the database
        // ====================================================================
        await DB.icons.query().findById(itemId).patch({ 
            name        : name,
            // user_id     : +user_id,
            set_id      : +set_id,
            style_id    : set?.style_id,
            color_data  : JSON.stringify(colorData),
        });

        // ====================================================================
        // Update tags
        // ====================================================================
        if (tags && ! uploadedImage) {
            await manageTagsOnEntityUpdate(tags, { id: +itemId }, enums.entityType.Icon);
        }

        // ====================================================================
        // Get updated icon
        // ====================================================================
        const icon = await DB.icons.query().withGraphFetched('[set.family]').findById(itemId);

        // ====================================================================
        // Check if family_unique_id or set_unique_id is missing and throw 
        // an error if it's not set
        // ====================================================================
        if (!icon?.set?.family?.unique_id || !icon?.set?.unique_id) {
            throw new AppError(config.BAD_REQUEST_ERROR);
        }

        // ====================================================================
        // Upload images ZIP to S3
        // ====================================================================
        const metadata = {
            item_unique_id    : icon?.unique_id,
            family_unique_id  : icon?.set?.family?.unique_id,
            set_unique_id     : icon?.set?.unique_id,
            style_id          : icon?.set?.style_id,
            product_type      : enums.productType.PRODUCT_TYPE_ICON,
            user_id           : +user_id,
            user_name         : user_name,
            license_id        : set?.license_id,
            item_id           : itemId || -1,
        }

        if (uploadedImage) {
            // Upload the ZIP archive to S3
            await S3Actions.upload(
                process.env.AWS_S3_IMAGE_PROCESSING_DIR, 
                `${uniqueId}-archive.zip`, 
                zipArchivePath, 
                metadata
            )
            // This will delete all sub-directories as well
            utils.deleteDirectory(uniqueTmpDir);
        }

        return res.status(200).json({
            success   : true,
            message   : `Icon details successfully updated!`,
            icon      : icon,
        });
    })
);

/**
 * Move an icon to a new set.
 * @param {number} id - The ID of the icon to move.
 * @param {number} set_id - The ID of the set to move the icon to.
 * @example
 * PUT /api/icon/move/60/54
 * @returns {object} - The HTTP response.
 */
router.put(
    '/move/:id([0-9]+)/:set_id([0-9]+)',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const itemId = utils.$get(req, 'params.id');
        const setId  = utils.$get(req, 'params.set_id');

        if (! itemId || ! setId) {
            throw new AppError(
                'Item ID and Set ID required to move asset between sets', 
                400
            );
        }

        const item   = await DB.icons.query().findById(itemId);
        const oldSet = await DB.sets.query().findById(item.set_id);
        const newSet = await DB.sets.query().findById(setId);

        // ====================================================================
        // Verify icon exists.
        // ====================================================================
        if (! item) {
            throw new AppError(
                `Icon with ID ${itemId} does not exist`,
                404
            );
        }

        // ====================================================================
        // Verify target set exists.
        // ====================================================================
        if (! newSet) {
            throw new AppError(
                `Set with ID ${setId} does not exist`,
                404
            );
        }

        // ====================================================================
        // Verify target set is not the same as the current set.
        // ====================================================================
        if (oldSet.id === newSet.id) {
            throw new AppError(
                `Icon with ID ${itemId} is already in set with ID ${setId}`,
                400
            );
        }

        // ====================================================================
        // Verify target set is the same product type (icon, Icon, etc.).
        // ====================================================================
        if (oldSet.type_id !== newSet.type_id) {
            throw new AppError(
                `The product type of the source set and target set must match when moving assets.`,
                400
            );
        }

        // ====================================================================
        // Ok to move the icon.
        // ====================================================================
        await DB.icons.query().findById(itemId).patch({
            set_id: newSet.id,
        })

        return res.status(200).json({
            success: true,
            message: `Icon with ID ${itemId} has been moved to Set ${newSet.name} successfully!`
        });
    })
);

/**
 * Activate Icon.
 * @example
 * PUT /api/icon/60/activate
 */
router.put(
    '/:id([0-9]+)/activate',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const itemId = utils.$get(req, 'params.id', null);
        if (!itemId) {
            throw new AppError(config.BAD_REQUEST_ERROR, 400);
        }
        await DB.icons.query().findById(itemId).patch(req?.body.icon)
        return res.status(200).json({
            success: true,
            message: `Icon with ID ${itemId} has been updated successfully!`
        });
    })
);

/**
 * Delete Icon.
 * @example
 * DELETE /api/icon/60
 */
router.delete(
    '/:id([0-9]+)',
    auth,
    role.checkRole(
        role.ROLES.Admin,
        role.ROLES.Contributor,
    ),
    contextCheck,
    catchAsync(async (req, res) => {
        const itemId = utils.$get(req, 'params.id', null);
        if (!itemId) {
            return res.status(400).json({ error: `ID required to delete icon` });
        }
        await DB.icons.query().patch({is_deleted: true}).findById(itemId)
        await manageTagsOnEntityRemove({ id: +itemId }, enums.entityType.Icon)

        // =========================================================================
        // Delete the favorites
        // =========================================================================
        utils.deleteFavoritesByEntityTypeAndId('icon', itemId);
        
        return res.status(200).json({
            success: true,
            message: `Icon with ID ${itemId} has been deleted successfully!`,
        });
    })
);

// =========================================================================

// Export router.
module.exports = router;