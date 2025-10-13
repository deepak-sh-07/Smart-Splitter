// server.js
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= Config =================
const {
  ACCESS_SECRET,
  REFRESH_SECRET,
  MONGO_URI,
  PORT = 5000,
} = process.env;

const client = new MongoClient(MONGO_URI);
let db, Groups, Expenses, Users;

// ================= DB Connect =================
async function connectDB() {
  try {
    await client.connect();
    db = client.db("smart_splitter");
    Groups = db.collection("groups");
    Expenses = db.collection("expenses");
    Users = db.collection("users");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
connectDB();

// ================= Middleware =================
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token missing" });

  jwt.verify(token, ACCESS_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user; // { userId, email }
    next();
  });
}

// ================= Auth Routes =================

// 🧍 Register User
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const existing = await Users.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);
    const result = await Users.insertOne({ name, email, password: hash });

    res.json({ message: "Registered successfully", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔑 Login User
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Incorrect password" });

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
    res.status(500).json({ error: err.message });
  }
});

// 🔁 Refresh Token
app.post("/api/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ error: "Refresh token required" });

  jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid refresh token" });
    const accessToken = jwt.sign(
      { userId: user.userId, email: user.email },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken });
  });
});

// ================= Group Routes =================

// 📂 Get Groups
app.get("/api/groups", authenticateToken, async (req, res) => {
  try {
    const groups = await Groups.find({ ownerId: req.user.userId }).toArray();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Create Group
app.post("/api/groups", authenticateToken, async (req, res) => {
  try {
    const { title, participants } = req.body;
    if (!title || !participants?.length)
      return res.status(400).json({ error: "Title and participants required" });

    const newGroup = {
      title,
      participants,
      ownerId: req.user.userId,
      createdAt: new Date(),
    };

    const result = await Groups.insertOne(newGroup);
    res.json({ id: result.insertedId, ...newGroup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= Expense Routes =================

// 💸 Add Expense
app.post("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const { groupId, description, amount, paidBy, splitBetween } = req.body;
    if (!groupId || !description || !amount || !paidBy || !splitBetween?.length)
      return res.status(400).json({ error: "All fields are required" });

    const expense = {
      groupId,
      description,
      amount: parseFloat(amount),
      paidBy,
      splitBetween,
      createdAt: new Date(),
    };

    const result = await Expenses.insertOne(expense);
    res.json({ id: result.insertedId, ...expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 Get Group Summary
app.get("/api/expenses/:groupId", authenticateToken, async (req, res) => {
  try {
    const expenses = await Expenses.find({ groupId: req.params.groupId }).toArray();
    const balances = {};

    expenses.forEach(({ paidBy, splitBetween, amount }) => {
      const participants = [paidBy, ...splitBetween];
      const share = amount / participants.length;

      participants.forEach((person) => {
        balances[person] = balances[person] || 0;
        if (person === paidBy) balances[person] += amount - share;
        else balances[person] -= share;
      });
    });

    const creditors = [];
    const debtors = [];

    for (const [name, balance] of Object.entries(balances)) {
      if (balance > 0) creditors.push({ name, amount: balance });
      else if (balance < 0) debtors.push({ name, amount: -balance });
    }

    const transactions = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);
      transactions.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: Number(amount.toFixed(2)),
      });

      debtors[i].amount -= amount;
      creditors[j].amount -= amount;
      if (debtors[i].amount === 0) i++;
      if (creditors[j].amount === 0) j++;
    }

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ➖ Delete Group
app.delete("/api/groups/:groupId", authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Delete only if the logged-in user owns the group
    const result = await Groups.deleteOne({
      _id: new ObjectId(groupId),
      ownerId: req.user.userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Group not found or you are not the owner" });
    }

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong while deleting group" });
  }
});


// ================= Start Server =================
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
