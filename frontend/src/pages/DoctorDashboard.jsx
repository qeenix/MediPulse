// frontend/src/pages/DoctorDashboard.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // <-- FIX: api import කලා
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
} from "@mui/material";
import {
  Home,
  Description,
  PersonAdd,
  Group,
  ExitToApp,
  Menu as MenuIcon,
  HealthAndSafety,
  Close as CloseIcon,
} from "@mui/icons-material";

// --- Component Imports ---
import NewConsultation from "../components/NewConsultation";
import PatientHistory from "../components/PatientHistory";
import RegisterPatientForm from "../components/RegisterPatientForm";

// --- Design System Constants ---
const DESIGN_SYSTEM = {
  colors: {
    primaryGradient: "linear-gradient(to right, #4F46E5, #7C3AED)",
    primaryIndigo: "#4F46E5",
    primaryPurple: "#7C3AED",
    success: "#10B981",
    warning: "#F59E0B",
  },
  shadows: {
    main: "0 4px 14px 0 rgba(79, 70, 229, 0.4)",
    hover: "0 8px 20px 0 rgba(79, 70, 229, 0.45)",
  },
  borderRadius: {
    card: "16px",
    control: "12px",
  },
};

const drawerWidth = 256;

// --- Reusable Components ---
const StatCard = ({ title, value, color, icon: Icon, loading }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: DESIGN_SYSTEM.borderRadius.card,
      borderLeft: `5px solid ${color}`,
      transition: "transform 0.3s, box-shadow 0.3s",
      boxShadow: DESIGN_SYSTEM.shadows.main,
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: DESIGN_SYSTEM.shadows.hover,
      },
    }}
  >
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        <Typography
          variant="h4"
          component="div"
          fontWeight={800}
          sx={{ mt: 0.5, color: "text.primary" }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: color }} />
          ) : (
            value
          )}
        </Typography>
      </Box>
      {Icon && <Icon sx={{ fontSize: 40, color: color, opacity: 0.7 }} />}
    </Box>
  </Paper>
);

const DashboardContent = ({
  user,
  onStartConsultation,
  onViewPatients,
  stats,
  loading,
  error,
}) => (
  <Box>
    <Typography variant="h3" fontWeight={700} color="text.primary">
      Welcome, Dr. {user ? user.name : "[User Name]"}!
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
      Your central hub for patient care and management.
    </Typography>

    {error && (
      <Alert severity="error" sx={{ mb: 4 }}>
        Failed to load dashboard statistics: {error}
      </Alert>
    )}

    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          color={DESIGN_SYSTEM.colors.primaryIndigo}
          icon={Group}
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Today's Consultations"
          value={stats.todayConsultations}
          color={DESIGN_SYSTEM.colors.success}
          icon={Description}
          loading={loading}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          title="Pending Prescriptions"
          value={stats.pendingPrescriptions}
          color={DESIGN_SYSTEM.colors.warning}
          icon={HealthAndSafety}
          loading={loading}
        />
      </Grid>
    </Grid>

    <Paper
      sx={{
        mt: 6,
        p: 4,
        borderRadius: DESIGN_SYSTEM.borderRadius.card,
        boxShadow: DESIGN_SYSTEM.shadows.main,
      }}
    >
      <Typography variant="h5" fontWeight={700} color="text.primary">
        Quick Actions
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={onStartConsultation}
          sx={{
            textTransform: "none",
            color: "white",
            background: DESIGN_SYSTEM.colors.primaryGradient,
            boxShadow: DESIGN_SYSTEM.shadows.main,
            borderRadius: DESIGN_SYSTEM.borderRadius.control,
            transition: "box-shadow 0.3s",
            py: 1.5,
            "&:hover": {
              boxShadow: DESIGN_SYSTEM.shadows.hover,
            },
          }}
        >
          Start New Consultation
        </Button>
        <Button
          variant="outlined"
          onClick={onViewPatients}
          sx={{
            textTransform: "none",
            borderRadius: DESIGN_SYSTEM.borderRadius.control,
            color: DESIGN_SYSTEM.colors.primaryIndigo,
            borderColor: DESIGN_SYSTEM.colors.primaryIndigo,
            py: 1.5,
            "&:hover": {
              backgroundColor: "rgba(79, 70, 229, 0.04)",
              borderColor: DESIGN_SYSTEM.colors.primaryIndigo,
            },
          }}
        >
          View All Patients
        </Button>
      </Box>
    </Paper>
  </Box>
);

// --- Main Doctor Dashboard Component ---

const DoctorDashboard = ({ onLogout, user }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    todayConsultations: 0,
    pendingPrescriptions: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    if (activeTab === "dashboard") {
      const fetchStats = async () => {
        setLoadingStats(true);
        setStatsError(null);
        try {
          const response = await api.get("/dashboard/stats"); // <-- FIX: axios.get -> api.get සහ '/api' අයින් කලා
          setDashboardStats(response.data);
        } catch (err) {
          console.error("Error fetching dashboard stats:", err);
          setStatsError(
            err.response?.data?.error || "Could not connect to API."
          );
        } finally {
          setLoadingStats(false);
        }
      };

      fetchStats();
    }
  }, [activeTab]);

  const menuItems = [
    { name: "Dashboard", icon: Home, tab: "dashboard", path: "#" },
    {
      name: "New Consultation",
      icon: Description,
      tab: "consultation",
      path: "#",
    },
    { name: "Patient History", icon: Group, tab: "patients", path: "#" },
    { name: "Register Patient", icon: PersonAdd, tab: "register", path: "#" },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (item) => {
    if (item.path !== "#") {
      navigate(item.path);
    } else {
      setActiveTab(item.tab);
    }
    if (!isDesktop) {
      setMobileOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "patients":
        return <PatientHistory />;
      case "consultation":
        return <NewConsultation />;
      case "register":
        return (
          <Box sx={{ mt: 2 }}>
            <RegisterPatientForm
              onSuccess={() => setActiveTab("consultation")}
            />
          </Box>
        );
      case "dashboard":
      default:
        return (
          <DashboardContent
            user={user}
            onStartConsultation={() => setActiveTab("consultation")}
            onViewPatients={() => setActiveTab("patients")}
            stats={dashboardStats}
            loading={loadingStats}
            error={statsError}
          />
        );
    }
  };

  const drawer = (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100%", p: 3 }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 4,
        }}
      >
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{
            color: DESIGN_SYSTEM.colors.primaryIndigo,
            display: "flex",
            alignItems: "center",
          }}
        >
          <HealthAndSafety sx={{ mr: 1, fontSize: 32 }} /> MediPulse
        </Typography>
        {!isDesktop && (
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.name}
            onClick={() => handleNavigation(item)}
            selected={
              activeTab === item.tab ||
              (item.path !== "#" && window.location.pathname === item.path)
            }
            sx={{
              borderRadius: DESIGN_SYSTEM.borderRadius.control,
              mb: 1,
              py: 1.5,
              px: 3,
              color: "text.secondary",
              "&:hover": {
                bgcolor: "grey.100",
                color: DESIGN_SYSTEM.colors.primaryIndigo,
              },
              "&.Mui-selected": {
                color: "white",
                background: DESIGN_SYSTEM.colors.primaryGradient,
                boxShadow: DESIGN_SYSTEM.shadows.main,
                "& .MuiListItemIcon-root": {
                  color: "white",
                },
                "&:hover": {
                  background: DESIGN_SYSTEM.colors.primaryGradient,
                  boxShadow: DESIGN_SYSTEM.shadows.hover,
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: "auto", mr: 2, color: "inherit" }}>
              <item.icon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary={item.name}
              primaryTypographyProps={{
                fontWeight:
                  activeTab === item.tab ||
                  (item.path !== "#" && window.location.pathname === item.path)
                    ? 600
                    : 500,
                variant: "body1",
              }}
            />
          </ListItemButton>
        ))}
      </Box>

      <Box
        sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider" }}
      >
        <Button
          onClick={onLogout}
          fullWidth
          variant="outlined"
          startIcon={<ExitToApp />}
          sx={{
            color: "error.main",
            borderColor: "error.light",
            py: 1.5,
            borderRadius: DESIGN_SYSTEM.borderRadius.control,
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              bgcolor: "rgba(239, 68, 68, 0.04)",
              borderColor: "error.main",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f7f8" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "white",
          color: "text.primary",
          boxShadow: "0 1px 4px 0 rgba(0,0,0,0.1)",
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: "none" },
              color: DESIGN_SYSTEM.colors.primaryIndigo,
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            {menuItems.find((item) => item.tab === activeTab)?.name ||
              menuItems.find((item) => item.path === window.location.pathname)
                ?.name ||
              "Dashboard"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "none",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          bgcolor: "#f7f7f8",
          p: { xs: 2, sm: 4 },
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ p: 0 }}>
          {renderContent()}
        </Container>
      </Box>
    </Box>
  );
};

export default DoctorDashboard;
