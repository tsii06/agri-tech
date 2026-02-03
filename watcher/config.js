import 'dotenv/config';

export default {
  privateWs: process.env.PRIVATE_WS, // il faut un rpc de type websocket ici car on ecoute les evenements des smarts contracts
  publicRPC: process.env.PUBLIC_RPC,
  adresseExportateurClientContrat: process.env.EXPORTATEUR_CLIENT_ADDR,
  adresseRegistreExpeditionContrat: process.env.REGISTRE_EXPEDITION_ADDR,
  privateKey: process.env.PRIVATE_KEY,
  port: 3000,
  // config pinata
  pinataJwt: process.env.JWT_PINATA,
  pinataGateway: process.env.GATEWAY_PINATA
};
