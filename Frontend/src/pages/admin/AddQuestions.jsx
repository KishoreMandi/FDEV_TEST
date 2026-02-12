import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { Folder, ArrowLeft, Download, Code, List, Plus, Trash2, Maximize2, Minimize2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Editor from "@monaco-editor/react";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams, getAdminQuestions, deleteQuestion } from "../../api/examApi";
import axios from "../../api/axiosInstance";

const AddQuestions = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [questionsList, setQuestionsList] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [type, setType] = useState("mcq"); // mcq or coding
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(null);
  
  // Coding states
  const [language, setLanguage] = useState("javascript");
  const [starterCode, setStarterCode] = useState("");
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "", isHidden: false }]);

  const [isPublished, setIsPublished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Undo history for smart paste
  const undoRef = useRef(null);
  const isSmartPasting = useRef(false);

  useEffect(() => {
    getExams().then((res) => setExams(res.data));
  }, []);

  async function fetchQuestions() {
    try {
      const res = await getAdminQuestions(examId);
      setQuestionsList(res.data);
    } catch (error) {
      console.error("Failed to fetch questions", error);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (examId) {
        const selectedExam = exams.find((e) => e._id === examId);
        const published = Boolean(selectedExam?.isPublished);

        setIsPublished(published);
        if (published) {
          toast.error("Your exam is already published, unable to add questions");
        }

        fetchQuestions();
      } else {
        setQuestionsList([]);
        setIsPublished(false);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [examId, exams]);

  const handleOptionChange = (value, index) => {
    // Clear undo history if user manually edits options
    undoRef.current = null;
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleEdit = (q) => {
    if (isPublished) {
      toast.error("Your exam is already published, unable to edit questions");
      return;
    }
    setEditingId(q._id);
    setType(q.type || "mcq");
    setQuestion(q.question);
    if (q.type === "coding") {
      setLanguage(q.codingData.language);
      setStarterCode(q.codingData.starterCode);
      setTestCases(q.codingData.testCases);
    } else {
      setOptions(q.options);
      setCorrectOption(q.correctOption);
    }
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectOption(null);
    setType("mcq");
    setStarterCode("");
    setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);
  };

  const handleDelete = async (id) => {
    if (isPublished) {
      toast.error("Your exam is already published, unable to delete questions");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion(id);
      toast.success("Question deleted");
      fetchQuestions();
    } catch {
      toast.error("Failed to delete question");
    }
  };

  const handleDownloadQuestions = () => {
    if (questionsList.length === 0) {
      toast.error("No questions to download");
      return;
    }

    const examTitle = exams.find(e => e._id === examId)?.title || "Exam";
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text(`${examTitle} - Questions`, 14, 22);

    // Prepare Table Data
    const tableData = questionsList.map((q, index) => {
      if (q.type === "mcq") {
        return [
          index + 1,
          q.question,
          "MCQ",
          q.options[0],
          q.options[1],
          q.options[2],
          q.options[3],
          q.options[q.correctOption]
        ];
      } else {
        return [
          index + 1,
          q.question,
          "CODING",
          "-",
          "-",
          "-",
          "-",
          `Lang: ${q.codingData?.language}`
        ];
      }
    });

    // Generate Table
    autoTable(doc, {
      startY: 30,
      head: [["#", "Question", "Type", "Opt A", "Opt B", "Opt C", "Opt D", "Correct/Lang"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] }, // Blue header
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 }, // #
        1: { cellWidth: 40 }, // Question
        2: { cellWidth: 20 }, // Type
        3: { cellWidth: 20 }, // Opt A
        4: { cellWidth: 20 }, // Opt B
        5: { cellWidth: 20 }, // Opt C
        6: { cellWidth: 20 }, // Opt D
        7: { cellWidth: 30 }, // Correct
      },
    });

    doc.save(`${examTitle}_Questions.pdf`);
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData("text");
    if (!pastedData) return;

    const lines = pastedData.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length >= 5) {
      const last4 = lines.slice(-4);
      const optionRegex = /^([A-Da-d1-4])[.)-]\s+(.*)$/;
      
      const cleanedOptions = last4.map(opt => {
        const match = opt.match(optionRegex);
        return match ? match[2] : opt;
      });

      e.preventDefault();
      
      // Save current state for undo
      undoRef.current = {
        question: question, // Current question text before paste
        options: [...options] // Current options before paste
      };
      
      isSmartPasting.current = true;

      const questionBody = lines.slice(0, lines.length - 4).join("\n");
      
      // Use execCommand to preserve browser undo history for the text field
      setOptions(cleanedOptions);
      
      // Select all text in the textarea to ensure we replace content like a normal paste/set
      e.target.select();
      document.execCommand('insertText', false, questionBody);
      
      toast.success("Question and options auto-populated!");
    }
  };

  const handleKeyDown = (e) => {
    // Custom Undo for Smart Paste (Ctrl+Z)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (undoRef.current) {
        e.preventDefault(); // Prevent native undo since we are handling it manually
        
        setQuestion(undoRef.current.question);
        setOptions(undoRef.current.options);
        
        undoRef.current = null; // Clear undo history after using it
        toast.success("Undid smart paste");
      }
    }
  };

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
    
    // If this change was triggered by our smart paste, reset the flag but keep undo history
    if (isSmartPasting.current) {
      isSmartPasting.current = false;
    } else {
      // If user manually types/changes text, clear the smart paste undo history
      undoRef.current = null;
    }
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }]);
  };

  const handleRemoveTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPublished) {
      toast.error("Your exam is already published, unable to add questions");
      return;
    }

    if (!examId) {
      toast.error("Please select an exam");
      return;
    }

    if (type === "mcq" && correctOption === null) {
      toast.error("Please select a correct option");
      return;
    }

    const payload = {
      examId,
      question,
      type,
      ...(type === "mcq"
        ? { options, correctOption }
        : {
            codingData: {
              language,
              starterCode,
              testCases,
            },
          }),
    };

    try {
      if (editingId) {
        await axios.put(`/questions/${editingId}`, payload);
        toast.success("Question updated successfully");
        setEditingId(null);
      } else {
        await axios.post("/questions", payload);
        toast.success("Question added successfully");
      }

      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectOption(null);
      setStarterCode("");
      setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);
      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save question");
    }
  };

  return (
    <div className={`flex ${isFullscreen ? "w-full h-screen" : ""}`}>
      {!isFullscreen && <AdminSidebar />}

      <div className={`${isFullscreen ? "w-full" : "ml-64 w-full"} min-h-screen bg-gray-100`}>
        {!isFullscreen && <AdminHeader />}

        <div className="p-6 max-w-5xl mx-auto">
          {!examId ? (
            // Folder View
            <div>
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 hover:bg-gray-200 rounded-full transition text-gray-600"
                >
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-gray-800">Select Exam Folder</h2>
              </div>
              {exams.length === 0 ? (
                <p className="text-gray-500">No exams found. Please create an exam first.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.map((exam) => (
                    <div 
                      key={exam._id} 
                      onClick={() => setExamId(exam._id)}
                      className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center border border-gray-200 group"
                    >
                      <Folder size={64} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h3 className="text-lg font-semibold text-gray-800 text-center">{exam.title}</h3>
                      <p className="text-sm text-gray-500 mt-2">Click to manage questions</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Question Management View
            <div>
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => setExamId("")}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={20} className="mr-2" />
                  Back to Exams
                </button>
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {exams.find(e => e._id === examId)?.title} - Questions
                  </h2>
                  <button
                    onClick={handleDownloadQuestions}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    title="Download Questions"
                  >
                    <Download size={18} />
                    Download
                  </button>
                </div>
              </div>

              <div className={`grid ${isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"} gap-8`}>
                {/* Form Section */}
                <div className={`${isFullscreen ? "col-span-1" : "lg:col-span-1"}`}>
                  <div className={`bg-white p-6 rounded-xl shadow sticky top-6 ${isPublished ? "opacity-75" : ""} ${isFullscreen ? "relative" : ""}`}>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="text-xl font-bold">
                        {editingId ? "Edit Question" : "Add New Question"}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="text-gray-500 hover:text-gray-700"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                      >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                      </button>
                    </div>
                    
                    {isPublished && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-4 text-sm" role="alert">
                        <p className="font-bold">Exam Published</p>
                        <p>Questions cannot be modified.</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className={`space-y-4 ${isPublished ? "pointer-events-none" : ""}`}>
                      {/* Type Toggle */}
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setType("mcq")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${type === "mcq" ? "bg-white shadow-sm text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          <List size={18} />
                          MCQ
                        </button>
                        <button
                          type="button"
                          onClick={() => setType("coding")}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${type === "coding" ? "bg-white shadow-sm text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          <Code size={18} />
                          Coding
                        </button>
                      </div>

                      {/* Question */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                        <textarea
                          placeholder={type === "mcq" ? "Enter your question here... (Paste question + 4 options to auto-fill)" : "Enter coding problem description..."}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          rows="3"
                          value={question}
                          onChange={handleQuestionChange}
                          onPaste={type === "mcq" ? handlePaste : undefined}
                          onKeyDown={handleKeyDown}
                          required
                        />
                      </div>

                      {type === "mcq" ? (
                        /* Options */
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">Options (Select Correct)</label>
                          {options.map((opt, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                              <input
                                type="radio"
                                name="correctOption"
                                checked={correctOption === index}
                                onChange={() => setCorrectOption(index)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <input
                                placeholder={`Option ${index + 1}`}
                                className={`flex-1 p-1 border-none outline-none bg-transparent ${correctOption === index ? "font-medium" : ""}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(e.target.value, index)}
                                required={type === "mcq"}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Coding Fields */
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Programming Language</label>
                            <select
                              value={language}
                              onChange={(e) => setLanguage(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="javascript">JavaScript</option>
                              <option value="typescript">TypeScript</option>
                              <option value="python">Python</option>
                              <option value="java">Java</option>
                              <option value="cpp">C++</option>
                              <option value="c">C</option>
                              <option value="csharp">C#</option>
                              <option value="go">Go</option>
                              <option value="rust">Rust</option>
                              <option value="php">PHP</option>
                              <option value="ruby">Ruby</option>
                              <option value="kotlin">Kotlin</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Starter Code</label>
                            <div className={`border border-gray-300 rounded-lg overflow-hidden ${isFullscreen ? "h-[calc(100vh-400px)]" : "h-48"}`}>
                              <Editor
                                height="100%"
                                language={language}
                                theme="vs-light"
                                value={starterCode}
                                onChange={(value) => setStarterCode(value)}
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 12,
                                  lineNumbers: "on",
                                  scrollBeyondLastLine: false,
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="block text-sm font-medium text-gray-700">Test Cases</label>
                              <button
                                type="button"
                                onClick={handleAddTestCase}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-bold"
                              >
                                <Plus size={16} />
                                Add
                              </button>
                            </div>
                            {testCases.map((tc, index) => (
                              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 relative group">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTestCase(index)}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-100 transition-opacity p-1 rounded-full bg-white"
                                  title="Remove Test Case"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Input (stdin)</label>
                                  <textarea
                                    placeholder="Input (stdin)"
                                    className="w-full p-2 border border-gray-300 rounded-lg outline-none text-sm"
                                    rows="2"
                                    value={tc.input}
                                    onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Expected Output</label>
                                  <textarea
                                    placeholder="Expected Output"
                                    className="w-full p-2 border border-gray-300 rounded-lg outline-none text-sm"
                                    rows="2"
                                    value={tc.expectedOutput}
                                    onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`hidden-${index}`}
                                    checked={tc.isHidden}
                                    onChange={(e) => handleTestCaseChange(index, "isHidden", e.target.checked)}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                                  />
                                  <label htmlFor={`hidden-${index}`} className="text-sm font-medium text-gray-700">Hidden Test Case</label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                          {editingId ? "Update" : "Add Question"}
                        </button>

                        {editingId && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>

                {/* List Section */}
                <div className={`${isFullscreen ? "col-span-1" : "lg:col-span-2"} space-y-4`}>
                   <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-700">
                        Existing Questions ({questionsList.length})
                      </h3>
                   </div>
                  
                  {questionsList.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
                      <p>No questions added yet for this exam.</p>
                      <p className="text-sm mt-1">Use the form on the left to add one.</p>
                    </div>
                  ) : (
                    questionsList.map((q, i) => (
                      <div key={q._id} className="bg-white p-5 rounded-xl shadow border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-lg text-gray-800 pr-4">
                            <span className="text-blue-600 mr-2">Q{i + 1}.</span>{q.question}
                            {q.type === "coding" && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                Coding
                              </span>
                            )}
                          </h4>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleEdit(q)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              disabled={isPublished}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(q._id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                              disabled={isPublished}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {q.type === "mcq" ? (
                          <ul className="pl-2 space-y-2">
                            {q.options.map((opt, idx) => (
                              <li
                                key={idx}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                                  q.correctOption === idx
                                    ? "bg-green-50 text-green-700 border border-green-200 font-medium"
                                    : "bg-gray-50 text-gray-600 border border-transparent"
                                }`}
                              >
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 text-xs ${q.correctOption === idx ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                {opt}
                                {q.correctOption === idx && <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Correct</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="pl-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-bold">Language:</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded uppercase text-xs">{q.codingData.language}</span>
                            </div>
                            {q.codingData?.testCases && (
                              <div className="mt-4 border-t pt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Test Cases:</p>
                                <div className="space-y-3">
                                  {q.codingData.testCases.map((tc, tcIndex) => (
                                    <div key={tcIndex} className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                                      <p className="text-xs text-gray-600">
                                        <span className="font-semibold">Input:</span> {tc.input || "N/A"}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        <span className="font-semibold">Expected Output:</span> {tc.expectedOutput || "N/A"}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        <span className="font-semibold">Hidden:</span> {tc.isHidden ? "Yes" : "No"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddQuestions;
