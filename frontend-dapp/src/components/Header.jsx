import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { Link } from "react-router-dom";

function Header({ state }) {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);

  const verifierConnexionInitiale = async () => {
    if (window.ethereum) {
      try {
        // Vérifier si des comptes sont déjà connectés
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await verifierActeur(accounts[0]);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la connexion initiale:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Demander à l'utilisateur de choisir un compte
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress);
        await verifierActeur(userAddress);
      } catch (error) {
        console.error("Erreur de connexion:", error);
        alert("Erreur lors de la connexion au wallet");
      }
    } else {
      alert("Installe Metamask !");
    }
  };

  const changerCompte = async () => {
    if (window.ethereum) {
      try {
        // Forcer l'ouverture de MetaMask pour sélectionner un compte
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        
        // Récupérer le nouveau compte sélectionné
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts[0]) {
          setAccount(accounts[0]);
          await verifierActeur(accounts[0]);
        }
      } catch (error) {
        console.error("Erreur lors du changement de compte:", error);
        alert("Erreur lors du changement de compte");
      }
    }
  };

  const deconnecterWallet = () => {
    setAccount(null);
    setRole(null);
  };

  const verifierActeur = async (userAddress) => {
    try {
      const contract = await getContract();
      const acteur = await contract.acteurs(userAddress);
      
      if (acteur.addr !== ethers.ZeroAddress) {
        const roleNumber = Number(acteur.role);
        setRole(roleNumber);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'acteur :", error);
    }
  };

  const getRoleName = (roleNumber) => {
    const roles = {
      0: "PRODUCTEUR",
      1: "FOURNISSEUR",
      2: "CERTIFICATEUR",
      3: "COLLECTEUR",
      4: "AUDITEUR",
      5: "TRANSPORTEUR"
    };
    return roles[roleNumber] || "INCONNU";
  };

  useEffect(() => {
    // Vérifier la connexion initiale au chargement de la page
    verifierConnexionInitiale();

    // Écouter les changements de compte
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          verifierActeur(accounts[0]);
        } else {
          setAccount(null);
          setRole(null);
        }
      });

      // Écouter les changements de chaîne
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    // Nettoyage des listeners lors du démontage du composant
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
  }, [state]);

  const getNavigationLinks = () => {
    if (!account) return [];

    const commonLinks = [
      { to: "/liste-produits", text: "Liste des Produits" }
    ];

    if (role === null) {
      return [
        { to: "/ajout-acteur", text: "S'enregistrer" },
        ...commonLinks
      ];
    }

    switch (role) {
      case 0: // Producteur
        return [
          { to: "/mes-parcelles", text: "Mes Parcelles" },
          { to: "/creer-parcelle", text: "Nouvelle Parcelle" },
          ...commonLinks
        ];
      case 1: // Fournisseur
        return [
          ...commonLinks,
          { to: "/mes-parcelles", text: "Gérer les Intrants" }
        ];
      case 2: // Certificateur
        return [
          ...commonLinks,
          { to: "/mes-parcelles", text: "Contrôle Phytosanitaire" }
        ];
      case 3: // Collecteur
        return [
          { to: "/ajout-produit", text: "Ajouter Produit" },
          ...commonLinks
        ];
      case 4: // Auditeur
        return [
          ...commonLinks,
          { to: "/mes-parcelles", text: "Inspections" }
        ];
      case 5: // Transporteur
        return [
          ...commonLinks,
          { to: "/conditions-transport", text: "Conditions Transport" }
        ];
      default:
        return commonLinks;
    }
  };

  return (
    <div className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gray-900">
              <Link to="/">DApp Collecteur Exportateur</Link>
            </h1>
            <nav className="flex space-x-4">
              {getNavigationLinks().map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {link.text}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {account ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {getRoleName(role)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {`${account.substring(0, 6)}...${account.substring(
                      account.length - 4
                    )}`}
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      role !== null ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                </div>
                <button
                  onClick={changerCompte}
                  className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Changer de compte
                </button>
                <Link
                  to="/ajout-acteur"
                  className="px-4 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Nouvel acteur
                </Link>
                <button
                  onClick={deconnecterWallet}
                  className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Déconnecter
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connecter Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header; 