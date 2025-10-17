const DB = require('@vectopus.com/db');
const { cartStatus } = require('../../utils/enums');


class CartItemEntity {
    constructor(data) {
        this.id = data.id;
        this.cart_id = data.cart_id;
        this.entity_id = data.entity_id;
        this.entity_type = data.entity_type;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
        this.price = parseFloat(data.price || 0);
        this.image = data.image || null;
    }

    static from(data) {
        return new CartItemEntity(data);
    }

    static async getInstance(data) {
        if (!data) return null;
        const entity = new CartItemEntity(data);
        await entity.decorate();
        return entity;
    }

    // TODO: This code currently queries the database directly, which violates the SOLID principle.
    // This is a known piece of technical debt. We're doing a progressive refactor and had to draw
    // a line to avoid the rabbit hole of refactoring everything at once.
    // In a future iteration of CartService, this should be refactored to use a repository layer
    // or injected dependency rather than accessing DB directly.

    async decorate() {
        const imageItem = await DB.images.query()
            .select(
                "url",
                "object_key",
                "image_types.label as type_label",
                "image_types.value as type_name"
            )
            .leftJoin("image_types", "images.image_type_id", "image_types.id")
            .where("entity_id", this.entity_id)
            .where("entity_type", this.entity_type)
            .where("file_type", "png")
            .whereRaw("COALESCE(images.is_deleted, false) = false")
            .whereRaw("images.url IS NOT NULL")
            .first();

        this.image = {
            url         : imageItem.url,
            object_key  : imageItem.object_key,
            type_label  : imageItem.type_label,
            type_name   : imageItem.type_name,
        }
    }

    getPrice() {
        return this.price;
    }

    isFor(entityId, entityType) {
        return this.entity_id === entityId && this.entity_type === entityType;
    }

    isActive() {
        return this.is_active;
    }

    toJSON() {
        return {
            id          : this.id,
            cart_id     : this.cart_id,
            entity_id   : this.entity_id,
            entity_type : this.entity_type,
            is_active   : this.is_active,
            created_at  : this.created_at,
            updated_at  : this.updated_at,
            price       : this.price,
            image       : this.image,
        };
    }
}

module.exports = CartItemEntity;