import { ethers } from "ethers";

// RpcProvider avec retry automatique
export function createRpcProvider(rpcUrl, maxRetries = 3) {
  const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
    staticNetwork: true, // optimisation
    batchMaxCount: 1, // évite les batches qui peuvent fail
  });

  // Wrapper pour auto-retry
  const originalSend = provider.send.bind(provider);
  provider.send = async (method, params) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await originalSend(method, params);
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        // Retry seulement sur erreurs réseau
        if (error.code === "NETWORK_ERROR" || error.code === "TIMEOUT") {
          await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // backoff
          continue;
        }
        throw error; // Pas de retry sur autres erreurs
      }
    }
  };

  return provider;
}

export class ReconnectingWebSocketProvider {
  constructor(wsUrl, options = {}) {
    this.wsUrl = wsUrl;
    this.maxRetries = options.maxRetries || Infinity;
    this.retryDelay = options.retryDelay || 3000;
    this.provider = null;
    this.isManualClose = false;
    this.reconnectAttempts = 0;

    this._connect();
  }

  _connect() {
    this.provider = new ethers.WebSocketProvider(this.wsUrl);

    // Événements de connexion
    this.provider.websocket.addEventListener("open", () => {
      console.log("WebSocket connecté");
      this.provider.getNetwork().then((net) => {
        console.log(
          "WebSocket Provider connecter au reseau : ",
          net.name,
          net.chainId
        );
      });
      this.reconnectAttempts = 0;
    });

    this.provider.websocket.addEventListener("close", (code) => {
      console.log(`WebSocket fermé (code: ${code})`);

      // Ne pas reconnecter si fermeture manuelle
      if (this.isManualClose) return;

      // Reconnecter
      if (this.reconnectAttempts < this.maxRetries) {
        this.reconnectAttempts++;
        console.log(
          `Reconnexion ${this.reconnectAttempts}/${this.maxRetries}...`
        );

        setTimeout(() => {
          this._connect();
        }, this.retryDelay * this.reconnectAttempts); // backoff exponentiel
      } else {
        console.error("Max reconnexions atteint");
      }
    });

    this.provider.websocket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error.message);
    });
  }

  // Méthodes proxy
  async getBlockNumber() {
    return this.provider.getBlockNumber();
  }

  async getBalance(address) {
    return this.provider.getBalance(address);
  }

  on(event, listener) {
    return this.provider.on(event, listener);
  }

  off(event, listener) {
    return this.provider.off(event, listener);
  }

  // Fermeture propre
  destroy() {
    this.isManualClose = true;
    this.provider.destroy();
  }

  // Accès direct au provider pour Contract
  getProvider() {
    return this.provider;
  }
}

// Contract avec gestion complète
export class SmartContractManager {
  constructor(address, abi, signerOrProvider) {
    this.address = address;
    this.abi = abi;
    this.contract = new ethers.Contract(address, abi, signerOrProvider);
  }

  // Lecture avec retry
  async read(methodName, ...args) {
    try {
      return await this.contract[methodName](...args);
    } catch (error) {
      throw this._handleError(error, "read", methodName);
    }
  }

  // Écriture avec gestion complète
  async write(methodName, args = [], options = {}) {
    try {
      // Estimation du gas
      const gasEstimate = await this.contract[methodName].estimateGas(
        ...args,
        options
      );

      // +20% de marge
      const gasLimit = (gasEstimate * 120n) / 100n;

      // Envoi
      const tx = await this.contract[methodName](...args, {
        ...options,
        gasLimit,
      });

      console.log(`TX envoyée: ${tx.hash}`);

      // Attendre confirmation
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      return { ...receipt, hash: tx.hash };
    } catch (error) {
      throw this._handleError(error, "write", methodName);
    }
  }

  // Gestion centralisée des erreurs
  _handleError(error, type, methodName) {
    // Erreurs du contrat (revert)
    if (error.code === "CALL_EXCEPTION") {
      return new Error(
        `Contract revert: ${methodName}\n` +
          `Reason: ${error.reason || "Unknown"}\n` +
          `Data: ${error.data}`
      );
    }

    // Gas insuffisant
    if (error.code === "INSUFFICIENT_FUNDS") {
      return new Error(`Pas assez d'ETH pour payer le gas`);
    }

    // User rejection
    if (error.code === "ACTION_REJECTED") {
      return new Error("Transaction rejetée par l'utilisateur");
    }

    // Nonce trop bas
    if (error.code === "NONCE_EXPIRED") {
      return new Error("Nonce expiré, retry");
    }

    // Timeout
    if (error.code === "TIMEOUT") {
      return new Error(`Timeout sur ${methodName}`);
    }

    // Network
    if (error.code === "NETWORK_ERROR") {
      return new Error(`Erreur réseau: ${error.message}`);
    }

    // Défaut
    return new Error(`Erreur ${type}: ${error.message}`);
  }
}
