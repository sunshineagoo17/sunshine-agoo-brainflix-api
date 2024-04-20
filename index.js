require("dotenv").config();
const express = require("express");
const cors = require("cors");
const videosRouter = require("./routes/videos");

const app = express();
const PORT = process.env.PORT || 8080;

// Configure CORS dynamically using env variables
const corsOptions = {
    origin: process.env.CORS_ORIGIN, 
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the "images" directory
app.use(express.static("public/images"));

// Serve static files from the 'videos' directory
app.use(express.static("public/videos"));