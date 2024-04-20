const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const app = express();
const cors = require("cors");
const { v4: uuidv4 } = require("uuid"); 

// Defines paths for video and image storage
const videosPath = path.join(__dirname, "..", "data", "videos.json");
const imagesPath = path.join(__dirname, "..", "public", "images");

// File filter for image uploads - only allows image file types (additional backend validation)
const imageFileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|svg|bmp|tiff|webp|eps|gif)$/i)) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};

// Cronfigure multer for image storage management
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, imagesPath);  
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        let newImageNumber = 0;
        const videos = getVideos(); 
        videos.forEach(video => {
            const imageName = path.basename(video.image);
            const imageNumber = parseInt(imageName.replace("image", "").replace(ext, ""));
            if (imageNumber >= newImageNumber) {
                newImageNumber = imageNumber + 1;
            }
        });
        const fileName = `/image${newImageNumber}${ext}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage, fileFilter: imageFileFilter });

// Enables static file serving and CORS
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());