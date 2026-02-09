import { SmartContractManager } from "../../utils/contrat/frontSetupOnChain";
import { getSignerWallet, wsProvider } from "./frontProviders";

// les ABI des contrats
import producteurEnPhaseCultureABI from "../../abi/ProducteurEnPhaseCulture.json";
import collecteurProducteurABI from "../../abi/CollecteurProducteur.json";
import gestionnaireActeursABI from "../../abi/GestionnaireActeurs.json";
import exportateurClientABI from "../../abi/ExportateurClient.json";
import collecteurExportateurABI from "../../abi/CollecteurExportateur.json";
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
export const exportateurClientRead = new SmartContractManager(
  config.addrExportateurClient,
  exportateurClientABI.abi,
  wsProvider
);
export const collecteurExportateurRead = new SmartContractManager(
  config.addrCollecteurExportateur,
  collecteurExportateurABI.abi,
  wsProvider
);

// Les contrats write ==================================================================================
export async function getProducteurEnPhaseCultureWrite() {
  const signerWallet = await getSignerWallet();
  return new SmartContractManager(
    config.addrProducteurEnPhaseCulture,
    producteurEnPhaseCultureABI.abi,
    signerWallet
  );
}
export async function getCollecteurProducteurWrite() {
  const signerWallet = await getSignerWallet();
  return new SmartContractManager(
    config.addrCollecteurProducteur,
    collecteurProducteurABI.abi,
    signerWallet
  );
}
export async function getExportateurClientWrite() {
  const signerWallet = await getSignerWallet();
  return new SmartContractManager(
    config.addrExportateurClient,
    exportateurClientABI.abi,
    signerWallet
  );
}
export async function getCollecteurExportateurWrite() {
  const signerWallet = await getSignerWallet();
  return new SmartContractManager(
    config.addrCollecteurExportateur,
    collecteurExportateurABI.abi,
    signerWallet
  );
}
