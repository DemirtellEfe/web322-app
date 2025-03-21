/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Efe Demirtel Student ID: 126378223 Date: 2025-03-21
*
*  Replit Web App URL: https://replit.com/@edemirtel/web322-app?v=1
* 
*  GitHub Repository URL: https://github.com/DemirtellEfe/web322-app.git
*
********************************************************************************/ 

require('dotenv').config();
const express = require("express");

const app = express(); 
app.set("view engine", "ejs"); 

const path = require("path");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require("./data/store-service.js");

const PORT = process.env.PORT || 3000;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const upload = multer();

app.use(express.static("public")); 
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("about");
});

app.get("/items/add", (req, res) => {
    res.render("addPost");
});

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
            console.log("Uploaded Image URL:", uploaded.url); 
            processItem(uploaded.url);
        }).catch(err => res.status(500).send("File upload failed: " + err));
    } else {
        console.log("No Image Uploaded, Using Default"); 
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
    storeService.getAllItems()
        .then(data => res.render("items", { items: data })) 
        .catch(() => res.render("items", { items: [] }));
});


app.get("/item/:id", (req, res) => {
    storeService.getItemById(req.params.id)
        .then(item => res.render("item", { item: item }))
        .catch(() => res.render("item", { message: "Item not found" }));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then(data => res.render("categories", { categories: data }))
        .catch(() => res.render("categories", { categories: [] }));
});

app.get("/shop", async (req, res) => {
    try {
        const category = req.query.category;
        const allItems = await storeService.getPublishedItems();
        const categories = await storeService.getCategories();

        let filteredItems = allItems;
        if (category) {
            filteredItems = allItems.filter(i => i.category === category);
        }

        const latestItem = filteredItems.length > 0 ? filteredItems[0] : null;

        res.render("shop", {
            item: latestItem,
            items: filteredItems,
            categories: categories,
            selectedCategory: category
        });
    } catch (err) {
        res.status(500).send("Unable to load shop");
    }
});



app.get("/shop/:id", async (req, res) => {
    try {
        const category = req.query.category;

        const allItems = await storeService.getPublishedItems();
        const categories = await storeService.getCategories();

        let filteredItems = allItems;
        if (category) {
            filteredItems = allItems.filter(i => i.category === category);
        }

        const selectedItem = allItems.find(i => i.id == req.params.id);

        res.render("shop", {
            item: selectedItem,
            items: filteredItems,
            categories: categories,
            selectedCategory: category
        });
    } catch (err) {
        res.status(500).send("Unable to load selected item");
    }
});
app.get("/about", (req, res) => {
    res.render("about");
});


