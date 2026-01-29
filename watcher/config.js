require('dotenv').config();

module.exports = {
  privateRPC: process.env.PRIVATE_RPC,
  publicRPC: process.env.PUBLIC_RPC,
  adresseExportateurClientContrat: process.env.EXPORTATEUR_CLIENT_ADDR,
  adresseRegistreExpeditionContrat: process.env.REGISTRE_EXPEDITION_ADDR,
  privateKey: process.env.PRIVATE_KEY,
  port: 3000,
};
