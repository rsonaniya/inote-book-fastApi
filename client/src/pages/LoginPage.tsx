import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// Import our custom API instance and Auth Context
import api from "../axiosInstance";
import { useAuth } from "../context/AuthContext";

interface IFormInput {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    setIsLoading(true);
    setApiError(null);

    try {
      // 1. Create URLSearchParams to encode the data properly
      const formData = new URLSearchParams();

      // 2. Map the form's 'email' strictly to the 'username' key for FastAPI
      formData.append("username", data.email);
      formData.append("password", data.password);

      // 3. Send the request with the specific Content-Type header
      const response = await api.post("/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // Extract token from your FastAPI response
      const token = response.data.access_token;

      // Map the newly updated FastAPI response to your AuthContext interface
      const userData = {
        user_id: response.data.user_id,
        email: response.data.email,
        fullname: response.data.fullname,
      };

      // Save to context
      login(token, userData);

      // Redirect to the dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.response && error.response.data && error.response.data.detail) {
        setApiError(error.response.data.detail);
      } else {
        setApiError(
          "Unable to connect to the server. Please check your credentials.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#fdf8fd",
        fontFamily: '"Hanken Grotesk", sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 0,
          width: 600,
          height: 600,
          opacity: 0.2,
          pointerEvents: "none",
          background: "radial-gradient(circle, #e6e0ef 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(80px)",
        }}
      />

      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              bgcolor: "#673ab7",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              boxShadow: "0px 4px 12px rgba(103, 58, 183, 0.08)",
            }}
          >
            <CheckCircleIcon sx={{ color: "#ffffff", fontSize: 32 }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, color: "#1c1b1f", letterSpacing: "-0.5px" }}
          >
            Focus
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#4a4453", mt: 0.5, fontWeight: 400 }}
          >
            Intentional Productivity
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: "24px",
            bgcolor: "#ffffff",
            border: "1px solid #ccc3d5",
            boxShadow: "0px 4px 12px rgba(103, 58, 183, 0.08)",
          }}
        >
          <Box
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            {apiError && (
              <Alert severity="error" sx={{ borderRadius: "8px" }}>
                {apiError}
              </Alert>
            )}

            {/* Replaced Username field with Email field */}
            <TextField
              id="email"
              label="Email"
              type="email"
              variant="standard"
              fullWidth
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format",
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
              slotProps={{
                inputLabel: { sx: { color: "#4a4453", fontSize: "16px" } },
              }}
              sx={{
                "& .MuiInput-underline:before": {
                  borderBottomColor: "#ccc3d5",
                },
                "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                  borderBottomColor: "#7b7484",
                },
                "& .MuiInput-underline:after": { borderBottomColor: "#4f1c9e" },
              }}
            />

            <TextField
              id="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="standard"
              fullWidth
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                maxLength: {
                  value: 14,
                  message: "Password cannot exceed 14 characters",
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                inputLabel: { sx: { color: "#4a4453", fontSize: "16px" } },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        sx={{ color: "#4a4453" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                "& .MuiInput-underline:before": {
                  borderBottomColor: "#ccc3d5",
                },
                "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                  borderBottomColor: "#7b7484",
                },
                "& .MuiInput-underline:after": { borderBottomColor: "#4f1c9e" },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disableElevation
              disabled={isLoading}
              sx={{
                mt: 2,
                height: 48,
                bgcolor: "#4f1c9e",
                color: "#ffffff",
                borderRadius: "9999px",
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "#3d167a",
                  boxShadow: "0px 4px 12px rgba(79, 28, 158, 0.2)",
                },
                "&:active": { transform: "scale(0.98)" },
                "&.Mui-disabled": { bgcolor: "#ccc3d5", color: "#ffffff" },
              }}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </Box>
        </Paper>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#4a4453" }}>
            Don't have an account?{" "}
            <Link
              href="/signup"
              underline="hover"
              sx={{ color: "#4f1c9e", fontWeight: 700, fontSize: "14px" }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
