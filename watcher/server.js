const express = require("express");
const { getExpeditionData } = require("./blockchain");
const config = require("./config");

const app = express();

app.get("/expedition/:ref", async (req, res) => {
  try {
    const ref = req.params.ref;
    const data = await getExpeditionData(ref);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () =>
  console.log(`Server running on port ${config.port}`)
);
