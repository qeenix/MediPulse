// frontend/src/components/NewConsultation.jsx

import React, { useState, useEffect } from 'react';
import api from '../api'; 
import {
    Box,
    TextField,
    Button,
    Typography,
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Grid, // ✅ FIX: Import as 'Grid' (not Grid2)
    Alert,
    CircularProgress,
    Chip,
    Stack,
    Snackbar
} from '@mui/material';
import { 
    Delete, 
    AddCircle, 
    Save, 
    Search, 
    AttachFile, 
    Image as ImageIcon, 
    PictureAsPdf 
} from '@mui/icons-material';

const NewConsultation = () => {
    // --- Notification State ---
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    const showNotification = (message, severity = 'info') => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification({ ...notification, open: false });
    };

    // --- Form State ---
    const [mobileNumber, setMobileNumber] = useState('');
    const [patient, setPatient] = useState(null);
    const [loadingPatient, setLoadingPatient] = useState(false);
    
    const [diagnosis, setDiagnosis] = useState('');
    const [diagnosisError, setDiagnosisError] = useState(false);
    
    const [weight, setWeight] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);

    const [drugList, setDrugList] = useState([]); 
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [dosage, setDosage] = useState('');
    const [quantity, setQuantity] = useState('');
    const [prescribedDrugs, setPrescribedDrugs] = useState([]);
    
    const [saving, setSaving] = useState(false);

    // --- 1. Fetch Drugs ---
    const fetchDrugs = async (searchQuery = '') => {
        try {
            const url = searchQuery ? `/drugs?search=${searchQuery}` : '/drugs';
            const response = await api.get(url); 
            setDrugList(response.data);
        } catch (err) {
            console.error("Failed to fetch drug list", err);
            showNotification("Failed to load drug list.", "error");
        }
    };

    useEffect(() => {
        fetchDrugs(); 
    }, []);

    // --- 2. Search Patient ---
    const handleSearchPatient = async () => {
        if (!mobileNumber) {
            showNotification("Please enter a mobile number.", "warning");
            return;
        }
        setLoadingPatient(true);
        setPatient(null);
        try {
            const response = await api.get(`/patients/search/${mobileNumber}`);
            setPatient(response.data);
            if (response.data.currentWeightKg) {
                setWeight(response.data.currentWeightKg);
            }
            showNotification("Patient found!", "success");
        } catch (err) {
            setPatient(null);
            showNotification("Patient not found. Please register them first.", "error");
        } finally {
            setLoadingPatient(false);
        }
    };

    // --- 3. File Handling ---
    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length + selectedFiles.length > 5) {
            showNotification("You can only upload a maximum of 5 files.", "warning");
            return;
        }
        setSelectedFiles([...selectedFiles, ...files]);
    };

    const handleRemoveFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
    };

    // --- 4. Add Drug to List ---
    const handleAddDrug = () => {
        if (!selectedDrug || !dosage || !quantity) {
            showNotification("Please fill all drug details.", "warning");
            return;
        }
        
        const newDrug = {
            drugId: selectedDrug.id,
            name: selectedDrug.name,
            dosageForm: selectedDrug.dosageForm, 
            dosage,
            quantity: parseInt(quantity)
        };

        setPrescribedDrugs([...prescribedDrugs, newDrug]);
        
        // Reset drug inputs
        setSelectedDrug(null);
        setDosage('');
        setQuantity('');
    };

    const handleRemoveDrug = (index) => {
        const updatedList = prescribedDrugs.filter((_, i) => i !== index);
        setPrescribedDrugs(updatedList);
    };

    // --- 5. Submit Consultation ---
    const handleSubmit = async () => {
        if (!patient) {
            showNotification("Please search and select a patient first.", "error");
            return;
        }
        
        if (!diagnosis.trim()) {
            setDiagnosisError(true);
            showNotification("Diagnosis Notes are required.", "error");
            return;
        } else {
            setDiagnosisError(false);
        }

        if (prescribedDrugs.length === 0) {
            showNotification("Please add at least one drug.", "warning");
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('patientId', patient.id);
            formData.append('diagnosisNotes', diagnosis); 
            if (weight) formData.append('weightAtConsultation', weight);
            formData.append('prescribedDrugs', JSON.stringify(prescribedDrugs));

            selectedFiles.forEach((file) => {
                formData.append('attachments', file);
            });

            await api.post('/consultations', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showNotification("Consultation saved successfully!", "success");
            
            // Reset All Fields
            setMobileNumber('');
            setPatient(null);
            setDiagnosis('');
            setWeight('');
            setPrescribedDrugs([]);
            setSelectedFiles([]);
            setDiagnosisError(false);
            
        } catch (err) {
            console.error("Error saving consultation:", err);
            const errMsg = err.response?.data?.error || "Failed to save consultation.";
            showNotification(errMsg, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>New Consultation</Typography>

            {/* --- Patient Search Section --- */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    {/* ✅ FIX: Use 'Grid' with 'size' prop */}
                    <Grid size={{ xs: 12, md: 6 }}> 
                        <TextField 
                            fullWidth 
                            label="Search Patient by Mobile" 
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder="Enter mobile number"
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchPatient()}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <Button 
                            variant="contained" 
                            startIcon={loadingPatient ? <CircularProgress size={20} color="inherit"/> : <Search />}
                            onClick={handleSearchPatient}
                            disabled={loadingPatient}
                            fullWidth
                            sx={{ height: '56px' }}
                        >
                            Search
                        </Button>
                    </Grid>
                </Grid>
                
                {patient && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                            <Typography variant="h6" color="primary">{patient.name}</Typography>
                            <Chip label={`Mobile: ${patient.mobileNumber}`} />
                        </Stack>
                        
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField 
                                    label="Diagnosis Notes" 
                                    fullWidth 
                                    multiline 
                                    rows={3}
                                    required
                                    error={diagnosisError}
                                    value={diagnosis}
                                    onChange={(e) => {
                                        setDiagnosis(e.target.value);
                                        if(e.target.value.trim()) setDiagnosisError(false);
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField 
                                    label="Weight (Kg)" 
                                    fullWidth 
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<AttachFile />}
                                        size="small"
                                    >
                                        Attach Files
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            accept="image/*,application/pdf"
                                            onChange={handleFileChange}
                                        />
                                    </Button>
                                    <Typography variant="caption" color="text.secondary">
                                        Max 5 files
                                    </Typography>
                                </Stack>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                    {selectedFiles.map((file, index) => (
                                        <Chip
                                            key={index}
                                            label={file.name}
                                            size="small"
                                            onDelete={() => handleRemoveFile(index)}
                                            icon={file.type === 'application/pdf' ? <PictureAsPdf /> : <ImageIcon />}
                                        />
                                    ))}
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* --- Prescription Section --- */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddCircle color="primary"/> Prescription Details
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        {/* ✅ UPDATED: Bigger Autocomplete */}
                        <Autocomplete
                            options={drugList}
                            getOptionLabel={(option) => `${option.name} (${option.dosageForm})`}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={selectedDrug}
                            onChange={(event, newValue) => setSelectedDrug(newValue)}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Select or Search Drug" 
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            height: '65px', // Taller
                                            fontSize: '1.2rem', // Bigger text
                                            paddingLeft: '15px'
                                        },
                                        '& .MuiInputLabel-root': {
                                            fontSize: '1.1rem', // Bigger label
                                            top: '5px'
                                        }
                                    }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                        <TextField 
                            fullWidth 
                            label="Dosage (e.g., 1x3)" 
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 6, md: 3 }}>
                        <TextField 
                            fullWidth 
                            label="Quantity" 
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <Button 
                            variant="contained"
                            color="secondary" 
                            onClick={handleAddDrug}
                            fullWidth
                            sx={{ height: '56px' }}
                        >
                            Add Drug
                        </Button>
                    </Grid>
                </Grid>

                <TableContainer sx={{ mt: 3, bgcolor: '#fafafa', borderRadius: 1 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Drug Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Form</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Dosage</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {prescribedDrugs.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No drugs added yet.</TableCell></TableRow>
                            ) : (
                                prescribedDrugs.map((drug, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{drug.name}</TableCell>
                                        <TableCell>{drug.dosageForm}</TableCell>
                                        <TableCell>{drug.dosage}</TableCell>
                                        <TableCell>{drug.quantity}</TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" color="error" onClick={() => handleRemoveDrug(index)}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* --- Save Button --- */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit"/> : <Save />}
                    onClick={handleSubmit}
                    disabled={saving}
                    sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
                >
                    {saving ? "Saving..." : "Save Consultation"}
                </Button>
            </Box>

            {/* --- Professional Alerts --- */}
            <Snackbar 
                open={notification.open} 
                autoHideDuration={6000} 
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }} variant="filled">
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default NewConsultation;