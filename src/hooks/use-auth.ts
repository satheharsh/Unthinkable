"use client";

import { useState, useEffect } from "react";

// Extremely simple mock global auth state for prototype
let globalIsAuthenticated = false;

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(globalIsAuthenticated);

  // Sync state if it changes from another component
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated !== globalIsAuthenticated) {
        setIsAuthenticated(globalIsAuthenticated);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = () => {
    globalIsAuthenticated = true;
    setIsAuthenticated(true);
  };

  const logout = () => {
    globalIsAuthenticated = false;
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}
