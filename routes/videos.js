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

// Helper functions to read videos data from JSON file
const getVideos = () => {
    try {
        const data = fs.readFileSync(videosPath, "utf8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading file:", err);
        return [];
    }
};

// Helper function to save videos data to JSON file
const saveVideos = (videos) => {
    try {
        fs.writeFileSync(videosPath, JSON.stringify(videos, null, 2), "utf8");
        console.log("File written successfully");  // Log success message
    } catch (err) {
        console.error("Error writing file:", err);
    }
};

// Enables static file serving and CORS
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());

// Routes
router.post("/", upload.single("posterImage"), async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
    }

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded or invalid file type." });
    }

    const { title, description } = req.body;
    const imagePath = req.file ? req.file.filename : "/Upload-video-preview.jpg";

    try {
        // Generate random values for channel, views, likes
        const channel = generateRandomChannel();
        const views = generateRandomViews();
        const likes = generateRandomLikes();
        const video = `/Brainstation_Sample_Video.mp4`;
        const duration = "4:01";

        // Generate random comments
        const comments = generateRandomComments(2);

        // Add video data to videos array
        const newVideo = {
            id: uuidv4(), 
            title, 
            channel, 
            description, 
            views,
            likes, 
            duration, 
            video, 
            image: imagePath,
            timestamp: Date.now(), 
            comments
        };

        const videos = getVideos();
        videos.push(newVideo);

        saveVideos(videos);

        res.status(201).json({ message: "Image uploaded successfully", imagePath: imagePath });
    } catch (error) {
        console.error("Error handling the uploaded image:", error);
        res.status(500).json({ error: "Error processing the uploaded image" });
    }
});

// Shuffle function
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Function to generate a random channel name without repetition
const generateRandomChannel = (() => {
    let shuffledChannels = shuffleArray(["Hugo Boss", "Little Lulu", "The Revers", "Molina Inc.", "Awesome-o Corp.", "The Avengers", "Lululime Group"]);
    let index = 0;
    
    return () => {
        const channel = shuffledChannels[index];
        index = (index + 1) % shuffledChannels.length;
        if (index === 0) {
            shuffledChannels = shuffleArray(shuffledChannels);
        }
        return channel;
    };
})();

// Function to generate random views
const generateRandomViews = () => {
    return (Math.floor(Math.random() * 1000000) + 1000).toLocaleString(); 
};

// Function to generate random likes
const generateRandomLikes = () => {
    return (Math.floor(Math.random() * 110000) + 500).toLocaleString(); 
};

// Arrays of predefined names and comments
const predefinedNames = [
    "El Magnifico",
    "Bolt Pikachu",
    "Max Power",
    "Dolph Lundgren",
    "Abraham Simpson",
    "Stewie Griffin",
    "Bumblebee Dwight",
    "Blaine Coolio"
];

const predefinedComments = [
    "Every time I watch him skate, it's like he's defying gravity. Makes me want to grab my own board and hit the ramps. He's seriously skilled!",
    "Her guitar skills are off the charts! Watching her play lights a fire in me to practice more. One day, I'll jam out like that at my own gig!",
    "His drawing sessions are a joy to watch. It’s amazing how he brings characters to life. I’m dusting off my sketchpad right now—inspired to create!",
    "Seeing her solve those complex math problems so smoothly is just wow. I’m motivated to crack open my textbooks and ace my exams like she does!",
    "Every dive he makes looks so perfect and effortless. Watching him really makes me want to improve my own diving skills. Summer can't come soon enough!",
    "The way she edits her videos is pure art. Makes me want to learn video editing just to see if I can capture magic like that on my own projects.",
    "His cooking tutorials make gourmet dishes seem so accessible. I'm motivated to try those recipes this weekend. Who knows, I might be a hidden chef!",
    "Watching her fitness routine is so motivating. Her strength and flexibility are goals! Time to get off the couch and into the gym. Maybe I'll be as fit as her one day!"
];

// Shuffle the arrays once
const shuffledNames = shuffleArray(predefinedNames.slice()); 
const shuffledComments = shuffleArray(predefinedComments.slice()); 

let lastUsedNameIndex = 0;
let lastUsedCommentIndex = 0;

// Function to generate random comments
const generateRandomComments = (count) => {
    const comments = [];
    for (let i = 0; i < count; i++) {
        const comment = {
            id: uuidv4(),
            name: shuffledNames[lastUsedNameIndex], 
            comment: shuffledComments[lastUsedCommentIndex],
            likes: Math.floor(Math.random() * 50),
            timestamp: Date.now() - i * 1000 
        };

        comments.push(comment);

        // Increment indices and reset to 0 if reached the end of the arrays
        lastUsedNameIndex = (lastUsedNameIndex + 1) % shuffledNames.length;
        lastUsedCommentIndex = (lastUsedCommentIndex + 1) % shuffledComments.length;
    }
    return comments;
};

router.get("/", (req, res) => {
    const videos = getVideos();
    res.json(videos);
});

router.get("/:videoId", (req, res) => {
    const videos = getVideos();
    const video = videos.find(v => v.id === req.params.videoId);
    if (video) {
        res.json(video);
    } else {
        res.status(404).send({ error: "Video not found" });
    }
});

// Route to post a comment on a video
router.post("/:videoId/comments", (req, res) => {
    const { name, comment } = req.body;
    if (!name || !comment) {
        return res.status(400).json({ error: "Missing name or comment" });
    }
    const videos = getVideos();
    const video = videos.find(v => v.id === req.params.videoId);
    if (video) {
        const newComment = {
            id: uuidv4(),
            name,
            comment,
            likes: 0,
            timestamp: Date.now()
        };
        video.comments.push(newComment);
        saveVideos(videos);
        res.status(201).json(newComment);
    } else {
        res.status(404).send({ error: "Video not found" });
    }
});

// PUT endpoint to increment the like count for a video
router.put("/:videoId/likes", (req, res) => {
    const videos = getVideos();
    const videoIndex = videos.findIndex(v => v.id === req.params.videoId);
    if (videoIndex !== -1) {
        // Parse the likes count from string to number before incrementing
        let likesCount = parseInt(videos[videoIndex].likes.replace(/,/g, "")) + 1;
        likesCount = likesCount.toLocaleString();
        videos[videoIndex].likes = likesCount;
        saveVideos(videos); 
        res.status(200).json(videos[videoIndex]); // Send the updated video object with the likes count in the response
    } else {
        res.status(404).send({ error: "Video not found" });
    }
});

// PUT endpoint to increment the like count for a comment on a video
router.put("/:videoId/comments/:commentId/likes", (req, res) => {
    const videos = getVideos();
    const video = videos.find(v => v.id === req.params.videoId);
    if (!video) {
        return res.status(404).json({ error: "Video not found" });
    }

    const comment = video.comments.find(c => c.id === req.params.commentId);
    if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
    }

    comment.likes = (comment.likes || 0) + 1; 
    saveVideos(videos); // Save the updated array to your JSON file

    res.status(200).json({ likes: comment.likes }); 
});

// DELETE a comment from a video
router.delete("/:videoId/comments/:commentId", (req, res) => {
    console.log(`Received request to delete comment ${req.params.commentId} from video ${req.params.videoId}`);
    const videos = getVideos();
    const video = videos.find(v => v.id === req.params.videoId);
    if (video) {
        const commentIndex = video.comments.findIndex(c => c.id === req.params.commentId);
        if (commentIndex !== -1) {
            video.comments.splice(commentIndex, 1); // Remove the comment from the comments array
            saveVideos(videos); 
            res.status(204).send(); 
        } else {
            res.status(404).send({ error: "Comment not found" });
        }
    } else {
        res.status(404).send({ error: "Video not found" });
    }
});

module.exports = router;