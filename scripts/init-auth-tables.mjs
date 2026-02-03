import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL. Example: mysql://USER:PASSWORD@127.0.0.1:3306/DB_NAME",
  );
  process.exit(1);
}

const sql = readFileSync(new URL("./better-auth.mysql.sql", import.meta.url), "utf8");

const connection = await mysql.createConnection({
  uri: databaseUrl,
  multipleStatements: true,
});

try {
  await connection.query(sql);
  const [tables] = await connection.query("SHOW TABLES");
  console.log("Better Auth tables are ready:");
  console.table(tables);
} finally {
  await connection.end();
}
