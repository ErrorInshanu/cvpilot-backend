const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const PDFParser = require("pdf2json");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Clean spaced-out PDF text ────────────────────────────────────────────────
// Handles: "S h a n u", "c o m", "0 8 / 2023", "B C A" etc.
function cleanPdfText(text) {
  return text
    // Fix single letters separated by spaces: "S h a n u" → "Shanu"
    .replace(/\b([a-zA-Z])\s(?=[a-zA-Z]\s|[a-zA-Z]\b)/g, "$1")
    // Fix spaced digits in years/dates: "0 8 / 2 0 2 3" → "08/2023"
    .replace(/(\d)\s(?=\d)/g, "$1")
    // Fix common spaced patterns like "@ gmail" → "@gmail" and "g m a i l" → "gmail"
    .replace(/\s@\s/g, "@")
    .replace(/\s\.\s/g, ".")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── Call Groq with retry ─────────────────────────────────────────────────────
async function callGroq(prompt, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a JSON-only API. You must always respond with valid JSON and nothing else. No markdown, no backticks, no explanation. Only a raw JSON object.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      });

      const raw = completion.choices[0]?.message?.content || "";
      const stripped = raw.replace(/```json|```/g, "").trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      console.warn(`Attempt ${i + 1}: No JSON found in response, retrying...`);
    } catch (e) {
      console.warn(`Attempt ${i + 1} failed:`, e.message);
      if (i === retries - 1) throw e;
    }
  }
  throw new Error("Failed to get valid JSON from Groq after retries");
}

router.post("/", async (req, res) => {
  try {
    const { resumePdfBase64, jobDescription } = req.body;

    if (!resumePdfBase64) {
      return res.status(400).json({ message: "Resume PDF is required" });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(resumePdfBase64, "base64");

    // ── Extract text using pdf2json ──
    let rawText = "";
    try {
      rawText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          const text = pdfData.Pages?.map(page =>
            page.Texts?.map(t => {
              try {
                return decodeURIComponent(t.R?.map(r => r.T).join(""));
              } catch {
                return t.R?.map(r => r.T).join("") || "";
              }
            }).join(" ")
          ).join("\n") || "";

          resolve(text.trim());
        });

        pdfParser.on("pdfParser_dataError", reject);
        pdfParser.parseBuffer(pdfBuffer);
      });
    } catch (e) {
      console.error("PDF parse error:", e);
      return res.status(400).json({ message: "Could not read PDF. Please try a different file." });
    }

    // ── Clean the extracted text ──
    const resumeText = cleanPdfText(rawText).substring(0, 8000);
    console.log("Cleaned text preview:", resumeText.substring(0, 300));

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ message: "Could not extract text from PDF. Please try a text-based PDF." });
    }

    // ── Build prompt ──
    const prompt = `Analyze this resume and return ONLY a JSON object. No text before or after the JSON.

${jobDescription ? `Job Description:\n${jobDescription}\n\n` : ""}Resume:\n${resumeText}

Return this exact JSON structure:
{
  "atsScore": <number 0-100>,
  "verdict": "<Excellent | Good | Needs Work | Major Issues>",
  "verdictMessage": "<one sentence>",
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "grammarIssues": [{"original": "weak phrase", "suggestion": "better phrase", "reason": "why"}],
  "sectionFeedback": {
    "summary": "<feedback>",
    "experience": "<feedback>",
    "education": "<feedback>",
    "skills": "<feedback>",
    "overall": "<feedback>"
  },
  "improvements": ["item1", "item2"],
  "whatToRemove": ["item1", "item2"],
  "strengths": ["item1", "item2"]
}`;

    // ── Call Groq with retry ──
    let analysis;
    try {
      analysis = await callGroq(prompt);
    } catch (e) {
      console.error("Groq error after retries:", e.message);
      return res.status(500).json({ message: "Analysis failed. Please try again." });
    }

    return res.json({ success: true, analysis });

  } catch (error) {
    console.error("Analyze route error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;