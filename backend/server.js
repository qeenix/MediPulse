// backend/server.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer"); 
require("dotenv").config();

const app = express();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev"; 

app.use(cors());
app.use(express.json());

// --- 1. CONFIGURE MULTER (File Upload Logic) ---
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only images and PDFs are allowed!"), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- BASE AND AUTH MIDDLEWARE ---

app.get("/api/ping", (req, res) => res.json({ ok: true, time: new Date() }));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (token == null) return res.status(401).json({ error: "Access Denied: No Token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err);
      return res.status(403).json({ error: "Access Denied: Invalid Token" }); 
    }
    req.user = user; 
    next();
  });
};

// --- USER AUTH ENDPOINTS ---

app.post("/api/register", async (req, res) => {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, password: hashedPassword, name, role },
            select: { id: true, username: true, name: true, role: true },
        });
        res.status(201).json({ message: 'User successfully registered.', user });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'This username is already in use.' });
        }
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, name: user.name }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

// --- PATIENT ENDPOINTS ---

app.get("/api/patients", authenticateToken, async (req, res) => { 
  try {
    const patients = await prisma.patient.findMany({
        select: {
            id: true,
            name: true,
            mobileNumber: true,
            currentWeightKg: true,
            _count: { select: { consultations: true } }
        },
        orderBy: { name: 'asc' }
    });
    const formattedPatients = patients.map(p => ({
        ...p,
        consultationCount: p._count.consultations
    }));
    res.json(formattedPatients);
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients", authenticateToken, async (req, res) => {
  if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only doctors or admins can register patients.' });
  }
  try {
    const { name, mobileNumber, currentWeightKg } = req.body;
    if (!name || !mobileNumber) {
      return res.status(400).json({ error: "Name and mobile number are required." });
    }
    const existingPatient = await prisma.patient.findUnique({ where: { mobileNumber } });
    if (existingPatient) {
        return res.status(409).json({ error: "A patient with this mobile number already exists." });
    }
    const patient = await prisma.patient.create({
      data: { name, mobileNumber, currentWeightKg: currentWeightKg ? parseFloat(currentWeightKg) : null },
    });
    res.status(201).json(patient);
  } catch (err) {
    console.error("Error adding patient:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/patients/:patientId", authenticateToken, async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            include: {
                consultations: {
                    select: {
                        id: true,
                        createdAt: true,
                        diagnosis: true, 
                        notes: true,
                        weightAtConsultation: true,
                        attachments: true, 
                        prescription: { 
                            select: { 
                                id: true, 
                                status: true,
                                prescribedDrugs: {
                                    include: { drug: true } 
                                }
                            } 
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!patient) return res.status(404).json({ error: "Patient not found." });
        res.json(patient);
    } catch (err) {
        console.error("Error fetching patient details:", err);
        res.status(500).json({ error: "Could not fetch patient details." });
    }
});

app.get("/api/patients/search/:mobileNumber", authenticateToken, async (req, res) => {
    const { mobileNumber } = req.params; 
    if (!mobileNumber) return res.status(400).json({ error: "Mobile number required." });
    try {
        const patient = await prisma.patient.findUnique({ where: { mobileNumber: mobileNumber } });
        if (!patient) return res.status(404).json({ error: "Patient not found." });
        res.json(patient);
    } catch (err) {
        console.error("Error searching patient:", err);
        res.status(500).json({ error: "Could not find patient." });
    }
});

// --- CONSULTATION/PRESCRIPTION ENDPOINTS ---

app.post("/api/consultations", authenticateToken, upload.array('attachments', 5), async (req, res) => {
    if (req.user.role !== 'DOCTOR') {
        return res.status(403).json({ error: 'Forbidden: Only doctors can create consultations.' });
    }

    try {
        const { patientId, diagnosisNotes, weightAtConsultation } = req.body;
        
        let prescribedDrugs = [];
        if (req.body.prescribedDrugs) {
            prescribedDrugs = JSON.parse(req.body.prescribedDrugs);
        }

        const filePaths = req.files ? req.files.map(file => file.path) : [];

        if (!patientId || !diagnosisNotes || prescribedDrugs.length === 0) {
            return res.status(400).json({ error: 'Patient, diagnosis, and at least one drug are required.' });
        }

        const result = await prisma.$transaction(async (tx) => {
            const consultation = await tx.consultation.create({
                data: {
                    patientId,
                    doctorId: req.user.userId, 
                    diagnosis: diagnosisNotes, 
                    weightAtConsultation: weightAtConsultation ? parseFloat(weightAtConsultation) : null,
                    attachments: JSON.stringify(filePaths) 
                },
            });

            const prescription = await tx.prescription.create({
                data: {
                    consultationId: consultation.id,
                    status: 'PENDING' 
                },
            });

            const drugsToCreate = prescribedDrugs.map(drug => ({
                prescriptionId: prescription.id,
                drugId: drug.drugId,
                dosage: drug.dosage,
                quantity: parseInt(drug.quantity), 
            }));

            await tx.prescribedDrug.createMany({ data: drugsToCreate });

            return { consultation, prescription };
        });

        res.status(201).json({
            message: 'Consultation saved successfully.',
            consultationId: result.consultation.id,
        });

    } catch (err) {
        console.error('Failed to create consultation:', err.message, err.stack); 
        res.status(500).json({ error: 'Consultation failed. Transaction rolled back.' });
    }
});

app.get("/api/drugs", authenticateToken, async (req, res) => {
    try {
        const { search } = req.query; 
        const where = search ? { name: { contains: search } } : {};
        
        const drugs = await prisma.drug.findMany({
            where,
            select: { 
                id: true, 
                name: true, 
                dosageForm: true 
                // Removed 'unit' because it's likely not in your updated schema
            }, 
            orderBy: { name: 'asc' },
            take: 50 
        });
        res.json(drugs);
    } catch (err) {
        console.error("Error fetching drug list:", err);
        res.status(500).json({ error: "Could not fetch drug list." });
    }
});

// ----------------------------------------------------
// --- PHARMACIST ENDPOINTS ---
// ----------------------------------------------------

app.get("/api/pharmacist/prescriptions/pending", authenticateToken, async (req, res) => {
    if (req.user.role !== 'PHARMACIST' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const prescriptions = await prisma.prescription.findMany({
            where: { status: 'PENDING' }, 
            include: {
                consultation: {
                    include: { patient: true }
                },
                prescribedDrugs: true
            },
            orderBy: { consultation: { createdAt: "desc" } } 
        });
        
        const formattedPrescriptions = prescriptions.map(p => ({
            id: p.id,
            date: p.consultation?.createdAt.toISOString().split('T')[0] || 'N/A', 
            patientName: p.consultation?.patient?.name || 'Unknown', 
            mobileNumber: p.consultation?.patient?.mobileNumber || 'N/A', 
            drugsCount: p.prescribedDrugs.length,
            status: p.status, 
        }));
        res.json(formattedPrescriptions);
    } catch (err) {
        console.error("Error fetching pending prescriptions:", err);
        res.status(500).json({ error: "Could not fetch prescriptions." });
    }
});

// 7. Get Dispensed Prescriptions History
app.get("/api/pharmacist/prescriptions/dispensed", authenticateToken, async (req, res) => {
    if (req.user.role !== 'PHARMACIST' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const history = await prisma.prescription.findMany({
            where: {
                status: 'DISPENSED',
            },
            select: {
                id: true,
                // ✅ FIX: Fetch data from the Bill relation
                bill: {
                    select: {
                        issuedAt: true,
                        totalAmount: true
                    }
                },
                consultation: {
                    select: {
                        patient: {
                            select: {
                                name: true,
                                mobileNumber: true,
                            }
                        }
                    }
                },
                _count: {
                    select: { prescribedDrugs: true }
                }
            },
            orderBy: {
                bill: {
                    issuedAt: 'desc'
                }
            },
        });

        const formattedHistory = history.map(h => ({
            id: h.id,
            date: h.bill?.issuedAt ? new Date(h.bill.issuedAt).toLocaleDateString() : 'N/A',
            time: h.bill?.issuedAt ? new Date(h.bill.issuedAt).toLocaleTimeString() : 'N/A',
            patientName: h.consultation?.patient?.name || 'N/A',
            mobileNumber: h.consultation?.patient?.mobileNumber || 'N/A',
            totalBill: h.bill?.totalAmount || 0,
            drugsCount: h._count.prescribedDrugs, 
            status: 'DISPENSED',
        }));

        res.json(formattedHistory);
    } catch (err) {
        console.error("Error fetching dispensed history:", err);
        res.status(500).json({ error: "Failed to fetch dispensed history." });
    }
});

app.get("/api/pharmacist/prescriptions/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const prescription = await prisma.prescription.findUnique({
            where: { id },
            include: {
                consultation: {
                    include: { patient: true }
                },
                prescribedDrugs: {
                    include: { drug: true }
                }
            }
        });
        if (!prescription) return res.status(404).json({ error: "Prescription not found" }); 
        res.json(prescription);
    } catch (err) {
        console.error("Error fetching prescription details:", err);
        res.status(500).json({ error: "Could not fetch details." });
    }
});

// 3. Dispense Drugs (Stock Deduction + Billing)
app.post("/api/pharmacist/prescriptions/:id/dispense", authenticateToken, async (req, res) => {
    if (req.user.role !== 'PHARMACIST' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { id } = req.params;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const prescription = await tx.prescription.findUnique({
                where: { id },
                include: { prescribedDrugs: true }
            });

            if (!prescription) throw new Error("Prescription not found");
            if (prescription.status === 'DISPENSED') throw new Error("Prescription already dispensed");

            let totalBillAmount = 0;

            for (const prescribedDrug of prescription.prescribedDrugs) {
                const requestedQty = prescribedDrug.quantity;
                const drugId = prescribedDrug.drugId;

                const stockItems = await tx.stockItem.findMany({
                    where: { drugId: drugId, quantityInStock: { gt: 0 } },
                    orderBy: { expiryDate: 'asc' } 
                });

                let remainingQtyToDeduct = requestedQty;

                for (const item of stockItems) {
                    if (remainingQtyToDeduct <= 0) break;

                    const deductAmount = Math.min(item.quantityInStock, remainingQtyToDeduct);
                    
                    await tx.stockItem.update({
                        where: { id: item.id },
                        data: { quantityInStock: item.quantityInStock - deductAmount }
                    });

                    totalBillAmount += (deductAmount * item.sellingPrice);
                    remainingQtyToDeduct -= deductAmount;
                }

                if (remainingQtyToDeduct > 0) {
                    throw new Error(`Insufficient stock for Drug ID: ${drugId}. Short by ${remainingQtyToDeduct}`);
                }
            }

            // ✅ CREATE BILL RECORD
            await tx.pharmacyBill.create({
                data: {
                    prescriptionId: id,
                    totalAmount: totalBillAmount
                }
            });

            const updatedPrescription = await tx.prescription.update({
                where: { id },
                data: { 
                    status: 'DISPENSED',
                    dispensedAt: new Date(),
                    dispensedByUserId: req.user.userId
                }
            });

            return { updatedPrescription, totalBillAmount };
        });

        res.json({ 
            message: "Prescription dispensed successfully!", 
            totalBill: result.totalBillAmount,
            status: result.updatedPrescription.status 
        });

    } catch (err) {
        console.error("Error dispensing prescription:", err.message);
        res.status(400).json({ error: err.message || "Failed to dispense." });
    }
});

app.get("/api/pharmacist/stock/summary", authenticateToken, async (req, res) => {
    if (req.user.role !== 'PHARMACIST' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const drugStock = await prisma.drug.findMany({
            select: {
                id: true,
                name: true,
                dosageForm: true,
                stockItems: { select: { quantityInStock: true } }
            }
        });
        const formattedStock = drugStock.map(drug => ({
            id: drug.id,
            name: drug.name,
            category: drug.dosageForm, 
            unit: drug.dosageForm, // Simplification for now
            totalStock: drug.stockItems.reduce((sum, item) => sum + item.quantityInStock, 0),
        }));
        res.json(formattedStock);
    } catch (err) {
        console.error("Error fetching drug stock:", err);
        res.status(500).json({ error: "Could not fetch stock summary." });
    }
});

app.get("/api/pharmacist/drugs", authenticateToken, async (req, res) => {
    if (req.user.role !== 'PHARMACIST' && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    try {
        const drugs = await prisma.drug.findMany({
            select: { 
                id: true, 
                name: true, 
                dosageForm: true,
                stockItems: { 
                    select: { sellingPrice: true },
                    orderBy: { expiryDate: 'desc' }, 
                    take: 1
                }
            }
        });

        const formattedDrugs = drugs.map(drug => ({
            id: drug.id,
            name: drug.name,
            unit: drug.dosageForm, 
            sellingPrice: drug.stockItems.length > 0 ? drug.stockItems[0].sellingPrice : null
        }));

        res.json(formattedDrugs); 
    } catch (err) {
        console.error("Error fetching pharmacist drug list:", err); 
        res.status(500).json({ error: "Failed to fetch drug list." });
    }
});

app.post("/api/pharmacist/stock/add-item", authenticateToken, async (req, res) => {
    if (req.user.role !== 'PHARMACIST' && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const { 
        drugId, 
        batchNumber, 
        expiryDate, 
        quantityInStock, 
        purchasePrice, 
        sellingPrice, 
        supplierId 
    } = req.body;

    if (!drugId || !quantityInStock || !sellingPrice || !expiryDate) {
        return res.status(400).json({ error: "Missing required fields: drugId, quantity, sellingPrice, expiryDate" });
    }

    try {
        const newStock = await prisma.stockItem.create({
            data: {
                drugId,
                batchNumber: batchNumber || 'N/A', 
                expiryDate: new Date(expiryDate), 
                quantityInStock: parseInt(quantityInStock),
                purchasePrice: parseFloat(purchasePrice || 0),
                sellingPrice: parseFloat(sellingPrice),
                supplierId: supplierId || null, 
            }
        });

        res.status(201).json({ message: "Stock item added successfully!", stock: newStock });
    } catch (err) {
        console.error("Error adding stock item:", err);
        res.status(500).json({ error: "Failed to add stock item to inventory." });
    }
});

// 8. Get Pharmacy Income Report (The Endpoint for Income Tab)
app.get("/api/pharmacist/income", authenticateToken, async (req, res) => {
    if (req.user.role !== 'PHARMACIST' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { range } = req.query; 
    
    let dateFilter = {};
    const now = new Date();
    
    if (range === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        dateFilter = { gte: start };
    } else if (range === 'week') {
        const start = new Date();
        start.setDate(now.getDate() - 7);
        dateFilter = { gte: start };
    } else if (range === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { gte: start };
    }
    
    try {
        const bills = await prisma.pharmacyBill.findMany({
            where: {
                issuedAt: dateFilter
            },
            select: {
                totalAmount: true,
                issuedAt: true
            },
            orderBy: { issuedAt: 'desc' }
        });
        
        const totalIncome = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
        
        res.json({
            totalIncome,
            transactionCount: bills.length,
            transactions: bills 
        });
        
    } catch (err) {
        console.error("Error calculating income:", err);
        res.status(500).json({ error: "Failed to calculate income." });
    }
});

// --- DOCTOR DASHBOARD STATS ENDPOINT ---

app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    if (req.user.role !== 'DOCTOR' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const [totalPatients, todayConsultations, pendingPrescriptions] = await Promise.all([
            prisma.patient.count(),
            prisma.consultation.count({
                where: { createdAt: { gte: startOfDay, lte: endOfDay } }
            }),
            prisma.prescription.count({ where: { status: 'PENDING' } })
        ]);
        res.json({ totalPatients, todayConsultations, pendingPrescriptions });
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ error: "Error fetching stats." });
    }
});

// --- ADMIN ENDPOINTS ---
app.get("/api/admin/stats", authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const [
            totalPatients, totalConsultations, pendingPrescriptions,
            totalDoctors, totalPharmacists, totalAdmins, totalDrugs
        ] = await Promise.all([
            prisma.patient.count(), prisma.consultation.count(),
            prisma.prescription.count({ where: { status: 'PENDING' } }),
            prisma.user.count({ where: { role: 'DOCTOR' } }),
            prisma.user.count({ where: { role: 'PHARMACIST' } }),
            prisma.user.count({ where: { role: 'ADMIN' } }),
            prisma.drug.count(),
        ]);
        res.json({
            totalPatients, totalConsultations, pendingPrescriptions,
            totalDoctors, totalPharmacists, totalAdmins, totalDrugs
        });
    } catch (err) {
        res.status(500).json({ error: "Stats error." });
    }
});

app.get("/api/admin/users", authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, name: true, role: true },
            orderBy: { name: 'asc' }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "User list error." });
    }
});

// Update User (Name, Username, Role)
app.put("/api/admin/users/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const { name, username, role } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, username, role }
        });
        res.json({ message: "User updated successfully", user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: "Failed to update user." });
    }
});

// Reset User Password
app.put("/api/admin/users/:id/reset-password", authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        });
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to reset password." });
    }
});

// --- ADMIN: DRUG MANAGEMENT ---

// --- ADMIN: DRUG MANAGEMENT ---

// Get All Drugs
app.get("/api/admin/drugs", authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const drugs = await prisma.drug.findMany({ orderBy: { name: 'asc' } });
        res.json(drugs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch drugs." });
    }
});

// Add New Drug
app.post("/api/admin/drugs", authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { name, dosageForm } = req.body;
    if (!name || !dosageForm) return res.status(400).json({ error: "Name and Form required" });

    try {
        const newDrug = await prisma.drug.create({ data: { name, dosageForm } });
        res.status(201).json(newDrug);
    } catch (err) {
        if (err.code === 'P2002') return res.status(409).json({ error: "Drug already exists." });
        res.status(500).json({ error: "Failed to add drug." });
    }
});

// Update Drug
app.put("/api/admin/drugs/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const { name, dosageForm } = req.body;
    try {
        const updated = await prisma.drug.update({ where: { id }, data: { name, dosageForm } });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Failed to update drug." });
    }
});

// Delete Drug
app.delete("/api/admin/drugs/:id", authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    try {
        await prisma.drug.delete({ where: { id } });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Cannot delete. Drug is in use." });
    }
});

// --- ADMIN: FINANCIALS (Fix for 404 Error) ---

// Get Total Revenue for a specific month
app.get("/api/admin/financials/revenue", authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const { month } = req.query; // e.g., "2025-11"
    if (!month) return res.status(400).json({ error: "Month is required" });

    // Construct start and end dates for the month
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(new Date(start).setMonth(start.getMonth() + 1));

    try {
        const bills = await prisma.pharmacyBill.findMany({
            where: {
                issuedAt: {
                    gte: start,
                    lt: end
                }
            },
            select: { totalAmount: true }
        });
        
        const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
        res.json({ totalRevenue });
    } catch (err) {
        console.error("Revenue Calc Error:", err);
        res.status(500).json({ error: "Failed to calculate revenue." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

app.get("/api/test-route", (req, res) => {
    res.json({ message: "Test route is working!" });
});