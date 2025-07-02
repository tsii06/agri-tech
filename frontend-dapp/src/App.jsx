import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
import AjouterRoleActeur from "./pages/Admin/AjouterRoleActeur";
import Dashboard from "./pages/Dashboard";

import {
  ShieldCheck, TreePine, ShoppingBasket, Package,
  ShoppingCart, Search, Users, Truck, Home as HomeIcon, ChevronRight
} from "lucide-react";
import { getGestionnaireActeursContract } from "./utils/contract";
import { useUserContext } from './context/useContextt';

function App() {
  const [state, setState] = useState({});
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      if (account) {
        try {
          const contract = await getGestionnaireActeursContract();
          const rolesArray = await contract.getRoles(account);
          setRoles(rolesArray.map(r => Number(r)));
        } catch (e) {
          setRoles([]);
        }
      } else {
        setRoles([]);
      }
    };
    fetchRoles();
  }, [account]);

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
          roles={roles}
        />
      </Router>
    </UserProvider>
  );
}

function AppLayout({ state, setState, account, setAccount, role, setRole, sidebarOpen, setSidebarOpen, roles }) {
  const location = useLocation();
  const navigate = useNavigate();
  const prevAccount = useRef();

  useEffect(() => {
    // Redirige uniquement si le compte a changé (pas à chaque navigation)
    if (account && prevAccount.current && account !== prevAccount.current && location.pathname !== '/') {
      navigate('/');
    }
    prevAccount.current = account;
  }, [account, navigate, location.pathname]);

  const getNavigationLinks = () => {
    if (!account || !roles.length) return [];
    const linksSet = new Set();
    const links = [];
    roles.forEach(role => {
      let roleLinks = [];
      switch (role) {
        case 0:
          roleLinks = [
            { to: "/mes-parcelles", text: "Mes Parcelles" },
            { to: "/creer-parcelle", text: "Nouvelle Parcelle" },
            { to: "/liste-recolte", text: "Mes récoltes" }
          ]; break;
        case 1:
          roleLinks = [{ to: "/mes-parcelles", text: "Gérer les Intrants" }]; break;
        case 2:
          roleLinks = [
            { to: "/mes-parcelles", text: "Validation des intrants" },
            { to: "/liste-recolte", text: "Contrôle Phytosanitaire Recolte" }
          ]; break;
        case 3:
          roleLinks = [
            { to: "/liste-recolte", text: "Passer commande" },
            { to: "/liste-collecteur-commande", text: "Mes commandes" },
            { to: "/liste-produits", text: "Liste des produits" },
            { to: "/liste-acteurs-role", text: "Liste des Producteurs" }
          ]; break;
        case 4:
          roleLinks = [{ to: "/mes-parcelles", text: "Inspections" }]; break;
        case 5:
          roleLinks = [{ to: "/transport", text: "Gestion des transports" }]; break;
        case 6:
          roleLinks = [
            { to: "/mes-parcelles", text: "Parcelles" },
            { to: "/mes-commandes-exportateur", text: "Mes commandes" },
            { to: "/passer-commande-collecteur", text: "Passer commande" },
            { to: "/liste-acteurs-role", text: "Liste des Collecteurs" },
            { to: "/liste-produits", text: "Liste des produits" }
          ]; break;
        default: break;
      }
      roleLinks.forEach(link => {
        const key = link.to + link.text;
        if (!linksSet.has(key)) {
          linksSet.add(key);
          links.push(link);
        }
      });
    });
    if (roles.includes(7)) {
      links.push({ to: "/admin", text: "Admin" });
    }
    return links;
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
                roles={roles || []}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                getLinkIcon={getLinkIcon}
              />
            </div>

            {/* Main content */}
            <div className="col-md-9 col-lg-10 py-3">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
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
                <Route path="admin/ajouter-role-acteur" element={<AjouterRoleActeur />} />
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
        <li><a href="/admin/ajouter-role-acteur">Ajouter un rôle à un acteur</a></li>
      </ul>
    </div>
  );
}

export default App;
