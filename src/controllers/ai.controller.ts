import { Request, Response, NextFunction } from "express";
import { analyzeWithOpenAI } from "../services/ai.service";

type Category = "menu" | "supermarket" | "attraction";

interface Location {
  lat: number;
  lng: number;
}

interface AnalyzeRequestBody {
  text: string;
  imageBase64: string[];
  category: Category;
  location: Location;
}

export const analyzeContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.header("apiKey");
    const aiModel = req.header("aiModel");

    if (!apiKey) {
      return res.status(400).json({ message: "Missing header: apiKey" });
    }
    if (!aiModel) {
      return res.status(400).json({ message: "Missing header: aiModel" });
    }

    const body = req.body as AnalyzeRequestBody;

    if (!body) {
      return res.status(400).json({ message: "Missing body" });
    }

    const { text, imageBase64, category, location } = body;

    if (!text && (!imageBase64 || imageBase64.length === 0)) {
      return res
        .status(400)
        .json({ message: "Either text or imageBase64 is required" });
    }

    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(400).json({
        message: "location with numeric lat and lng is required",
      });
    }

    if (!["menu", "supermarket", "attraction"].includes(category)) {
      return res.status(400).json({
        message: "Invalid category. Must be one of menu | supermarket | attraction",
      });
    }

    const result = await analyzeWithOpenAI({
      apiKey,
      model: aiModel,
      text,
      imageBase64: imageBase64 || [],
      category,
      location,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
};