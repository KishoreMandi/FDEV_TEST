import Question from "../models/Question.js";

const JDOODLE_EXECUTE_URL = "https://api.jdoodle.com/v1/execute";

const JDOODLE_LANGUAGE_MAP = {
  javascript: { language: "nodejs", versionIndex: "4" },
  typescript: { language: "nodejs", versionIndex: "4" }, // Fallback to Node.js as JDoodle does not natively support TS execution directly
  python: { language: "python3", versionIndex: "4" },
  java: { language: "java", versionIndex: "4" },
  cpp: { language: "cpp", versionIndex: "5" },
  c: { language: "c", versionIndex: "5" },
  csharp: { language: "csharp", versionIndex: "4" },
  go: { language: "go", versionIndex: "4" },
  rust: { language: "rust", versionIndex: "4" },
  php: { language: "php", versionIndex: "4" },
  ruby: { language: "ruby", versionIndex: "4" },
  kotlin: { language: "kotlin", versionIndex: "3" },
};

const getRuntimeConfig = (languageId) => {
  return JDOODLE_LANGUAGE_MAP[languageId] || null;
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

    const langConfig = getRuntimeConfig(language);
    if (!langConfig) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: "JDoodle API credentials are not configured on the server. Please add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to the .env file." });
    }

    const testCases = question.codingData.testCases;
    const results = [];

    // Helper to detect hardcoding of expected outputs
    const isHardcoded = (submittedCode, expected) => {
      if (!expected || expected.trim().length < 2) return false;
      const cleanCode = submittedCode.replace(/\s+/g, ' ');
      const cleanExpected = expected.trim();

      const patterns = [
        `"${cleanExpected}"`,
        `'${cleanExpected}'`,
        `\`${cleanExpected}\``
      ];

      return patterns.some(p => cleanCode.includes(p));
    };

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];

      const payload = {
        script: code,
        language: langConfig.language,
        versionIndex: langConfig.versionIndex,
        clientId: clientId,
        clientSecret: clientSecret,
        stdin: testCase.input,
      };

      const response = await fetch(JDOODLE_EXECUTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.output !== undefined) {
        // JDoodle provides compilation/runtime errors directly in the output field.
        const actualOutput = data.output.trim();
        const expectedOutput = testCase.expectedOutput.trim();

        const isError = data.memory === null || data.statusCode !== 200;
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
            : (isError ? actualOutput : null),
        });
      } else {
        results.push({
          testCaseId: testCase._id,
          passed: false,
          error: data.error || data.message || "Execution API failed",
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

    const langConfig = getRuntimeConfig(language);
    if (!langConfig) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ message: "JDoodle API credentials are not configured on the server. Please add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to the .env file." });
    }

    const payload = {
      script: code,
      language: langConfig.language,
      versionIndex: langConfig.versionIndex,
      clientId: clientId,
      clientSecret: clientSecret,
      stdin: stdin || "",
    };

    const response = await fetch(JDOODLE_EXECUTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.output !== undefined) {
      const isError = data.memory === null || data.statusCode !== 200;

      res.json({
        success: true,
        output: !isError ? data.output : "",
        stderr: isError ? data.output : "",
        stdout: !isError ? data.output : "",
        exitCode: isError ? 1 : 0,
      });
    } else {
      res.status(400).json({ message: "Execution failed", error: data.error || data.message });
    }
  } catch (error) {
    console.error("CUSTOM EXECUTION ERROR:", error);
    res.status(500).json({ message: "Code execution failed", error: error.message });
  }
};
