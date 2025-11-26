import OpenAI from "openai";
import { reverseGeocode, LocationInfo } from "./location.service";

type Category = "menu" | "supermarket" | "attraction";

interface AnalyzeParams {
  apiKey: string;
  model: string;
  text: string;
  imageBase64: string[];
  category: Category;
  location: {
    lat: number;
    lng: number;
  };
}

export interface AnalyzeResult {
  model: string;
  location: LocationInfo & {
    lat: number;
    lng: number;
  };
  category: Category;
  promptUsed: string;
  content: string;
}

/**
 * 給 user content 用的簡化型別
 * （結構上與 OpenAI 的 ChatCompletionContentPart 相容）
 */
type UserContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
        detail?: "auto" | "low" | "high";
      };
    };

const buildSystemPrompt = (category: Category) => {
  // 根據不同 category 做簡單的角色設定
  switch (category) {
    case "menu":
      return `
你是一位餐廳助手。
請翻譯並解釋菜單內容，包含菜名、食材和烹飪方式等資訊，內容需精簡但具資訊量，並著重於提供旅客實用的建議。
`.trim();
    case "supermarket":
      return `
你是一位超市與商品助手。
請解說超市的商品、它們的常見用途，以及相關的文化背景。
重點是協助旅客判斷是否值得購買，以及買回去後該如何使用。
`.trim();
    case "attraction":
      return `
你是一位旅遊景點導覽助手。
請解說該景點的歷史、文化背景，以及任何實用的參觀建議。
`.trim();
    default:
      return "You are a helpful travel assistant.";
  }
};

const buildUserPrompt = (
  text: string,
  category: Category,
  locInfo: LocationInfo & { lat: number; lng: number }
) => {
  return `
使用者目前所在地：
	•	國家：${locInfo.country}
	•	地區：${locInfo.region}
	•	城市：${locInfo.city ?? "Unknown"}
	•	座標：(${locInfo.lat}, ${locInfo.lng})

分類：${category}

使用者的文字／問題：
${text || "(沒有提供文字，主要依靠圖片與定位)"}

回答時請遵循以下原則：
	•	一律假設使用者是旅客，可能不熟悉當地語言與文化。
	•	使用清楚、簡單的語句。
	•	若有需要，可提及當地習俗或「當地人通常怎麼做」。
`.trim();
};

/**
 * 把前端送來的 base64 正規化成 data URL
 * - 如果已經是 data:image/...;base64, 就原樣回傳
 * - 否則預設當作 image/jpeg
 */
const toDataUrl = (base64: string): string => {
  if (!base64) return base64;
  if (base64.startsWith("data:")) {
    return base64;
  }
  return `data:image/jpeg;base64,${base64}`;
};

export const analyzeWithOpenAI = async (
  params: AnalyzeParams
): Promise<AnalyzeResult> => {
  const { apiKey, model, text, imageBase64, category, location } = params;

  const client = new OpenAI({ apiKey });

  // 1. 反查 location
  const locInfo = await reverseGeocode(location.lat, location.lng);

  const systemPrompt = buildSystemPrompt(category);
  const userPrompt = buildUserPrompt(text, category, {
    ...locInfo,
    lat: location.lat,
    lng: location.lng,
  });

  // 2. 準備 messages（支援圖片）
  const userContent: UserContentPart[] = [];

  // 先放文字
  userContent.push({
    type: "text",
    text: userPrompt,
  });

  // 再放圖片（如果有）
  // 注意：要使用 vision 功能，你的 model 必須支援（例如 gpt-4.1, gpt-4.1-mini, gpt-4o 系列）
  if (imageBase64 && imageBase64.length > 0) {
    for (const base64 of imageBase64) {
      if (!base64) continue;

      userContent.push({
        type: "image_url",
        image_url: {
          url: toDataUrl(base64),
          detail: "auto",
        },
      });
    }
  }

  const chat = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        // 這裡的型別會被視為 ChatCompletionContentPart[]
        content: userContent,
      },
    ],
  });

  // 3. 把回傳內容整理成純文字（兼容 string 與 array 兩種情況）
  const rawContent = chat.choices[0]?.message?.content as
    | string
    | Array<{ type: string; text?: string }>
    | undefined;

  let contentText = "";

  if (typeof rawContent === "string") {
    contentText = rawContent;
  } else if (Array.isArray(rawContent)) {
    contentText = rawContent
      .map((part) => (part.type === "text" ? part.text ?? "" : ""))
      .join("\n")
      .trim();
  }

  return {
    model,
    location: {
      ...locInfo,
      lat: location.lat,
      lng: location.lng,
    },
    category,
    promptUsed: userPrompt,
    content: contentText,
  };
};