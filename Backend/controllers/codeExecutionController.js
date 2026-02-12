import Question from "../models/Question.js";

const PISTON_EXECUTE_URL = "https://emkc.org/api/v2/piston/execute";
const PISTON_RUNTIMES_URL = "https://emkc.org/api/v2/piston/runtimes";

const LANGUAGE_ALIASES = {
  javascript: { piston: "javascript" },
  typescript: { piston: "typescript" },
  python: { piston: "python" },
  java: { piston: "java" },
  cpp: { piston: "cpp" },
  c: { piston: "c" },
  csharp: { piston: "csharp" },
  go: { piston: "go" },
  rust: { piston: "rust" },
  php: { piston: "php" },
  ruby: { piston: "ruby" },
  kotlin: { piston: "kotlin" },
};

const FALLBACK_VERSIONS = {
  javascript: "18.15.0",
  typescript: "5.0.0",
  python: "3.10.0",
  java: "15.0.2",
  cpp: "10.2.0",
  c: "10.2.0",
  csharp: "6.12.0",
  go: "1.20.0",
  rust: "1.70.0",
  php: "8.2.0",
  ruby: "3.2.0",
  kotlin: "1.9.0",
};

const RUNTIMES_TTL_MS = 6 * 60 * 60 * 1000;
let runtimesCache = { fetchedAt: 0, data: null };

const compareVersionsLoose = (a, b) => {
  const aParts = String(a).split(/[^0-9]+/).filter(Boolean).map(Number);
  const bParts = String(b).split(/[^0-9]+/).filter(Boolean).map(Number);

  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const av = aParts[i] ?? 0;
    const bv = bParts[i] ?? 0;
    if (av !== bv) return av - bv;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

const fetchRuntimes = async () => {
  const now = Date.now();
  if (runtimesCache.data && now - runtimesCache.fetchedAt < RUNTIMES_TTL_MS) {
    return runtimesCache.data;
  }

  const response = await fetch(PISTON_RUNTIMES_URL);
  if (!response.ok) return runtimesCache.data;

  const data = await response.json();
  if (!Array.isArray(data)) return runtimesCache.data;

  runtimesCache = { fetchedAt: now, data };
  return data;
};

const getRuntimeConfig = async (languageId) => {
  const alias = LANGUAGE_ALIASES[languageId];
  if (!alias) return null;

  const runtimes = await fetchRuntimes().catch(() => null);
  const pistonLanguage = alias.piston;

  const versions = Array.isArray(runtimes)
    ? runtimes.filter((r) => r.language === pistonLanguage).map((r) => r.version)
    : [];

  const version =
    versions.length > 0
      ? versions.sort(compareVersionsLoose)[versions.length - 1]
      : FALLBACK_VERSIONS[languageId];

  if (!version) return null;

  return { language: pistonLanguage, version };
};

export const executeCode = async (req, res) => {
  try {
    const { questionId, code, language } = req.body;

    if (!questionId || !code || !language) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const question = await Question.findById(questionId);
    if (!question || question.type !== "coding") {
      return res.status(404).json({ message: "Coding question not found" });
    }

    const langConfig = await getRuntimeConfig(language);
    if (!langConfig) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const testCases = question.codingData.testCases;
    const results = [];

    // Helper to detect hardcoding of expected outputs
    const isHardcoded = (submittedCode, expected) => {
      if (!expected || expected.trim().length < 2) return false;
      const cleanCode = submittedCode.replace(/\s+/g, ' ');
      const cleanExpected = expected.trim();
      
      // Check for string literals containing the expected output
      // This is a basic check and can be improved with regex for different languages
      const patterns = [
        `"${cleanExpected}"`,
        `'${cleanExpected}'`,
        `\`${cleanExpected}\``
      ];
      
      return patterns.some(p => cleanCode.includes(p));
    };

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      const response = await fetch(PISTON_EXECUTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: langConfig.language,
          version: langConfig.version,
          files: [{ content: code }],
          stdin: testCase.input,
        }),
      });

      const data = await response.json();

      if (data.run || data.compile) {
        const compileExitCode = data.compile?.code ?? 0;
        const runExitCode = data.run?.code ?? 0;

        const compileError = compileExitCode !== 0 ? (data.compile?.stderr || data.compile?.output || "Compilation failed") : null;
        const runError = runExitCode !== 0 ? (data.run?.stderr || data.run?.output || `Process exited with code ${runExitCode}`) : null;

        const actualOutput = (data.run?.output || "").trim();
        const expectedOutput = testCase.expectedOutput.trim();
        
        // Check for non-zero exit code (Runtime/Compilation Error)
        const isError = compileExitCode !== 0 || runExitCode !== 0;
        let passed = !isError && actualOutput === expectedOutput;
        let hardcodingDetected = false;

        if (passed && isHardcoded(code, expectedOutput)) {
          passed = false;
          hardcodingDetected = true;
        }

        results.push({
          testCaseId: testCase._id,
          input: testCase.isHidden ? "Hidden" : testCase.input,
          expectedOutput: testCase.isHidden ? "Hidden" : testCase.expectedOutput,
          actualOutput: testCase.isHidden ? (passed ? "Passed" : (hardcodingDetected ? "Hardcoding Detected" : "Failed")) : actualOutput,
          passed,
          error: hardcodingDetected 
            ? "Logic violation: Hardcoding expected output is not allowed. Please implement the actual logic." 
            : (compileError || runError || null),
        });
      } else {
        results.push({
          testCaseId: testCase._id,
          passed: false,
          error: "Execution failed",
        });
      }
    }

    res.json({
      success: true,
      results,
      allPassed: results.every((r) => r.passed),
    });
  } catch (error) {
    console.error("CODE EXECUTION ERROR:", error);
    res.status(500).json({ message: "Code execution failed", error: error.message });
  }
};

export const executeCustomCode = async (req, res) => {
  try {
    const { code, language, stdin } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const langConfig = await getRuntimeConfig(language);
    if (!langConfig) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const response = await fetch(PISTON_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [{ content: code }],
        stdin: stdin || "",
      }),
    });

    const data = await response.json();

    if (data.run || data.compile) {
      const compileExitCode = data.compile?.code ?? 0;
      const runExitCode = data.run?.code ?? 0;

      res.json({
        success: true,
        output: data.run?.output || "",
        stderr: (compileExitCode !== 0 ? data.compile?.stderr : data.run?.stderr) || "",
        stdout: data.run?.stdout || "",
        exitCode: compileExitCode !== 0 ? compileExitCode : runExitCode,
      });
    } else {
      res.status(400).json({ message: "Execution failed", error: data.message });
    }
  } catch (error) {
    console.error("CUSTOM EXECUTION ERROR:", error);
    res.status(500).json({ message: "Code execution failed", error: error.message });
  }
};
