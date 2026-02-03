import { ReconnectingWebSocketProvider } from "../../utils/contrat/frontSetupOnChain";
import { config } from "../frontConfig";

// WebSocket provider pour la blockchain sur VPS
export const wsProvider = new ReconnectingWebSocketProvider(config.privateWsUrl).getProvider();