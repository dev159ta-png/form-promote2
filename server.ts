import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // AI Analysis for Individual Evaluation
  app.post("/api/ai/analyze-evaluation", async (req, res) => {
    try {
      const { candidate, scoresSummary, formTitle, strengths, improvements } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Return structured smart feedback fallback if API key is not yet set
        return res.json({
          success: true,
          source: "local-heuristic",
          feedback: {
            strengthsSummary: strengths || "มีความมุ่งมั่นและรับผิดชอบต่อหน้าที่ที่ได้รับมอบหมายเป็นอย่างดี มีมนุษยสัมพันธ์และการทำงานร่วมกับผู้อื่นได้ราบรื่น",
            improvementAreas: improvements || "ควรเพิ่มพูนทักษะเฉพาะทางและการแก้ปัญหาเฉพาะหน้า รวมถึงการบันทึกสรุปผลงานอย่างเป็นรูปธรรม",
            developmentPlan: "1. เข้ารับการอบรมพัฒนาทักษะเฉพาะตำแหน่ง\n2. จัดทำคู่มือหรือเช็กลิสต์การปฏิบัติงานเพื่อเพิ่มประสิทธิภาพและความถูกต้อง",
            overallComment: `ผลการประเมินอยู่ในเกณฑ์ ${scoresSummary?.grade || "มาตรฐาน"} (คะแนนเฉลี่ย ${scoresSummary?.percentage?.toFixed(2) || "0.00"}%) แนะนำให้รักษามาตรฐานการปฏิบัติงานและพัฒนาตามข้อเสนอแนะ`,
          },
        });
      }

      const prompt = `
คุณคือผู้เชี่ยวชาญด้านการบริหารทรัพยากรบุคคลและการประเมินผลการปฏิบัติงานของสถาบันการศึกษาและหน่วยงานราชการ
โปรดวิเคราะห์ผลการประเมินและสร้างข้อเสนอแนะเชิงบวกและสร้างสรรค์ (Constructive Feedback) เป็นภาษาไทย

ข้อมูลผู้รับการประเมิน:
- ชื่อ-นามสกุล: ${candidate?.name || "ผู้รับการประเมิน"}
- ตำแหน่ง: ${candidate?.position || "ลูกจ้างชั่วคราว"} (${formTitle || "แบบประเมินผลการปฏิบัติงาน"})
- สังกัด/ฝ่าย: ${candidate?.department || "กลุ่มงานบริหารทั่วไป"}
- คะแนนรวมที่ได้: ${scoresSummary?.totalScore} จาก ${scoresSummary?.maxScore} (${scoresSummary?.percentage?.toFixed(2)}%)
- ระดับผลการประเมิน: ${scoresSummary?.grade}
- ข้อคิดเห็นจุดเด่นจากกรรมการ: ${strengths || "ไม่มีระบุ"}
- ข้อควรปรับปรุงจากกรรมการ: ${improvements || "ไม่มีระบุ"}

โปรดตอบเป็น JSON object ที่มีโครงสร้างดังนี้:
{
  "strengthsSummary": "สรุปจุดเด่นและสมรรถนะที่ทำได้ดีมาก 2-3 ประเด็นอย่างสร้างสรรค์",
  "improvementAreas": "ข้อควรพัฒนาหรือจุดที่สามารถยกระดับการทำงานให้มีประสิทธิภาพยิ่งขึ้น",
  "developmentPlan": "แผนพัฒนาตนเองรายบุคคล (IDP) 2-3 ข้อที่ทำได้จริงและวัดผลได้",
  "overallComment": "บทสรุปภาพรวมความคิดเห็นของคณะกรรมการอย่างเป็นทางการและให้กำลังใจ"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);

      return res.json({
        success: true,
        source: "gemini-ai",
        feedback: parsed,
      });
    } catch (error: any) {
      console.error("AI Evaluation error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการประมวลผล AI",
      });
    }
  });

  // AI Executive Summary for All Evaluations
  app.post("/api/ai/executive-summary", async (req, res) => {
    try {
      const { summaryStats, departmentStats } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          success: true,
          source: "local-heuristic",
          summary: "ภาพรวมการประเมินผลการปฏิบัติงานบุคลากรพบว่า บุคลากรส่วนใหญ่อยู่ในระดับ 'ดีมาก' ถึง 'ยอดเยี่ยม' โดยคะแนนเฉลี่ยรวมทุกสายงานอยู่ในเกณฑ์มาตรฐาน การประเมินดำเนินไปด้วยความโปร่งใสและครอบคลุมทุกมิติภาระงาน",
        });
      }

      const prompt = `
โปรดเขียนรายงานสรุปผลการประเมินภาพรวม (Executive Summary) สำหรับผู้บริหาร/ผู้อำนวยการโรงเรียนหรือสถาบันการศึกษา
ข้อมูลสถิติภาพรวม:
${JSON.stringify(summaryStats, null, 2)}
ข้อมูลแยกตามฝ่าย/สายงาน:
${JSON.stringify(departmentStats, null, 2)}

โปรดเขียนรายงานสรุปที่มีสาระสำคัญ 3 ส่วน:
1. ภาพรวมผลคะแนนและสัดส่วนระดับผลการประเมิน (ยอดเยี่ยม, ดีมาก, ดี, พอใช้, ปรับปรุง)
2. จุดแข็งขององค์กรและกลุ่มงานที่มีผลงานโดดเด่น
3. ข้อเสนอแนะเชิงนโยบายเพื่อการพัฒนาบุคลากรในรอบประเมินถัดไป
ใช้ภาษาทางการ นุ่มนวล ชัดเจน และกระชับ
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      return res.json({
        success: true,
        source: "gemini-ai",
        summary: response.text,
      });
    } catch (error: any) {
      console.error("Executive summary AI error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "เกิดข้อผิดพลาดในการสร้างสรุปผู้บริหาร",
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Performance Evaluation System Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
