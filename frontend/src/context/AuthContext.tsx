import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: number;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, full_name: string, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("safescan_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem("safescan_token");
    return stored ? stored : null;
  });

  const login = (email: string, full_name: string, accessToken: string) => {
    const newUser = {
      id: 1,
      email,
      full_name,
    };
    setUser(newUser);
    setToken(accessToken);
    localStorage.setItem("safescan_user", JSON.stringify(newUser));
    localStorage.setItem("safescan_token", accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("safescan_user");
    localStorage.removeItem("safescan_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
