// server.js
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= Config =================
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const url = process.env.MONGO_URI;
const dbName = "smart_splitter";
const PORT = process.env.PORT || 5000;

const client = new MongoClient(url);
let db, groupsCollection, expensesCollection, userscollection;

// ================= DB Connect =================
async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    db = client.db(dbName);
    groupsCollection = db.collection("groups");
    expensesCollection = db.collection("expenses");
    userscollection = db.collection("users");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
connectDB();

// ================= Middleware =================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user; // decoded { userId, email }
    next();
  });
}

// ================= Routes =================

// -------- User Register --------
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await userscollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await userscollection.insertOne({
      name,
      email,
      password: hashedPassword,
    });

    res.json({ message: "Registration successful", _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------- User Login --------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userscollection.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    // ✅ Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, email: user.email },
      REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// -------- Refresh Token --------
app.post("/api/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ error: "No refresh token provided" });

  jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid refresh token" });

    const newAccessToken = jwt.sign(
      { userId: user.userId, email: user.email },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });
  });
});


// -------- Protected Routes --------

// Get all groups (Protected)
app.get("/api/groups", authenticateToken, async (req, res) => {
  try {
    const groups = await groupsCollection
      .find({ owner: req.user.username }) // 👈 only fetch user's groups
      .toArray();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Add a group (Protected)
app.post("/api/groups", authenticateToken, async (req, res) => {
  try {
    const { title, participants } = req.body;

    const newGroup = {
      title,
      participants,
      owner: req.user.username,  // 👈 link group to the logged-in user
      createdAt: new Date(),
    };

    const result = await groupsCollection.insertOne(newGroup);
    res.json({ _id: result.insertedId, ...newGroup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all expenses for a group (Protected)
app.get("/api/expenses/:groupId", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await expensesCollection.find({ groupId }).toArray();

    const balanceMap = {};
    expenses.forEach((exp) => {
      const share = exp.amount / exp.splitBetween.length;

      balanceMap[exp.paidBy] = (balanceMap[exp.paidBy] || 0) + exp.amount;

      exp.splitBetween.forEach((person) => {
        balanceMap[person] = (balanceMap[person] || 0) - share;
      });
    });

    let creditors = [];
    let debtors = [];

    for (let [name, balance] of Object.entries(balanceMap)) {
      if (balance > 0) {
        creditors.push({ name, amount: balance });
      } else if (balance < 0) {
        debtors.push({ name, amount: -balance });
      }
    }

    let transactions = [];
    let i = 0,
      j = 0;

    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];

      let amount = Math.min(debtor.amount, creditor.amount);

      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount: Number(amount.toFixed(2)),
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount === 0) i++;
      if (creditor.amount === 0) j++;
    }

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add an expense (Protected)
app.post("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const result = await expensesCollection.insertOne(req.body);
    res.json({ _id: result.insertedId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= Start Server =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
