import { app } from "../server.js";
import { getAncrageByRef } from "../services/ancrage.service.js";
import { getExpeditionOnMainnet } from "../utils/onChain/call.js";

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