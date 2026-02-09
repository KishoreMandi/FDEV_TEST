import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerUser } from "../../api/authApi";
import { getDepartments } from "../../api/departmentApi";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // Default role
  const [department, setDepartment] = useState(""); // New state for department
  const [departmentList, setDepartmentList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch departments on mount
    const fetchDepts = async () => {
      try {
        const { data } = await getDepartments();
        setDepartmentList(data);
        // Optional: Set default department if list is not empty
        // if (data.length > 0) setDepartment(data[0].name);
      } catch (error) {
        console.error("Failed to load departments", error);
        // Fallback or just leave empty so user can type if we wanted to support both, 
        // but requirement is dropdown. We'll stick to dropdown.
      }
    };
    fetchDepts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = { name, email, employeeId, password, role };
      if (role === "student") {
        userData.department = department;
      }
      await registerUser(userData);
      toast.success("Registration successful! Please wait for admin approval.");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-900">
      <div className="bg-[#eef4ff] w-[900px] max-w-full rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        
        {/* LEFT FORM */}
        <div className="p-10">
          <h2 className="text-2xl font-bold mb-2">Register</h2>
          <p className="text-gray-600 mb-6">
            Create your account to get started.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email id"
              className="w-full p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Employee ID / Student ID"
              className="w-full p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="relative">
              <select
                className="w-full p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {role === "student" && (
              <div className="relative">
                <select
                  className="w-full p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Department</option>
                  {departmentList.map((dept) => (
                    <option key={dept._id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                  {departmentList.length === 0 && (
                    <option value="" disabled>Loading departments...</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-full font-semibold transition"
            >
              Register
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-700 font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>

        {/* RIGHT ILLUSTRATION */}
        <div className="hidden md:flex items-center justify-center bg-[#e1ecff]">
          <img
            src="/register.svg"
            alt="Register Illustration"
            className="w-72"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;