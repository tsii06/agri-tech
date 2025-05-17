import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress);
      } catch (error) {
        console.error("Erreur lors de la connexion au wallet:", error);
        setAccount(null);
        setRole(null);
        setIsLoading(false);
      }
    } else {
      alert("Installe Metamask !");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      // Vérifier si déjà connecté
      window.ethereum.request({ method: "eth_accounts" })
        .then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            setIsLoading(false);
          }
        });

      // Écouter les changements de compte
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          setRole(null);
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  return {
    account,
    role,
    isLoading,
    connectWallet,
  };
} 