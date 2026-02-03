import { SmartContractManager } from "../../utils/contrat/frontSetupOnChain";
import { wsProvider } from "./frontProviders";

// les ABI des contrats
import producteurEnPhaseCultureABI from "../../abi/ProducteurEnPhaseCulture.json";
import { config } from "../config";

// Les contrats read-only
export const producteurEnPhaseCultureRead = new SmartContractManager(
  config.addrProducteurEnPhaseCulture,
  producteurEnPhaseCultureABI.abi,
  wsProvider
);
