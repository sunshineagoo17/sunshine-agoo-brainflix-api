const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// Defines paths for video and image storage
const videosPath = path.join(__dirname, "..", "data", "videos.json");
const imagesPath = path.join(__dirname, "..", "public", "images");

// Helper function to read videos data from JSON file
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
        console.log("File written successfully");
    } catch (err) {
        console.error("Error writing file:", err);
    }
};

// File filter for image uploads - only allows image file types (additional backend validation)
const imageFileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|svg|bmp|tiff|webp|eps|gif)$/i)) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};

// Configure multer for image storage management
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

// Routes

// Get all videos with minimal data
router.get("/", (req, res) => {
    const videos = getVideos();
    const minimalVideoData = videos.map(video => ({
        id: video.id,
        title: video.title,
        channel: video.channel,
        image: video.image,
    }));
    res.json(minimalVideoData);
});

// Get video details by ID
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

// PUT endpoint to increment the view count for a video
router.put("/:videoId/views", (req, res) => {
    const videos = getVideos();
    const videoIndex = videos.findIndex(v => v.id === req.params.videoId);
    if (videoIndex !== -1) {
        // Parse the views count from string to number, increment it, and convert it back to string
        let currentViews = parseInt(videos[videoIndex].views.replace(/,/g, "")) + 1;
        currentViews = currentViews.toLocaleString();
        videos[videoIndex].views = currentViews;
        saveVideos(videos);
        res.status(200).json(videos[videoIndex]); // Send the updated video object with the views count in the response
    } else {
        res.status(404).send({ error: "Video not found" });
    }
});

// Extra routes for handling video uploads
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
        const comments = generateRandomComments(3);

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

        res.status(201).json({ message: "Image uploaded successfully", videoId: newVideo.id, imagePath: imagePath });
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
    "Incredible! He's so skilled. The clarity and depth of the content make it easy to understand and engage with. Really looking forward to more videos like this one.",
    "This was exceptionally enlightening! The enthusiasm not only kept me hooked but also greatly enhanced my understanding of the topic. Can't wait to watch more!",
    "What a fantastic video! This was sooo cool to watch. It helped illustrate the concepts perfectly. This has sparked a real interest in learning more about the subject.",
    "Superbly done! Every minute of this video was worth watching. It's packed with insightful information and practical advice that I can actually use.",
    "Exciting stuff! I was thoroughly impressed by how you got me hooked to my screen. Summer can't come soon enough. Great work with this video! Keep making great content!",
    "This video is a treasure trove of knowledge! It's not just informative but also incredibly motivating. It's videos like these that inspire lifelong creativity.",
    "Absolutely loved the visuals in this video! They were not only beautiful but really helped in reinforcing this amazing subject. Wow! I'm absolutely in awe of those shots. Great job!",
    "I was glued to my seat this whole time. Truly an excellent resource for anyone looking to dive into this world. Those engaging shots kept me at the edge of my seat."
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
            likes: Math.floor(Math.random() * 10),
            timestamp: Date.now() - i * 1000
        };

        comments.push(comment);

        // Increment indices and reset to 0 if reached the end of the arrays
        lastUsedNameIndex = (lastUsedNameIndex + 1) % shuffledNames.length;
        lastUsedCommentIndex = (lastUsedCommentIndex + 1) % shuffledComments.length;
    }
    return comments;
};

module.exports = router;