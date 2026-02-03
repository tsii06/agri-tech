import { SmartContractManager } from "../../utils/contrat/frontSetupOnChain";
import { getSignerWallet, wsProvider } from "./frontProviders";

// les ABI des contrats
import producteurEnPhaseCultureABI from "../../abi/ProducteurEnPhaseCulture.json";
import collecteurProducteurABI from "../../abi/CollecteurProducteur.json";
import gestionnaireActeursABI from "../../abi/GestionnaireActeurs.json";
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
export const gestionnaireActeursRead = new SmartContractManager(
  config.addrGestionnaireActeurs,
  gestionnaireActeursABI.abi,
  wsProvider
);

// Les contrats write
const signerWallet = await getSignerWallet();
export const producteurEnPhaseCultureWrite = new SmartContractManager(
  config.addrProducteurEnPhaseCulture,
  producteurEnPhaseCultureABI.abi,
  signerWallet
);
