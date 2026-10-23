// One place for all requests to the server.
import axios from "axios";

const api = axios.create({ baseURL: "https://sms-backend-production-4398.up.railway.app/api" });

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

// The link to an uploaded file. New uploads are stored on Cloudinary and the
// database holds the full https link, so it is used as it is. Older records
// that only hold a file name fall back to the server's /uploads folder.
export function fileUrl(file) {
  if (!file) return "";
  if (/^https?:\/\//i.test(file)) return file;
  return api.defaults.baseURL.replace(/\/api\/?$/, "") + "/uploads/" + file;
}

export default api;
