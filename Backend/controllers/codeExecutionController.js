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
  javascript: { language: "javascript", version: "18.15.0", wandbox: "nodejs-20.17.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python3", version: "3.10.0", wandbox: "cpython-3.12.7" },
  java: { language: "java", version: "15.0.2", wandbox: "openjdk-jdk-21+35" },
  cpp: { language: "cpp", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  csharp: { language: "csharp", version: "6.12.0" },
  go: { language: "go", version: "1.16.2" },
  rust: { language: "rust", version: "1.68.2" },
  php: { language: "php", version: "8.2.3" },
  ruby: { language: "ruby", version: "3.0.1" },
  kotlin: { language: "kotlin", version: "1.8.20" },
};

const executeOnWandbox = async (language, code, stdin) => {
  const config = LANGUAGE_MAP[language];
  if (!config || !config.wandbox) return null;

  // Java Hack: Remove 'public' from class definition to avoid filename mismatch
  let finalCode = code;
  if (language === "java") {
    finalCode = code.replace(/public\s+class/g, "class");
  }

  try {
    const resp = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler: config.wandbox,
        code: finalCode,
        stdin: stdin || ""
      }),
      timeout: 10000
    });
    const data = await resp.json();
    return {
      run: {
        output: (data.program_message || data.compiler_message || "").trim(),
        stdout: (data.program_output || "").trim(),
        stderr: (data.program_error || data.compiler_error || "").trim(),
        code: data.status === "0" ? 0 : 1
      }
    };
  } catch (err) {
    console.error("[WANDBOX ERROR]", err.message);
    return null;
  }
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
      try { 
        execSync("javac Main.java", { cwd: tempDir, timeout: 5000 }); 
      } catch (e) { 
        const errStr = e.stderr?.toString() || e.message;
        if (errStr.includes("not found") || errStr.includes("is not recognized")) {
          return { run: { output: "System Error: The compiler 'javac' is not installed on this server. If you are hosting on Vercel, Vercel does not support Java execution. Please host your backend on Render or Railway.", stderr: "Compiler not found", code: 1, stdout: "" } };
        }
        return { run: { output: errStr, stderr: errStr, code: 1, stdout: "" } }; 
      }
      command = "java"; args = ["Main"];
    } else if (language === "python" || language === "python3") {
      command = process.platform === "win32" ? "python" : "python3";
      fs.writeFileSync(path.join(tempDir, "script.py"), code);
      args = ["script.py"];
    } else if (language === "javascript") {
      fs.writeFileSync(path.join(tempDir, "script.js"), code);
      command = "node"; args = ["script.js"];
    } else { throw new Error("Local fallback not available for " + language); }

    return new Promise((resolve) => {
      const child = spawn(command, args, { cwd: tempDir, timeout: 10000 });
      let out = ""; let err = "";
      
      child.on('error', (err) => {
        if (err.code === 'ENOENT') {
          resolve({ run: { output: `System Error: The interpreter '${command}' is not installed on this server.`, stderr: `Interpreter not found`, code: 1, stdout: "" } });
        }
      });

      if (child.stdout) child.stdout.on("data", (d) => (out += d.toString()));
      if (child.stderr) child.stderr.on("data", (d) => (err += d.toString()));
      child.on("close", (c) => {
        resolve({ run: { output: (out + err).trim(), stderr: err.trim(), stdout: out.trim(), code: c } });
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
      });
      if (stdin && child.stdin) { child.stdin.write(stdin); child.stdin.end(); }
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

  // PLATFORM CRACK: If all Piston mirrors fail, use Wandbox (Unlimited Free)
  const wandboxRes = await executeOnWandbox(language, code, stdin);
  if (wandboxRes) {
    console.log(`[PLATFORM CRACK] Piston failed. Using Wandbox ${language} engine.`);
    return wandboxRes;
  }

  // LAST RESORT: Try Local Native Engine (if installed)
  if (["java", "python", "javascript"].includes(language)) {
    console.log(`[PLATFORM CRACK] Wandbox failed. Using local ${language} engine.`);
    return await executeLocally(language, code, stdin);
  }
  
  throw new Error("Code execution services are currently restricted. Please contact support.");
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
