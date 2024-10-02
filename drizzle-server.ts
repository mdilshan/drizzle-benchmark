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

const p1 = db.query.customers
    .findMany({
        limit: sql.placeholder("limit"),
        offset: sql.placeholder("offset"),
        orderBy: customers.id,
    })
    .prepare("p1");

const p2 = db.query.customers
    .findFirst({
        where: eq(customers.id, sql.placeholder("id")),
    })
    .prepare("p2");

const p3 = db.query.customers
    .findMany({
        where: sql`to_tsvector('english', ${customers.companyName
            }) @@ to_tsquery('english', ${sql.placeholder("term")})`,
    })
    .prepare("p3");

const p4 = db.query.employees
    .findMany({
        limit: sql.placeholder("limit"),
        offset: sql.placeholder("offset"),
        orderBy: employees.id,
    })
    .prepare("p4");

const p5 = db.query.employees
    .findMany({
        with: {
            recipient: true,
        },
        where: eq(employees.id, sql.placeholder("id")),
    })
    .prepare("p5");

const p6 = db.query.suppliers
    .findMany({
        limit: sql.placeholder("limit"),
        offset: sql.placeholder("offset"),
        orderBy: suppliers.id,
    })
    .prepare("p6");

const p7 = db.query.suppliers
    .findFirst({
        where: eq(suppliers.id, sql.placeholder("id")),
    })
    .prepare("p7");

const p8 = db.query.products
    .findMany({
        limit: sql.placeholder("limit"),
        offset: sql.placeholder("offset"),
        orderBy: products.id,
    })
    .prepare("p8");

const p9 = db.query.products
    .findMany({
        where: eq(products.id, sql.placeholder("id")),
        with: {
            supplier: true,
        },
    })
    .prepare("p9");

const p10 = db.query.products
    .findMany({
        where: sql`to_tsvector('english', ${products.name
            }) @@ to_tsquery('english', ${sql.placeholder("term")})`,
    })
    .prepare("p10");

const p11 = db
    .select({
        id: orders.id,
        shippedDate: orders.shippedDate,
        shipName: orders.shipName,
        shipCity: orders.shipCity,
        shipCountry: orders.shipCountry,
        productsCount: sql<number>`count(${details.productId})::int`,
        quantitySum: sql<number>`sum(${details.quantity})::int`,
        totalPrice: sql<number>`sum(${details.quantity} * ${details.unitPrice})::real`,
    })
    .from(orders)
    .leftJoin(details, eq(details.orderId, orders.id))
    .groupBy(orders.id)
    .orderBy(asc(orders.id))
    .limit(sql.placeholder("limit"))
    .offset(sql.placeholder("offset"))
    .prepare("p11");

const p12 = db
    .select({
        id: orders.id,
        shippedDate: orders.shippedDate,
        shipName: orders.shipName,
        shipCity: orders.shipCity,
        shipCountry: orders.shipCountry,
        productsCount: sql<number>`count(${details.productId})::int`,
        quantitySum: sql<number>`sum(${details.quantity})::int`,
        totalPrice: sql<number>`sum(${details.quantity} * ${details.unitPrice})::real`,
    })
    .from(orders)
    .leftJoin(details, eq(details.orderId, orders.id))
    .where(eq(orders.id, sql.placeholder("id")))
    .groupBy(orders.id)
    .orderBy(asc(orders.id))
    .prepare("p12");

const p13 = db.query.orders
    .findMany({
        with: {
            details: {
                with: {
                    product: true,
                },
            },
        },
        where: eq(orders.id, sql.placeholder("id")),
    })
    .prepare("p13");

const app = express() as any;

// request logger
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.get("/customers", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);
    const result = await p1.execute({ limit, offset });
    return res.json(result);
});

app.get("/customer-by-id", async (req, res) => {
    const result = await p2.execute({ id: req.query["id"] });
    return res.json(result);
});

app.get("/search-customer", async (req, res) => {
    // const term = `%${req.query("term")}%`;
    const term = `${req.query["term"]}:*`;
    const result = await p3.execute({ term });
    return res.json(result);
});

app.get("/employees", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);
    const result = await p4.execute({ limit, offset });
    return res.json(result);
});

app.get("/employee-with-recipient", async (req, res) => {
    const result = await p5.execute({ id: req.query["id"] });
    return res.json(result);
});

app.get("/suppliers", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);

    const result = await p6.execute({ limit, offset });
    return res.json(result);
});

app.get("/supplier-by-id", async (req, res) => {
    const result = await p7.execute({ id: req.query["id"] });
    return res.json(result);
});

app.get("/products", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);

    const result = await p8.execute({ limit, offset });
    return res.json(result);
});

app.get("/product-with-supplier", async (req, res) => {
    const result = await p9.execute({ id: req.query["id"] });
    return res.json(result);
});

app.get("/search-product", async (req, res) => {
    // const term = `%${req.query("term")}%`;
    const term = `${req.query["term"]}:*`;
    const result = await p10.execute({ term });
    return res.json(result);
});

app.get("/orders-with-details", async (req, res) => {
    const limit = Number(req.query["limit"]);
    const offset = Number(req.query["offset"]);

    const result = await p11.execute({ limit, offset });
    return res.json(result);
});

app.get("/order-with-details", async (req, res) => {
    const result = await p12.execute({ id: req.query["id"] });
    return res.json(result);
});

app.get("/order-with-details-and-products", async (req, res) => {
    const result = await p13.execute({ id: req.query["id"] });
    return res.json(result);
});

app.listen(4000, () => {
    console.log("Server is running on http://localhost:4000");
})

