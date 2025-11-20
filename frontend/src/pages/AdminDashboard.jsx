// frontend/src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; 
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Button,
    Divider,
    Container,
    Grid,
    Paper,
    useMediaQuery,
    useTheme,
    CircularProgress,
    Alert,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Card,
    CardContent
} from '@mui/material';
import {
    Home,
    Group,
    ExitToApp,
    Menu as MenuIcon,
    Inventory,
    SupervisorAccount,
    LocalHospital,
    Medication,
    People,
    Assignment,
    Warning,
    Add,
    Edit,
    Delete,
    Calculate,
    AttachMoney,
    WaterDrop,
    ElectricBolt,
    House
} from '@mui/icons-material';

const DESIGN_SYSTEM = {
    drawerWidth: 240,
    colors: {
        primaryMain: '#FF9800', 
        primaryLight: '#FFB74D',
        primaryDark: '#F57C00',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        sidebarBg: '#ffffff',
        mainBg: '#f9f9f9',
    },
    shadows: {
        card: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    },
    borderRadius: { card: '8px', control: '10px' }
};

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, color, icon: IconComponent }) => (
    <Paper elevation={3} sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `5px solid ${color}`, borderRadius: DESIGN_SYSTEM.borderRadius.card }}>
        <Box>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">{title}</Typography>
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ mt: 0.5, color: color }}>{value}</Typography>
        </Box>
        {IconComponent && <IconComponent sx={{ fontSize: 40, color: color, opacity: 0.7 }} />}
    </Paper>
);

// --- 1. OVERVIEW TAB ---
const AdminOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/stats').then(res => { setStats(res.data); setLoading(false); }).catch(console.error);
    }, []);

    if (loading) return <CircularProgress />;
    if (!stats) return <Alert severity="error">Failed to load stats.</Alert>;

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>System Overview</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Total Patients" value={stats.totalPatients} color="#1976d2" icon={People} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Consultations" value={stats.totalConsultations} color="#2e7d32" icon={Assignment} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Pending Rx" value={stats.pendingPrescriptions} color="#ed6c02" icon={LocalHospital} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Doctors" value={stats.totalDoctors} color="#9c27b0" icon={SupervisorAccount} /></Grid>
            </Grid>
        </Box>
    );
};

// --- 2. USER MANAGEMENT TAB ---
const UserManagement = ({ onRegisterUser }) => {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null); // User being edited
    const [resetPasswordId, setResetPasswordId] = useState(null); // User ID for password reset
    const [newPassword, setNewPassword] = useState(''); // New password input

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        api.get('/admin/users').then(res => setUsers(res.data)).catch(console.error);
    };

    const handleEditSave = async () => {
        try {
            await api.put(`/admin/users/${editingUser.id}`, editingUser);
            setEditingUser(null);
            fetchUsers();
            alert("User updated successfully!");
        } catch { alert("Update failed."); }
    };

    const handlePasswordReset = async () => {
        try {
            await api.put(`/admin/users/${resetPasswordId}/reset-password`, { newPassword });
            setResetPasswordId(null);
            setNewPassword('');
            alert("Password reset successfully!");
        } catch { alert("Reset failed."); }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight="bold">User Management</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={onRegisterUser} sx={{ bgcolor: DESIGN_SYSTEM.colors.primaryMain }}>New User</Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Username</TableCell><TableCell>Role</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <IconButton color="primary" onClick={() => setEditingUser(user)}><Edit /></IconButton>
                                    <Button size="small" color="secondary" onClick={() => setResetPasswordId(user.id)}>Reset Pwd</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Edit User Dialog */}
            <Dialog open={!!editingUser} onClose={() => setEditingUser(null)}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    {editingUser && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300, mt: 1 }}>
                            <TextField label="Name" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} fullWidth />
                            <TextField label="Username" value={editingUser.username} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} fullWidth />
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select value={editingUser.role} label="Role" onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}>
                                    <MenuItem value="DOCTOR">DOCTOR</MenuItem>
                                    <MenuItem value="PHARMACIST">PHARMACIST</MenuItem>
                                    <MenuItem value="ADMIN">ADMIN</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingUser(null)}>Cancel</Button>
                    <Button onClick={handleEditSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={!!resetPasswordId} onClose={() => setResetPasswordId(null)}>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                     <TextField label="New Password" type="password" fullWidth margin="dense" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetPasswordId(null)}>Cancel</Button>
                    <Button onClick={handlePasswordReset} variant="contained" color="error">Reset</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// --- 3. DRUG MANAGEMENT TAB ---
const DrugManagement = () => {
    const [drugs, setDrugs] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [currentDrug, setCurrentDrug] = useState({ name: '', dosageForm: 'TABLET' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => { fetchDrugs(); }, []);
    const fetchDrugs = () => api.get('/admin/drugs').then(res => setDrugs(res.data));

    const handleSubmit = async () => {
        try {
            if (isEditing) {
                await api.put(`/admin/drugs/${currentDrug.id}`, currentDrug);
            } else {
                await api.post('/admin/drugs', currentDrug);
            }
            setOpenModal(false);
            fetchDrugs();
            setCurrentDrug({ name: '', dosageForm: 'TABLET' });
        } catch { alert("Operation failed."); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this drug?")) {
            try { await api.delete(`/admin/drugs/${id}`); fetchDrugs(); } 
            catch { alert("Cannot delete. Drug might be used in records."); }
        }
    };

    return (
        <Box>
             <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h5" fontWeight="bold">Drug Inventory Master</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => { setIsEditing(false); setCurrentDrug({ name: '', dosageForm: 'TABLET' }); setOpenModal(true); }}>Add Drug</Button>
            </Box>
            
            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                <Table stickyHeader>
                    <TableHead><TableRow><TableCell>Drug Name</TableCell><TableCell>Form</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                    <TableBody>
                        {drugs.map(drug => (
                            <TableRow key={drug.id}>
                                <TableCell>{drug.name}</TableCell>
                                <TableCell>{drug.dosageForm}</TableCell>
                                <TableCell>
                                    <IconButton size="small" onClick={() => { setIsEditing(true); setCurrentDrug(drug); setOpenModal(true); }}><Edit fontSize="small"/></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(drug.id)}><Delete fontSize="small"/></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openModal} onClose={() => setOpenModal(false)}>
                <DialogTitle>{isEditing ? 'Edit Drug' : 'Add New Drug'}</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Drug Name" fullWidth margin="dense" value={currentDrug.name} onChange={(e) => setCurrentDrug({...currentDrug, name: e.target.value})} />
                    <FormControl fullWidth>
                        <InputLabel>Form</InputLabel>
                        <Select label="Form" value={currentDrug.dosageForm} onChange={(e) => setCurrentDrug({...currentDrug, dosageForm: e.target.value})}>
                            {['TABLET','CAPSULE','SYRUP_LIQUID','INJECTION','CREAM_OINTMENT_GEL','DROPS','INHALER'].map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">{isEditing ? 'Update' : 'Create'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// --- 4. FINANCIAL CALCULATOR TAB ---
// frontend/src/pages/AdminDashboard.jsx (FinancialCalculator Component)

const FinancialCalculator = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [revenue, setRevenue] = useState(0);
    const [expenses, setExpenses] = useState({ electricity: 0, water: 0, rent: 0, salaries: 0 });
    const [profit, setProfit] = useState(null);

    const fetchRevenue = async () => {
        try {
            // 404 Error එක එන්නේ මේ URL එක backend එකේ නැති නිසා. (Step 1 එකෙන් ඒක හරි යනවා)
            const res = await api.get(`/admin/financials/revenue?month=${month}`);
            setRevenue(res.data.totalRevenue || 0);
            setProfit(null);
        } catch { 
            console.error("Failed to fetch revenue"); 
        }
    };

    useEffect(() => { fetchRevenue(); }, [month]);

    const calculateProfit = () => {
        const totalExpenses = Object.values(expenses).reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
        setProfit(revenue - totalExpenses);
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Profit & Expense Calculator</Typography>
            
            <Grid container spacing={3}>
                {/* ✅ FIX: Use 'size' prop instead of item/xs/md */}
                
                {/* Income Section */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>SELECT MONTH</Typography>
                            <TextField type="month" fullWidth value={month} onChange={(e) => setMonth(e.target.value)} sx={{ mb: 2 }} />
                            <Typography variant="h6">Total Pharmacy Revenue</Typography>
                            <Typography variant="h4" color="success.main" fontWeight="bold">Rs. {revenue.toFixed(2)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Expenses Section */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6" gutterBottom>Monthly Expenses</Typography>
                            <TextField label="Electricity Bill" type="number" size="small" InputProps={{ startAdornment: <ElectricBolt fontSize="small" color="action" sx={{mr:1}}/> }} value={expenses.electricity} onChange={e => setExpenses({...expenses, electricity: e.target.value})} />
                            <TextField label="Water Bill" type="number" size="small" InputProps={{ startAdornment: <WaterDrop fontSize="small" color="action" sx={{mr:1}}/> }} value={expenses.water} onChange={e => setExpenses({...expenses, water: e.target.value})} />
                            <TextField label="Rent" type="number" size="small" InputProps={{ startAdornment: <House fontSize="small" color="action" sx={{mr:1}}/> }} value={expenses.rent} onChange={e => setExpenses({...expenses, rent: e.target.value})} />
                            <TextField label="Staff Salaries" type="number" size="small" InputProps={{ startAdornment: <People fontSize="small" color="action" sx={{mr:1}}/> }} value={expenses.salaries} onChange={e => setExpenses({...expenses, salaries: e.target.value})} />
                            <Button variant="contained" color="primary" startIcon={<Calculate />} onClick={calculateProfit}>Calculate Profit</Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Result Section */}
                <Grid size={{ xs: 12, md: 4 }}>
                     {profit !== null && (
                        <Card sx={{ bgcolor: profit >= 0 ? '#e8f5e9' : '#ffebee', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">NET PROFIT / LOSS</Typography>
                                <Typography variant="h3" fontWeight="bold" color={profit >= 0 ? 'success.main' : 'error.main'}>
                                    Rs. {profit.toFixed(2)}
                                </Typography>
                                <Typography variant="caption">{profit >= 0 ? "Excellent work!" : "Warning: Expenses exceed revenue."}</Typography>
                            </CardContent>
                        </Card>
                     )}
                </Grid>
            </Grid>
        </Box>
    );
};

// --- MAIN ADMIN DASHBOARD ---
const AdminDashboard = ({ onLogout, user }) => { 
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); 
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

    const menuItems = [
        { tab: 'overview', label: 'Overview', icon: Home },
        { tab: 'users', label: 'User Management', icon: Group },
        { tab: 'drugs', label: 'Drug Inventory', icon: Inventory },
        { tab: 'financials', label: 'Financials', icon: AttachMoney },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <AdminOverview />;
            case 'users': return <UserManagement onRegisterUser={() => navigate('/register')} />;
            case 'drugs': return <DrugManagement />;
            case 'financials': return <FinancialCalculator />;
            default: return <AdminOverview />;
        }
    };

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Toolbar sx={{ bgcolor: DESIGN_SYSTEM.colors.primaryDark, mb: 2 }}>
                <SupervisorAccount sx={{ mr: 1, color: 'white' }} />
                <Typography variant="h6" color="white" fontWeight="bold">Admin Portal</Typography>
            </Toolbar>
            <List>
                {menuItems.map(item => (
                    <ListItemButton key={item.tab} selected={activeTab === item.tab} onClick={() => { setActiveTab(item.tab); setMobileOpen(false); }}>
                        <ListItemIcon sx={{ color: activeTab === item.tab ? DESIGN_SYSTEM.colors.primaryMain : 'inherit' }}><item.icon /></ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
            </List>
            <Box flexGrow={1} />
            <Box p={2}><Button fullWidth variant="outlined" color="error" onClick={onLogout}>Logout</Button></Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: DESIGN_SYSTEM.colors.mainBg }}>
            <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, display: { sm: 'none' }, bgcolor: DESIGN_SYSTEM.colors.primaryDark }}>
                <Toolbar>
                    <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)}><MenuIcon /></IconButton>
                    <Typography variant="h6">Admin Dashboard</Typography>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: DESIGN_SYSTEM.drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DESIGN_SYSTEM.drawerWidth } }}>{drawer}</Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DESIGN_SYSTEM.drawerWidth } }} open>{drawer}</Drawer>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DESIGN_SYSTEM.drawerWidth}px)` }, mt: { xs: 7, sm: 0 } }}>
                <Container maxWidth="xl">{renderContent()}</Container>
            </Box>
        </Box>
    );
};

export default AdminDashboard;