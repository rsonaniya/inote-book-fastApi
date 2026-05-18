import React, { useState, useEffect } from "react";
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
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import api from "../axiosInstance";

// Define the updated form structure
interface ISignupForm {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const navigate = useNavigate();

  // --- UI & Flow States ---
  const [step, setStep] = useState<"signup" | "otp">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- OTP States ---
  const [emailToVerify, setEmailToVerify] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(0); // 60 seconds timer

  // --- API & Loading States ---
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ISignupForm>();

  const currentPassword = watch("password", "");

  // --- Timer Hook for OTP Resend ---
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // --- Handlers ---
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword((show) => !show);
  const handleMouseDownPassword = (e: React.MouseEvent<HTMLButtonElement>) =>
    e.preventDefault();

  const showToast = (
    message: string,
    severity: "success" | "error" = "error",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // --- API Call: Step 1 - Signup ---
  const onSubmitSignup: SubmitHandler<ISignupForm> = async (data) => {
    setIsLoading(true);

    try {
      await api.post("/user/", {
        fullname: data.fullname,
        email: data.email,
        password: data.password,
      });

      // Move to OTP step
      setEmailToVerify(data.email);
      setStep("otp");
      setTimeLeft(60); // Start 1-minute cooldown
      showToast("OTP sent to your email!", "success");
    } catch (err: any) {
      console.error("Signup failed:", err);
      const axiosError = err as any;

      if (
        axiosError.response?.status === 422 &&
        Array.isArray(axiosError.response.data?.detail)
      ) {
        const errorMessages = axiosError.response.data.detail
          .map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`)
          .join(" | ");
        showToast(errorMessages);
      } else if (axiosError.response?.data?.detail) {
        showToast(axiosError.response.data.detail);
      } else {
        showToast("Unable to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- API Call: Step 2 - Verify OTP ---
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      showToast("Please enter the OTP.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/user/verify-otp", {
        otp_code: otpCode,
        email: emailToVerify,
      });

      showToast("Account verified successfully! Redirecting...", "success");

      // Delay navigation so they can see the success toast
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error("OTP Verification failed:", err);
      const axiosError = err as any;

      if (axiosError.response?.data?.detail) {
        // This will catch "Invalid OTP" or "OTP expired" from your backend
        showToast(axiosError.response.data.detail);
      } else {
        showToast("Verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- API Call: Resend OTP ---
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await api.post("/user/resend-otp", {
        email: emailToVerify,
      });

      setTimeLeft(60); // Reset timer
      showToast("A new OTP has been sent to your email.", "success");
    } catch (err: any) {
      console.error("Resend OTP failed:", err);
      showToast("Failed to resend OTP. Please try again later.");
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
        background: "linear-gradient(135deg, #fdf8fd 0%, #f1ecf2 100%)",
        fontFamily: '"Hanken Grotesk", sans-serif',
        position: "relative",
        overflow: "hidden",
        p: 2,
      }}
    >
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ zIndex: 2000 }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {snackbar.message}
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
            position: "relative",
          }}
        >
          {/* ======================================================== */}
          {/* STEP 1: SIGNUP FORM                                        */}
          {/* ======================================================== */}
          {step === "signup" && (
            <Box sx={{ animation: "fadeIn 0.3s ease" }}>
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
                onSubmit={handleSubmit(onSubmitSignup)}
                sx={{ display: "flex", flexDirection: "column", gap: 3 }}
              >
                {/* Full Name Field */}
                <TextField
                  id="fullname"
                  placeholder="Full Name"
                  type="text"
                  variant="standard"
                  fullWidth
                  disabled={isLoading}
                  {...register("fullname", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  error={!!errors.fullname}
                  helperText={errors.fullname?.message}
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
                    "& .MuiInput-underline:after": {
                      borderBottomColor: "#4f1c9e",
                    },
                  }}
                />

                {/* Email Field */}
                <TextField
                  id="email"
                  placeholder="Email Address"
                  type="email"
                  variant="standard"
                  fullWidth
                  disabled={isLoading}
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
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: "#7b7484" }} />
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
                    "& .MuiInput-underline:after": {
                      borderBottomColor: "#4f1c9e",
                    },
                  }}
                />

                {/* Password Field */}
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
                    "& .MuiInput-underline:after": {
                      borderBottomColor: "#4f1c9e",
                    },
                  }}
                />

                {/* Confirm Password Field */}
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
                    "& .MuiInput-underline:after": {
                      borderBottomColor: "#4f1c9e",
                    },
                  }}
                />

                <Typography
                  variant="caption"
                  sx={{ color: "#66636f", mt: 1, lineHeight: 1.5 }}
                >
                  By joining, you agree to our{" "}
                  <Box
                    component="span"
                    sx={{
                      color: "#4f1c9e",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    Terms of Service
                  </Box>{" "}
                  and{" "}
                  <Box
                    component="span"
                    sx={{
                      color: "#4f1c9e",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
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
                  disabled={isLoading}
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
                    "&:hover": { bgcolor: "#3d167a" },
                    "&:active": { transform: "scale(0.98)" },
                    "&.Mui-disabled": { bgcolor: "#ccc3d5", color: "#ffffff" },
                  }}
                >
                  {isLoading ? "Processing..." : "Create Account"}
                </Button>
              </Box>
            </Box>
          )}

          {/* ======================================================== */}
          {/* STEP 2: OTP VERIFICATION FORM                              */}
          {/* ======================================================== */}
          {step === "otp" && (
            <Box
              sx={{
                animation: "fadeIn 0.3s ease",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <Box>
                <IconButton
                  onClick={() => setStep("signup")}
                  sx={{ ml: -1.5, mb: 1, color: "#7b7484" }}
                  aria-label="back to signup"
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 500, color: "#1c1b1f", mb: 1 }}
                >
                  Verify your email
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#4a4453", lineHeight: 1.5 }}
                >
                  We've sent a one-time passcode to <br />
                  <Box
                    component="span"
                    sx={{ fontWeight: 600, color: "#4f1c9e" }}
                  >
                    {emailToVerify}
                  </Box>
                </Typography>
              </Box>

              <TextField
                id="otpCode"
                placeholder="Enter OTP Code"
                type="text"
                variant="standard"
                fullWidth
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={isLoading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyIcon sx={{ color: "#7b7484" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      pb: 1,
                      "& input": {
                        pl: 1,
                        letterSpacing: "4px",
                        fontSize: "18px",
                        fontWeight: 500,
                      },
                    },
                  },
                }}
                sx={{
                  "& .MuiInput-underline:before": {
                    borderBottomColor: "#ccc3d5",
                  },
                  "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                    borderBottomColor: "#7b7484",
                  },
                  "& .MuiInput-underline:after": {
                    borderBottomColor: "#4f1c9e",
                  },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  mt: 1,
                }}
              >
                <Button
                  onClick={handleVerifyOtp}
                  fullWidth
                  variant="contained"
                  disableElevation
                  disabled={isLoading || otpCode.length < 4}
                  sx={{
                    height: 48,
                    bgcolor: "#4f1c9e",
                    color: "#ffffff",
                    borderRadius: "12px",
                    textTransform: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "#3d167a" },
                    "&:active": { transform: "scale(0.98)" },
                    "&.Mui-disabled": { bgcolor: "#ccc3d5", color: "#ffffff" },
                  }}
                >
                  {isLoading ? "Verifying..." : "Verify Account"}
                </Button>

                <Button
                  onClick={handleResendOtp}
                  fullWidth
                  variant="text"
                  disabled={isLoading || timeLeft > 0}
                  sx={{
                    height: 48,
                    color: "#4f1c9e",
                    borderRadius: "12px",
                    textTransform: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    "&.Mui-disabled": { color: "#7b7484" },
                  }}
                >
                  {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : "Resend OTP"}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Bottom Login Link (Only show on signup step) */}
        {step === "signup" && (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "#4a4453" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                underline="hover"
                sx={{ color: "#4f1c9e", fontWeight: 700, fontSize: "14px" }}
              >
                Log in
              </Link>
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
