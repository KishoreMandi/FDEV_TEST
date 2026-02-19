import { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { Folder, ArrowLeft, Download, Code, List, Plus, Trash2, Maximize2, Minimize2, Sparkles, FileText, CheckCircle, AlertCircle, Edit3, Eye, Terminal, Settings } from "lucide-react";
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

  const [type, setType] = useState("mcq");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(null);
  
  const [language, setLanguage] = useState("javascript");
  const [starterCode, setStarterCode] = useState("");
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "", isHidden: false }]);

  const [isPublished, setIsPublished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const undoRef = useRef(null);
  const isSmartPasting = useRef(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    getExams().then((res) => setExams(res.data));

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await getAdminQuestions(examId);
      setQuestionsList(res.data);
    } catch (error) {
      console.error("Failed to fetch questions", error);
    }
  }, [examId]);

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
  }, [examId, exams, fetchQuestions]);

  const handleOptionChange = (value, index) => {
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

    doc.setFontSize(18);
    doc.text(`${examTitle} - Questions`, 14, 22);

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

    autoTable(doc, {
      startY: 30,
      head: [["#", "Question", "Type", "Opt A", "Opt B", "Opt C", "Opt D", "Correct/Lang"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [236, 72, 153] },
      styles: { fontSize: 10, cellPadding: 3 },
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
      
      undoRef.current = {
        question: question,
        options: [...options]
      };
      
      isSmartPasting.current = true;

      const questionBody = lines.slice(0, lines.length - 4).join("\n");
      
      setOptions(cleanedOptions);
      e.target.select();
      document.execCommand('insertText', false, questionBody);
      
      toast.success("Question and options auto-populated!");
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (undoRef.current) {
        e.preventDefault();
        setQuestion(undoRef.current.question);
        setOptions(undoRef.current.options);
        undoRef.current = null;
        toast.success("Undid smart paste");
      }
    }
  };

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
    if (isSmartPasting.current) {
      isSmartPasting.current = false;
    } else {
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
    <div className={`flex bg-slate-100 ${isFullscreen ? "w-full h-screen" : "min-h-screen"}`}>
      {!isFullscreen && <AdminSidebar />}

      <div className={`${isFullscreen ? "w-full" : "ml-64 flex-1"} min-h-screen bg-slate-50`}>
        {!isFullscreen && <AdminHeader />}

        <div className="p-6 max-w-6xl mx-auto">
          {!examId ? (
            // Folder View
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => window.history.back()}
                  className="group p-3 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md hover:shadow-amber-200/40 transition-all duration-200"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-amber-500 transition-colors" />
                </button>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Select Exam Folder
                  </h2>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Choose an exam to manage its questions
                  </p>
                </div>
              </div>

              {exams.length === 0 ? (
                <div className="relative">
                  <div className="relative bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-900 flex items-center justify-center">
                      <Folder className="w-10 h-10 text-amber-300" />
                    </div>
                    <p className="text-gray-700 font-medium">No exams found</p>
                    <p className="text-gray-400 text-sm mt-1">Please create an exam first</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.map((exam, index) => (
                    <div 
                      key={exam._id} 
                      onClick={() => setExamId(exam._id)}
                      className="relative group cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="relative flex flex-col items-center">
                          <div className="mb-4">
                            <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                              <Folder className="w-8 h-8 text-amber-300" />
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 text-center mb-1">{exam.title}</h3>
                          <p className="text-sm text-amber-700 font-medium">Click to manage questions</p>
                          
                          <div className="mt-3 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                            <div className="px-4 py-1.5 rounded-full bg-slate-900 text-amber-200 text-xs font-medium">
                              Open Folder
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <button 
                  onClick={() => setExamId("")}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md hover:shadow-amber-200/40 transition-all duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-amber-500 transition-colors" />
                  <span className="text-gray-700 group-hover:text-amber-600 font-medium">Back to Exams</span>
                </button>
                
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {exams.find(e => e._id === examId)?.title}
                    <span className="text-gray-400 font-normal ml-2">- Questions</span>
                  </h2>
                  <button
                    onClick={handleDownloadQuestions}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              <div className={`grid ${isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"} gap-8`}>
                <div className={`${isFullscreen ? "col-span-1" : "lg:col-span-1"}`}>
                  <div className="relative group sticky top-6">
                    <div className={`relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isPublished ? "opacity-75" : ""}`}>
                      <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${editingId ? "bg-amber-500" : "bg-slate-900"} text-white`}>
                            {editingId ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {editingId ? "Edit Question" : "Add New Question"}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                      </div>

                      {isPublished && (
                        <div className="mx-5 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-2 text-amber-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-bold">Exam Published</span>
                          </div>
                          <p className="text-amber-600 text-sm mt-1">Questions cannot be modified.</p>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className={`p-5 space-y-5 ${isPublished ? "pointer-events-none" : ""}`}>
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setType("mcq")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-200 ${
                              type === "mcq" 
                                ? "bg-slate-900 text-white shadow-sm" 
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <List className="w-4 h-4" />
                            MCQ
                          </button>
                          <button
                            type="button"
                            onClick={() => setType("coding")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-200 ${
                              type === "coding" 
                                ? "bg-slate-900 text-white shadow-sm" 
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <Code className="w-4 h-4" />
                            Coding
                          </button>
                        </div>

                        <div className="group">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <FileText className="w-4 h-4 text-amber-500" />
                            Question Text
                          </label>
                          <textarea
                            placeholder={type === "mcq" ? "Enter your question... (Paste question + 4 options to auto-fill)" : "Enter coding problem description..."}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200 resize-none"
                            rows="3"
                            value={question}
                            onChange={handleQuestionChange}
                            onPaste={type === "mcq" ? handlePaste : undefined}
                            onKeyDown={handleKeyDown}
                            required
                          />
                        </div>

                        {type === "mcq" ? (
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <CheckCircle className="w-4 h-4 text-amber-500" />
                              Options (Select Correct)
                            </label>
                            {options.map((opt, index) => (
                              <div 
                                key={index} 
                                className={`group/option flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                                  correctOption === index 
                                    ? "border-emerald-300 bg-emerald-50 shadow-sm" 
                                    : "border-slate-200 bg-white hover:border-slate-400"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="correctOption"
                                  checked={correctOption === index}
                                  onChange={() => setCorrectOption(index)}
                                  className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer"
                                />
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                                  correctOption === index 
                                    ? "bg-emerald-500 text-white" 
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <input
                                  placeholder={`Option ${index + 1}`}
                                  className={`flex-1 bg-transparent outline-none ${correctOption === index ? "font-medium text-green-700" : "text-gray-700"}`}
                                  value={opt}
                                  onChange={(e) => handleOptionChange(e.target.value, index)}
                                  required
                                />
                                {correctOption === index && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-5">
                            <div className="group">
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Terminal className="w-4 h-4 text-amber-500" />
                                Programming Language
                              </label>
                              <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200"
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

                            <div className="group">
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Code className="w-4 h-4 text-amber-500" />
                                Starter Code
                              </label>
                              <div className={`border border-slate-200 rounded-xl overflow-hidden shadow-sm ${isFullscreen ? "h-[calc(100vh-500px)]" : "h-48"}`}>
                                <Editor
                                  height="100%"
                                  language={language}
                                  theme="vs-light"
                                  value={starterCode}
                                  onChange={(value) => setStarterCode(value)}
                                  options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    lineNumbers: "on",
                                    scrollBeyondLastLine: false,
                                    fontFamily: "'Fira Code', monospace",
                                  }}
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                  <Settings className="w-4 h-4 text-amber-500" />
                                  Test Cases
                                </label>
                                <button
                                  type="button"
                                  onClick={handleAddTestCase}
                                  className="flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all duration-200"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add
                                </button>
                              </div>
                              
                              {testCases.map((tc, index) => (
                                <div key={index} className="relative group/tc p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTestCase(index)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover/tc:opacity-100 transition-all duration-200 shadow-sm"
                                    title="Remove Test Case"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  
                                  <div className="flex items-center gap-2 text-xs font-medium text-blue-600 mb-2">
                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Test Case {index + 1}</span>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Input (stdin)</label>
                                    <textarea
                                      placeholder="Input..."
                                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none text-sm transition-all duration-200"
                                      rows="2"
                                      value={tc.input}
                                      onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Expected Output</label>
                                    <textarea
                                      placeholder="Expected output..."
                                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none text-sm transition-all duration-200"
                                      rows="2"
                                      value={tc.expectedOutput}
                                      onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)}
                                      required
                                    />
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={tc.isHidden}
                                      onChange={(e) => handleTestCaseChange(index, "isHidden", e.target.checked)}
                                      className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded"
                                    />
                                    <span className="text-sm text-gray-600">Hidden Test Case</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                          <button
                            type="submit"
                            className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200"
                          >
                            <span className="flex items-center justify-center gap-2">
                              {editingId ? (
                                <>
                                  <CheckCircle className="w-5 h-5" />
                                  Update Question
                                </>
                              ) : (
                                <>
                                  <Plus className="w-5 h-5" />
                                  Add Question
                                </>
                              )}
                            </span>
                          </button>

                          {editingId && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all duration-200"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Questions List Section */}
                <div className={`${isFullscreen ? "col-span-1" : "lg:col-span-2"} space-y-4`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-slate-900">
                      <Eye className="w-5 h-5 text-amber-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Existing Questions ({questionsList.length})
                    </h3>
                  </div>
                  
                  {questionsList.length === 0 ? (
                    <div className="relative">
                      <div className="relative bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-sm">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-900 flex items-center justify-center">
                          <FileText className="w-10 h-10 text-amber-300" />
                        </div>
                        <p className="text-gray-700 font-medium">No questions added yet</p>
                        <p className="text-gray-400 text-sm mt-1">Use the form on the left to add one</p>
                      </div>
                    </div>
                  ) : (
                    questionsList.map((q, i) => (
                      <div key={q._id} className="relative group">
                        <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-semibold text-lg flex items-start gap-2 flex-1 pr-4">
                              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-amber-300 text-sm font-bold shrink-0">
                                Q{i + 1}
                              </span>
                              <span className="text-gray-800">{q.question}</span>
                              {q.type === "coding" && (
                                <span className="shrink-0 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-bold border border-amber-200">
                                  Coding
                                </span>
                              )}
                            </h4>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleEdit(q)}
                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-all duration-200 disabled:opacity-50"
                                disabled={isPublished}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(q._id)}
                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 transition-all duration-200 disabled:opacity-50"
                                disabled={isPublished}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {q.type === "mcq" ? (
                            <ul className="pl-2 space-y-2">
                              {q.options.map((opt, idx) => (
                                <li
                                  key={idx}
                                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                                    q.correctOption === idx
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium shadow-sm"
                                      : "bg-gray-50 text-gray-600 border border-gray-100"
                                  }`}
                                >
                                  <span className={`w-6 h-6 flex items-center justify-center rounded-lg mr-3 text-xs font-bold ${
                                    q.correctOption === idx 
                                      ? "bg-emerald-500 text-white" 
                                      : "bg-gray-200 text-gray-500"
                                  }`}>
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  {opt}
                                  {q.correctOption === idx && (
                                    <CheckCircle className="ml-auto w-4 h-4 text-green-500" />
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="pl-2 space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-gray-600">Language:</span>
                                <span className="bg-amber-50 px-2 py-1 rounded-lg uppercase text-xs font-bold text-amber-700">{q.codingData.language}</span>
                              </div>
                              {q.codingData?.testCases && (
                                <div className="border-top border-slate-100 pt-3">
                                  <p className="text-sm font-medium text-gray-600 mb-2">Test Cases:</p>
                                  <div className="space-y-2">
                                    {q.codingData.testCases.map((tc, tcIndex) => (
                                      <div key={tcIndex} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <span className="font-medium text-gray-500">Input:</span>
                                            <span className="text-gray-700 ml-1">{tc.input || "N/A"}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-500">Output:</span>
                                            <span className="text-gray-700 ml-1">{tc.expectedOutput || "N/A"}</span>
                                          </div>
                                        </div>
                                        {tc.isHidden && (
                                          <span className="inline-block mt-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Hidden</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
