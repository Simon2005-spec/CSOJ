import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { CODING_PROBLEMS } from "./src/data/codingProblems";
import { CodingProblem } from "./src/types";

// Setup __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing with size limits
  app.use(express.json({ limit: '10mb' }));

  // File paths for persistence
  const PROBLEMS_FILE = path.join(process.cwd(), "data_problems.json");
  const SUBMISSIONS_FILE = path.join(process.cwd(), "data_submissions.json");

  // Load problems from file or populate with defaults
  let problems: CodingProblem[] = [];
  try {
    if (fs.existsSync(PROBLEMS_FILE)) {
      const fileData = fs.readFileSync(PROBLEMS_FILE, "utf-8");
      problems = JSON.parse(fileData);
    } else {
      problems = [...CODING_PROBLEMS];
      fs.writeFileSync(PROBLEMS_FILE, JSON.stringify(problems, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error reading problems file:", err);
    problems = [...CODING_PROBLEMS];
  }

  // Load submissions from file or populate
  let submissions: { [username: string]: any } = {};
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const fileData = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
      submissions = JSON.parse(fileData);
    } else {
      submissions = {};
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error reading submissions file:", err);
    submissions = {};
  }

  // Helper functions to save
  const saveProblems = () => {
    try {
      fs.writeFileSync(PROBLEMS_FILE, JSON.stringify(problems, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving problems:", err);
    }
  };

  const saveSubmissions = () => {
    try {
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving submissions:", err);
    }
  };

  // --- API ROUTES ---

  // 1. Get all problems
  app.get("/api/problems", (req, res) => {
    res.json(problems);
  });

  // 2. Add or update a problem
  app.post("/api/problems", (req, res) => {
    const newProb: CodingProblem = req.body;
    if (!newProb || !newProb.id) {
      return res.status(400).json({ error: "Invalid problem structure" });
    }

    const index = problems.findIndex(p => p.id === newProb.id);
    if (index !== -1) {
      problems[index] = newProb;
    } else {
      problems.push(newProb);
    }

    saveProblems();
    res.json({ success: true, problem: newProb });
  });

  // 3. Delete a problem
  app.delete("/api/problems/:id", (req, res) => {
    const id = req.params.id;
    problems = problems.filter(p => p.id !== id);
    saveProblems();
    res.json({ success: true });
  });

  // 4. Get all submissions (for leaderboard/admin grading dashboard)
  app.get("/api/submissions", (req, res) => {
    res.json(submissions);
  });

  // 5. Get a specific user's submission state
  app.get("/api/submissions/:username", (req, res) => {
    const username = req.params.username.toLowerCase();
    res.json(submissions[username] || null);
  });

  // 6. Save/update user submission state
  app.post("/api/submissions", (req, res) => {
    const { username, codingAnswers, timeLeft, isFinished, score } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const normUser = username.toLowerCase();
    submissions[normUser] = {
      username: normUser,
      codingAnswers: codingAnswers || {},
      timeLeft: timeLeft ?? 5400,
      isFinished: !!isFinished,
      score: score ?? 0,
      updatedAt: new Date().toISOString()
    };

    saveSubmissions();
    res.json({ success: true, data: submissions[normUser] });
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
