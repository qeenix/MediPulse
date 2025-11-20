// frontend/src/pages/PharmacyDashboard.jsx

import React, { useState, useEffect } from "react";
import api from "../api";
import {
  Box,
  Typography,
  Paper,
  ButtonBase,
  useMediaQuery,
  useTheme,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Drawer,
  AppBar,
  Toolbar,
  Snackbar,
  Divider,
  Card,
  CardContent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import {
  Home,
  LocalHospital,
  ExitToApp,
  Menu as MenuIcon,
  Close as CloseIcon,
  HealthAndSafety,
  Inventory,
  CheckCircle,
  WarningAmber,
  AddBusiness,
  History,
  Payments, // Icon for Income
  Print, // Icon for Print
} from "@mui/icons-material";

// --- Design System ---
const DESIGN_SYSTEM = {
  colors: {
    primaryMain: "#00bcd4",
    primaryDark: "#00838f",
    sidebarBg: "#ffffff",
    mainBg: "#f5f7fa",
    success: "#4caf50",
    error: "#f44336",
  },
  shadows: {
    card: "0 4px 12px rgba(0, 0, 0, 0.08)",
    sidebar: "2px 0 10px rgba(0, 0, 0, 0.05)",
  },
  borderRadius: { card: "16px", control: "8px" },
  sidebarWidth: 260,
};

// --- Helper: Robust Thermal Printer Logic ---
const printThermalBill = (details, totalBill) => {
  // 1. Define the content
  const date = new Date().toLocaleString();
  const itemsHtml = details.prescribedDrugs
    .map(
      (pd) => `
        <div class="row">
            <span class="item-name">${pd.drug.name}</span>
        </div>
        <div class="row details">
            <span>Qty: ${pd.quantity} | ${pd.dosage}</span>
        </div>
    `
    )
    .join("");

  const billHtml = `
        <html>
        <head>
            <title>Receipt</title>
            <style>
                @page { margin: 0; size: 80mm auto; }
                body { 
                    margin: 0; 
                    padding: 10px; 
                    font-family: 'Courier New', monospace; 
                    font-size: 12px; 
                    width: 280px; 
                    color: #000;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                .item-name { font-weight: bold; font-size: 13px; }
                .details { font-size: 11px; color: #333; }
                .total-section { font-size: 18px; font-weight: bold; margin-top: 10px; text-align: right; }
                .footer { margin-top: 20px; font-size: 10px; text-align: center; }
            </style>
        </head>
        <body>
            <div class="center bold" style="font-size: 16px;">MediPulse Pharmacy</div>
            <div class="center">123, Health Street, Colombo</div>
            <div class="center">Tel: 011-2345678</div>
            <div class="divider"></div>
            
            <div class="row"><span>Pt: ${
              details.consultation.patient.name
            }</span></div>
            <div class="row"><span>Date: ${date}</span></div>
            
            <div class="divider"></div>
            
            ${itemsHtml}

            <div class="divider"></div>
            <div class="total-section">TOTAL: Rs. ${parseFloat(
              totalBill
            ).toFixed(2)}</div>
            <div class="divider"></div>
            
            <div class="footer">Get Well Soon!</div>
        </body>
        </html>
    `;

  // 2. Create an iframe (invisible) to print
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  // 3. Write content and print
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(billHtml);
  doc.close();

  iframe.contentWindow.focus();
  // Slight delay to ensure styles load
  setTimeout(() => {
    iframe.contentWindow.print();
    // Clean up after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};

// --- StatCard ---
const StatCard = ({ title, value, color, icon: Icon }) => (
  <Paper
    sx={{
      p: 2,
      borderRadius: DESIGN_SYSTEM.borderRadius.card,
      backgroundColor: "white",
      boxShadow: DESIGN_SYSTEM.shadows.card,
      borderLeft: `4px solid ${color}`,
      height: "100%",
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <Box>
        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight={500}
          gutterBottom
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ mt: 0.5, color: DESIGN_SYSTEM.colors.primaryDark }}
        >
          {value}
        </Typography>
      </Box>
      {Icon && <Icon sx={{ fontSize: 36, color: color, opacity: 0.8 }} />}
    </Box>
  </Paper>
);

// --- COMPONENT: INCOME REPORT ---
const IncomeReport = () => {
  const [range, setRange] = useState("today"); // 'today', 'week', 'month'
  const [data, setData] = useState({ totalIncome: 0, transactionCount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchIncome = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/pharmacist/income?range=${range}`);
        setData(response.data);
      } catch (err) {
        console.error("Error fetching income:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncome();
  }, [range]);

  const handleRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setRange(newRange);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Pharmacy Income
        </Typography>
        <ToggleButtonGroup
          value={range}
          exclusive
          onChange={handleRangeChange}
          aria-label="income range"
          size="small"
        >
          <ToggleButton value="today">Today</ToggleButton>
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StatCard
              title={`Total Income (${range.toUpperCase()})`}
              value={`Rs. ${data.totalIncome.toFixed(2)}`}
              color="#4caf50"
              icon={Payments}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <StatCard
              title="Transactions"
              value={data.transactionCount}
              color="#2196f3"
              icon={CheckCircle}
            />
          </Grid>
        </Grid>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        * Income is calculated based on dispensed prescriptions only.
      </Typography>
    </Box>
  );
};

// --- PENDING PRESCRIPTIONS (Updated with Better Print & Dialog) ---
const PendingPrescriptions = ({ notify }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get("/pharmacist/prescriptions/pending");
      setPrescriptions(response.data);
    } catch (err) {
      notify("Failed to fetch pending prescriptions.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions(); // Fetch immediately on load

    // Set up a timer to fetch every 5 seconds (5000 ms)
    const intervalId = setInterval(() => {
      fetchPrescriptions();
    }, 5000);

    // Clean up the timer when the component unmounts (user leaves the tab)
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array

  const handleViewClick = async (id) => {
    setOpenModal(true);
    setDetailsLoading(true);
    try {
      const response = await api.get(`/pharmacist/prescriptions/${id}`);
      setSelectedPrescription(response.data);
    } catch {
      notify("Error fetching details", "error");
      setOpenModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleIssueConfirm = async () => {
    if (!selectedPrescription) return;

    // No window.confirm needed if we have a nice dialog
    setActionLoading(true);
    try {
      const res = await api.post(
        `/pharmacist/prescriptions/${selectedPrescription.id}/dispense`
      );

      // Close modal first
      setOpenModal(false);
      notify(
        `Dispensed Successfully! Bill: Rs. ${res.data.totalBill?.toFixed(2)}`,
        "success"
      );

      // Auto Print or Ask to Print
      printThermalBill(selectedPrescription, res.data.totalBill);

      fetchPrescriptions();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to issue.";
      notify(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Paper
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: DESIGN_SYSTEM.borderRadius.card,
          boxShadow: DESIGN_SYSTEM.shadows.card,
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Pending Prescriptions
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  Mobile
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No records.
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.patientName}</TableCell>
                    <TableCell
                      sx={{ display: { xs: "none", md: "table-cell" } }}
                    >
                      {row.mobileNumber}
                    </TableCell>
                    <TableCell>
                      <Chip label={row.status} color="warning" size="small" />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleViewClick(row.id)}
                      >
                        View/Issue
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- IMPROVED DIALOG --- */}
      <Dialog
        open={openModal}
        onClose={() => !actionLoading && setOpenModal(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f8f9fa",
            borderBottom: "1px solid #eee",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HealthAndSafety color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Dispense Prescription
            </Typography>
          </Box>
          <IconButton
            onClick={() => setOpenModal(false)}
            disabled={actionLoading}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : selectedPrescription ? (
            <Box>
              {/* Patient Info Card */}
              <Card variant="outlined" sx={{ mb: 3, bgcolor: "#fcfcfc" }}>
                <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        PATIENT NAME
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {selectedPrescription.consultation.patient.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        MOBILE NUMBER
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {selectedPrescription.consultation.patient.mobileNumber}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Drugs List */}
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ mt: 2, fontWeight: "bold" }}
              >
                PRESCRIBED MEDICINES
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f1f3f4" }}>
                      <TableCell>Drug Name</TableCell>
                      <TableCell>Dosage</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPrescription.prescribedDrugs.map((pd) => (
                      <TableRow key={pd.id}>
                        <TableCell sx={{ fontWeight: "500" }}>
                          {pd.drug.name}
                        </TableCell>
                        <TableCell>{pd.dosage}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          {pd.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Alert severity="info" sx={{ mt: 2 }}>
                Clicking "Confirm" will deduct stock and generate a bill
                receipt.
              </Alert>
            </Box>
          ) : (
            <Typography color="error">Error loading data.</Typography>
          )}
        </DialogContent>

        <DialogActions
          sx={{ p: 2, borderTop: "1px solid #eee", bgcolor: "#f8f9fa" }}
        >
          <Button
            onClick={() => setOpenModal(false)}
            color="inherit"
            disabled={actionLoading}
            size="large"
          >
            Cancel
          </Button>
          <Button
            onClick={handleIssueConfirm}
            variant="contained"
            color="success"
            size="large"
            startIcon={
              actionLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Print />
              )
            }
            disabled={actionLoading}
            sx={{ px: 4 }}
          >
            {actionLoading ? "Processing..." : "Confirm & Print"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// --- DISPENSED HISTORY (Kept same) ---
const DispensedHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get("/pharmacist/prescriptions/dispensed");
      setHistory(response.data);
    } catch (err) {
      console.error("Error fetching dispensed history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return <CircularProgress sx={{ my: 4 }} />;

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 4 },
        borderRadius: DESIGN_SYSTEM.borderRadius.card,
        boxShadow: DESIGN_SYSTEM.shadows.card,
      }}
    >
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Dispensed History
      </Typography>
      {history.length === 0 ? (
        <Alert severity="info">No dispensed records found yet.</Alert>
      ) : (
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  Time
                </TableCell>
                <TableCell>Patient</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  Mobile
                </TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Total Bill (Rs.)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    {row.time}
                  </TableCell>
                  <TableCell>{row.patientName}</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    {row.mobileNumber}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${row.drugsCount} item(s)`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    {row.totalBill ? row.totalBill.toFixed(2) : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

// --- STOCK SUMMARY (Kept same but ensure api import) ---
const StockSummary = ({ notify }) => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRestocking, setIsRestocking] = useState(false);
  const [openRestockModal, setOpenRestockModal] = useState(false);
  const [drugList, setDrugList] = useState([]);
  const [restockFormData, setRestockFormData] = useState({
    drugId: "",
    batchNumber: "",
    expiryDate: "",
    quantityInStock: "",
    purchasePrice: "",
    sellingPrice: "",
  });

  const fetchStock = async () => {
    try {
      setLoading(true);
      const response = await api.get("/pharmacist/stock/summary");
      setStock(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrugList = async () => {
    try {
      const response = await api.get("/pharmacist/drugs");
      setDrugList(response.data);
    } catch (err) {
      notify("Failed to fetch drug list.", "error");
    }
  };

  useEffect(() => {
    fetchStock();
    fetchDrugList();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRestockFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "drugId" && value) {
      const selectedDrug = drugList.find((d) => d.id === value);
      if (selectedDrug) {
        setRestockFormData((prev) => ({
          ...prev,
          sellingPrice: selectedDrug.sellingPrice || "",
        }));
      }
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    setIsRestocking(true);
    try {
      const res = await api.post("/pharmacist/stock/add-item", restockFormData);
      notify(`${res.data.message}`, "success");
      setOpenRestockModal(false);
      setRestockFormData({
        drugId: "",
        batchNumber: "",
        expiryDate: "",
        quantityInStock: "",
        purchasePrice: "",
        sellingPrice: "",
      });
      fetchStock();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Restock failed.";
      notify(errMsg, "error");
    } finally {
      setIsRestocking(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <>
      <Paper
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: DESIGN_SYSTEM.borderRadius.card,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ mb: { xs: 2, sm: 0 } }}
          >
            Stock Summary
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddBusiness />}
              onClick={() => {
                setOpenRestockModal(true);
              }}
            >
              Add New Stock
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Total Drugs"
              value={stock.length}
              color={DESIGN_SYSTEM.colors.primaryDark}
              icon={Inventory}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Low Stock"
              value={stock.filter((i) => i.totalStock < 100).length}
              color={DESIGN_SYSTEM.colors.error}
              icon={WarningAmber}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Total Units"
              value={stock.reduce((s, i) => s + i.totalStock, 0)}
              color={DESIGN_SYSTEM.colors.success}
              icon={Inventory}
            />
          </Grid>
        </Grid>

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Drug Name</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  Category
                </TableCell>
                <TableCell align="right">Current Stock</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stock.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    {row.category}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: row.totalStock < 100 ? "bold" : "normal",
                      color: row.totalStock < 100 ? "error.main" : "inherit",
                    }}
                  >
                    {row.totalStock} {row.unit}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={openRestockModal}
        onClose={() => !isRestocking && setOpenRestockModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Stock Batch</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleRestockSubmit} sx={{ mt: 1 }}>
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="drug-select-label">Select Drug</InputLabel>
              <Select
                labelId="drug-select-label"
                label="Select Drug"
                name="drugId"
                value={restockFormData.drugId}
                onChange={handleFormChange}
              >
                {drugList.map((drug) => (
                  <MenuItem key={drug.id} value={drug.id}>
                    {drug.name} ({drug.unit})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Batch Number"
              name="batchNumber"
              value={restockFormData.batchNumber}
              onChange={handleFormChange}
              fullWidth
              margin="dense"
              required
            />
            <TextField
              label="Expiry Date"
              name="expiryDate"
              type="date"
              value={restockFormData.expiryDate}
              onChange={handleFormChange}
              fullWidth
              margin="dense"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Quantity to Add"
              name="quantityInStock"
              type="number"
              value={restockFormData.quantityInStock}
              onChange={handleFormChange}
              fullWidth
              margin="dense"
              required
            />
            <TextField
              label="Selling Price (Per Unit)"
              name="sellingPrice"
              type="number"
              value={restockFormData.sellingPrice}
              onChange={handleFormChange}
              fullWidth
              margin="dense"
              required
            />
            <TextField
              label="Purchase Price (Optional)"
              name="purchasePrice"
              type="number"
              value={restockFormData.purchasePrice}
              onChange={handleFormChange}
              fullWidth
              margin="dense"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenRestockModal(false)}
            color="inherit"
            disabled={isRestocking}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRestockSubmit}
            variant="contained"
            color="success"
            disabled={
              isRestocking ||
              !restockFormData.drugId ||
              !restockFormData.quantityInStock ||
              !restockFormData.sellingPrice
            }
          >
            {isRestocking ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Add Stock"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// --- MAIN LAYOUT ---
const PharmacyDashboard = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // --- GLOBAL NOTIFICATION STATE ---
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === "clickaway") return;
    setNotification({ ...notification, open: false });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const renderContent = () => {
    const contentPadding = { p: { xs: 2, md: 3 } };
    switch (activeTab) {
      case "issue":
        return (
          <Box sx={contentPadding}>
            <PendingPrescriptions notify={notify} />
          </Box>
        );
      case "history":
        return (
          <Box sx={contentPadding}>
            <DispensedHistory />
          </Box>
        );
      case "stock":
        return (
          <Box sx={contentPadding}>
            <StockSummary notify={notify} />
          </Box>
        );
      case "income":
        return (
          <Box sx={contentPadding}>
            <IncomeReport />
          </Box>
        ); // NEW TAB
      default:
        return (
          <Box sx={contentPadding}>
            <Box sx={{ mt: 2 }}>
              <PendingPrescriptions notify={notify} />
            </Box>
            <Box sx={{ mt: 4 }}>
              <StockSummary notify={notify} />
            </Box>
          </Box>
        );
    }
  };

  const sidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{
            color: DESIGN_SYSTEM.colors.primaryMain,
            mb: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          <HealthAndSafety sx={{ mr: 1 }} /> MediPulse
        </Typography>

        <ButtonBase
          onClick={() => {
            setActiveTab("dashboard");
            if (isMobile) handleDrawerToggle();
          }}
          sx={{
            justifyContent: "flex-start",
            width: "100%",
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            bgcolor:
              activeTab === "dashboard"
                ? DESIGN_SYSTEM.colors.primaryMain
                : "transparent",
            color: activeTab === "dashboard" ? "white" : "text.secondary",
          }}
        >
          <Home sx={{ mr: 2 }} /> Dashboard
        </ButtonBase>
        <ButtonBase
          onClick={() => {
            setActiveTab("issue");
            if (isMobile) handleDrawerToggle();
          }}
          sx={{
            justifyContent: "flex-start",
            width: "100%",
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            bgcolor:
              activeTab === "issue"
                ? DESIGN_SYSTEM.colors.primaryMain
                : "transparent",
            color: activeTab === "issue" ? "white" : "text.secondary",
          }}
        >
          <LocalHospital sx={{ mr: 2 }} /> Issue Prescription
        </ButtonBase>
        <ButtonBase
          onClick={() => {
            setActiveTab("history");
            if (isMobile) handleDrawerToggle();
          }}
          sx={{
            justifyContent: "flex-start",
            width: "100%",
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            bgcolor:
              activeTab === "history"
                ? DESIGN_SYSTEM.colors.primaryMain
                : "transparent",
            color: activeTab === "history" ? "white" : "text.secondary",
          }}
        >
          <History sx={{ mr: 2 }} /> Dispensed History
        </ButtonBase>
        <ButtonBase
          onClick={() => {
            setActiveTab("stock");
            if (isMobile) handleDrawerToggle();
          }}
          sx={{
            justifyContent: "flex-start",
            width: "100%",
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            bgcolor:
              activeTab === "stock"
                ? DESIGN_SYSTEM.colors.primaryMain
                : "transparent",
            color: activeTab === "stock" ? "white" : "text.secondary",
          }}
        >
          <Inventory sx={{ mr: 2 }} /> Manage Stock
        </ButtonBase>
        <ButtonBase
          onClick={() => {
            setActiveTab("income");
            if (isMobile) handleDrawerToggle();
          }}
          sx={{
            justifyContent: "flex-start",
            width: "100%",
            p: 1.5,
            mb: 1,
            borderRadius: 2,
            bgcolor:
              activeTab === "income"
                ? DESIGN_SYSTEM.colors.primaryMain
                : "transparent",
            color: activeTab === "income" ? "white" : "text.secondary",
          }}
        >
          <Payments sx={{ mr: 2 }} /> Income Report
        </ButtonBase>
      </Box>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Button
          onClick={onLogout}
          variant="outlined"
          color="error"
          startIcon={<ExitToApp />}
          fullWidth
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        bgcolor: DESIGN_SYSTEM.colors.mainBg,
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DESIGN_SYSTEM.sidebarWidth}px)` },
          ml: { md: `${DESIGN_SYSTEM.sidebarWidth}px` },
          bgcolor: DESIGN_SYSTEM.colors.mainBg,
          boxShadow: "none",
          borderBottom: "1px solid #e0e0e0",
          color: "text.primary",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            fontWeight={700}
            color={DESIGN_SYSTEM.colors.primaryDark}
          >
            {activeTab === "dashboard"
              ? `Welcome, ${user?.name}!`
              : activeTab === "issue"
              ? "Issue Prescription"
              : activeTab === "history"
              ? "Dispensed History"
              : activeTab === "stock"
              ? "Manage Stock"
              : "Income Report"}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          width: { md: DESIGN_SYSTEM.sidebarWidth },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DESIGN_SYSTEM.sidebarWidth,
              borderRight: "none",
              boxShadow: DESIGN_SYSTEM.shadows.sidebar,
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DESIGN_SYSTEM.sidebarWidth,
          },
        }}
      >
        {sidebarContent}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DESIGN_SYSTEM.sidebarWidth}px)` },
          overflowY: "auto",
          mt: "64px",
        }}
      >
        {renderContent()}
      </Box>

      {/* Global Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PharmacyDashboard;
