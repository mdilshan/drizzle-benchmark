## Introduction
This benchmark is conducted to identify any major performance issues compared to the native SQL queries. The individual values may not provide a clear meaning, as the data we parse in both versions is different.

For example, in the raw SQL query version, we parse and send more data through HTTP. Therefore, we should expect some performance drop in the native SQL query version. However, relative to one another, the native SQL queries are still performing better, and Drizzle ORM is also performing well compared to classic ORMs.

## Prerequisite
1. You need [docker](https://docs.docker.com/get-started/get-docker/) to run the pg server
2. You will need [wrk](https://github.com/wg/wrk) to run the test

## Steps to run benchmark
1. Clone the repo and run `npm install` to install all the packages
2. Run `docker compose up -d` in the root directory to setup a new pg server with pg admin
3. Run `npm run seed` to populate the database. Once complete log into pg admin and ensure the db is populated
4. Now run `npm run generate` to generate request urls based on the database data. The generated data will be output into `data` directory
5. Start the server you want to benchmark `npm run server:drizzle` or `npm run server:pg`
6. Finally run `npm run bench` to start the benchmark for the running server

Data generationg and drizzle benchmark queries were used from - https://github.com/drizzle-team/drizzle-benchmarks
