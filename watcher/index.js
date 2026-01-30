import { listenExpedition, pushToPublic } from "./blockchain.js";
import './server.js'; // start HTTP server

const callbackListener = async (data) => {
  console.log("Processing expedition for public chain...");
  await pushToPublic(data);
};

listenExpedition(callbackListener);
