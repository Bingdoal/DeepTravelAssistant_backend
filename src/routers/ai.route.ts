import { Router } from "express";
import { analyzeContent } from "../controllers/ai.controller";

export const aiRouter = Router();

/**
 * POST /api/ai/analyze
 * Header:
 *  - apiKey: string (OpenAI API key)
 *  - aiModel: string (e.g. gpt-4.1-mini)
 *
 * Body:
 *  - text: string
 *  - imageBase64: string[]
 *  - category: "menu" | "supermarket" | "attraction"
 *  - location: { lat: number; lng: number }
 */
aiRouter.post("/analyze", analyzeContent);