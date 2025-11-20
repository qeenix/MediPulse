// frontend/src/components/PatientHistory.jsx

import React, { useState } from 'react';
import api from '../api'; 
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    CircularProgress,
    Alert,
    Grid, // ✅ FIX: Import simply as 'Grid'
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Link
} from '@mui/material';
import { 
    Search, 
    Visibility, 
    ArrowBack, 
    Event, 
    Notes, 
    AttachFile, 
    MedicationLiquid 
} from '@mui/icons-material';

const DESIGN_SYSTEM = {
    colors: {
        primaryGradient: 'linear-gradient(to right, #4F46E5, #7C3AED)',
        primaryIndigo: '#4F46E5',
        secondaryBg: '#F3F4F6'
    },
    shadows: {
        main: '0 4px 14px 0 rgba(79, 70, 229, 0.4)',
        card: '0 2px 8px rgba(0,0,0,0.08)',
    },
    borderRadius: {
        card: '16px',
        control: '12px',
    },
};

// Helper to parse the stored JSON string for files
const parseAttachments = (attachmentsJson) => {
    if (!attachmentsJson) return [];
    try {
        return JSON.parse(attachmentsJson);
    } catch (e) {
        console.error("Failed to parse attachments", e);
        return [];
    }
};

const PatientHistory = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleSearchSubmit = async () => {
        if (!searchQuery.trim()) {
            setError('Please enter a name or mobile number to search.');
            setPatients([]);
            return;
        }

        setLoading(true);
        setError(null);
        setPatients([]);
        setPage(0);
        setSelectedPatient(null);

        try {
             // Try searching by mobile first
             try {
                const response = await api.get(`/patients/search/${searchQuery}`);
                setPatients([response.data]);
             } catch (searchErr) {
                 // Fallback: Fetch all and filter (for names)
                 const response = await api.get('/patients');
                 const allPatients = response.data;
                 const filtered = allPatients.filter(p => 
                     p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     p.mobileNumber.includes(searchQuery)
                 );
                 setPatients(filtered);
                 
                 if (filtered.length === 0) {
                     setError('No patients found matching that query.');
                 }
             }
        } catch (err) {
            console.error('Error fetching patients:', err);
            setError('Failed to fetch patient data.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (patientId) => {
        setLoadingDetails(true);
        setError(null);
        try {
            const response = await api.get(`/patients/${patientId}`);
            setSelectedPatient(response.data);
        } catch (err) {
            console.error("Error fetching details:", err);
            alert("Failed to load patient history.");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleBackToList = () => {
        setSelectedPatient(null);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // --- RENDER: Patient Detail View ---
    if (selectedPatient) {
        return (
            <Box>
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={handleBackToList}
                    sx={{ mb: 2, color: 'text.secondary' }}
                >
                    Back to Search
                </Button>

                {/* Patient Header Card */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: DESIGN_SYSTEM.borderRadius.card, background: '#fff' }}>
                    {/* ✅ FIX: Grid container */}
                    <Grid container spacing={2}>
                        {/* ✅ FIX: Grid item using 'size' prop */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {selectedPatient.name}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Mobile: {selectedPatient.mobileNumber}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <Box sx={{ p: 2, bgcolor: DESIGN_SYSTEM.colors.secondaryBg, borderRadius: '12px', display: 'inline-block' }}>
                                <Typography variant="caption" display="block">Latest Weight</Typography>
                                <Typography variant="h6" fontWeight="bold">
                                    {selectedPatient.currentWeightKg ? `${selectedPatient.currentWeightKg} kg` : 'N/A'}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>Consultation History</Typography>

                {/* Consultations List */}
                {selectedPatient.consultations && selectedPatient.consultations.length > 0 ? (
                    selectedPatient.consultations.map((consultation) => (
                        <Card key={consultation.id} sx={{ mb: 3, borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                {/* Header: Date & Status */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Event color="action" fontSize="small" />
                                        <Typography fontWeight="bold">
                                            {new Date(consultation.createdAt).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(consultation.createdAt).toLocaleTimeString()}
                                        </Typography>
                                    </Box>
                                    <Chip 
                                        label={consultation.prescription?.status || "NO PRESCRIPTION"} 
                                        color={consultation.prescription?.status === 'DISPENSED' ? "success" : "warning"} 
                                        size="small" 
                                        variant="outlined"
                                    />
                                </Box>
                                
                                <Divider sx={{ my: 1.5 }} />
                                
                                {/* Diagnosis & Weight */}
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid size={{ xs: 12, md: 8 }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Notes color="primary" fontSize="small" sx={{ mt: 0.3 }} />
                                            <Box>
                                                <Typography variant="subtitle2" color="primary">Diagnosis / Notes:</Typography>
                                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                                    {consultation.diagnosis || "No notes recorded."}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        {consultation.weightAtConsultation && (
                                            <Typography variant="body2" color="text.secondary" align="right">
                                                Recorded Weight: <strong>{consultation.weightAtConsultation} kg</strong>
                                            </Typography>
                                        )}
                                    </Grid>
                                </Grid>

                                {/* --- 1. ATTACHMENTS SECTION --- */}
                                {consultation.attachments && parseAttachments(consultation.attachments).length > 0 && (
                                    <Box sx={{ mt: 2, mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <AttachFile fontSize="small" /> Attached Files
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {parseAttachments(consultation.attachments).map((filePath, index) => {
                                                // Clean path for URL 
                                                const fileName = filePath.split(/[/\\]/).pop(); 
                                                // Assumes server is on localhost:3001
                                                const fileUrl = `http://localhost:3001/${filePath.replace(/\\/g, '/')}`;
                                                
                                                return (
                                                    <Chip
                                                        key={index}
                                                        label={`View ${fileName}`}
                                                        component="a"
                                                        href={fileUrl}
                                                        target="_blank"
                                                        clickable
                                                        color="primary"
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                );
                                            })}
                                        </Stack>
                                    </Box>
                                )}

                                {/* --- 2. PRESCRIBED DRUGS SECTION --- */}
                                {consultation.prescription?.prescribedDrugs && consultation.prescription.prescribedDrugs.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: DESIGN_SYSTEM.colors.primaryIndigo }}>
                                            <MedicationLiquid fontSize="small" /> Prescribed Medication
                                        </Typography>
                                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                                    <TableRow>
                                                        <TableCell>Drug Name</TableCell>
                                                        <TableCell>Dosage</TableCell>
                                                        <TableCell align="right">Quantity</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {consultation.prescription.prescribedDrugs.map((pd) => (
                                                        <TableRow key={pd.id}>
                                                            <TableCell>{pd.drug.name} <Typography variant="caption" color="text.secondary">({pd.drug.dosageForm})</Typography></TableCell>
                                                            <TableCell>{pd.dosage}</TableCell>
                                                            <TableCell align="right">{pd.quantity}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Alert severity="info">No previous consultation history found for this patient.</Alert>
                )}
            </Box>
        );
    }

    // --- RENDER: Search & List View ---
    const paginatedPatients = patients.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                Patient History
            </Typography>
            
            <Paper sx={{ p: 3, mb: 4, borderRadius: DESIGN_SYSTEM.borderRadius.card, boxShadow: DESIGN_SYSTEM.shadows.main, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    label="Search by Patient Name or Mobile"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search color="disabled" /></InputAdornment>,
                    }}
                />
                <Button
                    variant="contained"
                    onClick={handleSearchSubmit}
                    disabled={loading}
                    sx={{
                        textTransform: 'none',
                        color: 'white',
                        background: DESIGN_SYSTEM.colors.primaryGradient,
                        boxShadow: DESIGN_SYSTEM.shadows.main,
                        px: 4
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
                </Button>
            </Paper>

            {error && <Alert severity="warning" sx={{ mb: 4 }}>{error}</Alert>}

            <Paper sx={{ borderRadius: DESIGN_SYSTEM.borderRadius.card, overflow: 'hidden', boxShadow: DESIGN_SYSTEM.shadows.main }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Weight (kg)</TableCell>
                                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && (
                                <TableRow><TableCell colSpan={4} align="center"><CircularProgress sx={{ my: 3 }} /></TableCell></TableRow>
                            )}

                            {!loading && paginatedPatients.map((patient) => (
                                <TableRow key={patient.id} hover>
                                    <TableCell sx={{ color: DESIGN_SYSTEM.colors.primaryIndigo, fontWeight: 500 }}>{patient.name}</TableCell>
                                    <TableCell>{patient.mobileNumber}</TableCell>
                                    <TableCell>{patient.currentWeightKg || 'N/A'}</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={loadingDetails ? <CircularProgress size={16}/> : <Visibility />}
                                            onClick={() => handleViewDetails(patient.id)}
                                            disabled={loadingDetails}
                                            sx={{ borderRadius: '8px', textTransform: 'none' }}
                                        >
                                            View History
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {!loading && patients.length === 0 && !error && (
                                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Search to see results</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {patients.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={patients.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                )}
            </Paper>
        </Box>
    );
};

export default PatientHistory;