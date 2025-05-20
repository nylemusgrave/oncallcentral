import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: async () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for authenticated user on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking auth status...");
        const response = await fetch("/api/user", {
          credentials: "include",
        });

        console.log("Auth response status:", response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log("User data from API:", userData);
          setUser(userData);
          
          // For demo purposes, store user in localStorage as well
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          console.log("No authenticated user via API, checking localStorage");
          // No authenticated user - check localStorage fallback
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            console.log("Found user in localStorage");
            // For demo purposes, we'll use the stored user
            setUser(JSON.parse(storedUser));
            
            // For demo purposes, simulate login with stored user data
            const storedUserData = JSON.parse(storedUser);
            await fetch("/api/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                username: storedUserData.username, 
                password: "password" // Demo password
              }),
              credentials: "include",
            });
          } else {
            console.log("No user found in localStorage");
            
            // For demo purposes, perform auto-login to admin account
            try {
              console.log("Auto-logging in with admin user");
              await login("admin", "password");
            } catch (e) {
              console.error("Auto-login failed:", e);
            }
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        console.log("Auth check complete, isLoading set to false");
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        return false;
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
