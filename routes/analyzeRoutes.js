const express = require("express");
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

router.post("/", async (req, res) => {
  try {
    const { resumePdfBase64, jobDescription } = req.body;

    if (!resumePdfBase64) {
      return res.status(400).json({ message: "Resume PDF is required" });
    }

    const prompt = `You are an expert ATS resume analyzer and career coach. Analyze the provided resume PDF thoroughly.

${jobDescription ? `The user is applying for this role:\n${jobDescription}\n` : "Perform a general resume analysis."}

Analyze the resume and return a JSON object with EXACTLY this structure (no extra text, just JSON):

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

    const geminiBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: "application/pdf",
                data: resumePdfBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(500).json({ message: "Gemini API error", detail: errText });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean and parse JSON
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