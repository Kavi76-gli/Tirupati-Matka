/* =========================================================
   KALYAN MASTER - MAIN SERVER
   Express 5 Compatible
========================================================= */

/* =========================
   ENVIRONMENT
========================= */

require("dotenv").config();


/* =========================
   IMPORTS
========================= */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");

const replayDailyGames = require("./cron/dailyGameReset");


/* =========================
   APP
========================= */

const app = express();


/* =========================
   CONFIGURATION
========================= */

const PORT = process.env.PORT || 5000;


/* =========================================================
   IMPORTANT FOLDER PATHS

   Project structure:

   Kalyan4Days/
   ├── backend/
   │   ├── server.js
   │   ├── routes/
   │   ├── cron/
   │   └── uploads/
   │
   └── frontend/
       └── public/
           ├── index.html
           ├── style.css
           ├── main.js
           └── ...
========================================================= */

// server.js is inside /backend
// Go one level back → /Kalyan4Days
// Then enter /frontend/public

const FRONTEND_PATH = path.join(
  __dirname,
  "..",
  "frontend",
  "public"
);


const INDEX_FILE = path.join(
  FRONTEND_PATH,
  "index.html"
);


const UPLOADS_PATH = path.join(
  __dirname,
  "uploads"
);


/* =========================================================
   STARTUP PATH CHECK
========================================================= */

console.log("==========================================");
console.log("🚀 KALYAN MASTER SERVER STARTING");
console.log("==========================================");
console.log("📁 Backend path:", __dirname);
console.log("📁 Frontend path:", FRONTEND_PATH);
console.log("📄 Index file:", INDEX_FILE);
console.log("📄 Index exists:", fs.existsSync(INDEX_FILE));
console.log("==========================================");


if (!fs.existsSync(INDEX_FILE)) {
  console.error("❌ ERROR: index.html was not found!");
  console.error("❌ Expected location:", INDEX_FILE);
  console.error("❌ Check your Render Root Directory and GitHub files.");
}


/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: true,

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "adminToken",
      "token"
    ]
  })
);


/* =========================================================
   BODY PARSERS
========================================================= */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);


/* =========================================================
   CACHE CONTROL

   HTML:
   Always load the latest version.

   CSS / JS:
   Short cache period.
========================================================= */

app.use((req, res, next) => {

  if (
    req.path === "/" ||
    req.path === "/index.html" ||
    req.path.endsWith(".html")
  ) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader(
      "Pragma",
      "no-cache"
    );

    res.setHeader(
      "Expires",
      "0"
    );

    res.setHeader(
      "Surrogate-Control",
      "no-store"
    );
  }

  next();
});


/* =========================================================
   DAILY GAME CRON JOB
   Runs every day at 4:01 AM India Time
========================================================= */

cron.schedule(
  "1 4 * * *",

  async () => {

    try {

      console.log("🔁 Running daily game replay...");

      await replayDailyGames();

      console.log(
        "✅ Daily game replay completed successfully"
      );

    } catch (error) {

      console.error(
        "❌ Daily game replay failed:",
        error
      );

    }

  },

  {
    timezone: "Asia/Kolkata"
  }
);


/* =========================================================
   SERVE UPLOADS
========================================================= */

app.use(
  "/uploads",

  express.static(
    UPLOADS_PATH,
    {
      maxAge: "1h"
    }
  )
);


/* =========================================================
   API ROUTES
========================================================= */

app.use(
  "/api/auth",
  require("./routes/auth")
);


app.use(
  "/api/match",
  require("./routes/match")
);


app.use(
  "/api/admin",
  require("./routes/adminBidroutes")
);


app.use(
  "/api/gali",
  require("./routes/gali")
);


app.use(
  "/api/gali-bet",
  require("./routes/gali-bet")
);


/* =========================================================
   STATIC FRONTEND FILES

   Serves:
   /style.css
   /main.js
   /images/...
   etc.
========================================================= */

if (fs.existsSync(FRONTEND_PATH)) {

  app.use(
    express.static(
      FRONTEND_PATH,
      {
        index: false,

        maxAge: "1h"
      }
    )
  );

  console.log(
    "✅ Frontend static folder connected"
  );

} else {

  console.error(
    "❌ Frontend folder does not exist:",
    FRONTEND_PATH
  );

}


/* =========================================================
   HOME PAGE

   https://kalyanmaster.onrender.com/

   Opens:

   frontend/public/index.html
========================================================= */

app.get(
  "/",

  (req, res) => {

    if (!fs.existsSync(INDEX_FILE)) {

      return res.status(500).json({
        success: false,
        message: "Frontend index.html not found",
        expectedPath: INDEX_FILE
      });

    }

    res.sendFile(INDEX_FILE);

  }
);


/* =========================================================
   API 404 HANDLER
========================================================= */

app.use(
  "/api",

  (req, res) => {

    res.status(404).json({
      success: false,
      message: "API route not found"
    });

  }
);


/* =========================================================
   FRONTEND FALLBACK
   EXPRESS 5 COMPATIBLE

   DO NOT USE:

   app.get("*", ...)

   USE:

   app.get("/{*path}", ...)
========================================================= */

app.get(
  "/{*path}",

  (req, res) => {

    if (!fs.existsSync(INDEX_FILE)) {

      return res.status(500).json({
        success: false,
        message: "Frontend index.html not found",
        expectedPath: INDEX_FILE
      });

    }

    res.sendFile(INDEX_FILE);

  }
);


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (err, req, res, next) => {

    console.error(
      "❌ Server Error:",
      err
    );

    if (res.headersSent) {
      return next(err);
    }

    res.status(
      err.status || 500
    ).json({

      success: false,

      message:
        err.message ||
        "Internal Server Error"

    });

  }
);


/* =========================================================
   DATABASE + SERVER START
========================================================= */

if (!process.env.MONGO_URI) {

  console.error(
    "❌ MONGO_URI is missing in .env file"
  );

  process.exit(1);

}


mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {

    console.log(
      "✅ MongoDB connected successfully"
    );


    app.listen(
      PORT,

      () => {

        console.log(
          `🚀 Server running on port ${PORT}`
        );

        console.log(
          `🏠 Local URL: http://localhost:${PORT}`
        );

        console.log(
          "🌐 Production URL: https://tirupati-matka.onrender.com/"
        );

        console.log(
          `📁 Backend path: ${__dirname}`
        );

        console.log(
          `📁 Frontend path: ${FRONTEND_PATH}`
        );

        console.log(
          `📄 Index file: ${INDEX_FILE}`
        );

        console.log(
          `📄 Index exists: ${fs.existsSync(INDEX_FILE)}`
        );

      }
    );

  })

  .catch(
    (error) => {

      console.error(
        "❌ MongoDB connection error:",
        error
      );

      process.exit(1);

    }
  );