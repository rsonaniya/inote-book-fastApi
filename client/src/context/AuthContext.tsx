import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
  useContext,
  type SetStateAction,
  type Dispatch,
} from "react";

// 1. Define the shape of your User and Context
interface User {
  user_id: number;
  email: string;
  fullname: string;
  profile_pic_url: string;
  profile_pic_public_id: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  setUser: Dispatch<SetStateAction<User | null>>;
}

// 2. Create the Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  console.log("@@@user", user);

  // Check if a token exists when the app first loads
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Force a redirect to login if they are logged out
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 4. Custom hook to make it easy to use the context anywhere
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
