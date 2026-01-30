import { listenExpedition, pushToPublic, privateProvider } from "./blockchain.js";
import './server.js'; // start HTTP server

const callbackListener = async (data) => {
  console.log("Processing expedition for public chain...");
  await pushToPublic(data);
};

listenExpedition(callbackListener);

// Gestion des reconnections
privateProvider.on("error", (error) => {
  console.log("Erreur provider, reconnect...");
  listenExpedition(callbackListener);
});
