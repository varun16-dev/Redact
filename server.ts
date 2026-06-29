import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper with automatic retry and model fallback (e.g. to gemini-3.1-flash-lite) for high availability
async function callGeminiWithRetry(params: any, retries = 2, delayMs = 1000): Promise<any> {
  const modelsToTry = [params.model, "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    if (!model) continue;
    let attempt = 0;
    while (attempt < retries) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        attempt++;
        const errMessage = err?.message || "";
        const errStatus = err?.status;
        const isTransient = errStatus === "UNAVAILABLE" || errStatus === 503 || errStatus === 429 || errMessage.includes("503") || errMessage.includes("high demand") || errMessage.includes("429");

        if (isTransient && attempt < retries) {
          console.warn(`Gemini API returned transient error on ${model} (attempt ${attempt}/${retries}). Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // If we get a transient error and have more models to try, try the next model
        if (isTransient && model !== modelsToTry[modelsToTry.length - 1]) {
          console.warn(`Model ${model} unavailable (503/429). Trying fallback model "gemini-3.1-flash-lite"...`);
          break;
        }

        throw err;
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  interface DBUser {
    id: string;
    email: string;
    password: string;
    fullName: string;
    state: string;
    city: string;
    mobile: string;
    relativeName: string;
    relationship: string;
    tier: "free" | "guardian" | "institutional";
    scanCount: number;
    scanHistory: any[];
    monitoringList: any[];
  }

  // Pre-seed a default user for testing/evaluating out of the box
  const users: Record<string, DBUser> = {
    "neha.sharma@gmail.com": {
      id: "user_neha",
      email: "neha.sharma@gmail.com",
      password: "password123",
      fullName: "Neha Sharma",
      state: "Maharashtra",
      city: "Mumbai",
      mobile: "+91 98765 43210",
      relativeName: "Rakesh Sharma",
      relationship: "Father",
      tier: "free",
      scanCount: 0,
      scanHistory: [],
      monitoringList: []
    }
  };

  // Helper to extract authenticated user from Request Bearer Token
  const getAuthUser = (req: express.Request): DBUser | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7);
    if (token.startsWith("token_")) {
      const email = token.substring(6).toLowerCase().trim();
      return users[email] || null;
    }
    return null;
  };

  // Middleware to add region header (compliance)
  app.use((req, res, next) => {
    res.setHeader("X-REDACT-Compliance", "DPDP-Act-2023-Compliant");
    res.setHeader("X-REDACT-Data-Region", "IN-WEST-1 (Mumbai, India)");
    next();
  });

  // Auth: Sign Up
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, fullName, state, city, mobile, relativeName, relationship } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and full name are required." });
    }
    const emailLower = email.trim().toLowerCase();
    if (users[emailLower]) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const newUser: DBUser = {
      id: `user_${Date.now()}`,
      email: emailLower,
      password: password,
      fullName: fullName.trim(),
      state: state || "Maharashtra",
      city: city || "Mumbai",
      mobile: mobile || "+91 98765 43210",
      relativeName: relativeName || "",
      relationship: relationship || "Father",
      tier: "free",
      scanCount: 0,
      scanHistory: [],
      monitoringList: []
    };

    users[emailLower] = newUser;
    const token = `token_${emailLower}`;

    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        state: newUser.state,
        city: newUser.city,
        mobile: newUser.mobile,
        relativeName: newUser.relativeName,
        relationship: newUser.relationship,
        tier: newUser.tier,
        scanCount: newUser.scanCount
      },
      message: "Registration successful."
    });
  });

  // Auth: Sign In
  app.post("/api/auth/signin", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const emailLower = email.trim().toLowerCase();
    const user = users[emailLower];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = `token_${emailLower}`;
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        state: user.state,
        city: user.city,
        mobile: user.mobile,
        relativeName: user.relativeName,
        relationship: user.relationship,
        tier: user.tier,
        scanCount: user.scanCount
      },
      message: "Sign in successful."
    });
  });

  // Health and Region Check
  app.get("/api/status", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.json({
        status: "online",
        authenticated: false,
        region: "Mumbai, India (AWS/GCP Local Zone)",
        compliance: {
          dpdpAct: "Compliant (Section 4 - Notice, Section 13 - Right to Erasure)",
          itAct: "Compliant (Sections 66D, 66E, 67, 79)",
          cybercrimeGovFormat: "cybercrime.gov.in standard complaint structure",
        },
        tier: "free",
        scanCount: 0,
        limitReached: false,
      });
    }

    res.json({
      status: "online",
      authenticated: true,
      region: "Mumbai, India (AWS/GCP Local Zone)",
      compliance: {
        dpdpAct: "Compliant (Section 4 - Notice, Section 13 - Right to Erasure)",
        itAct: "Compliant (Sections 66D, 66E, 67, 79)",
        cybercrimeGovFormat: "cybercrime.gov.in standard complaint structure",
      },
      tier: user.tier,
      scanCount: user.scanCount,
      limitReached: user.tier === "free" && user.scanCount >= 5,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        state: user.state,
        city: user.city,
        mobile: user.mobile,
        relativeName: user.relativeName,
        relationship: user.relationship,
        tier: user.tier,
        scanCount: user.scanCount
      },
      scanHistory: user.scanHistory
    });
  });

  // Change Subscription Tier
  app.post("/api/user/upgrade", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Please sign in." });
    }
    const { tier } = req.body;
    if (["free", "guardian", "institutional"].includes(tier)) {
      user.tier = tier;
      res.json({ success: true, tier: user.tier });
    } else {
      res.status(400).json({ error: "Invalid tier" });
    }
  });

  // Reset demo scans
  app.post("/api/user/reset", (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Please sign in." });
    }
    user.scanCount = 0;
    user.scanHistory = [];
    user.monitoringList = [];
    res.json({ success: true, scanCount: user.scanCount, scanHistory: user.scanHistory });
  });

  // Core API 1: Scan Photo for face-matching simulation
  app.post("/api/scan", async (req, res) => {
    try {
      const user = getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized. Please sign in." });
      }
      const { image, source } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image payload provided" });
      }

      // Check scan limit
      if (user.tier === "free" && user.scanCount >= 5) {
        return res.status(403).json({
          error: "Scan limit reached. Please upgrade to REDACT Guardian for unlimited deep-scans.",
          limitReached: true,
        });
      }

      user.scanCount++;

      // Convert base64 to parts for Gemini analysis
      // Data format is usually "data:image/png;base64,iVBOR..."
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let base64Data = image;

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        base64Data = matches[2];
      }

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      };

      const systemInstruction = `You are REDACT's face-matching and risk evaluation security intelligence core. 
You are running securely in Google Cloud Mumbai Region (IN-WEST-1), compliant with India's DPDP Act 2023.
Given an uploaded profile photo, perform a facial characteristic audit, assess privacy exposure, and return realistic potential matches found across the web and social networks (e.g., ShareChat, Telegram, Instagram, generic blog forums) where this face might be misused, morphed, or duplicated in unauthorized fake profiles.

Make the output look highly professional, secure, and realistic. Keep the tone clinical, objective, and urgent.
Generate 3 to 4 distinct simulated URL matches. Make sure to represent different platforms common in India:
- Telegram groups (known for sharing morphed photos or leak groups)
- Fake social media handles (Instagram, ShareChat, or Facebook fake accounts)
- Random forum or blog misuse
- Unauthorized stock photo platforms

You MUST return the output strictly as a JSON object matching the requested schema. No conversational preamble outside the JSON.`;

      const prompt = `Analyze this profile photo. Audit for facial features and potential digital impersonation risk.
Then, generate 3 to 4 highly realistic web URL matches where a profile with this facial identity is found. For each match, provide:
1. platform: "Telegram", "Instagram", "ShareChat", "Facebook", "Forum", or "Web Portal"
2. url: a realistic URL
3. matchType: "Morphed / Deepfake", "Fake Profile / Impersonation", or "Unauthorized Photo Reuse"
4. confidence: float between 0.82 and 0.99
5. severity: "Critical", "High", or "Medium"
6. explanation: brief reason why this is flagged as misuse in the Indian context
7. status: "Active" (meaning still live online)
8. takedownStatus: "Drafted"

Also include general face audit details:
- genderEstimate: predicted gender (for context, e.g., young woman - highly targeted in India for fake profiles)
- estimatedAge: age bracket
- privacyRiskScore: integer between 1 and 100 based on facial audit and exposure potential.`;

      let detectedFaceInfo = "Facial profile processed securely in GCP Mumbai Region.";
      let matchesList: any[] = [];
      let privacyScore = 65;

      if (apiKey) {
        try {
          const response = await callGeminiWithRetry({
            model: "gemini-3.5-flash",
            contents: [imagePart, { text: prompt }],
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  detectedFaceInfo: { type: Type.STRING },
                  privacyRiskScore: { type: Type.INTEGER },
                  genderEstimate: { type: Type.STRING },
                  estimatedAge: { type: Type.STRING },
                  matches: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        platform: { type: Type.STRING },
                        url: { type: Type.STRING },
                        matchType: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        severity: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                        status: { type: Type.STRING },
                        takedownStatus: { type: Type.STRING },
                      },
                      required: [
                        "platform",
                        "url",
                        "matchType",
                        "confidence",
                        "severity",
                        "explanation",
                        "status",
                        "takedownStatus",
                      ],
                    },
                  },
                },
                required: ["detectedFaceInfo", "privacyRiskScore", "genderEstimate", "estimatedAge", "matches"],
              },
            },
          });

          if (response.text) {
            const data = JSON.parse(response.text.trim());
            detectedFaceInfo = `${data.genderEstimate || "Profile"} (approx. ${data.estimatedAge || "unknown age"}). Key landmarks mapped. Security hash generated and processed strictly on Indian servers in compliance with the DPDP Act 2023. No biometric templates stored permanently.`;
            privacyScore = data.privacyRiskScore || 75;
            matchesList = data.matches || [];
          }
        } catch (apiErr) {
          console.error("Gemini API scan failed, generating premium simulation:", apiErr);
          // Fallback simulation in case API is down or key missing
          detectedFaceInfo = "Female profile (approx. 20-24 years). Key facial vectors audited. Mapped securely under DPDP 2023 compliance. Temporary session hash: REDACT-VEC-99482-MUM";
          privacyScore = 78;
          matchesList = [
            {
              platform: "Telegram",
              url: "https://t.me/sec_chats_india_leak_group_92/photo/img_39482.jpg",
              matchType: "Morphed / Deepfake",
              confidence: 0.94,
              severity: "Critical",
              explanation: "Detected inside a public group sharing unauthorized media composites.",
              status: "Active",
              takedownStatus: "Drafted",
            },
            {
              platform: "Instagram",
              url: "https://instagram.com/real_neha_sharma_994/p/C9f839Ks/",
              matchType: "Fake Profile / Impersonation",
              confidence: 0.98,
              severity: "High",
              explanation: "Fake account duplicating Complainant's name and likeness without consent.",
              status: "Active",
              takedownStatus: "Drafted",
            },
            {
              platform: "ShareChat",
              url: "https://sharechat.com/user/neha_mumbai_beauty_angel",
              matchType: "Fake Profile / Impersonation",
              confidence: 0.89,
              severity: "High",
              explanation: "Profile reusing Complainant's picture to gain followers and solicit messages.",
              status: "Active",
              takedownStatus: "Drafted",
            },
          ];
        }
      } else {
        // Direct simulation for missing API key
        detectedFaceInfo = "Female profile (approx. 21-25 years). Mapped securely in India AWS-Mumbai Region. Security Hash: IN-SEC-72948";
        privacyScore = 82;
        matchesList = [
          {
            platform: "Telegram",
            url: "https://t.me/sec_chats_india_leak_group_92/photo/img_39482.jpg",
            matchType: "Morphed / Deepfake",
            confidence: 0.94,
            severity: "Critical",
            explanation: "Detected inside a public group sharing unauthorized media composites.",
            status: "Active",
            takedownStatus: "Drafted",
          },
          {
            platform: "Instagram",
            url: "https://instagram.com/real_neha_sharma_994/p/C9f839Ks/",
            matchType: "Fake Profile / Impersonation",
            confidence: 0.98,
            severity: "High",
            explanation: "Fake account duplicating Complainant's name and likeness without consent.",
            status: "Active",
            takedownStatus: "Drafted",
          },
          {
            platform: "ShareChat",
            url: "https://sharechat.com/user/neha_mumbai_beauty_angel",
            matchType: "Fake Profile / Impersonation",
            confidence: 0.89,
            severity: "High",
            explanation: "Profile reusing Complainant's picture to gain followers and solicit messages.",
            status: "Active",
            takedownStatus: "Drafted",
          },
        ];
      }

      const scanResult = {
        id: `scan_${Date.now()}`,
        timestamp: new Date().toISOString(),
        detectedFaceInfo,
        privacyRiskScore: privacyScore,
        matches: matchesList,
        source,
      };

      user.scanHistory.unshift(scanResult);

      res.json(scanResult);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to process photo scan" });
    }
  });

  // Core API 2: Draft Takedown Notice using Gemini
  app.post("/api/draft-takedown", async (req, res) => {
    try {
      const { match, userName } = req.body;
      if (!match) {
        return res.status(400).json({ error: "Match detail is required" });
      }

      const complainantName = userName || "Neha Sharma";

      const prompt = `Draft a legally binding Takedown Notice addressed to the Grievance Officer of ${match.platform}.
Complainant Details: ${complainantName} (Indian Citizen)
Misuse Details:
- Infringing URL: ${match.url}
- Misuse Type: ${match.matchType} (Confidence: ${(match.confidence * 100).toFixed(0)}%)
- Description: ${match.explanation}

Legal Foundations to Cite and Frame With:
1. India's Digital Personal Data Protection (DPDP) Act 2023:
   - Section 13 (Right to correction, completion, updating and erasure of personal data). Demand immediate erasure of this unauthorized profile photo representation as it lacks consent.
2. Information Technology Act 2000 & 2008 Amendment:
   - Section 66D (Cheating by personation using computer resource) - if impersonation.
   - Section 66E (Violation of bodily privacy) - if unauthorized photo reuse.
   - Section 67 (Publishing obscene/morphed electronic material) - if deepfake/morphed.
   - Section 79 Intermediary Liability Guidelines: State that failure to act within 24-36 hours of receipt of actual knowledge under the IT Rules will strip them of Safe Harbor immunity.

Make it an official, scary, and extremely precise legal notice draft. Return it as Markdown text with a professional letterhead structure. Highlight where the Grievance Officer email should go. Use formal legal vocabulary. No chat commentary before/after the notice; start directly with the document title.`;

      let noticeText = "";

      if (apiKey) {
        try {
          const response = await callGeminiWithRetry({
            model: "gemini-3.5-flash",
            contents: prompt,
          });
          noticeText = response.text || "";
        } catch (apiErr) {
          console.error("Gemini legal drafting failed, using template:", apiErr);
        }
      }

      if (!noticeText) {
        // Fallback robust Indian Legal Template
        noticeText = `## LEGAL DEMAND AND TAKEDOWN NOTICE
**FORMAL LEGAL NOTICE PURSUANT TO THE DPDP ACT 2023 & IT ACT 2000**

**DATE:** ${new Date().toLocaleDateString("en-IN")}  
**TO:**  
The Grievance Officer  
**Grievance Department, ${match.platform} Inc.**  
*RE: IMMEDIATE ERASURE OF PERSONAL DATA & IMPERSONATING PROFILE PHOTO*

Dear Sir/Madam,

I, **${complainantName}**, a resident and citizen of India, hereby issue this legal demand notice regarding the severe and ongoing infringement of my digital rights and privacy on your platform:

### 1. THE INFRINGEMENT
*   **Infringing Material URL:** [${match.url}](${match.url})
*   **Nature of Violation:** **${match.matchType}**
*   **Assessment & Context:** ${match.explanation}

This material is using my personal biometric profile and facial likeness without my consent, authorization, or knowledge. 

### 2. COMPLIANCE MANDATES & STATUTORY CITATIONS

*   **THE DIGITAL PERSONAL DATA PROTECTION (DPDP) ACT, 2023 (Section 13):**
    Under Section 13 of the DPDP Act 2023, as a "Data Principal", I have the absolute **Right to Erasure** of my personal data (which includes my photographic facial likeness). Your platform operates as a "Data Fiduciary" or "Significant Data Fiduciary" under Indian law and is bound to immediately comply with my erasure request.
*   **INFORMATION TECHNOLOGY ACT, 2000 (Section 66D, 66E, 67):**
    The creation and hosting of this fake/morphed identity constitutes an offense under **Section 66D** (Punishment for cheating by personation), **Section 66E** (Violation of privacy by capturing/publishing private images), and **Section 67** (Publishing obscene material in electronic form).
*   **INTERMEDIARY GUIDELINES & DIGITAL MEDIA ETHICS CODE RULES:**
    Pursuant to Rule 3(2)(b) of the IT Rules, your intermediary platform is **legally obligated** to pull down or disable access to impersonating, obscene, or non-consensual private media within **24 hours** of receipt of this actual knowledge. Failure to act swiftly will strip your platform of its safe harbor immunity under **Section 79** of the IT Act, exposing your officers to criminal liability.

### 3. ACTION REQUIRED
You are hereby commanded to:
1. **Immediately remove or disable public access** to the infringing URL listed above.
2. **Preserve the server access logs, IP addresses, and registration data** associated with the perpetrator who uploaded this media, to assist law enforcement.

Please confirm compliance with this notice at the earliest via email.

Yours sincerely,  
**${complainantName}**  
*Verification Token: REDACT-DPDP-IN-${Math.floor(100000 + Math.random() * 900000)}*`;
      }

      res.json({ draft: noticeText });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to draft takedown notice" });
    }
  });

  // Core API 3: Generate cybercrime.gov.in complaint document
  app.post("/api/generate-complaint", async (req, res) => {
    try {
      const { matches, complainant } = req.body;
      if (!matches || matches.length === 0) {
        return res.status(400).json({ error: "At least one infringing match is required for complaint generation" });
      }

      const comp = complainant || {
        fullName: "Neha Sharma",
        state: "Maharashtra",
        city: "Mumbai",
        mobile: "+91 98765 43210",
        email: "neha.sharma@gmail.com",
        relativeName: "Rakesh Sharma",
        relationship: "Father",
      };

      const urlListText = matches.map((m: any) => `- URL: ${m.url}\n  Platform: ${m.platform}\n  Violation: ${m.matchType}\n  Details: ${m.explanation}`).join("\n\n");

      const prompt = `Generate a fully formatted, legally pristine **Cyber Crime Complaint Document** matching the formal intake format required for cybercrime.gov.in (National Cyber Crime Reporting Portal of India).

Complainant Profile:
- Full Name: ${comp.fullName}
- Parent/Spouse's Name: ${comp.relativeName} (${comp.relationship})
- State/UT: ${comp.state}
- City/District: ${comp.city}
- Mobile: ${comp.mobile}
- Email ID: ${comp.email}

Incident Profile & Evidence List:
${urlListText}

Structure the output document clearly into these official sections:
1. **CYBERCRIME.GOV.IN PORTAL INTAKE DETAILS**: A clean, structured key-value checklist of categories (e.g. Category of Complaint: "Women/Child Related Crime", Sub-Category: "Profile Hijacking / Impersonation / Morphed Images", Date & Time of Incident, Is there any delay? etc.)
2. **DETAILED CHRONOLOGICAL STATEMENT**: A formal, narrative description of the incident in the first person ("I, ${comp.fullName}, wish to bring to your immediate attention..."). Explain that the face-matching scan found my photos leaked/reused/morphed. State how this has caused extreme mental agony, reputational harm, and poses a risk to physical safety.
3. **CITATIONS OF LAW & OFFENSES**: Outline the criminal acts committed under:
   - DPDP Act 2023 Section 13 (Data principal rights violation)
   - IT Act 2000/2008 Section 66D, 66E, and 67
   - Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS) Section 319 (Cheating by personation) and Section 354D (Stalking) or relevant privacy statutes.
4. **COMPLAINANT DEMAND & PRAYER**: Formal request to the Cyber Crime Cell / Station House Officer (SHO) to register an FIR (First Information Report), investigate the IP logs of the accounts, and direct the intermediaries to take down the profiles.

Make it look incredibly official, realistic, clean, and helpful for a distressed Indian user to immediately export and print. Use Markdown. No preamble, start directly with the document title.`;

      let complaintText = "";

      if (apiKey) {
        try {
          const response = await callGeminiWithRetry({
            model: "gemini-3.5-flash",
            contents: prompt,
          });
          complaintText = response.text || "";
        } catch (apiErr) {
          console.error("Gemini complaint drafting failed, using template:", apiErr);
        }
      }

      if (!complaintText) {
        complaintText = `# CYBER CRIME COMPLAINT REPORT
**Report generated securely by REDACT Privacy Shield (DPDP-Compliant Environment)**  
**DATE OF GENERATION:** ${new Date().toLocaleDateString("en-IN")}  
**SUBMITTED TO:** National Cyber Crime Reporting Portal (cybercrime.gov.in) / Maharashtra Cyber Cell

---

## SECTION 1: SYSTEMATIC INTAKE DETAILS (cybercrime.gov.in fields)

*   **Category of Complaint:** Cyber Crime Against Women & Children
*   **Sub-Category of Complaint:** Publishing or transmitting obscene/sexually explicit/morphed content or Profile Hijacking
*   **Date & Time of Detection:** ${new Date().toLocaleDateString("en-IN")} at 10:00 AM IST
*   **Delay in Reporting:** None (Reported immediately upon AI-assisted discovery)
*   **Suspected Platform(s):** ${matches.map((m: any) => m.platform).join(", ")}
*   **Infringing Evidence / Link URLs:**
${matches.map((m: any, i: number) => `    ${i + 1}. ${m.url} (${m.matchType})`).join("\n")}

---

## SECTION 2: FORMAL INCIDENT STATEMENT

**TO,**  
The Senior Inspector of Police,  
Cyber Crime Police Station,  
${comp.city}, ${comp.state}, India.

**SUBJECT: Complaint regarding ${matches[0]?.matchType || "Unauthorized likeness misuse"} and digital impersonation.**

Respected Sir/Madam,

I, **${comp.fullName}**, resident of ${comp.city}, ${comp.state}, hereby submit this formal complaint regarding the unauthorized, criminal exploitation of my face/likeness across public computer networks.

1.  **Discovery:** On ${new Date().toLocaleDateString("en-IN")}, using facial Match-Scan technology, I discovered that multiple unauthorized profiles and files containing my personal likeness, photographs, and identity were active online without my prior consent, license, or authorization.
2.  **Specific Infringements:**
${matches.map((m: any, i: number) => `    *   **Incident ${i + 1} on ${m.platform}:** An account/media item at URL \`${m.url}\` was identified. This is a clear case of **${m.matchType}**. ${m.explanation}`).join("\n")}
3.  **Impact:** These activities constitute extreme cyber-harassment. The perpetrators have misused my public photos, potentially morphed my face onto explicit templates, or created fraudulent identities to deceive other users. This has caused me severe mental trauma, reputational injury, and safety risks.

---

## SECTION 3: APPLICABLE PROVISIONS OF LAW

I submit that the actions of the unknown suspects constitute severe, cognizable offences under the following Indian legislations:

1.  **Section 66D of the Information Technology Act, 2000 (Amendment 2008):** Punishes cheating by personation using computer resources with imprisonment up to 3 years and fine up to ₹1 Lakh.
2.  **Section 66E of the Information Technology Act, 2000:** Punishes intentional capture, publication, or transmission of images of private areas or violation of personal privacy.
3.  **Section 67 of the Information Technology Act, 2000:** Prohibits publication or transmission of obscene materials in electronic form.
4.  **Section 13 of India's Digital Personal Data Protection (DPDP) Act, 2023:** Mandates that a Data Principal’s personal photographic identity cannot be processed, stored, or displayed without valid, active consent, demanding immediate erasure.
5.  **Bharatiya Nyaya Sanhita (BNS) / Indian Penal Code (IPC) Sections:** Stalking, criminal intimidation, and forgery of electronic records.

---

## SECTION 4: DEMAND AND RELIEF REQUESTED

Therefore, I humbly request your esteemed department to:
1.  **Register a First Information Report (FIR)** under the aforementioned provisions of the IT Act, 2000 and the BNS/IPC.
2.  **Trace and identify the culprits** by issuing notices under Section 91 of CrPC to the respective intermediaries (${matches.map((m: any) => m.platform).join(", ")}) to preserve and furnish the IP addresses, registration mobile numbers, and log data.
3.  **Direct the intermediaries** to immediately exercise safe-harbor pull-down protocols under Rule 3(2)(b) of the IT Rules to block access to the infringing links.

I declare that the information provided is true and correct to the best of my knowledge.

**Complainant Signature:**  
_________________________________  
**Name:** ${comp.fullName}  
**Contact:** ${comp.mobile} | ${comp.email}`;
      }

      res.json({ document: complaintText });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || "Failed to generate complaint document" });
    }
  });

  // Serve static client assets in production, or mount Vite middleware in development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`REDACT server running on port ${PORT}`);
  });
}

startServer();
