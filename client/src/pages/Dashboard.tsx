import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Checkbox,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Fab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Drawer,
  Avatar,
  Divider,
} from "@mui/material";

// Icons
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

import api from "../axiosInstance";
import { useAuth } from "../context/AuthContext";

export interface ITodo {
  id: number;
  title: string;
  content: string;
  completed: boolean;
  creator_id: number;
}

export default function Dashboard() {
  // Ensure your AuthContext exposes an updateUser function to refresh the user state
  const { user, logout, setUser } = useAuth();

  const [todos, setTodos] = useState<ITodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Drawer & Profile Upload State ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<ITodo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (
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

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/notes/");
      setTodos(response.data);
    } catch (err: any) {
      console.error("Failed to fetch tasks:", err);
      setError("Unable to load your tasks. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (id: number, currentStatus: boolean) => {
    const todoToUpdate = todos.find((todo) => todo.id === id);
    if (!todoToUpdate) return;

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !currentStatus } : todo,
      ),
    );

    try {
      await api.put(`/notes/${id}`, {
        title: todoToUpdate.title,
        content: todoToUpdate.content,
        completed: !currentStatus,
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, completed: currentStatus } : todo,
        ),
      );
      showSnackbar("Failed to update task status. Please try again.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notes/${id}`);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      console.error("Failed to delete task:", err);
      showSnackbar("Failed to delete the task.");
    }
  };

  // --- Profile Picture Upload Logic ---
  const handleProfilePicClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again if needed
    event.target.value = "";

    // Validation: File Type
    const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      showSnackbar(
        "Invalid file type. Please upload a JPEG, PNG, or WEBP.",
        "error",
      );
      return;
    }

    // Validation: File Size (100KB to 5MB)
    const minSize = 100 * 1024;
    const maxSize = 5 * 1024 * 1024;
    if (file.size < minSize || file.size > maxSize) {
      showSnackbar("Image size must be between 100KB and 5MB.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("profile_pic", file);

    try {
      const response = await api.post("/user/upload-profile-pic", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Assuming your AuthContext has a way to update the user in state
      if (setUser) {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      showSnackbar("Profile picture updated successfully!", "success");
    } catch (err: any) {
      console.error("Failed to upload image:", err);
      if (err.response?.data?.detail) {
        showSnackbar(
          typeof err.response.data.detail === "string"
            ? err.response.data.detail
            : "Upload failed.",
        );
      } else {
        showSnackbar("Failed to upload profile picture. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // --- Modal Handlers ---
  const handleOpenModal = (todo: ITodo) => {
    setSelectedTodo(todo);
    setEditTitle(todo.title);
    setEditContent(todo.content || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedTodo(null);
      setEditTitle("");
      setEditContent("");
    }, 200);
  };

  const handleSaveEdit = async () => {
    if (!selectedTodo) return;
    setIsSaving(true);

    try {
      await api.put(`/notes/${selectedTodo.id}`, {
        title: editTitle,
        content: editContent,
      });

      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === selectedTodo.id
            ? { ...todo, title: editTitle, content: editContent }
            : todo,
        ),
      );

      handleCloseModal();
    } catch (err) {
      console.error("Failed to save task edits:", err);
      const axiosError = err as any;

      if (
        axiosError.response?.status === 422 &&
        Array.isArray(axiosError.response.data?.detail)
      ) {
        const errorMessages = axiosError.response.data.detail
          .map((e: any) => {
            const field = e.loc[e.loc.length - 1];
            const formattedField =
              field.charAt(0).toUpperCase() + field.slice(1);
            return `${formattedField}: ${e.msg}`;
          })
          .join(" | ");

        showSnackbar(errorMessages);
      } else {
        showSnackbar("Failed to save changes. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAddModal = () => {
    setAddTitle("");
    setAddContent("");
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCreateTask = async () => {
    if (!addTitle.trim()) {
      showSnackbar("Please enter a title for your task.");
      return;
    }

    setIsAdding(true);

    try {
      const response = await api.post("/notes/", {
        title: addTitle,
        content: addContent,
      });

      setTodos((prev) => [response.data, ...prev]);
      showSnackbar("Task created!", "success");
      handleCloseAddModal();
    } catch (err) {
      console.error("Failed to create task:", err);
      const axiosError = err as any;

      if (
        axiosError.response?.status === 422 &&
        Array.isArray(axiosError.response.data?.detail)
      ) {
        const errorMessages = axiosError.response.data.detail
          .map((e: any) => {
            const field = e.loc[e.loc.length - 1];
            const formattedField =
              field.charAt(0).toUpperCase() + field.slice(1);
            return `${formattedField}: ${e.msg}`;
          })
          .join(" | ");

        showSnackbar(errorMessages);
      } else {
        showSnackbar("Failed to create task. Please try again.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fdf8fd",
        fontFamily: '"Hanken Grotesk", sans-serif',
        pb: 10,
      }}
    >
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        accept="image/jpeg, image/png, image/webp"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <Container maxWidth="md" sx={{ pt: 6 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 600,
                color: "#1c1b1f",
                mb: 1,
                letterSpacing: "-0.5px",
              }}
            >
              Your Notes
            </Typography>
            <Typography variant="body1" sx={{ color: "#4a4453" }}>
              Welcome back, {user?.fullname || "User"}. Here is what you need to
              focus on.
            </Typography>
          </Box>

          {/* User Avatar Button (Replaces Logout Button) */}
          <IconButton
            onClick={() => setIsDrawerOpen(true)}
            sx={{
              p: 0.5,
              border: "2px solid #e6e0ef",
              "&:hover": { borderColor: "#4f1c9e" },
              transition: "all 0.2s",
            }}
          >
            <Avatar
              src={user?.profile_pic_url}
              alt={user?.fullname}
              sx={{
                width: 48,
                height: 48,
                bgcolor: "#4f1c9e",
                color: "#ffffff",
                fontWeight: 600,
              }}
            >
              {user?.fullname?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        {/* --- Main Content (Tasks) --- */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
            <CircularProgress sx={{ color: "#4f1c9e" }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: "12px" }}>
            {error}
          </Alert>
        )}

        {!isLoading && !error && todos.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" sx={{ color: "#7b7484" }}>
              You don't have any notes yet.
            </Typography>
            <Typography variant="body2" sx={{ color: "#7b7484" }}>
              Click the + button to create one.
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {todos &&
            todos.length > 0 &&
            todos.map((todo) => (
              <Paper
                key={todo.id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "16px",
                  border: "1px solid #ccc3d5",
                  bgcolor: "#ffffff",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  transition: "all 0.2s",
                  "&:hover": {
                    boxShadow: "0px 4px 12px rgba(103, 58, 183, 0.08)",
                    "& .action-buttons": { opacity: 1 },
                  },
                }}
              >
                <Box sx={{ pt: 0.5 }}>
                  <Checkbox
                    checked={todo.completed}
                    onChange={() =>
                      handleToggleComplete(todo.id, todo.completed)
                    }
                    icon={
                      <RadioButtonUncheckedIcon
                        sx={{ color: "#7b7484", fontSize: 28 }}
                      />
                    }
                    checkedIcon={
                      <CheckCircleIcon
                        sx={{ color: "#673ab7", fontSize: 28 }}
                      />
                    }
                    sx={{ p: 0 }}
                  />
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: todo.completed ? "#7b7484" : "#1c1b1f",
                        textDecoration: todo.completed
                          ? "line-through"
                          : "none",
                        fontWeight: 500,
                        mb: 0.5,
                        fontSize: "18px",
                      }}
                    >
                      {todo.title}
                    </Typography>

                    <Box
                      className="action-buttons"
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        opacity: 0,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleOpenModal(todo)}
                        sx={{
                          color: "#4a4453",
                          "&:hover": { bgcolor: "#f1ecf2" },
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(todo.id)}
                        sx={{
                          color: "#4a4453",
                          "&:hover": { bgcolor: "#ffdad6", color: "#ba1a1a" },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {todo.content && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: todo.completed ? "#ccc3d5" : "#4a4453",
                        textDecoration: todo.completed
                          ? "line-through"
                          : "none",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {todo.content}
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
        </Box>
      </Container>

      <Fab
        color="primary"
        aria-label="add"
        onClick={handleOpenAddModal}
        sx={{
          position: "fixed",
          bottom: 32,
          right: 32,
          bgcolor: "#673ab7",
          color: "#ffffff",
          "&:hover": { bgcolor: "#4f1c9e" },
        }}
      >
        <AddIcon />
      </Fab>

      {/* --- User Profile Drawer --- */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 360 },
              bgcolor: "#fdf8fd",
              fontFamily: '"Hanken Grotesk", sans-serif',
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1c1b1f" }}>
              Profile
            </Typography>
            <IconButton
              onClick={() => setIsDrawerOpen(false)}
              sx={{ color: "#4a4453" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ borderColor: "#ccc3d5" }} />

          <Box
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            {/* Interactive Avatar Area */}
            <Box
              sx={{
                position: "relative",
                mb: 3,
                cursor: isUploading ? "default" : "pointer",
                borderRadius: "50%",
                overflow: "hidden",
                width: 120,
                height: 120,
                boxShadow: "0px 8px 24px rgba(103, 58, 183, 0.15)",
                "&:hover .overlay": { opacity: 1 },
              }}
              onClick={!isUploading ? handleProfilePicClick : undefined}
            >
              {isUploading ? (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#e6e0ef",
                  }}
                >
                  <CircularProgress size={32} sx={{ color: "#4f1c9e" }} />
                </Box>
              ) : (
                <>
                  <Avatar
                    src={user?.profile_pic_url}
                    alt={user?.fullname}
                    sx={{
                      width: "100%",
                      height: "100%",
                      bgcolor: "#4f1c9e",
                      color: "#ffffff",
                      fontSize: "40px",
                      fontWeight: 600,
                    }}
                  >
                    {user?.fullname?.charAt(0).toUpperCase()}
                  </Avatar>

                  {/* Hover/Placeholder Overlay */}
                  <Box
                    className="overlay"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: "rgba(28, 27, 31, 0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: user?.profile_pic_url ? 0 : 1, // Always show if no picture, otherwise show on hover
                      transition: "opacity 0.2s ease-in-out",
                    }}
                  >
                    {user?.profile_pic_url ? (
                      <PhotoCameraIcon
                        sx={{ color: "#ffffff", fontSize: 32 }}
                      />
                    ) : (
                      <AddPhotoAlternateIcon
                        sx={{ color: "#ffffff", fontSize: 36 }}
                      />
                    )}
                  </Box>
                </>
              )}
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "#1c1b1f",
                mb: 0.5,
                textAlign: "center",
              }}
            >
              {user?.fullname}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#4a4453", mb: 4, textAlign: "center" }}
            >
              {user?.email}
            </Typography>
          </Box>

          <Box sx={{ p: 3, bgcolor: "#f7f2f8" }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setIsDrawerOpen(false);
                logout();
              }}
              startIcon={<LogoutIcon />}
              sx={{
                color: "#ba1a1a",
                borderColor: "#ccc3d5",
                borderRadius: "9999px",
                textTransform: "none",
                fontWeight: 600,
                py: 1.5,
                "&:hover": { bgcolor: "#ffdad6", borderColor: "#ba1a1a" },
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* --- Edit Task Modal --- */}
      {/* ... (Kept completely identical to your provided code) ... */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "28px",
              bgcolor: "#ffffff",
              boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.12)",
              m: 2,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#1c1b1f" }}>
            Edit Task
          </Typography>
          <IconButton
            onClick={handleCloseModal}
            sx={{ color: "#4a4453", "&:hover": { bgcolor: "#f1ecf2" } }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 1 }}>
            <Box>
              <Typography
                variant="body2"
                sx={{ color: "#4f1c9e", fontWeight: 500, mb: 1 }}
              >
                Task Title
              </Typography>
              <TextField
                fullWidth
                variant="standard"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
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
                  "& input": { py: 1, color: "#1c1b1f", fontSize: "16px" },
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ color: "#4f1c9e", fontWeight: 500, mb: 1 }}
              >
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="standard"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
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
                  "& textarea": { py: 1, color: "#1c1b1f", fontSize: "16px" },
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f7f2f8" }}>
          <Button
            onClick={handleCloseModal}
            sx={{
              color: "#4f1c9e",
              textTransform: "none",
              fontWeight: 500,
              px: 3,
              borderRadius: "9999px",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={isSaving}
            sx={{
              bgcolor: "#4f1c9e",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 500,
              px: 4,
              borderRadius: "9999px",
              "&:hover": { bgcolor: "#3d167a" },
              "&.Mui-disabled": { bgcolor: "#ccc3d5" },
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Add Task Modal --- */}
      {/* ... (Kept completely identical to your provided code) ... */}
      <Dialog
        open={isAddModalOpen}
        onClose={handleCloseAddModal}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "28px",
              bgcolor: "#ffffff",
              boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.12)",
              m: 2,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#1c1b1f" }}>
            Add New Task
          </Typography>
          <IconButton
            onClick={handleCloseAddModal}
            sx={{ color: "#4a4453", "&:hover": { bgcolor: "#f1ecf2" } }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 1 }}>
            <Box>
              <Typography
                variant="body2"
                sx={{ color: "#4f1c9e", fontWeight: 500, mb: 1 }}
              >
                Task Title
              </Typography>
              <TextField
                fullWidth
                variant="standard"
                placeholder="What do you need to do?"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
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
                  "& input": { py: 1, color: "#1c1b1f", fontSize: "16px" },
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ color: "#4f1c9e", fontWeight: 500, mb: 1 }}
              >
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="standard"
                placeholder="Add details..."
                value={addContent}
                onChange={(e) => setAddContent(e.target.value)}
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
                  "& textarea": { py: 1, color: "#1c1b1f", fontSize: "16px" },
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f7f2f8" }}>
          <Button
            onClick={handleCloseAddModal}
            sx={{
              color: "#4f1c9e",
              textTransform: "none",
              fontWeight: 500,
              px: 3,
              borderRadius: "9999px",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={isAdding || !addTitle.trim()}
            sx={{
              bgcolor: "#4f1c9e",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 500,
              px: 4,
              borderRadius: "9999px",
              "&:hover": { bgcolor: "#3d167a" },
              "&.Mui-disabled": { bgcolor: "#ccc3d5" },
            }}
          >
            {isAdding ? "Creating..." : "Create Task"}
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}
