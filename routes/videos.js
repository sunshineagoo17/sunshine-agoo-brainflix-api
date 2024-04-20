const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const app = express();
const cors = require("cors");
const { v4: uuidv4 } = require("uuid"); 

// Enables static file serving and CORS
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());