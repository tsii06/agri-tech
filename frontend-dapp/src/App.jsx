import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Link } from "react-router-dom";
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
import AcheterRecolte from "./pages/CollecteurProducteur/AcheterRecolte";
import MesCommandesExportateur from "./pages/CollecteurExportateur/MesCommandesExportateur";
import AdminRegisterActeur from "./pages/admin/AdminRegisterActeur";
import AdminAjoutContratDelegue from "./pages/admin/AdminAjoutContratDelegue";
import AdminListeActeurs from "./pages/admin/AdminListeActeurs";
import ListeActeursRole from "./pages/ListeActeursRole";
import ActiverDesactiverActeur from "./pages/admin/ActiverDesactiverActeur";
import RetirerContratDelegue from "./pages/RetirerContratDelegue";
import AjouterRoleActeur from "./pages/admin/AjouterRoleActeur";
import Dashboard from "./pages/Dashboard";
import EspaceClient from "./pages/EspaceClient";

import {
  ShieldCheck, TreePine, ShoppingBasket, Package,
  ShoppingCart, Search, Users, Truck, Home as HomeIcon, ChevronRight
} from "lucide-react";
import { getGestionnaireActeursContract } from "./utils/contract";

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
          console.error("Erreurs lors de l'initialisation des roles de l'user : ", e);
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

function AppLayout({ state, setState, account, setAccount, setRole, sidebarOpen, setSidebarOpen, roles }) {
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
        alert("Erreur lors de la connexion au wallet : ", error);
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
                <Route path="/espace-client" element={<EspaceClient />} />
                <Route path="admin" element={<AdminHome />} />
                <Route path="admin/enregistrer-acteur" element={<AdminRegisterActeur />} />
                <Route path="admin/ajouter-contrat-delegue" element={<AdminAjoutContratDelegue />} />
                <Route path="admin/liste-acteurs" element={<AdminListeActeurs />} />
                <Route path="admin/activer-desactiver-acteur" element={<ActiverDesactiverActeur />} />
                <Route path="admin/ajouter-role-acteur" element={<AjouterRoleActeur />} />
                <Route path="creer-parcelle" element={<CreerParcelle />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="effectuer-paiement/:id" element={<EffectuerPaiement />} />
                <Route path="liste-produits" element={<ListeProduits />} />
                <Route path="liste-collecteur-commande" element={<CommandeCollecteur />} />
                <Route path="listerecolte/:address" element={<ListeRecoltes />} />
                <Route path="listeproduit/:address" element={<ListeProduits />} />
                <Route path="liste-acteurs-role" element={<ListeActeursRole />} />
                <Route path="liste-recolte" element={<ListeRecoltes />} />
                <Route path="mettre-a-jour-transport/:id" element={<LivraisonRecolte />} />
                <Route path="mes-parcelles" element={<MesParcelles />} />
                <Route path="mes-commandes-exportateur" element={<MesCommandesExportateur />} />
                <Route path="passer-commande-collecteur/:id" element={<PasserCommande />} />
                <Route path="parcelle/:id/photos" element={<PhotosParcelle />} />
                <Route path="parcelle/:id/intrants" element={<IntrantsParcelle />} />
                <Route path="parcelle/:id/inspections" element={<InspectionsParcelle />} />
                <Route path="parcelle/:id/faire-recolte" element={<FaireRecolte />} />
                <Route path="producteur/:address/recoltes/acheter" element={<AcheterRecolte />} />
                <Route path="retirer-contrat-delegue" element={<RetirerContratDelegue />} />
                <Route path="transport" element={<LivraisonRecolte />} />
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
        <li><Link to="/admin/enregistrer-acteur">Enregistrer un acteur</Link></li>
        <li><Link to="/admin/ajouter-contrat-delegue">Ajouter un contrat délégué</Link></li>
        <li><Link to="/admin/liste-acteurs">Liste des acteurs</Link></li>
        <li><Link to="/admin/activer-desactiver-acteur">Activer / Désactiver un acteur</Link></li>
        <li><Link to="/retirer-contrat-delegue">Retirer un contrat délégué</Link></li>
        <li><Link to="/admin/ajouter-role-acteur">Ajouter un rôle à un acteur</Link></li>
      </ul>
    </div>
  );
}

export default App;
