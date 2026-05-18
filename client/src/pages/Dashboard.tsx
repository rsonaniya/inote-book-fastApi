import React, { useState, useEffect } from "react";
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
} from "@mui/material";

// Icons
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";

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
  const { user, logout } = useAuth();

  const [todos, setTodos] = useState<ITodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    // 1. Find the specific todo in our current state array
    const todoToUpdate = todos.find((todo) => todo.id === id);
    if (!todoToUpdate) return;

    // 2. Optimistic UI update
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !currentStatus } : todo,
      ),
    );

    try {
      // 3. Send the full object as required by your FastAPI PUT endpoint
      await api.put(`/notes/${id}`, {
        title: todoToUpdate.title,
        content: todoToUpdate.content,
        completed: !currentStatus,
      });
    } catch (err) {
      console.error("Failed to update task status:", err);

      // Revert the UI state if the backend request fails
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

  // --- Edit Modal Handlers ---
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

      // Type guard to cast the error safely to an AxiosError
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

  // --- Add Modal Handlers ---
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
      // Assuming FastAPI expects a payload matching the Todo schema
      const response = await api.post("/notes/", {
        title: addTitle,
        content: addContent,
      });

      // Add the newly created task to the top of the list
      setTodos((prev) => [response.data, ...prev]);
      showSnackbar("Task created!", "success");
      handleCloseAddModal();
    } catch (err) {
      console.error("Failed to create task:", err);

      // Type guard to cast the error safely to an AxiosError
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
      <Container maxWidth="md" sx={{ pt: 6 }}>
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

          <Button
            variant="outlined"
            onClick={logout}
            startIcon={<LogoutIcon />}
            sx={{
              color: "#4a4453",
              borderColor: "#ccc3d5",
              borderRadius: "9999px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              "&:hover": { bgcolor: "#f1ecf2", borderColor: "#7b7484" },
            }}
          >
            Logout
          </Button>
        </Box>

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

      {/* --- Edit Task Modal --- */}
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
