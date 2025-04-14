/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
*  No part of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
*
*  Name: Efe Demirtel  Student ID: 126378223  Date: 2025-04-13
*
*  Replit Web App URL: https://replit.com/@edemirtel/web322-app?v=1
*  GitHub Repository URL: https://github.com/DemirtellEfe/web322-app.git
********************************************************************************/

require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const storeService = require("./data/store-service.js");
const expressLayouts = require("express-ejs-layouts");
const authData = require("./auth-service");
const clientSessions = require("client-sessions");


const upload = multer();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.use(clientSessions({
  cookieName: "session",
  secret: "web322appSecretKey",
  duration: 2 * 60 * 60 * 1000,
  activeDuration: 1000 * 60 * 5 
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.set("layout", "layouts/main");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ROUTES
app.get("/", (req, res) => res.render("about"));

app.get("/items/add", ensureLogin, (req, res) => {
  storeService.getCategories()
    .then((cats) => res.render("addPost", { categories: cats }))
    .catch(() => res.render("addPost", { categories: [] }));
});

app.post("/items/add", ensureLogin, upload.single("featureImage"), (req, res) => {
  const processItem = (imageUrl) => {
    req.body.featureImage = imageUrl;
    req.body.published = req.body.published ? true : false;
    for (let prop in req.body) {
      if (req.body[prop] === "") req.body[prop] = null;
    }
    req.body.postDate = new Date();

    storeService.addItem(req.body)
      .then(() => res.redirect("/items"))
      .catch((err) => res.status(500).send("Failed to add item: " + err));
  };

  if (req.file) {
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    streamUpload(req)
      .then((uploaded) => processItem(uploaded.url))
      .catch((err) => res.status(500).send("File upload failed: " + (err.message || JSON.stringify(err))));
  } else {
    processItem("");
  }
});


app.get("/items", (req, res) => {
  storeService.getAllItems()
    .then((data) => {
      res.render("items", {
        items: data,
        message: data.length > 0 ? null : "no results"
      });
    })
    .catch(() => {
      res.render("items", {
        items: [],
        message: "no results"
      });
    });
});

app.get("/items/delete/:id", ensureLogin, (req, res) => {
  storeService.deletePostById(req.params.id)
    .then(() => res.redirect("/items"))
    .catch(() => res.status(500).send("Unable to Remove Item / Item not found"));
});

app.get("/item/:id", (req, res) => {
  storeService.getItemById(req.params.id)
    .then((item) => res.render("item", { item }))
    .catch(() => res.render("item", { message: "Item not found" }));
});

app.get("/categories", (req, res) => {
  storeService.getCategories()
    .then((data) => res.render("categories", { categories: data }))
    .catch(() => res.render("categories", { categories: [] }));
});

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", ensureLogin, (req, res) => {
  storeService.addCategory(req.body)
    .then(() => res.redirect("/categories"))
    .catch((err) => res.status(500).send("Failed to add category: " + err));
});


app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  storeService.deleteCategoryById(req.params.id)
    .then(() => res.redirect("/categories"))
    .catch(() => res.status(500).send("Unable to Remove Category / Category not found"));
});


app.get("/shop", async (req, res) => {
  try {
    const categoryId = parseInt(req.query.category);
    const categories = await storeService.getCategories();
    let items = await storeService.getPublishedItems();

    if (!isNaN(categoryId)) {
      items = items.filter(i => i.category === categoryId);
    }

    res.render("shop", {
      item: null,
      items,
      categories,
      selectedCategory: categoryId
    });
  } catch (err) {
    res.status(500).send("Unable to load shop");
  }
});

app.get("/shop/:id", async (req, res) => {
  try {
    const categoryId = parseInt(req.query.category);
    const categories = await storeService.getCategories();
    const allItems = await storeService.getPublishedItems();
    const selectedItem = allItems.find(i => i.id == req.params.id);
    let filteredItems = allItems;

    if (!isNaN(categoryId)) {
      filteredItems = allItems.filter(i => i.category === categoryId);
    }

    res.render("shop", {
      item: selectedItem,
      items: filteredItems,
      categories,
      selectedCategory: categoryId
    });
  } catch (err) {
    res.status(500).send("Unable to load selected item");
  }
});

storeService.initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to start server:", err);
  });


  function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
  }

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  authData.registerUser(req.body)
    .then(() => {
      res.render("register", { successMessage: "User created" });
    })
    .catch(err => {
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName
      });
    });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData.checkUser(req.body)
    .then(user => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect("/items");
    })
    .catch(err => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName
      });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.use((req, res) => {
  res.status(404).render("404", { message: "Page Not Found" });
});

  