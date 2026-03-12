require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { init } = require("./db/database");
const { auth } = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

// Public route — no auth needed
app.use("/api/auth", require("./routes/auth"));

// Protected routes — need valid JWT
app.use("/api/readings", auth, require("./routes/readings"));
app.use("/api/patients", auth, require("./routes/patients"));
app.use("/api/alerts", auth, require("./routes/alerts"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;

init().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
