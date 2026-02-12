import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Play, CheckCircle, XCircle, Loader2, ChevronRight, ChevronDown, RotateCcw } from "lucide-react";
import axios from "../api/axiosInstance";
import toast from "react-hot-toast";

const LANGUAGES = [
  { id: "javascript", name: "JavaScript (Node.js)" },
  { id: "python", name: "Python 3" },
  { id: "java", name: "Java" },
  { id: "cpp", name: "C++" },
  { id: "c", name: "C" },
];

const STARTER_CODE = {
  javascript: `// Read input from stdin
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();

// Write your logic here
console.log('Hello World');`,

  python: `import sys

# Read input from stdin
# input_data = sys.stdin.read().strip()

def solve():
    # Write your logic here
    print("Hello World")

if __name__ == '__main__':
    solve()`,

  java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your logic here
        System.out.println("Hello World");
        
        sc.close();
    }
}`,

  cpp: `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // Write your logic here
    cout << "Hello World" << endl;
    
    return 0;
}`,

  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Write your logic here
    printf("Hello World");
    
    return 0;
}`
};

const CodingEnvironment = ({ question, initialData, onSave, layout = "default" }) => {
  const [code, setCode] = useState(initialData?.code || question.codingData.starterCode || "");
  const [language, setLanguage] = useState(initialData?.language || question.codingData.language);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customOutput, setCustomOutput] = useState(null);
  const editorRef = useRef(null);
  // Ref to store code for each language to prevent data loss when switching
  const codeMapRef = useRef({});

  useEffect(() => {
    // Initialize codeMap with initial data if available
    if (initialData?.code && initialData?.language) {
      codeMapRef.current[initialData.language] = initialData.code;
    } else if (question.codingData.starterCode && question.codingData.language) {
      codeMapRef.current[question.codingData.language] = question.codingData.starterCode;
    }
  }, [question, initialData]);

  useEffect(() => {
    // Update code if question changes and no saved code exists
    if (!initialData?.code) {
      setCode(question.codingData.starterCode || STARTER_CODE[question.codingData.language] || "");
      setLanguage(question.codingData.language);
      // Clear code map for new question
      codeMapRef.current = {};
      if (question.codingData.starterCode) {
        codeMapRef.current[question.codingData.language] = question.codingData.starterCode;
      }
    } else {
      setCode(initialData.code);
      setLanguage(initialData.language);
    }
  }, [question._id, initialData]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    const oldLang = language;
    
    // Save current code to map
    codeMapRef.current[oldLang] = code;
    
    setLanguage(newLang);
    
    // Load code for new language
    if (codeMapRef.current[newLang]) {
      setCode(codeMapRef.current[newLang]);
    } else {
      // If no saved code, use starter code
      // If this is the question's original language, prefer admin starter code
      if (newLang === question.codingData.language) {
         setCode(question.codingData.starterCode || STARTER_CODE[newLang] || "");
      } else {
         setCode(STARTER_CODE[newLang] || "");
      }
    }
  };

  const handleResetCode = () => {
    // If the selected language matches the question's original language, use the admin's starter code
    if (language === question.codingData.language) {
      setCode(question.codingData.starterCode || STARTER_CODE[language] || "");
    } else {
      // Otherwise, use the generic starter code for that language
      setCode(STARTER_CODE[language] || "");
    }
    toast.success("Code reset to template");
  };

  const handleRun = async (mode) => {
    setIsRunning(true);
    setResults(null);
    setCustomOutput(null);

    // If running custom input, ensure the panel is visible
    if (mode === 'custom') {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
    }

    try {
      if (mode === 'custom') {
        const res = await axios.post("/questions/execute-custom", {
          code,
          language,
          stdin: customInput
        });
        setCustomOutput(res.data);
        toast.success("Custom execution complete");
      } else {
        const res = await axios.post("/questions/execute", {
          questionId: question._id,
          code,
          language,
        });
        setResults(res.data);
        if (res.data.allPassed) {
          toast.success("All test cases passed!");
        } else {
          toast.error("Some test cases failed.");
        }
        
        onSave({
          code,
          language,
          isCorrect: res.data.allPassed,
          testCases: res.data.results,
        });
      }
    } catch (error) {
      toast.error("Execution failed: " + (error.response?.data?.message || error.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    
    // Disable Copy/Paste
    editor.onKeyDown((e) => {
      // Check for Ctrl+C, Ctrl+V, Cmd+C, Cmd+V
      if ((e.ctrlKey || e.metaKey) && (e.code === "KeyC" || e.code === "KeyV")) {
        e.preventDefault();
        e.stopPropagation();
        toast.error("Copy/Paste is disabled!");
      }
    });

    // Disable Context Menu (Right Click)
    editor.onContextMenu((e) => {
      e.event.preventDefault();
      e.event.stopPropagation();
    });
  };

  const isSplitVertical = layout === "split-vertical";

  return (
    <div className={`flex flex-col h-full bg-[#1e1e1e] ${!isSplitVertical ? 'rounded-xl shadow-2xl border border-gray-700' : ''} overflow-hidden`}>
      {/* MNC Style Header */}
      <div className="bg-[#252526] text-gray-300 p-2 px-4 flex justify-between items-center border-b border-[#3e3e3e] z-10 h-14">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select 
              value={language}
              onChange={handleLanguageChange}
              className="appearance-none bg-[#3c3c3c] text-white px-4 py-1.5 pr-8 rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-[16px] font-medium hover:bg-[#4c4c4c] transition-colors cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer mr-2">
            <input 
              type="checkbox" 
              checked={isCustomMode} 
              onChange={(e) => setIsCustomMode(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-[#3c3c3c]"
            />
            <span className="text-xs font-medium text-gray-400 select-none">Show Custom Input</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCode}
              disabled={isRunning}
              className="flex items-center gap-2 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white px-3 py-1.5 rounded-md text-sm font-bold transition-all disabled:opacity-50 active:scale-95 shadow-md border border-gray-600"
              title="Reset Code"
              type="button"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              onClick={() => handleRun('custom')}
              disabled={isRunning}
              className="flex items-center gap-2 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white px-4 py-1.5 rounded-md text-sm font-bold transition-all disabled:opacity-50 active:scale-95 shadow-md border border-gray-600"
            >
              {isRunning && isCustomMode ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
              Run Code
            </button>

            <button
              onClick={() => handleRun('tests')}
              disabled={isRunning}
              className="flex items-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-1.5 rounded-md text-sm font-bold transition-all disabled:opacity-50 active:scale-95 shadow-md border border-[rgba(240,246,252,0.1)]"
            >
              {isRunning && !isCustomMode ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
              Run Tests
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className={`flex flex-col flex-1 overflow-hidden relative`}>
        {/* Editor Area */}
        <div className="flex-1 relative border-b border-[#3e3e3e]">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language}
            theme="vs-dark"
            value={code}
            onMount={handleEditorMount}
            onChange={(value) => {
              setCode(value);
              onSave({ code: value, language, isCorrect: results?.allPassed || false });
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              mouseWheelZoom: false,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              cursorBlinking: "smooth",
              smoothScrolling: true,
              renderLineHighlight: "line",
              contextmenu: false, // Disable right-click menu
              quickSuggestions: true, // Enable IntelliSense
              suggestOnTriggerCharacters: true,
              wordBasedSuggestions: true,
              parameterHints: { enabled: true },
            }}
          />
        </div>

        {/* Results Panel (Bottom) */}
        <div className="h-1/3 bg-[#1e1e1e] flex flex-col border-t border-[#3e3e3e]">
          <div className="p-3 border-b border-[#3e3e3e] bg-[#252526] flex justify-between items-center px-6">
            <h3 className="font-bold text-gray-300 flex items-center gap-2 text-xs uppercase tracking-wider">
              {isCustomMode ? "Custom Input / Output" : "Test Results"}
            </h3>
            {!isCustomMode && results && (
              <div className="flex gap-4">
                <span className="text-xs font-bold text-gray-400">
                  Passed: <span className="text-green-400">{results.results.filter(r => r.passed).length}/{results.results.length}</span>
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar bg-[#1e1e1e]">
            {isCustomMode ? (
              <div className="flex h-full gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Input</label>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="flex-1 bg-[#2d2d2d] text-gray-300 p-3 rounded-lg border border-[#3e3e3e] focus:outline-none focus:border-blue-500 font-mono text-[16px] resize-none"
                    placeholder="Enter custom input here..."
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Output</label>
                  <div className="flex-1 bg-[#2d2d2d] text-gray-300 p-3 rounded-lg border border-[#3e3e3e] font-mono text-sm overflow-auto whitespace-pre-wrap">
                    {customOutput ? (
                      <>
                        {customOutput.output}
                        {customOutput.stderr && <div className="text-red-400 mt-2 pt-2 border-t border-red-900/30">Error: {customOutput.stderr}</div>}
                      </>
                    ) : (
                      <span className="text-gray-600 italic">Run code to see output...</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
            {!results && !isRunning && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                <div className="bg-[#2d2d2d] p-3 rounded-full mb-3">
                    <Play size={24} className="text-gray-400 ml-1" />
                </div>
                <p className="text-xs font-medium uppercase tracking-widest">Run code to view output</p>
              </div>
            )}

            {isRunning && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-[#2d2d2d] p-4 rounded-lg border border-[#3e3e3e] h-24">
                    <div className="h-3 bg-[#3e3e3e] rounded w-1/3 mb-4"></div>
                    <div className="h-8 bg-[#3e3e3e] rounded"></div>
                  </div>
                ))}
              </div>
            )}

            {results && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {results.results.map((res, idx) => (
                  <div
                    key={idx}
                    className={`bg-[#2d2d2d] rounded-lg border shadow-sm overflow-hidden transition-all flex flex-col ${
                      res.passed ? "border-green-900/50" : "border-red-900/50"
                    }`}
                  >
                    <div className={`px-4 py-2 flex justify-between items-center border-b ${
                      res.passed ? "bg-green-900/20 border-green-900/30" : "bg-red-900/20 border-red-900/30"
                    }`}>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Case {idx + 1}
                      </span>
                      {res.passed ? (
                        <div className="flex items-center gap-1 text-green-400 font-black text-[10px]">
                          <CheckCircle size={12} /> PASSED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-400 font-black text-[10px]">
                          <XCircle size={12} /> FAILED
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 flex-1 space-y-2 overflow-y-auto custom-scrollbar-sm max-h-40">
                      {res.input !== "Hidden" ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Input</label>
                            <pre className="bg-[#1e1e1e] p-1.5 rounded text-[11px] font-mono text-gray-300 border border-[#3e3e3e]">{res.input || "(empty)"}</pre>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Expected</label>
                              <pre className="bg-[#1e1e1e] p-1.5 rounded text-[11px] font-mono text-gray-300 border border-[#3e3e3e]">{res.expectedOutput}</pre>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Actual</label>
                              <pre className={`p-1.5 rounded text-[11px] font-mono border ${
                                res.passed ? "bg-green-900/10 text-green-300 border-green-900/30" : "bg-red-900/10 text-red-300 border-red-900/30"
                              }`}>
                                {res.actualOutput || (res.error ? "Error" : "(empty)")}
                              </pre>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-2 text-center">
                          <p className="text-[11px] font-bold text-gray-500 italic">
                            Security Hidden
                          </p>
                          <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            res.passed ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"
                          }`}>
                            {res.passed ? "Passed" : "Failed"}
                          </div>
                        </div>
                      )}

                      {res.error && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-red-400 uppercase tracking-tighter">Error</label>
                          <pre className="bg-red-900/10 text-red-300 p-1.5 rounded text-[10px] font-mono border border-red-900/30 whitespace-pre-wrap">
                            {res.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingEnvironment;
