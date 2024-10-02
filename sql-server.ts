import express from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import pg from "pg";
import { eq, sql, asc } from "drizzle-orm";
import {
    customers,
    details,
    employees,
    orders,
    products,
    suppliers,
} from "./schema";

const pool = new pg.Pool({
    user: 'admin',
    host: 'localhost',
    database: 'postgres',
    password: 'root',
    port: 5432,
});
const db = drizzle(pool, { schema, logger: false });

const p6 = db.query.suppliers
    .findMany({
        limit: sql.placeholder("limit"),
        offset: sql.placeholder("offset"),
        orderBy: suppliers.id,
    })
    .prepare("p6");

const p6_sql = `
    SELECT * FROM suppliers
    ORDER BY id
    LIMIT $1
    OFFSET $2
`;

const p7_sql = `
    SELECT * FROM suppliers
    WHERE id = $1
`;

const p8_sql = `
    SELECT * FROM products
    ORDER BY id
    LIMIT $1
    OFFSET $2
`;

const p9_sql = `
    SELECT p.*, s.*
    FROM products p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = $1
`;

const p10_sql = `
    SELECT * FROM products
    WHERE to_tsvector('english', name) @@ to_tsquery('english', $1)
`;

const p11_sql = `
    SELECT o.id, o.shipped_date, o.ship_name, o.ship_city, o.ship_country,
        count(d.product_id)::int as products_count,
        sum(d.quantity)::int as quantity_sum,
        sum(d.quantity * d.unit_price)::real as total_price
    FROM orders o
    LEFT JOIN order_details d ON d.order_id = o.id
    GROUP BY o.id
    ORDER BY o.id
    LIMIT $1
    OFFSET $2
`;

const p12_sql = `
    SELECT o.id, o.shipped_date, o.ship_name, o.ship_city, o.ship_country,
        count(d.product_id)::int as products_count,
        sum(d.quantity)::int as quantity_sum,
        sum(d.quantity * d.unit_price)::real as total_price
    FROM orders o
    LEFT JOIN order_details d ON d.order_id = o.id
    WHERE o.id = $1
    GROUP BY o.id
    ORDER BY o.id
`;

const p13_sql = `
    SELECT o.*, d.*, p.*
    FROM orders o
    LEFT JOIN order_details d ON d.order_id = o.id
    LEFT JOIN products p ON d.product_id = p.id
    WHERE o.id = $1
`;

const app = express() as any;

// request logger
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

const p1_sql = `
    SELECT * FROM customers
    ORDER BY id
    LIMIT $1
    OFFSET $2
`;

const p2_sql = `
    SELECT * FROM customers
    WHERE id = $1
`;

const p3_sql = `
    SELECT * FROM customers
    WHERE to_tsvector('english', company_name) @@ to_tsquery('english', $1)
`;

const p4_sql = `
    SELECT * FROM employees
    ORDER BY id
    LIMIT $1
    OFFSET $2
`;

const p5_sql = `
    SELECT e.*, r.*
    FROM employees e
    LEFT JOIN employees r ON e.recipient_id = r.id
    WHERE e.id = $1
`

app.get("/customers", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);

    const result = await pool.query(p1_sql, [limit, offset]);
    return res.json(result?.rows);
});

app.get("/customer-by-id", async (req, res) => {
    const id = req.query["id"];
    const result = await pool.query(p2_sql, [id]);
    return res.json(result?.rows);
});

app.get("/search-customer", async (req, res) => {
    // const term = `%${req.query("term")}%`;
    const term = `${req.query["term"]}:*`;
    const result = await pool.query(p3_sql, [term]);
    return res.json(result?.rows);
});

app.get("/employees", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);
    const result = await pool.query(p4_sql, [limit, offset]);
    return res.json(result?.rows);
});

app.get("/employee-with-recipient", async (req, res) => {
    const id = req.query["id"];
    const result = await pool.query(p5_sql, [id]);
    return res.json(result?.rows);
});

app.get("/suppliers", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);

    const result = await pool.query(p6_sql, [limit, offset]);
    return res.json(result?.rows);
});

app.get("/supplier-by-id", async (req, res) => {
    const id = req.query["id"];
    const result = await pool.query(p7_sql, [id]);
    return res.json(result?.rows);
});

app.get("/products", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);

    const result = await pool.query(p8_sql, [limit, offset]);
    return res.json(result?.rows);
});

app.get("/product-with-supplier", async (req, res) => {
    const id = req.query["id"];
    const result = await pool.query(p9_sql, [id]);
    return res.json(result?.rows);
});

app.get("/search-product", async (req, res) => {
    // const term = `%${req.query("term")}%`;
    const term = `${req.query["term"]}:*`;
    const result = await pool.query(p10_sql, [term]);
    return res.json(result?.rows);
});

app.get("/orders-with-details", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);

    const result = await pool.query(p11_sql, [limit, offset]);
    return res.json(result?.rows);
});

app.get("/order-with-details", async (req, res) => {
    const id = req.query["id"];
    const result = await pool.query(p12_sql, [id]);
    return res.json(result?.rows);
});

app.get("/order-with-details-and-products", async (req, res) => {
    const id = req.query["id"];
    const result = await pool.query(p13_sql, [id]);
    return res.json(result?.rows);
});

app.listen(4000, () => {
    console.log("Server is running on http://localhost:4000");
})


