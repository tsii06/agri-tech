import { ethers } from "ethers";
import config from "../../config.js";

let privateReconnectAttempts = 0;
const MAX_RECONNECT = 5;

const getPrivateProvider = () => {
  const privateProvider = new ethers.WebSocketProvider(config.privateRPC);

  privateProvider.websocket.on("error", (error) => {
    console.error("WebSocket error:", error);
    if (privateReconnectAttempts < MAX_RECONNECT) {
      privateReconnectAttempts++;
      console.log(`Reconnexion... (${privateReconnectAttempts}/${MAX_RECONNECT})`);
      setTimeout(getPrivateProvider, 5000); // Attend 5s avant de reconnecter
    }
  });

  privateProvider.websocket.on("close", () => {
    console.log("WebSocket fermé, reconnexion...");
    setTimeout(getPrivateProvider, 3000);
  });

  privateReconnectAttempts = 0; // Reset si connexion OK

  return privateProvider;
};

export const privateProvider = getPrivateProvider();
