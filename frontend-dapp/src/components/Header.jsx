import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { Link } from "react-router-dom";
import { Home, LogOut, UserPlus, Wallet, Menu } from "lucide-react";
import { Outlet } from "react-router-dom";

function Header({ state }) {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div class="container-fluid vh-100 d-flex flex-column">
    <div class="row flex-grow-1">

        <nav class="col-md-3 col-lg-2 d-md-block bg-light sidebar py-4 shadow-sm">
            <div class="position-sticky">
                <a href="/" class="d-flex align-items-center mb-3 text-dark fw-bold fs-5 text-decoration-none px-3">
                    Mon Projet
                </a>
                <ul class="nav flex-column px-3">
                    {getNavigationLinks().map((link) => (
                        <li class="nav-item">
                            <a href={link.to} key={link.to} class="nav-link text-dark py-2 rounded">
                                {link.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>


        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 d-flex flex-column">

            <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3 px-4 d-flex justify-content-between">
                <div>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                </div>
                <div class="collapse navbar-collapse" id="navbarNav">
                    {account ? (
                        <div class="d-flex align-items-center gap-3">
                            <span class="badge bg-success text-white px-3 py-1">
                                {getRoleName(role)}
                            </span>
                            <span class="fw-medium text-muted">
                                {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                            </span>
                            <div class={`status-indicator bg-${role !== null ? "success" : "danger"}`}></div>
                            <button onClick={changerCompte} class="btn btn-outline-primary btn-sm">
                                Changer
                            </button>
                            <a href="/ajout-acteur" class="btn btn-sm btn-outline-secondary d-flex align-items-center">
                                <i class="bi bi-person-plus me-1"></i> Nouvel acteur
                            </a>
                            <button onClick={deconnecterWallet} class="btn btn-sm btn-outline-danger d-flex align-items-center">
                                <i class="bi bi-box-arrow-right me-1"></i> Déconnecter
                            </button>
                        </div>
                    ) : (
                        <button onClick={connectWallet} class="btn btn-primary d-flex align-items-center">
                            <i class="bi bi-wallet me-2"></i> Connecter Wallet
                        </button>
                    )}
                </div>
            </nav>

            <div class="flex-grow-1 p-4">
                <h1 class="h4">Bienvenue sur votre tableau de bord</h1>
                <p>Gérez vos projets et vos interactions ici.</p>
                <Outlet />
            </div>
        </main>
    </div>
</div>

  );
}

export default Header;