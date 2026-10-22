// Keeps the logged-in user in one place so any page can read it.
import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page refresh, ask the server who this token belongs to.
  useEffect(function () {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(function (res) {
        setUser(res.data);
      })
      .catch(function () {
        localStorage.removeItem("token");
      })
      .finally(function () {
        setLoading(false);
      });
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    const me = await api.get("/auth/me");
    setUser(me.data);
    return me.data;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  // Called after something changes that affects the profile (e.g. new child).
  async function refresh() {
    const me = await api.get("/auth/me");
    setUser(me.data);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
