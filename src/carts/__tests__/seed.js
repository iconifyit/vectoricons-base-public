const DB = require('@vectoricons.net/db');
const enums = require('../../utils/enums');

let testCounter = 0;

const seedOne = async (opts = {}) => {
    const { trx } = opts;
    testCounter++;

    return {
        user_id: 1,
        // subtotal: 100.00,
        // tax: 10.00,
        // discount: 5.00,
        // total: 105.00,
        status: enums.cartStatus.NotProcessed,
    };
};

// -- Table Definition ----------------------------------------------

// CREATE TABLE carts (
//     id SERIAL PRIMARY KEY,
//     user_id integer REFERENCES users(id),
//     subtotal numeric(10,2) DEFAULT '0'::numeric,
//     tax numeric(10,2) DEFAULT '0'::numeric,
//     discount numeric(10,2) DEFAULT '0'::numeric,
//     total numeric(10,2) DEFAULT '0'::numeric,
//     status character varying(255) DEFAULT 'Not processed'::character varying CHECK (status::text = ANY (ARRAY['Not processed'::character varying::text, 'Processing'::character varying::text, 'Shipped'::character varying::text, 'Delivered'::character varying::text, 'Cancelled'::character varying::text])),
//     created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
//     updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
// );

// -- Indices -------------------------------------------------------

// CREATE UNIQUE INDEX carts_pkey ON carts(id int4_ops);
// CREATE INDEX carts_id_index ON carts(id int4_ops);
// CREATE INDEX carts_status_index ON carts(status text_ops);


const seedMany = async (opts = {}) => {
    const { n = 5, trx } = opts;
    const items = [];
    for (let i = 0; i < n; i++) {
        testCounter++;
        items.push(await seedOne({ trx }));
    }

    return items;
};

module.exports = {
    seedOne,
    seedMany,
};
