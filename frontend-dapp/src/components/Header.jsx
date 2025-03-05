import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { Link } from "react-router-dom";

function Header() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAccount(userAddress);
      await verifierActeur(userAddress);
    } else {
      alert("Installe Metamask !");
    }
  };

  const deconnecterWallet = () => {
    setAccount(null);
    setRole(null);
  };

  const verifierActeur = async (userAddress) => {
    try {
      const contract = await getContract();
      const acteur = await contract.getActeur(userAddress);
      
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
      0: "COLLECTEUR",
      1: "EXPORTATEUR",
      2: "TRANSPORTEUR"
    };
    return roles[roleNumber] || "INCONNU";
  };

  useEffect(() => {
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
    }
  }, []);

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
      case 0: // Collecteur
        return [
          { to: "/ajout-produit", text: "Ajouter Produit" },
          ...commonLinks
        ];
      case 1: // Exportateur
        return [
          ...commonLinks,
          { to: "/mes-commandes", text: "Mes Commandes" }
        ];
      case 2: // Transporteur
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
                <Link
                  to="/ajout-acteur"
                  className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
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