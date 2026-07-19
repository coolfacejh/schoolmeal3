import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let aiClient: any = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
app.use(express.json());

// API 1: School Search
app.get("/api/school/search", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "학교 이름을 입력해 주세요." });
    }

    const response = await fetch(
      `https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&pSize=30&SCHUL_NM=${encodeURIComponent(name)}`
    );
    const data = await response.json();

    if (!data.schoolInfo) {
      return res.status(404).json({ error: "검색 결과가 없거나 잘못된 요청입니다." });
    }

    const rows = data.schoolInfo[1].row;
    const schools = rows.map((row: any) => ({
      atptCode: row.ATPT_OFCDC_SC_CODE,
      atptName: row.ATPT_OFCDC_SC_NM,
      schoolCode: row.SD_SCHUL_CODE,
      schoolName: row.SCHUL_NM,
      address: row.ORG_RDNMA,
      type: row.SCHUL_KND_SC_NM,
    }));

    return res.json({ schools });
  } catch (error: any) {
    console.error("School search error:", error);
    return res.status(500).json({ error: "학교 검색 중 서버 오류가 발생했습니다." });
  }
});

// API 2: Retrieve meal list for a given date and school
app.get("/api/meal", async (req, res) => {
  try {
    const { atptCode, schoolCode, date } = req.query;
    if (!atptCode || !schoolCode || !date) {
      return res.status(400).json({ error: "필수 파라미터가 누락되었습니다." });
    }

    const response = await fetch(
      `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${atptCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${date}`
    );
    const data = await response.json();

    if (!data.mealServiceDietInfo) {
      return res.json({ meals: [], message: "해당 날짜에 등록된 급식 식단이 없습니다." });
    }

    const rows = data.mealServiceDietInfo[1].row;
    const meals = rows.map((row: any) => {
      const rawDdish = row.DDISH_NM || "";
      const cleanItems = rawDdish
        .split(/<br\s*\/?>/gi)
        .map((item: string) => item.replace(/\([0-9.]+\)/g, "").trim())
        .filter((item: string) => item.length > 0);

      return {
        mealCode: row.MMEAL_SC_CODE,
        mealName: row.MMEAL_SC_NM,
        menu: cleanItems,
        calories: row.CAL_INFO,
        nutrition: row.NTR_INFO ? row.NTR_INFO.split(/<br\s*\/?>/gi).filter(Boolean) : [],
        origins: row.ORPLC_INFO ? row.ORPLC_INFO.split(/<br\s*\/?>/gi).filter(Boolean) : [],
      };
    });

    return res.json({ meals });
  } catch (error: any) {
    console.error("Meal retrieval error:", error);
    return res.status(500).json({ error: "급식 정보를 가져오는 중 서버 오류가 발생했습니다." });
  }
});

// API 3: Generate a funny review using Gemini
app.post("/api/meal/review", async (req, res) => {
  try {
    const { menu, mealName, schoolName } = req.body;
    if (!menu || !Array.isArray(menu) || menu.length === 0) {
      return res.status(400).json({ error: "리뷰할 급식 식단 메뉴 정보가 없습니다." });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.json({
        review: "⚠️ AI 한줄평을 사용하시려면 Settings > Secrets에 GEMINI_API_KEY를 추가해 주세요!",
        isConfigured: false,
      });
    }

    const ai = getGeminiClient();
    const menuString = menu.join(", ");
    const mealType = mealName || "급식";
    const prompt = `${schoolName ? `'${schoolName}' ` : ""}${mealType} 메뉴: [${menuString}]\n이 급식 메뉴들의 환상적인 비유와 코믹한 조화를 담아 유머러스한 한줄평을 써줘.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `
너는 대한민국 학교 급식의 맛을 위트 있게 분석하여 학생들에게 유머러스하고 찰진 한줄평을 써주는 '급식 맛도리 1타 평론가'야.
사용자가 제공하는 급식 반찬 메뉴들을 보고 다음 지침을 지켜서 극강의 재미있는 드립을 짜라:
1. 주메뉴와 디저트, 국물의 조합을 해학적으로 엮어야 한다. (예: 고기 반찬 찬양, 탄수화물 축제, 급식실 이모님의 빅픽처, 마라와 영양의 극적인 타협 등)
2. 학생들의 공감을 가득 일으키는 트렌디한 구어체 한글 표현(예: "~조합 기절한다", "~는 국룰", "~실화냐", "위장 개방 필수", "오늘 급식실 조기 마감 가능", "입안 가득 불꽃놀이 축제" 등)을 적극 사용해라.
3. 군더더기 없이 딱 '한 줄'(한 문장)로만 재기발랄하게 대답해라.
4. 마크다운 강조 기호(** 등), 불필요한 큰따옴표, 대괄호 등의 서식은 절대로 사용하지 말고, 아주 깔끔하게 문장 형태의 순수 텍스트만 출력해라.
5. 지나치게 격식 있는 문법이나 영양 분석은 금지하며, 오직 급식 맛의 희로애락과 유쾌함에 몰입해라.
`,
        temperature: 1.0,
      },
    });

    const review = response.text?.trim() || "급식실 입구 컷만 넘기면 위장이 꽉 차서 춤추게 만드는 마법의 식단!";
    return res.json({ review, isConfigured: true });
  } catch (error: any) {
    console.error("Gemini review generation error:", error);
    return res.status(500).json({ error: "AI 한줄평 생성 중 오류가 발생했습니다." });
  }
});

// Serve static assets or mount Vite middleware in standalone non-Vercel environment
async function setupHosting() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

if (!process.env.VERCEL) {
  setupHosting().then(() => {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  });
}

export default app;
