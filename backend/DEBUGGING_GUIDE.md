# 🔍 Detailed Backend Debugging Guide & Bug Fixes

This guide documents the exact issues found in your backend codebase, explains why they happen, and provides the corrected code with clear debugging console logs.

---

## 🚩 Bug Summary Table

| File | Line | Issue | Symptoms | Fix |
|---|---|---|---|---|
| `src/components/user.components.js` | 22 | `user._id` instead of `users._id` | `TypeError: Cannot read properties of null (reading '_id')` during registration | Use `users._id` |
| `src/components/user.components.js` | 10, 47 | Returns `404` for duplicate user and wrong password | Frontend thinks endpoint doesn't exist | Return `409 Conflict` and `401 Unauthorized` |
| `src/components/user.components.js` | 31, 64 | Password hash leaked in JSON response | Sensitive password hash sent to client | Omit password from responses |
| `src/components/user.components.js` | All | Missing `try/catch` | Unhandled exceptions hang the request | Wrap with `try/catch` |
| `src/socket/socket.server.js` | 44 | Event name typo: `ai-respose` | Client listening for `ai-response` receives nothing | Emit `ai-response` |
| `src/socket/socket.server.js` | 28 | No error handling in `socket.on("ai-message")` | AI rate limits or 503 causes unhandled rejection | Add `try/catch` & emit `ai-error` |
| `src/app.js` | 1-13 | Missing `cors` middleware | Browser blocks API calls from Vite/React (port 5173) | Add `cors` with `credentials: true` |
| `server.js` | 8 | `connectedDB()` not awaited | Server accepts requests before DB is connected | `await connectedDB()` in async function |
| `src/service/ai.service.js` | 11 | Deprecated model name `gemini-3.5-flash` | Throws 404/Not Found error | Prioritize `gemini-3.8-flash` |
| `.env` vs code | - | Misspelling: `JWT_SCERET` | Risk of JWT errors if spelled `JWT_SECRET` | Support both keys |

---

## 🛠️ Detailed Bug Walkthroughs

### 1. The Fatal Registration Bug (`user._id` vs `users._id`)

#### ❌ The Buggy Code (`src/components/user.components.js`):
```javascript
const register = async (req, res) => {
  const { email, name, password } = req.body;
  const user = await userModel.findOne({ email: email.trim().toLowerCase() });
  if (user) {
    return res.status(404).send({ message: "user is already register" });
  }

  const hashpassword = await bcrypt.hash(password, 10);
  const users = await userModel.create({
    email,
    password: hashpassword,
    name,
  });

  // 💥 ERROR HERE: `user` is null because userModel.findOne returned null!
  // Accessing `user._id` throws TypeError: Cannot read properties of null (reading '_id')
  const token = jwt.sign({ id: user._id }, process.env.JWT_SCERET, {
    expiresIn: "2d",
  });
```

#### ✅ The Fix:
```javascript
  // Fix: Use `users._id` (the document that was just created)
  const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SCERET;
  const token = jwt.sign({ id: users._id }, jwtSecret, {
    expiresIn: "2d",
  });
```

---

### 2. Socket Event Name Typo (`ai-respose`)

#### ❌ The Buggy Code (`src/socket/socket.server.js`):
```javascript
socket.emit("ai-respose", {
  content: response,
  chat: messageplayload?.chat,
});
```
Notice the missing **'n'**: `ai-respose` instead of `ai-response`. If your frontend does `socket.on("ai-response", ...)`, it will never fire!

#### ✅ The Fix:
```javascript
// Emit the correct event name, and optionally emit the old typo for compatibility:
socket.emit("ai-response", {
  content: response,
  chat: messagePayload?.chat,
});
socket.emit("ai-respose", {
  content: response,
  chat: messagePayload?.chat,
});
```

---

### 3. Socket AI Error Handling

#### ❌ The Problem:
If the Gemini API is busy (HTTP 503), rate-limited, or network fails, the `generateResponse()` call throws an error. Because there is no `try/catch` around it inside `socket.on("ai-message")`, the server encounters an unhandled rejection and the user's chat screen spins forever without any error notification.

#### ✅ The Fix:
Wrap in `try/catch` and emit an `ai-error` event so the frontend can display an alert or retry button:
```javascript
try {
  const response = await generateResponse(messagePayload.content);
  // save model response and emit ai-response
} catch (error) {
  console.error("[SOCKET ERROR] Failed to generate AI response:", error.message);
  socket.emit("ai-error", {
    message: "Failed to generate AI response. Please try again.",
    chat: messagePayload?.chat
  });
}
```

---

### 4. Missing CORS Configuration in `app.js`

#### ❌ The Problem:
When your frontend runs on `http://localhost:5173` (Vite) and your backend runs on `http://localhost:3000`, the browser treats this as Cross-Origin. Without `cors` and `credentials: true`:
1. API calls will be blocked with CORS error in browser console.
2. The authentication cookie `token` will NOT be stored by the browser or sent in future requests!

#### ✅ The Fix (`src/app.js`):
```javascript
const cors = require("cors");

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true // allows cookies to be sent
}));
```

---

### 5. Server Startup Race Condition

#### ❌ The Problem in `server.js`:
```javascript
connectedDB(); // ⚠️ Asynchronous function called without await!
connectedserver(httpserver);

httpserver.listen(process.env.PORT, () => {
  console.log("server is connected");
});
```
`connectedDB()` is an async promise. The HTTP server starts listening BEFORE MongoDB has finished connecting! If a user registers within the first few seconds, the request crashes because Mongoose has no active connection.

#### ✅ The Fix (`server.js`):
```javascript
async function startServer() {
  try {
    await connectedDB(); // wait for MongoDB to connect first
    connectedserver(httpserver);

    const port = process.env.PORT || 3000;
    httpserver.listen(port, () => {
      console.log(`[SERVER] 🚀 Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("[SERVER ERROR] Failed to start:", err);
    process.exit(1);
  }
}

startServer();
```

---

## 📄 Complete Ready-to-Paste Corrected Files

### 1. `src/components/user.components.js`
```javascript
const userModel = require("../models/usermodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.JWT_SECRET || process.env.JWT_SCERET;

// 1. REGISTER
const register = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      console.log(`[AUTH] ⚠️ Register attempt for already existing email: ${normalizedEmail}`);
      return res.status(409).json({
        message: "User is already registered with this email.",
      });
    }

    const hashpassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      email: normalizedEmail,
      password: hashpassword,
      name: name.trim(),
    });

    console.log(`[AUTH] 🟢 New user created with ID: ${newUser._id}`);

    const token = jwt.sign({ id: newUser._id }, getJwtSecret(), {
      expiresIn: "2d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("[AUTH ERROR] Register failed:", error);
    return res.status(500).json({ message: "Internal server error during registration." });
  }
};

// 2. LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`[AUTH] ❌ Login failed: User not found for email: ${normalizedEmail}`);
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[AUTH] ❌ Login failed: Wrong password for email: ${normalizedEmail}`);
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    console.log(`[AUTH] 🟢 User logged in successfully: ${user._id}`);

    const token = jwt.sign({ id: user._id }, getJwtSecret(), {
      expiresIn: "2d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "User logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[AUTH ERROR] Login failed:", error);
    return res.status(500).json({ message: "Internal server error during login." });
  }
};

// 3. PROFILE
const profile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("[AUTH ERROR] Profile fetch failed:", error);
    return res.status(500).json({ message: "Internal server error fetching profile." });
  }
};

module.exports = { register, login, profile };
```

---

### 2. `src/socket/socket.server.js`
```javascript
const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const usermodel = require("../models/usermodel");
const messagemodel = require("../models/messagemodel");
const { generateResponse } = require("../service/ai.service");

const getJwtSecret = () => process.env.JWT_SECRET || process.env.JWT_SCERET;

const connectedserver = (httpserver) => {
  const io = new Server(httpserver, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers?.cookie || "";
      // In cookie v2.x, parseCookie is used
      const cookies = cookie.parseCookie ? cookie.parseCookie(rawCookie) : cookie.parse(rawCookie);

      if (!cookies.token) {
        console.log("[SOCKET AUTH] ❌ Connection rejected: No token provided in cookies.");
        return next(new Error("authentication error : token is not provided"));
      }

      const decode = jwt.verify(cookies.token, getJwtSecret());
      const user = await usermodel.findById(decode.id).select("-password");

      if (!user) {
        console.log("[SOCKET AUTH] ❌ Connection rejected: User not found in DB.");
        return next(new Error("authentication error : user not found"));
      }

      socket.user = user;
      console.log(`[SOCKET AUTH] 🟢 Authenticated user: ${user.email} (${user._id})`);
      next();
    } catch (error) {
      console.error("[SOCKET AUTH] ❌ Verification failed:", error.message);
      next(new Error("authentication error : invalid or expired token"));
    }
  });

  // Socket Connection Handling
  io.on("connection", (socket) => {
    console.log(`[SOCKET] ⚡ Client connected: socketId=${socket.id}, user=${socket.user.email}`);

    socket.on("ai-message", async (messagePayload) => {
      try {
        if (!messagePayload?.content || !messagePayload?.chat) {
          return socket.emit("ai-error", { message: "Message content and chat ID are required." });
        }

        console.log(`[SOCKET] 📩 Received prompt for chat ${messagePayload.chat}: "${messagePayload.content}"`);

        // 1. Save user's message to MongoDB
        await messagemodel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: messagePayload.content,
          role: "user",
        });

        // 2. Call Gemini AI service
        const response = await generateResponse(messagePayload.content);
        console.log(`[SOCKET] 🤖 AI Response generated (${response.length} chars)`);

        // 3. Save AI model's response to MongoDB
        await messagemodel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: response,
          role: "model",
        });

        // 4. Emit AI response to client
        const payload = {
          content: response,
          chat: messagePayload.chat,
        };

        socket.emit("ai-response", payload);
        socket.emit("ai-respose", payload); // fallback for original spelling

      } catch (err) {
        console.error("[SOCKET ERROR] Processing ai-message failed:", err.message);
        socket.emit("ai-error", {
          message: "Failed to generate AI response. Please try again.",
          chat: messagePayload?.chat,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] 🔌 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = connectedserver;
```

---

### 3. `src/service/ai.service.js`
```javascript
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateResponse(content) {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Message content is required and cannot be empty.");
  }

  // Model prioritization: gemini-3.8-flash is the primary current model
  const models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      console.log(`[AI SERVICE] ⏳ Attempting generation with model: ${model}...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: content,
      });

      if (response && response.text) {
        console.log(`[AI SERVICE] ✅ Generated successfully using ${model}`);
        return response.text;
      }
    } catch (err) {
      console.warn(`[AI SERVICE] ⚠️ Model ${model} failed: ${err.message}. Trying next fallback...`);
    }
  }

  throw new Error("All AI models failed to generate content. Please check API key and quota.");
}

module.exports = { generateResponse };
```

---

### 4. `server.js`
```javascript
require("dotenv").config();
const app = require("./src/app");
const connectedDB = require("./src/database/db.js");
const connectedserver = require("./src/socket/socket.server.js");
const { createServer } = require("http");

const httpserver = createServer(app);

async function startServer() {
  try {
    // 1. Connect to MongoDB before accepting HTTP/WebSocket connections
    console.log("[DB] ⏳ Connecting to MongoDB...");
    await connectedDB();

    // 2. Attach Socket.IO to HTTP server
    connectedserver(httpserver);

    // 3. Start listening
    const port = process.env.PORT || 3000;
    httpserver.listen(port, () => {
      console.log(`[SERVER] 🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("[SERVER FATAL] Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
```

---

### 5. `src/app.js`
```javascript
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authroute = require("./routes/user.routes");
const chatroute = require("./routes/chat.routes");

const app = express();

// Enable CORS for frontend client
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "ChatGPT Clone Backend API is running." });
});

// Routes
app.use("/user", authroute);
app.use("/chat", chatroute);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

module.exports = app;
```
