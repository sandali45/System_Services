import "dotenv/config";
import app from "./app.js";
import pool from "./config/db.js";

const port = Number(process.env.PORT || 3002);

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");

    app.listen(port, () => {
      console.log(
        `System Services API running at http://localhost:${port}`
      );
    });
  } catch (error) {
    console.error("Failed to start API:", error);
    process.exit(1);
  }
}

start();
