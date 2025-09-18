import { ethers } from "ethers";

export const USE_CHAIN_ID = 1337n;
export const USE_NETWORK = {
  chainId: "0x539", // 1337 en hexadécimal
  chainName: "Localhost",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["http://localhost:8545"],
  blockExplorerUrls: [""],
};

// export const USE_CHAIN_ID = 80002n;
// export const USE_NETWORK = {
//   chainId: "0x13882", // 80002 en hexadécimal
//   chainName: "Amoy",
//   nativeCurrency: {
//     name: "POL",
//     symbol: "POL",
//     decimals: 18,
//   },
//   rpcUrls: ["https://rpc-amoy.polygon.technology/"],
//   blockExplorerUrls: ["https://amoy.polygonscan.com/"],
// };

export async function checkNetwork() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (network.chainId === USE_CHAIN_ID) {
      console.log("✅ Connecté au réseau Amoy");
      return true;
    } else {
      console.log(
        `❌ Réseau incorrect. Connecté à: ${network.name} (${network.chainId})`
      );
      return false;
    }
  }
  return false;
}

export async function switchToCorrectNetwork() {
  try {
    // Tenter de changer de network
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: USE_NETWORK.chainId }],
    });
  } catch (switchError) {
    // Si le réseau n'est pas ajouté, l'ajouter
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [USE_NETWORK],
        });
      } catch (addError) {
        console.error("Erreur lors de l'ajout du réseau:", addError);
      }
    }
  }
}

export async function ensureCorrectNetwork() {
  try {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask n'est pas installé");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (network.chainId !== USE_CHAIN_ID) {
      const userConfirm = confirm(
        `Vous devez être connecté au réseau Amoy pour utiliser cette application. Changer de réseau ?`
      );

      if (userConfirm) {
        await switchToCorrectNetwork();
        // Vérifier à nouveau après le changement
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        const newNetwork = await newProvider.getNetwork();

        if (newNetwork.chainId !== USE_CHAIN_ID) {
          throw new Error("Échec du changement de réseau");
        }
        window.location.reload();
      } else {
        throw new Error("Réseau Amoy requis");
      }
    }

    return true;
  } catch (error) {
    console.error("Erreur réseau:", error);
    return false;
  }
}
