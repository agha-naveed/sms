// One place for all requests to the server.
import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach the saved login token to every request.
api.interceptors.request.use(function (config) {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

// If the token has expired, send the person back to the login page.
api.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Pulls a readable message out of any error.
export function errorText(err) {
  if (err.response && err.response.data && err.response.data.message) {
    return err.response.data.message;
  }
  return "Could not reach the server. Is it running?";
}

export default api;
