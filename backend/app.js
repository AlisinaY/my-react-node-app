require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { fromEnv } = require("@aws-sdk/credential-provider-env");
const cors = require("cors");
const path = require("path");
const Product = require("./models/Product");
const User = require("./models/User.js");

const app = express();

// Middleware
app.use(cors({ origin: `${process.env.API_URL}`, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "geheimnis123",
    resave: false,
    saveUninitialized: false
  })
);

// DB-Verbindung
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware zum Prüfen, ob eingeloggt
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ error: "Nicht eingeloggt" });
}

// S3 Konfiguration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromEnv()
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    key: (req, file, cb) => {
      const filename = Date.now() + "-" + path.basename(file.originalname);
      cb(null, filename);
    }
  })
});

// ======== Auth-Routen ========
app.post("/api/register", async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = new User({
    username: req.body.username,
    password: hashedPassword
  });
  await user.save();
  res.status(201).json({ success: true });
});

app.post("/api/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && (await bcrypt.compare(req.body.password, user.password))) {
    req.session.userId = user._id;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Login fehlgeschlagen" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ======== Produkt-Routen ========
app.get("/api/products", isAuthenticated, async (req, res) => {
  const products = await Product.find({ user: req.session.userId }).sort({
    _id: -1
  });
  res.json(products);
});

app.post(
  "/api/products",
  isAuthenticated,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Kein Bild ausgewählt." });
    }
    if (isNaN(req.body.price)) {
      return res.status(400).json({ error: "Ungültiger Preis" });
    }

    const imageUrl = req.file.location;

    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      imagePath: imageUrl,
      user: req.session.userId
    });
    await product.save();
    res.status(201).json(product);
  }
);

app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || product.user.toString() !== req.session.userId) {
    return res
      .status(404)
      .json({ error: "Produkt nicht gefunden oder kein Zugriff" });
  }

  const imageKey = product.imagePath.split("/").pop();
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imageKey
      })
    );
    await product.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Löschen" });
  }
});

// Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🛒 REST-API läuft auf Port ${PORT}`);
});
