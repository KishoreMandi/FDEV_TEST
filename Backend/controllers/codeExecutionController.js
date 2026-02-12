import Question from "../models/Question.js";

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const languageMap = {
  javascript: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "cpp", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
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

    const langConfig = languageMap[language];
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
      
      const response = await fetch(PISTON_URL, {
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

      if (data.run) {
        const actualOutput = data.run.output.trim();
        const expectedOutput = testCase.expectedOutput.trim();
        
        // Check for non-zero exit code (Runtime/Compilation Error)
        const isError = data.run.code !== 0;
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
            : (data.run.stderr || (isError ? `Process exited with code ${data.run.code}` : null)),
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

    const langConfig = languageMap[language];
    if (!langConfig) {
      return res.status(400).json({ message: "Unsupported language" });
    }

    const response = await fetch(PISTON_URL, {
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

    if (data.run) {
      res.json({
        success: true,
        output: data.run.output,
        stderr: data.run.stderr,
        stdout: data.run.stdout,
        exitCode: data.run.code,
      });
    } else {
      res.status(400).json({ message: "Execution failed", error: data.message });
    }
  } catch (error) {
    console.error("CUSTOM EXECUTION ERROR:", error);
    res.status(500).json({ message: "Code execution failed", error: error.message });
  }
};
