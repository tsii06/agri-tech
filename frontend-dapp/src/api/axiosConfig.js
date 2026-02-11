import axios from "axios";

const axiosReady = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_WATCHER ?? "http://localhost:3000"}`,
  timeout: 60000, // 60s pour attendre le back si wake up.
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

export const handleErrorAxios = (error) => {
  // Erreur de validation du serveur (400)
  if (error.response?.status === 400) {
    throw new Error(`Données invalides: ${error.response.data.error}`);
  }

  // Erreur serveur (500)
  if (error.response?.status === 500) {
    throw new Error(`Erreur serveur: ${error.response.data.error}`);
  }

  // Timeout
  if (error.code === "ECONNABORTED") {
    throw new Error("Délai d'attente dépassé");
  }

  // Pas de connexion
  if (error.code === "ERR_NETWORK") {
    throw new Error("Impossible de contacter le serveur");
  }

  // Autre erreur
  throw new Error(`Erreur inconnue: ${error.message}`);
};

export default axiosReady;
