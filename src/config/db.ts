import { Pool, PoolClient } from "pg"

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
        process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
})

db.connect((err: Error | undefined, client: PoolClient | undefined, release: (release?: unknown) => void) => {
    if (err || !client) {
        console.error("❌ DB Connection Error:", err)
    } else {
        console.log("✅ PostgreSQL Connected via DATABASE_URL")
        release()
    }
})

export default db

// import mysql from "mysql2/promise"

// const db = mysql.createPool({
//     uri: process.env.DATABASE_URL,
//     ssl:
//         process.env.NODE_ENV === "production"
//             ? { rejectUnauthorized: false }
//             : undefined,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0,
// })

// // Test connection on startup
// db.getConnection()
//     .then((conn) => {
//         console.log("✅ MySQL Connected via DATABASE_URL")
//         conn.release()
//     })
//     .catch((err: Error) => {
//         console.error("❌ DB Connection Error:", err.message)
//     })

// export default db
