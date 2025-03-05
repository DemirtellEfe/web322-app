/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Efe Demirtel Student ID: 126378223 Date: 2025-03-05
*
*  Replit Web App URL: https://replit.com/@edemirtel/web322-app?v=1
* 
*  GitHub Repository URL: https://github.com/DemirtellEfe/web322-app.git
*
********************************************************************************/ 


require('dotenv').config();
const express = require("express");
const path = require("path");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require("./data/store-service.js");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const upload = multer();

app.use(express.static("views"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "views", "about.html")));

app.get("/items/add", (req, res) => res.sendFile(path.join(__dirname, "views", "addItem.html")));

app.post("/items/add", upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => result ? resolve(result) : reject(error)
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        streamUpload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch(err => res.status(500).send("File upload failed: " + err));
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body)
            .then(() => res.redirect("/items"))
            .catch(err => res.status(500).send("Failed to add item: " + err));
    }
});

app.get("/items", (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(data => res.json(data))
            .catch(() => res.status(404).send("No results returned"));
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then(data => res.json(data))
            .catch(() => res.status(404).send("No results returned"));
    } else {
        res.json(storeService.getAllItems());
    }
});

app.get("/item/:id", (req, res) => {
    storeService.getItemById(req.params.id)
        .then(item => res.json(item))
        .catch(() => res.status(404).send("No result returned"));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
