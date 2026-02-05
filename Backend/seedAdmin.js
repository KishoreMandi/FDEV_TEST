import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const adminEmail = "admin@example.com";
    const adminPassword = "admin"; // Change this in production
    const adminName = "Admin";

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin user already exists");
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isApproved: true
      });

      await adminUser.save();
      console.log("Admin user created successfully");
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
