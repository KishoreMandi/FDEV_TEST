import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerUser } from "../../api/authApi";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(form);
      toast.success("Account created successfully!");
      navigate("/");
    } catch {
      toast.error("Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 to-blue-900">
      <div className="bg-[#eef4ff] w-[900px] max-w-full rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        
        {/* LEFT FORM */}
        <div className="p-10">
          <h2 className="text-2xl font-bold mb-2">Sign up</h2>
          <p className="text-gray-600 mb-6">
            Create your account to start exams.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              placeholder="Name"
              className="w-full p-3 rounded-full border"
              onChange={handleChange}
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email id"
              className="w-full p-3 rounded-full border"
              onChange={handleChange}
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-full border"
              onChange={handleChange}
              required
            />

            <select
              name="role"
              className="w-full p-3 rounded-full border"
              onChange={handleChange}
            >
              <option value="student">Student / Employee</option>
              <option value="trainer">Trainer</option>
            </select>

            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-full font-semibold transition"
            >
              Submit
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-700 font-semibold hover:underline"
            >
              Login here
            </Link>
          </p>
        </div>

        {/* RIGHT ILLUSTRATION */}
        <div className="hidden md:flex items-center justify-center bg-[#e1ecff]">
          <img
          
            src="/download.svg"
            alt="Signup Illustration"
            className="w-72"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;
