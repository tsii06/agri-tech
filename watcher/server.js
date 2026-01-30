import express from "express";
import config from "./config.js";
import { getAncrageByRef } from "./services/ancrage.service.js";
import { getExpeditionOnMainnet } from "./utils/onChain/call.js";

const app = express();

app.get("/anchor-expedition/:ref", async (req, res) => {
  try {
    const ref = req.params.ref;
    const dataOnMainnet = await getExpeditionOnMainnet(ref);
    const dataFromDb = await getAncrageByRef(ref);
    const data = { ...dataFromDb, ...dataOnMainnet };
    res.json(data);
  } catch (err) {
    console.error(
      "Erreur lors de la recuperation des donnees depuis le smart contract public : ",
      err
    );
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () =>
  console.log(`Server running on port ${config.port}`)
);
