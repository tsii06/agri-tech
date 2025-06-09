import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import { UserProvider } from './context/useContextt';
import { ethers } from "ethers";


import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import Footer from "./components/Layout/Footer";
import HomePage from "./pages/HomePage";

import ListeProduits from "./pages/CollecteurProducteur/ListeProduits";
import PasserCommande from "./pages/CollecteurExportateur/PasserCommandeVersCollecteur";
import EffectuerPaiement from "./pages/CollecteurExportateur/EffectuerPaiementCollecteur";
import LivraisonRecolte from "./pages/CollecteurProducteur/LivraisonRecolte";
import CommandeCollecteur from "./pages/CollecteurProducteur/CommandeCollecteur";
import CreerParcelle from "./pages/ProducteurEnPhaseCulture/CreerParcelle";
import MesParcelles from "./pages/ProducteurEnPhaseCulture/ListeParcelle";
import PhotosParcelle from "./pages/ProducteurEnPhaseCulture/PhotosParcelle";
import IntrantsParcelle from "./pages/ProducteurEnPhaseCulture/IntrantsParcelle";
import InspectionsParcelle from "./pages/CertificateurAuditeur/InspectionsParcelle";
import FaireRecolte from "./pages/ProducteurEnPhaseCulture/FaireRecolte";
import ListeRecoltes from "./pages/ProducteurEnPhaseCulture/ListeRecolte";
import CommandeExportateur from "./pages/CollecteurExportateur/CommandeExportateur";
import AcheterRecolte from "./pages/CollecteurProducteur/AcheterRecolte";
import MesCommandesExportateur from "./pages/CollecteurExportateur/MesCommandesExportateur";
import AdminRegisterActeur from "./pages/admin/AdminRegisterActeur";
import AdminAjoutContratDelegue from "./pages/admin/AdminAjoutContratDelegue";
import AdminListeActeurs from "./pages/admin/AdminListeActeurs";
import ListeActeursRole from "./pages/ListeActeursRole";
import ActiverDesactiverActeur from "./pages/Admin/ActiverDesactiverActeur";
import RetirerContratDelegue from "./pages/RetirerContratDelegue";

import {
  ShieldCheck, TreePine, ShoppingBasket, Package,
  ShoppingCart, Search, Users, Truck, Home as HomeIcon, ChevronRight
} from "lucide-react";

function App() {
  const [state, setState] = useState({});
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UserProvider state={state}>
      <Router>
        <AppLayout
          state={state}
          setState={setState}
          account={account}
          setAccount={setAccount}
          role={role}
          setRole={setRole}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </Router>
    </UserProvider>
  );
}

function AppLayout({ state, setState, account, setAccount, role, setRole, sidebarOpen, setSidebarOpen }) {
  const location = useLocation();

  const getNavigationLinks = () => {
    if (!account) return [];
    const commonLinks = [{ to: "/mes-parcelles", text: "Parcelles" }];
    const adminLink = { to: "/admin", text: "Admin" };

    switch (role) {
      case 0:
        return [
          { to: "/mes-parcelles", text: "Mes Parcelles" },
          { to: "/creer-parcelle", text: "Nouvelle Parcelle" },
          { to: "/liste-recolte", text: "Mes récoltes" },
          adminLink
        ];
      case 1:
        return [{ to: "/mes-parcelles", text: "Gérer les Intrants" }, adminLink];
      case 2:
        return [
          { to: "/mes-parcelles", text: "Contrôle Phytosanitaire Parcelle" },
          { to: "/liste-recolte", text: "Contrôle Phytosanitaire Recolte" },
          adminLink
        ];
      case 3:
        return [
          { to: "/liste-recolte", text: "Passer commande" },
          { to: "/liste-collecteur-commande", text: "Mes commandes" },
          { to: "/liste-produits", text: "Liste des produits" },
          { to: "/liste-acteurs-role", text: "Liste des Producteurs" },
          ...commonLinks,
          adminLink
        ];
      case 4:
        return [{ to: "/mes-parcelles", text: "Inspections" }, adminLink];
      case 5:
        return [{ to: "/transport", text: "Gestion des transports" }, adminLink];
      case 6:
        return [
          ...commonLinks,
          { to: "/mes-commandes-exportateur", text: "Mes commandes" },
          { to: "/passer-commande-collecteur", text: "Passer commande" },
          { to: "/liste-acteurs-role", text: "Liste des Collecteurs" },
          { to: "/liste-produits", text: "Liste des produits" },
          adminLink
        ];
      default:
        return [...commonLinks, adminLink];
    }
  };

  const getLinkIcon = (text) => {
    const t = text.toLowerCase();
    if (t.includes("admin")) return <ShieldCheck size={18} />;
    if (t.includes("parcelle")) return <TreePine size={18} />;
    if (t.includes("récolte") || t.includes("recolte")) return <ShoppingBasket size={18} />;
    if (t.includes("produit")) return <Package size={18} />;
    if (t.includes("commande")) return <ShoppingCart size={18} />;
    if (t.includes("inspection")) return <Search size={18} />;
    if (t.includes("collecteur")) return <Users size={18} />;
    if (t.includes("exportateur")) return <Truck size={18} />;
    if (t.includes("accueil") || t.includes("home")) return <HomeIcon size={18} />;
    return <ChevronRight size={18} />;
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccount(userAddress);
        // Appeler ici la logique de récupération du rôle si besoin
      } catch (error) {
        alert("Erreur lors de la connexion au wallet");
      }
    } else {
      alert("Installe Metamask !");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header state={state} setState={setState} setAccount={setAccount} setRole={setRole} />
      
      <div className="flex-grow-1">
        {location.pathname === "/" ? (
          <Routes>
            <Route path="/" element={<HomePage account={account} onConnectWallet={connectWallet} />} />
          </Routes>
        ) : (
          <div className="row">
            {/* Sidebar à gauche */}
            <div className="col-md-3 col-lg-2 bg-light border-end p-0">
              <Sidebar
                account={account}
                role={role}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                getNavigationLinks={getNavigationLinks}
                getLinkIcon={getLinkIcon}
              />
            </div>

            {/* Main content */}
            <div className="col-md-9 col-lg-10 py-3">
              <Routes>
                <Route path="liste-produits" element={<ListeProduits />} />
                <Route path="liste-collecteur-commande" element={<CommandeCollecteur />} />
                <Route path="passer-commande-collecteur/:id" element={<PasserCommande />} />
                <Route path="effectuer-paiement/:id" element={<EffectuerPaiement />} />
                <Route path="mettre-a-jour-transport/:id" element={<LivraisonRecolte />} />
                <Route path="creer-parcelle" element={<CreerParcelle />} />
                <Route path="mes-parcelles" element={<MesParcelles />} />
                <Route path="parcelle/:id/photos" element={<PhotosParcelle />} />
                <Route path="parcelle/:id/intrants" element={<IntrantsParcelle />} />
                <Route path="parcelle/:id/inspections" element={<InspectionsParcelle />} />
                <Route path="parcelle/:id/faire-recolte" element={<FaireRecolte />} />
                <Route path="liste-recolte" element={<ListeRecoltes />} />
                <Route path="producteur/:address/recoltes/acheter" element={<AcheterRecolte />} />
                <Route path="passer-commande-collecteur" element={<CommandeExportateur />} />
                <Route path="mes-commandes-exportateur" element={<MesCommandesExportateur />} />
                <Route path="admin" element={<AdminHome />} />
                <Route path="admin/enregistrer-acteur" element={<AdminRegisterActeur />} />
                <Route path="admin/ajouter-contrat-delegue" element={<AdminAjoutContratDelegue />} />
                <Route path="admin/liste-acteurs" element={<AdminListeActeurs />} />
                <Route path="liste-acteurs-role" element={<ListeActeursRole />} />
                <Route path="listerecolte/:address" element={<ListeRecoltes />} />
                <Route path="listeproduit/:address" element={<ListeProduits />} />
                <Route path="transport" element={<LivraisonRecolte />} />
                <Route path="admin/activer-desactiver-acteur" element={<ActiverDesactiverActeur />} />
                <Route path="retirer-contrat-delegue" element={<RetirerContratDelegue />} />
              </Routes>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}


function AdminHome() {
  return (
    <div className="container mt-4">
      <h2>Espace Administration</h2>
      <ul>
        <li><a href="/admin/enregistrer-acteur">Enregistrer un acteur</a></li>
        <li><a href="/admin/ajouter-contrat-delegue">Ajouter un contrat délégué</a></li>
        <li><a href="/admin/liste-acteurs">Liste des acteurs</a></li>
        <li><a href="/admin/activer-desactiver-acteur">Activer / Désactiver un acteur</a></li>
        <li><a href="/retirer-contrat-delegue">Retirer un contrat délégué</a></li>
      </ul>
    </div>
  );
}

export default App;
