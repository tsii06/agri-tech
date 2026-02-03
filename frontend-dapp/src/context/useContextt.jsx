/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { ensureCorrectNetwork, USE_CHAIN_ID } from "../utils/wallet";
import { gestionnaireActeursRead } from "../config/onChain/frontContracts";

const UserContext = createContext();

export const UserProvider = ({ children, state }) => {
  const [roles, setRoles] = useState([]);
  const [isActeur, setIsActeur] = useState(false);
  const [account, setAccount] = useState(
    () => localStorage.getItem("madtx_user_address") || ""
  );
  const [loadingUserAddr, setLoadingUserAddr] = useState(true);

  const verifeActeur = async (userAddress) => {
    try {
      const rolesArray = await gestionnaireActeursRead.read("getRoles", userAddress.toString());

      // verifie que l'user est un acteur
      if (rolesArray.length <= 0) setIsActeur(false);
      else setIsActeur(true);

      setRoles(rolesArray.map((r) => Number(r)));
    } catch (error) {
      console.error("Erreur lors de la vérification des rôles :", error);
      setRoles([]);
      setIsActeur(false);
    }
  };

  useEffect(() => {
    const checkAccount = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            // Vérifier et assurer la connexion à Amoy
            const isConnectedToAmoy = await ensureCorrectNetwork();

            if (!isConnectedToAmoy) {
              alert("Veuillez vous connecter au réseau Amoy pour continuer.");
              return;
            }
            // sauvegarder dans le storage
            localStorage.setItem("madtx_user_address", accounts[0]);
            setAccount(accounts[0]);
            await verifeActeur(accounts[0]);
          }
        }
      } catch (err) {
        console.error(
          "Erreur lors de l'initialisation dans UserProvider : ",
          err
        );
      } finally {
        setLoadingUserAddr(false);
      }
    };

    checkAccount();
  }, [state]);

  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (chainId) => {
        if (chainId !== USE_CHAIN_ID) {
          alert("Veuillez vous connecter au réseau Amoy.");
          // Optionnel: recharger la page
          // window.location.reload();
        }
      };

      window.ethereum.on("chainChanged", handleChainChanged);

      // Nettoyage de l'écouteur d'événements lors du démontage
      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  if ((isActeur && roles.length <= 0) || loadingUserAddr)
    return (
      <div className="container-fluid d-flex justify-content-center pt-5">
        <div className="spinner-border"></div> &nbsp; Chargement...
      </div>
    );

  return (
    <UserContext.Provider value={{ roles, setRoles, account, verifeActeur }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  return useContext(UserContext);
};
