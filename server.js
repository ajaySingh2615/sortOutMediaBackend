require("dotenv").config({ path: ".env" });

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { DB_NAME } = require("./constants");

const app = express();
const port = 3000;

// MongoDB Connection
const connectDB = async () => {
  try {
    // const connectionInstance = await mongoose.connect(
    //   `mongodb+srv://sortout:sortoutpassword@cluster0.npuol2g.mongodb.net/${DB_NAME}`
    // );
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection error", error);
    process.exit(1);
  }
};
connectDB();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
  api_key: `${process.env.CLOUDINARY_API_KEY}`,
  api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});

// Mongoose Schema and Model
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  team: String,
  gender: String,
  language: String,
  experience: Number,
  image: String,
});

const User = mongoose.model("User", userSchema);

// Middleware
app.use(
  cors({
    origin: "http://127.0.0.1:5500", // Replace with your frontend's domain
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer-Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "user_images",
    allowed_formats: ["jpeg", "png", "jpg"],
  },
});

const upload = multer({ storage });

// POST: Handle form submission
app.post("/submit-data", upload.single("image"), async (req, res) => {
  try {
    const { name, age, team, gender, language, experience } = req.body;
    const imagePath = req.file ? req.file.path : "";

    // Save data to MongoDB
    const user = new User({
      name,
      age,
      team,
      gender,
      language,
      experience,
      image: imagePath,
    });
    const savedUser = await user.save();

    res
      .status(200)
      .json({ message: "Data submitted successfully", data: savedUser });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Error saving data", error });
  }
});

// GET: Fetch all submitted data
app.get("/fetch-data", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Error fetching data", error });
  }
});

// Start server
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);
