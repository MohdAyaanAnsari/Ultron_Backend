import { Router, Request, Response } from "express"
import db from "../config/db"

const router = Router()

router.get(
    "/",
    async (_req: Request, res: Response) => {
        try {
            const result = await db.query(
                `SELECT DISTINCT category FROM faq WHERE category IS NOT NULL ORDER BY category`
            )

            const categories = result.rows.map((r: { category: string }) => r.category)

            res.json({ success: true, data: categories })
        } catch (err) {
            console.error("❌ /categories error:", (err as Error).message)
            res.status(500).json({ success: false, error: "Failed to fetch categories" })
        }
    }
)

export default router
