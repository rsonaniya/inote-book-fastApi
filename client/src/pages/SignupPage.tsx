import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
  Snackbar,
} from "@mui/material";

// Icons
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import api from "../axiosInstance";

// Define the form structure
interface ISignupForm {
  username: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for handling API responses
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ISignupForm>();

  // Watch the password field so we can compare it to confirmPassword
  const currentPassword = watch("password", "");

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const onSubmit: SubmitHandler<ISignupForm> = async (data) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      // Hit your backend endpoint
      await api.post("/user", {
        username: data.username,
        password: data.password,
      });

      // Show the success toast
      setSuccessMessage(
        "Account created successfully! Redirecting to login...",
      );

      // Wait 2 seconds so the user can read the message, then redirect
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Signup failed:", error);
      setIsLoading(false); // Only stop loading if there's an error, otherwise let it spin until redirect

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        setApiError(
          typeof detail === "string" ? detail : "Invalid data provided.",
        );
      } else {
        setApiError("Unable to create account. Please try again.");
      }
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
        background: "linear-gradient(135deg, #fdf8fd 0%, #f1ecf2 100%)",
        fontFamily: '"Hanken Grotesk", sans-serif',
        position: "relative",
        overflow: "hidden",
        p: 2,
      }}
    >
      {/* Success Notification Toast */}
      <Snackbar
        open={!!successMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Decorative Background */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 0,
          width: "100%",
          height: "100%",
          opacity: 0.3,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 30% 70%, #e6e0ef 0%, transparent 50%)",
        }}
      />

      <Container maxWidth="xs" sx={{ zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              bgcolor: "#4f1c9e",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.5,
              boxShadow: "0px 4px 12px rgba(79, 28, 158, 0.2)",
            }}
          >
            <CheckCircleIcon sx={{ color: "#ffffff", fontSize: 28 }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, color: "#1c1b1f", mb: 0.5 }}
          >
            Focus
          </Typography>
          <Typography variant="body2" sx={{ color: "#4a4453" }}>
            Streamline your workflow with intentionality.
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
          <Typography
            variant="h6"
            sx={{ fontWeight: 500, color: "#1c1b1f", mb: 3 }}
          >
            Create Account
          </Typography>

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

            <TextField
              id="username"
              placeholder="Username"
              type="text"
              variant="standard"
              fullWidth
              disabled={isLoading}
              {...register("username", {
                required: "Username is required",
                minLength: {
                  value: 3,
                  message: "Username must be at least 3 characters",
                },
              })}
              error={!!errors.username}
              helperText={errors.username?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: "#7b7484" }} />
                    </InputAdornment>
                  ),
                  sx: { pb: 1, "& input": { pl: 1 } },
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

            <TextField
              id="password"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              variant="standard"
              fullWidth
              disabled={isLoading}
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
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#7b7484" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        disabled={isLoading}
                        sx={{ color: "#7b7484" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { pb: 1, "& input": { pl: 1 } },
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

            <TextField
              id="confirmPassword"
              placeholder="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              variant="standard"
              fullWidth
              disabled={isLoading}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === currentPassword || "Passwords do not match",
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#7b7484" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        disabled={isLoading}
                        sx={{ color: "#7b7484" }}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { pb: 1, "& input": { pl: 1 } },
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

            <Typography
              variant="caption"
              sx={{ color: "#66636f", mt: 1, lineHeight: 1.5 }}
            >
              By joining, you agree to our{" "}
              <Box
                component="span"
                sx={{ color: "#4f1c9e", fontWeight: "bold", cursor: "pointer" }}
              >
                Terms of Service
              </Box>{" "}
              and{" "}
              <Box
                component="span"
                sx={{ color: "#4f1c9e", fontWeight: "bold", cursor: "pointer" }}
              >
                Privacy Policy
              </Box>
              .
            </Typography>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disableElevation
              disabled={isLoading || !!successMessage}
              endIcon={<ArrowForwardIcon />}
              sx={{
                mt: 1,
                height: 48,
                bgcolor: "#4f1c9e",
                color: "#ffffff",
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "14px",
                fontWeight: 500,
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "#3d167a",
                },
                "&:active": {
                  transform: "scale(0.98)",
                },
                "&.Mui-disabled": { bgcolor: "#ccc3d5", color: "#ffffff" },
              }}
            >
              {isLoading && !successMessage
                ? "Creating Account..."
                : "Create Account"}
            </Button>
          </Box>
        </Paper>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#4a4453" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              underline="hover"
              sx={{
                color: "#4f1c9e",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Log in
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
