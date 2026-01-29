const { listenExpedition, pushToPublic } = require("./blockchain");
require("./server"); // start HTTP server

listenExpedition(async (data) => {
  console.log("Processing expedition for public chain...");
  await pushToPublic(data);
});
