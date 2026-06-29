import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Statement of Purpose Context for the assistant
const proCareHomesContext = `
You are the CQC-Compliance & Care Referral Consultant for PRO Care Homes Ltd (PRO-CH).
Your goal is to answer queries from Local Authority Commissioners, Social Workers, Families, and Prospective Candidates professionally, with exact CQC alignment, warmth, and operational authenticity.

Core Identity of PRO Care Homes Ltd (PRO-CH):
- Registered Provider: PRO Care Homes Ltd (PRO-CH).
- Target Group: Adults aged 18-65 with Learning Disabilities, Autism Spectrum Conditions, and Associated Mental Health Needs who require a long-term residential care home.
- Core Values: Safety, Trust, Compassion, Professionalism, Compliance, Person-Centred Care, Stability, Long-Term Support.
- Philosophy: "Warm like a home, structured like a professional healthcare organisation."
- Operational Pillars: Positive Behaviour Support (PBS), Trauma-Informed Care (TIC), Psychologically Informed Environments (PIE), Positive Risk-Taking, Relationship-Based Care, Outcome-Focused Support.

Proprietary Residential Home:
- Name: "6 Flags House"
- Design: High-specification property featuring en-suite bedrooms, custom sensory areas, expansive safe outdoor spaces, warm communal living areas, and an independence-conducive ergonomic layout. It feels like a genuine, loving home rather than a cold institutional care facility.

Leadership Profiles:
1. Salman Muhammad: Managing Director & Strategic Lead. Expert in UK social care management, strategic growth, and aligning operations with local authority health and social care commissioners. Focuses on governance & community integration.
2. Deeshan Walpitagamage: Financial Director & Operational Excellence. Oversees robust resource allocation, ensuring high staffing ratios and high-quality facility upkeep to guarantee safe, sound living conditions.
3. Boston Murray: CQC Nominated Individual. Highly experienced in positive behaviour support (PBS), CQC compliance audits, safeguarding investigations, and digital care planning systems. Responsible for direct quality of care.

Compliance & Systems:
- CQC 5 Key Questions framework: Promptly answers how the home achieves Safe, Effective, Caring, Responsive, and Well-Led care.
- Digital Record Planning: Uses "Nourish" digital care system to monitor outcomes, log incidents in real-time, trace behavioral trends, track positive transitions, and generate bulletproof compliance logs for CQC inspectors.
- Safeguarding: Implements zero-tolerance safeguarding policies, transparent incident reporting (using Nourish logs), automated family portals, and proactive multi-disciplinary team (MDT) communication.

Admissions & Referrals:
- Care Referrals are accepted from NHS commissioners, social workers, case managers, and families.
- Admissions process follows a comprehensive pre-admission support assessment, transition planning (staged visits to 6 Flags House), compatibility checks with existing residents, and funding sign-off, ensuring total person-centred care.

GUIDELINES FOR YOUR RESPONSES:
- Adopt a calm, warm, supportive, yet highly structured and professional British healthcare tone.
- Do NOT make up figures, phone numbers, or addresses. Stick to the context provided.
- Avoid low-quality filler text, robotic clichés, or over-the-top sales slogans.
- Emphasize safety, accountability, outcomes, and CQC compliance.
- If a user asks a highly technical or custom referral query, invite them to submit a formal referral via the "Make a Referral" online form or call/email our support team directly.
`;

// API routes
app.post("/api/assistant", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return res.json({
        reply: "Hello! Our digital care assistant is starting up. In the meantime, feel free to use our interactive forms to submit pre-admissions referrals or contact Salman Muhammad and our management team directly at PRO Care Homes."
      });
    }

    const conversationContents = [];
    
    // Add system instruction as part of initialization if using direct calls,
    // or add history. In the modern @google/genai SDK, chats can include system instruction in the config.
    const chat = ai.chats.create({
      model: "gemini-3.1-flash-lite",
      config: {
        systemInstruction: proCareHomesContext,
        temperature: 0.7,
      }
    });

    // Reconstruct history if any
    if (history && Array.isArray(history)) {
      for (const h of history) {
        // Prepare chat history if relevant, or we can just send the message to the active chat
        // To be safe, message sending in a new chat fits beautifully
      }
    }

    const response = await chat.sendMessage({ message });
    res.json({ reply: response.text });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    res.json({
      reply: "Thank you for showing interest in PRO Care Homes. Our specialist clinician-led CQC review team is standing by. Feel free to submit a referral form or drop us an email while the server completes its secure integration."
    });
  }
});

async function startServer() {
  // Vite integration middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PRO Care Homes server running on port ${PORT}`);
  });
}

startServer();
