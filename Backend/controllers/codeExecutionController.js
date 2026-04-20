import Question from "../models/Question.js";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const getRandomId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multi-Mirror Piston Platform Execution
const PISTON_INSTANCES = [
  "https://piston.pydis.com/api/v2/execute",
  "https://emkc.org/api/v2/piston/execute",
  "https://pi.piston.sh/api/v2/execute"
];

const LANGUAGE_MAP = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python3", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "cpp", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  csharp: { language: "csharp", version: "6.12.0" },
  go: { language: "go", version: "1.16.2" },
  rust: { language: "rust", version: "1.68.2" },
  php: { language: "php", version: "8.2.3" },
  ruby: { language: "ruby", version: "3.0.1" },
  kotlin: { language: "kotlin", version: "1.8.20" },
};

// CRACKED: Local Piston-Compatible Engine (Fallback)
const executeLocally = async (language, code, stdin) => {
  const runId = getRandomId();
  const tempDir = path.join(__dirname, "../temp_exec", runId);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  try {
    let command = "";
    let args = [];
    if (language === "java") {
      fs.writeFileSync(path.join(tempDir, "Main.java"), code);
      try { execSync("javac Main.java", { cwd: tempDir, timeout: 5000 }); }
      catch (e) { return { run: { output: e.stderr?.toString() || e.message, stderr: e.stderr?.toString(), code: 1, stdout: "" } }; }
      command = "java"; args = ["Main"];
    } else if (language === "python" || language === "python3") {
      fs.writeFileSync(path.join(tempDir, "script.py"), code);
      command = "python"; args = ["script.py"];
    } else if (language === "javascript") {
      fs.writeFileSync(path.join(tempDir, "script.js"), code);
      command = "node"; args = ["script.js"];
    } else { throw new Error("Local fallback not available for " + language); }

    return new Promise((resolve) => {
      const child = spawn(command, args, { cwd: tempDir, timeout: 10000 });
      let out = ""; let err = "";
      child.stdout.on("data", (d) => (out += d.toString()));
      child.stderr.on("data", (d) => (err += d.toString()));
      child.on("close", (c) => {
        resolve({ run: { output: (out + err).trim(), stderr: err.trim(), stdout: out.trim(), code: c } });
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
      });
      if (stdin) { child.stdin.write(stdin); child.stdin.end(); }
    });
  } catch (err) { return { run: { output: err.message, stderr: err.message, code: 1, stdout: "" } }; }
};

const executeOnPiston = async (language, code, stdin) => {
  const config = LANGUAGE_MAP[language];
  if (!config) throw new Error("Unsupported language");

  const payload = { language: config.language, version: config.version, files: [{ content: code }], stdin: stdin || "" };

  // Try mirrors
  for (const url of PISTON_INSTANCES) {
    try {
      const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), timeout: 5000 });
      const data = await resp.json();
      if (resp.ok && data.run) return data;
    } catch (err) { continue; }
  }

  // PLATFORM CRACK: If all mirrors fail, use Local Native Engine
  if (["java", "python", "javascript"].includes(language)) {
    console.log(`[PLATFORM CRACK] Piston Mirrors failed. Using local ${language} engine.`);
    return await executeLocally(language, code, stdin);
  }
  
  throw new Error("Piston API is currently offline/restricted. Please contact support or use Java/Python.");
};

export const executeCode = async (req, res) => {
  try {
    const { questionId, code, language } = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const results = [];
    for (const testCase of question.codingData.testCases) {
      try {
        const pistonRes = await executeOnPiston(language, code, testCase.input);
        const actualOutput = pistonRes.run.output.trim();
        const expectedOutput = testCase.expectedOutput.trim();
        const isError = pistonRes.run.stderr.length > 0 || pistonRes.run.code !== 0;

        results.push({
          testCaseId: testCase._id,
          input: testCase.isHidden ? "Hidden" : testCase.input,
          expectedOutput: testCase.isHidden ? "Hidden" : testCase.expectedOutput,
          actualOutput: testCase.isHidden ? (pistonRes.run.code === 0 ? "Passed" : "Failed") : actualOutput,
          passed: !isError && actualOutput === expectedOutput,
          error: isError ? pistonRes.run.output : null
        });
      } catch (err) {
        results.push({ testCaseId: testCase._id, passed: false, error: err.message });
      }
    }
    res.json({ success: true, results, allPassed: results.every((r) => r.passed) });
  } catch (error) { res.status(500).json({ message: "System Error", error: error.message }); }
};

export const executeCustomCode = async (req, res) => {
  try {
    const { code, language, stdin } = req.body;
    const pistonRes = await executeOnPiston(language, code, stdin);
    res.json({ success: true, output: pistonRes.run.output, stderr: pistonRes.run.stderr, stdout: pistonRes.run.stdout, exitCode: pistonRes.run.code });
  } catch (error) { res.status(500).json({ message: "System Error", error: error.message }); }
};
