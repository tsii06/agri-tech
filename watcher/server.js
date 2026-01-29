const express = require("express");
const { getExpeditionData } = require("./blockchain");
const config = require("./config");

const app = express();

app.get("/expedition/:ref", async (req, res) => {
  try {
    const ref = req.params.ref;
    const data = await getExpeditionData(ref);
    res.json(
      JSON.parse(
        JSON.stringify(data, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      )
    );
  } catch (err) {
    console.error(
      "Erreur lors de la recuperation des donnees depuis le smart contract privee : ",
      err.message
    );
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () =>
  console.log(`Server running on port ${config.port}`)
);
