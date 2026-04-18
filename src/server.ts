import "dotenv/config"
import express, { Request, Response } from "express"
import http from "http"
import https from "https"
import { Server } from "socket.io"
import cors from "cors"
import cron from "node-cron"

import db from "./config/db"
import { socketHandler, setDb } from "./sockets/socket"
import categoryRoutes from "./routes/categories.routes"

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express()

app.use(express.json())
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
)

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
    res.send("Server Running 🚀")
})

app.use("/api/faqs/categories", categoryRoutes)

// ── HTTP + Socket.IO server ───────────────────────────────────────────────────
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
    },
})

setDb(db)
socketHandler(io)

const PORT = process.env.PORT ?? 5000

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)

    if (process.env.NODE_ENV === "production") {
        const SELF_URL = process.env.SERVER_URL

        cron.schedule("*/5 * * * *", () => {
            if (!SELF_URL) return
            https.get(SELF_URL, (res) => {
                console.log(`✅ Keepalive ping → ${SELF_URL} [${res.statusCode}]`)
            }).on("error", (err) => {
                console.error(`❌ Keepalive ping failed:`, err.message)
            })
        })

        console.log(`🔔 Keepalive cron started — pinging ${SELF_URL} every 5 min`)
    }
})
