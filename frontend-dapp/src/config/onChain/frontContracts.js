import { SmartContractManager } from "../../utils/contrat/frontSetupOnChain";
import { wsProvider } from "./frontProviders";

// les ABI des contrats
import producteurEnPhaseCultureABI from "../../abi/ProducteurEnPhaseCulture.json";
import collecteurProducteurABI from "../../abi/CollecteurProducteur.json";
import { config } from "../frontConfig";

// Les contrats read-only
export const producteurEnPhaseCultureRead = new SmartContractManager(
  config.addrProducteurEnPhaseCulture,
  producteurEnPhaseCultureABI.abi,
  wsProvider
);
export const collecteurProducteurRead = new SmartContractManager(
  config.addrCollecteurProducteur,
  collecteurProducteurABI.abi,
  wsProvider
);
