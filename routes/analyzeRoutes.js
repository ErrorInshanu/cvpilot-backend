const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const PDFParser = require("pdf2json");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/", async (req, res) => {
  try {
    const { resumePdfBase64, jobDescription } = req.body;

    if (!resumePdfBase64) {
      return res.status(400).json({ message: "Resume PDF is required" });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(resumePdfBase64, "base64");

    // Extract text using pdf2json
    let resumeText = "";
    try {
      resumeText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          const text = pdfData.Pages?.map(page =>
            page.Texts?.map(t =>
              decodeURIComponent(t.R?.map(r => r.T).join(""))
            ).join(" ")
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

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ message: "Could not extract text from PDF." });
    }

    resumeText = resumeText.substring(0, 8000);
    console.log("Extracted text preview:", resumeText.substring(0, 200));

    const prompt = `You are an expert ATS resume analyzer and career coach. Analyze the following resume thoroughly.

${jobDescription ? `The user is applying for this role:\n${jobDescription}\n` : "Perform a general resume analysis."}

RESUME TEXT:
${resumeText}

Return a JSON object with EXACTLY this structure (no extra text, no markdown, just pure JSON):
{
  "atsScore": <number 0-100>,
  "verdict": "<one of: Excellent | Good | Needs Work | Major Issues>",
  "verdictMessage": "<one sentence summary>",
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "grammarIssues": [
    {
      "original": "<weak phrase found in resume>",
      "suggestion": "<stronger alternative>",
      "reason": "<why this is better>"
    }
  ],
  "sectionFeedback": {
    "summary": "<feedback string>",
    "experience": "<feedback string>",
    "education": "<feedback string>",
    "skills": "<feedback string>",
    "overall": "<feedback string>"
  },
  "improvements": ["improvement1", "improvement2"],
  "whatToRemove": ["item1", "item2"],
  "strengths": ["strength1", "strength2"]
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2048,
    });

    const rawText = completion.choices[0]?.message?.content || "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse error:", e, rawText);
      return res.status(500).json({ message: "Failed to parse analysis", raw: rawText });
    }

    return res.json({ success: true, analysis });
  } catch (error) {
    console.error("Analyze route error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;