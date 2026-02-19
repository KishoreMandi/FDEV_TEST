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
    <div className={`flex ${isFullscreen ? "w-full h-screen" : ""}`}>
      {!isFullscreen && <AdminSidebar />}

      <div className={`${isFullscreen ? "w-full" : "ml-64 w-full"} min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 relative overflow-hidden`}>
        {/* Animated background elements */}
        {!isFullscreen && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-pink-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-bl from-purple-200/20 to-blue-200/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
          </div>
        )}

        {!isFullscreen && <AdminHeader />}

        <div className="relative p-6 max-w-6xl mx-auto">
          {!examId ? (
            // Folder View
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => window.history.back()}
                  className="group p-3 rounded-xl bg-white border border-purple-200 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-200/30 transition-all duration-300"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-pink-500 transition-colors" />
                </button>
                <div>
                  <h2 className="text-3xl font-bold">
                    <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Select Exam Folder
                    </span>
                  </h2>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Choose an exam to manage its questions
                  </p>
                </div>
              </div>

              {exams.length === 0 ? (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl blur-lg opacity-20" />
                  <div className="relative bg-white rounded-2xl p-12 border border-gray-200 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Folder className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No exams found</p>
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
                      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                      
                      <div className="relative bg-gradient-to-br from-white to-purple-50/50 p-6 rounded-2xl border border-purple-100/50 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-100/50 to-purple-100/50 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                        
                        <div className="relative flex flex-col items-center">
                          <div className="relative mb-4">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                            <div className="relative w-16 h-16 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Folder className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 text-center mb-1">{exam.title}</h3>
                          <p className="text-sm text-purple-500 font-medium">Click to manage questions</p>
                          
                          <div className="mt-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-medium">
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
            // Question Management View
            <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <button 
                  onClick={() => setExamId("")}
                  className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-purple-200 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-200/30 transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-pink-500 transition-colors" />
                  <span className="text-gray-600 group-hover:text-pink-500 font-medium">Back to Exams</span>
                </button>
                
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold">
                    <span className="bg-gradient-to-r from-gray-700 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {exams.find(e => e._id === examId)?.title}
                    </span>
                    <span className="text-gray-400 font-normal ml-2">- Questions</span>
                  </h2>
                  <button
                    onClick={handleDownloadQuestions}
                    className="group relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              <div className={`grid ${isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"} gap-8`}>
                {/* Form Section */}
                <div className={`${isFullscreen ? "col-span-1" : "lg:col-span-1"}`}>
                  <div className="relative group sticky top-6">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                    
                    <div className={`relative bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-2xl shadow-xl border border-purple-100/50 overflow-hidden ${isPublished ? "opacity-75" : ""}`}>
                      {/* Card Header */}
                      <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-white to-purple-50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${editingId ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-pink-500 to-purple-500'} shadow-lg`}>
                            {editingId ? <Edit3 className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
                          </div>
                          <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">
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
                        <div className="mx-5 mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                          <div className="flex items-center gap-2 text-amber-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-bold">Exam Published</span>
                          </div>
                          <p className="text-amber-600 text-sm mt-1">Questions cannot be modified.</p>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className={`p-5 space-y-5 ${isPublished ? "pointer-events-none" : ""}`}>
                        {/* Type Toggle */}
                        <div className="flex gap-2 p-1 bg-gradient-to-r from-gray-100 to-purple-100 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setType("mcq")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-300 ${
                              type === "mcq" 
                                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg" 
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <List className="w-4 h-4" />
                            MCQ
                          </button>
                          <button
                            type="button"
                            onClick={() => setType("coding")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-300 ${
                              type === "coding" 
                                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" 
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <Code className="w-4 h-4" />
                            Coding
                          </button>
                        </div>

                        {/* Question Text */}
                        <div className="group">
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <FileText className="w-4 h-4 text-purple-500" />
                            Question Text
                          </label>
                          <textarea
                            placeholder={type === "mcq" ? "Enter your question... (Paste question + 4 options to auto-fill)" : "Enter coding problem description..."}
                            className="w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300 resize-none"
                            rows="3"
                            value={question}
                            onChange={handleQuestionChange}
                            onPaste={type === "mcq" ? handlePaste : undefined}
                            onKeyDown={handleKeyDown}
                            required
                          />
                        </div>

                        {type === "mcq" ? (
                          /* MCQ Options */
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <CheckCircle className="w-4 h-4 text-purple-500" />
                              Options (Select Correct)
                            </label>
                            {options.map((opt, index) => (
                              <div 
                                key={index} 
                                className={`group/option flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${
                                  correctOption === index 
                                    ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg shadow-green-200/30' 
                                    : 'border-purple-200/50 bg-white hover:border-purple-300'
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
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white' 
                                    : 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600'
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
                          /* Coding Fields */
                          <div className="space-y-5">
                            {/* Language */}
                            <div className="group">
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Terminal className="w-4 h-4 text-purple-500" />
                                Programming Language
                              </label>
                              <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300"
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

                            {/* Starter Code */}
                            <div className="group">
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Code className="w-4 h-4 text-purple-500" />
                                Starter Code
                              </label>
                              <div className={`border border-purple-200/50 rounded-xl overflow-hidden shadow-lg ${isFullscreen ? "h-[calc(100vh-500px)]" : "h-48"}`}>
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

                            {/* Test Cases */}
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                  <Settings className="w-4 h-4 text-purple-500" />
                                  Test Cases
                                </label>
                                <button
                                  type="button"
                                  onClick={handleAddTestCase}
                                  className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-800 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-all duration-200"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add
                                </button>
                              </div>
                              
                              {testCases.map((tc, index) => (
                                <div key={index} className="relative group/tc p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 space-y-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTestCase(index)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover/tc:opacity-100 transition-all duration-200 shadow-sm"
                                    title="Remove Test Case"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  
                                  <div className="flex items-center gap-2 text-xs font-medium text-blue-600 mb-2">
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100">Test Case {index + 1}</span>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Input (stdin)</label>
                                    <textarea
                                      placeholder="Input..."
                                      className="w-full px-3 py-2 rounded-lg border border-blue-200/50 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 focus:outline-none text-sm transition-all duration-200"
                                      rows="2"
                                      value={tc.input}
                                      onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Expected Output</label>
                                    <textarea
                                      placeholder="Expected output..."
                                      className="w-full px-3 py-2 rounded-lg border border-blue-200/50 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-200/50 focus:outline-none text-sm transition-all duration-200"
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
                                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                                    />
                                    <span className="text-sm text-gray-600">Hidden Test Case</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-purple-100">
                          <button
                            type="submit"
                            className="flex-1 relative overflow-hidden px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group/btn"
                          >
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <span className="relative flex items-center justify-center gap-2">
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
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                      Existing Questions ({questionsList.length})
                    </h3>
                  </div>
                  
                  {questionsList.length === 0 ? (
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl blur-lg opacity-20" />
                      <div className="relative bg-white rounded-2xl p-12 border border-gray-200 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No questions added yet</p>
                        <p className="text-gray-400 text-sm mt-1">Use the form on the left to add one</p>
                      </div>
                    </div>
                  ) : (
                    questionsList.map((q, i) => (
                      <div key={q._id} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                        
                        <div className="relative bg-gradient-to-br from-white to-purple-50/30 p-5 rounded-2xl border border-purple-100/50 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-semibold text-lg flex items-start gap-2 flex-1 pr-4">
                              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 text-white text-sm font-bold shrink-0">
                                Q{i + 1}
                              </span>
                              <span className="text-gray-700">{q.question}</span>
                              {q.type === "coding" && (
                                <span className="shrink-0 text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold border border-purple-200">
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
                                      ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 font-medium shadow-sm"
                                      : "bg-gray-50 text-gray-600 border border-gray-100"
                                  }`}
                                >
                                  <span className={`w-6 h-6 flex items-center justify-center rounded-lg mr-3 text-xs font-bold ${
                                    q.correctOption === idx 
                                      ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white" 
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
                                <span className="bg-gradient-to-r from-blue-100 to-purple-100 px-2 py-1 rounded-lg uppercase text-xs font-bold text-purple-700">{q.codingData.language}</span>
                              </div>
                              {q.codingData?.testCases && (
                                <div className="border-t border-purple-100 pt-3">
                                  <p className="text-sm font-medium text-gray-600 mb-2">Test Cases:</p>
                                  <div className="space-y-2">
                                    {q.codingData.testCases.map((tc, tcIndex) => (
                                      <div key={tcIndex} className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-xl border border-gray-200">
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
                                          <span className="inline-block mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Hidden</span>
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
