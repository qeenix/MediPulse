// backend/server.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ✅ Check API running
app.get("/api/ping", (req, res) => res.json({ ok: true, time: new Date() }));

// ✅ Get all patients
app.get("/patients", async (req, res) => {
  try {
    const patients = await prisma.patient.findMany();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add a new patient
app.post("/patients", async (req, res) => {
  try {
    const { name, mobileNumber, currentWeightKg } = req.body;

    if (!name || !mobileNumber) {
      return res
        .status(400)
        .json({ error: "Name and mobile number are required" });
    }

    const patient = await prisma.patient.create({
      data: { name, mobileNumber, currentWeightKg },
    });

    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("API running on", PORT));
