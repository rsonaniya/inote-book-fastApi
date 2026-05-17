import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Button,
} from "@mui/material";

// Import the login page we just created
import LoginPage from "./pages/LoginPage";
import { AuthProvider } from "./context/AuthContext";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";

// ==========================================
// 1. GLOBAL THEME SETUP
// ==========================================
// This applies your specific fonts and colors globally
// so you don't have to rewrite them on every component.
const theme = createTheme({
  typography: {
    fontFamily: '"Hanken Grotesk", sans-serif',
  },
  palette: {
    primary: {
      main: "#4f1c9e", // Your primary purple brand color
    },
    background: {
      default: "#fdf8fd", // Your global light background color
    },
  },
});

const NotFoundPage = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
    }}
  >
    <Typography variant="h4" color="error">
      404 - Page Not Found
    </Typography>
  </Box>
);

// ==========================================
// 3. MAIN APP & ROUTING
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kicks in the global background color and resets default browser margins */}
        <CssBaseline />

        <BrowserRouter>
          <Routes>
            {/* Automatically redirect the root path to the login page */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Main Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Catch-all route for URLs that don't exist */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
