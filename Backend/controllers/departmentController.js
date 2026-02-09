import Department from "../models/Department.js";

/* ================= GET ALL DEPARTMENTS ================= */
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ status: "active" }).sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= ADD DEPARTMENT (ADMIN) ================= */
export const addDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const department = await Department.create({ name, description });

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE DEPARTMENT (ADMIN) ================= */
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const department = await Department.findByIdAndUpdate(
      id,
      { name, description, status },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE DEPARTMENT (ADMIN) ================= */
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= SEED DEPARTMENTS ================= */
export const seedDepartments = async () => {
  const startupDepartments = [
    "Engineering",
    "Product Management",
    "Design (UI/UX)",
    "Quality Assurance (QA)",
    "DevOps / SRE",
    "Sales & Marketing",
    "Human Resources (HR)",
    "Finance & Operations",
    "Customer Support",
    "Data Science & Analytics",
    "IT & Security"
  ];

  try {
    for (const name of startupDepartments) {
      const exists = await Department.findOne({ name });
      if (!exists) {
        await Department.create({ name, description: "Standard startup department" });
        console.log(`Seeded Department: ${name}`);
      }
    }
  } catch (error) {
    console.error("Error seeding departments:", error);
  }
};
