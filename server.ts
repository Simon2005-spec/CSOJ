import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { CODING_PROBLEMS } from "./src/data/codingProblems.ts";
import { CodingProblem } from "./src/types.ts";
import { db } from "./src/db/index.ts";
import { problems as dbProblems, submissions as dbSubmissions } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

// Setup __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper functions for serializing/deserializing problems
function serializeProblem(p: CodingProblem) {
  return {
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    descriptionHtml: p.descriptionHtml,
    inputFormat: p.inputFormat,
    outputFormat: p.outputFormat,
    entryFunctionName: p.entryFunctionName,
    examples: JSON.stringify(p.examples || []),
    constraints: JSON.stringify(p.constraints || []),
    inputNames: JSON.stringify(p.inputNames || []),
    defaultCode: JSON.stringify(p.defaultCode || {}),
    testCases: JSON.stringify(p.testCases || []),
  };
}

function deserializeProblem(p: any): CodingProblem {
  return {
    id: p.id,
    title: p.title,
    difficulty: p.difficulty as any,
    descriptionHtml: p.descriptionHtml,
    inputFormat: p.inputFormat,
    outputFormat: p.outputFormat,
    entryFunctionName: p.entryFunctionName,
    examples: JSON.parse(p.examples || "[]"),
    constraints: JSON.parse(p.constraints || "[]"),
    inputNames: JSON.parse(p.inputNames || "[]"),
    defaultCode: JSON.parse(p.defaultCode || "{}"),
    testCases: JSON.parse(p.testCases || "[]"),
  };
}

function deserializeSubmission(sub: any) {
  return {
    username: sub.username,
    codingAnswers: JSON.parse(sub.codingAnswers || "{}"),
    timeLeft: sub.timeLeft,
    isFinished: sub.isFinished,
    score: parseFloat(sub.score) || 0,
    updatedAt: sub.updatedAt
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing with size limits
  app.use(express.json({ limit: "10mb" }));

  // Disable caching for all API routes to force real-time sync across devices
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Seed the database if empty
  try {
    const dbProbs = await db.select().from(dbProblems);
    if (dbProbs.length === 0) {
      console.log("Database is empty, seeding standard coding problems...");
      for (const prob of CODING_PROBLEMS) {
        await db.insert(dbProblems).values(serializeProblem(prob));
      }
      console.log("Seeding complete.");
    } else {
      console.log(`Database initialized. Loaded ${dbProbs.length} coding problems.`);
    }
  } catch (err) {
    console.error("Error connecting to database or seeding:", err);
  }

  // --- API ROUTES ---

  // 1. Get all problems
  app.get("/api/problems", async (req, res) => {
    try {
      const dbProbs = await db.select().from(dbProblems);
      const decodedProbs = dbProbs.map(deserializeProblem);
      res.json(decodedProbs);
    } catch (err) {
      console.error("Failed to fetch problems from database:", err);
      res.status(500).json({ error: "Failed to fetch problems" });
    }
  });

  // 2. Add or update a problem
  app.post("/api/problems", async (req, res) => {
    try {
      const newProb: CodingProblem = req.body;
      if (!newProb || !newProb.id) {
        return res.status(400).json({ error: "Invalid problem structure" });
      }

      const serialized = serializeProblem(newProb);

      await db.insert(dbProblems)
        .values(serialized)
        .onConflictDoUpdate({
          target: dbProblems.id,
          set: serialized
        });

      console.log(`Successfully added/updated problem ID: ${newProb.id}`);
      res.json({ success: true, problem: newProb });
    } catch (err) {
      console.error("Failed to save problem in database:", err);
      res.status(500).json({ error: "Failed to save problem" });
    }
  });

  // 3. Delete a problem
  app.delete("/api/problems/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await db.delete(dbProblems).where(eq(dbProblems.id, id));
      console.log(`Successfully deleted problem ID: ${id}`);
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete problem from database:", err);
      res.status(500).json({ error: "Failed to delete problem" });
    }
  });

  // 4. Get all submissions (for leaderboard/admin grading dashboard)
  app.get("/api/submissions", async (req, res) => {
    try {
      const dbSubs = await db.select().from(dbSubmissions);
      const result: { [username: string]: any } = {};
      for (const sub of dbSubs) {
        result[sub.username] = deserializeSubmission(sub);
      }
      res.json(result);
    } catch (err) {
      console.error("Failed to fetch submissions from database:", err);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // 5. Get a specific user's submission state
  app.get("/api/submissions/:username", async (req, res) => {
    try {
      const username = req.params.username.toLowerCase();
      const dbSubs = await db.select().from(dbSubmissions).where(eq(dbSubmissions.username, username)).limit(1);
      if (dbSubs.length > 0) {
        res.json(deserializeSubmission(dbSubs[0]));
      } else {
        res.json(null);
      }
    } catch (err) {
      console.error("Failed to fetch user submission from database:", err);
      res.status(500).json({ error: "Failed to fetch user submission" });
    }
  });

  // 6. Save/update user submission state
  app.post("/api/submissions", async (req, res) => {
    try {
      const { username, codingAnswers, timeLeft, isFinished, score } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const normUser = username.toLowerCase();
      const payload = {
        username: normUser,
        codingAnswers: JSON.stringify(codingAnswers || {}),
        timeLeft: timeLeft ?? 5400,
        isFinished: !!isFinished,
        score: String(score ?? 0),
        updatedAt: new Date().toISOString()
      };

      await db.insert(dbSubmissions)
        .values(payload)
        .onConflictDoUpdate({
          target: dbSubmissions.username,
          set: payload
        });

      res.json({ success: true, data: { ...payload, codingAnswers, score } });
    } catch (err) {
      console.error("Failed to save submission in database:", err);
      res.status(500).json({ error: "Failed to save submission" });
    }
  });

  // Vite middleware for development
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
    console.log(`NHCOJ full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
