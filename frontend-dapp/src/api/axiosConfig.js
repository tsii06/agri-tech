import axios from "axios";

const axiosReady = axios.create({
  baseURL: `http://${import.meta.env.VITE_SERVER_WATCHER || "localhost:3000"}`,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * LES INTERCEPTORS
 *  -> executer automatiquement avant chaque requete
 *  -> mlay aa !!!!!
 * */
axiosReady.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("madtx_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosReady;
