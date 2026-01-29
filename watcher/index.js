const {
  listenExpedition,
  pushToPublic,
  privateProvider,
} = require("./blockchain");
require("./server"); // start HTTP server

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
