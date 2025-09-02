import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { UserProvider } from "./context/useContextt";
import { ethers } from "ethers";

import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import Footer from "./components/Layout/Footer";
import HomePage from "./pages/HomePage";

import AcheterRecolte from "./pages/CollecteurProducteur/AcheterRecolte";
import AdminRegisterActeur from "./pages/admin/AdminRegisterActeur";
import AjouterRoleActeur from "./pages/admin/AjouterRoleActeur";
import AdminAjoutContratDelegue from "./pages/admin/AdminAjoutContratDelegue";
import AdminListeActeurs from "./pages/admin/AdminListeActeurs";
import ActiverDesactiverActeur from "./pages/admin/ActiverDesactiverActeur";
import CommandeCollecteur from "./pages/CollecteurProducteur/CommandeCollecteur";
import CreerParcelle from "./pages/ProducteurEnPhaseCulture/CreerParcelle";
import Dashboard from "./pages/Dashboard";
import EffectuerPaiement from "./pages/CollecteurExportateur/EffectuerPaiementCollecteur";
import FaireRecolte from "./pages/ProducteurEnPhaseCulture/FaireRecolte";
import IntrantsParcelle from "./pages/ProducteurEnPhaseCulture/IntrantsParcelle";
import InspectionsParcelle from "./pages/ProducteurEnPhaseCulture/InspectionsParcelle";
import ListeProduits from "./pages/CollecteurProducteur/ListeProduits";
import ListeLotProduits from "./pages/CollecteurExportateur/ListeLotProduit";
import LivraisonRecolte from "./pages/CollecteurProducteur/LivraisonRecolte";
import ListeActeursRole from "./pages/ListeActeursRole";
import ListeRecoltes from "./pages/ProducteurEnPhaseCulture/ListeRecolte";
import MesParcelles from "./pages/ProducteurEnPhaseCulture/ListeParcelle";
import MesCommandesExportateur from "./pages/CollecteurExportateur/MesCommandesExportateur";
import PasserCommande from "./pages/CollecteurExportateur/PasserCommandeVersCollecteur";
import PhotosParcelle from "./pages/ProducteurEnPhaseCulture/PhotosParcelle";
import RetirerContratDelegue from "./pages/RetirerContratDelegue";
import StockDetails from "./pages/CollecteurExportateur/StockDetails";

import {
  ShieldCheck,
  TreePine,
  ShoppingBasket,
  Package,
  ShoppingCart,
  Search,
  Users,
  Truck,
  Home as HomeIcon,
  ChevronRight,
  Group,
  Box,
} from "lucide-react";
import { getGestionnaireActeursContract } from "./utils/contract";
import StockExportateur from "./pages/exportateur/Stock";
import ListeExpeditions from "./pages/Exportateur/ListeExpeditions";
import CertifierExpeditions from "./pages/CertificateurAuditeur/CertifierExpeditions";
import ProduitDetails from "./pages/EspaceClient/ProduitDetails";
import EspaceClient from "./pages/client/EspaceClient";
import DetailsExpedition from "./pages/exportateur/DetailsExpedition";

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
          setRoles(rolesArray.map((r) => Number(r)));
        } catch (e) {
          console.error(
            "Erreurs lors de l'initialisation des roles de l'user : ",
            e
          );
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

function AppLayout({
  state,
  setState,
  account,
  setAccount,
  setRole,
  sidebarOpen,
  setSidebarOpen,
  roles,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const prevAccount = useRef();

  useEffect(() => {
    // Redirige uniquement si le compte a changé (pas à chaque navigation)
    if (
      account &&
      prevAccount.current &&
      account !== prevAccount.current &&
      location.pathname !== "/"
    ) {
      navigate("/");
    }
    prevAccount.current = account;
  }, [account, navigate, location.pathname]);

  const getLinkIcon = (text) => {
    const t = text.toLowerCase();
    if (t.includes("admin")) return <ShieldCheck size={18} />;
    if (t.includes("parcelle")) return <TreePine size={18} />;
    if (t.includes("récolte") || t.includes("recolte"))
      return <ShoppingBasket size={18} />;
    if (t.includes("lots")) return <Group size={18} />;
    if (t.includes("produit")) return <Package size={18} />;
    if (t.includes("commande")) return <ShoppingCart size={18} />;
    if (t.includes("inspection")) return <Search size={18} />;
    if (t.includes("collecteur")) return <Users size={18} />;
    if (t.includes("exportateur")) return <Truck size={18} />;
    if (t.includes("accueil") || t.includes("home"))
      return <HomeIcon size={18} />;
    if (t.includes("stock")) return <Box size={18} />;
    return <ChevronRight size={18} />;
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
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
      <Header
        state={state}
        setState={setState}
        setAccount={setAccount}
        setRole={setRole}
      />

      <div className="flex-grow-1">
        {location.pathname === "/" || location.pathname.includes("client") ? (
          <Routes>
            <Route
              path="/"
              element={
                <HomePage account={account} onConnectWallet={connectWallet} />
              }
            />
            <Route path="/espace-client" element={<EspaceClient />} />
            <Route path="/client-detail-expedition/:reference" element={<DetailsExpedition />} />
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
                <Route path="admin" element={<AdminHome />} />
                <Route
                  path="admin/enregistrer-acteur"
                  element={<AdminRegisterActeur />}
                />
                <Route
                  path="admin/ajouter-contrat-delegue"
                  element={<AdminAjoutContratDelegue />}
                />
                <Route
                  path="admin/liste-acteurs"
                  element={<AdminListeActeurs />}
                />
                <Route
                  path="admin/activer-desactiver-acteur"
                  element={<ActiverDesactiverActeur />}
                />
                <Route
                  path="admin/ajouter-role-acteur"
                  element={<AjouterRoleActeur />}
                />
                <Route path="creer-parcelle" element={<CreerParcelle />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="effectuer-paiement/:id"
                  element={<EffectuerPaiement />}
                />
                <Route path="liste-produits" element={<ListeProduits />} />
                <Route
                  path="liste-lot-produits"
                  element={<ListeLotProduits />}
                />
                <Route
                  path="liste-collecteur-commande"
                  element={<CommandeCollecteur />}
                />
                <Route
                  path="listerecolte/:address"
                  element={<ListeRecoltes />}
                />
                <Route
                  path="listeproduit/:address"
                  element={<ListeProduits />}
                />
                <Route
                  path="liste-acteurs-role"
                  element={<ListeActeursRole />}
                />
                <Route
                  path="liste-transporteur-commande-recolte/:role/:idCommandeRecolte"
                  element={<ListeActeursRole />}
                />
                <Route
                  path="liste-transporteur-commande-produit/:role/:idCommandeProduit"
                  element={<ListeActeursRole />}
                />
                <Route path="liste-recolte" element={<ListeRecoltes />} />
                <Route
                  path="mettre-a-jour-transport/:id"
                  element={<LivraisonRecolte />}
                />
                <Route path="mes-parcelles" element={<MesParcelles />} />
                <Route
                  path="mes-commandes-exportateur"
                  element={<MesCommandesExportateur />}
                />
                <Route path="stock" element={<MesCommandesExportateur />} />
                <Route path="stock/:id" element={<StockDetails />} />
                <Route
                  path="passer-commande-collecteur/:id"
                  element={<PasserCommande />}
                />
                <Route
                  path="parcelle/:id/photos"
                  element={<PhotosParcelle />}
                />
                <Route
                  path="parcelle/:id/intrants"
                  element={<IntrantsParcelle />}
                />
                <Route
                  path="parcelle/:id/inspections"
                  element={<InspectionsParcelle />}
                />
                <Route
                  path="parcelle/:id/faire-recolte"
                  element={<FaireRecolte />}
                />
                <Route
                  path="producteur/:address/recoltes/acheter"
                  element={<AcheterRecolte />}
                />
                <Route
                  path="retirer-contrat-delegue"
                  element={<RetirerContratDelegue />}
                />
                <Route
                  path="stock-exportateur"
                  element={<StockExportateur />}
                />
                <Route path="expeditions" element={<ListeExpeditions />} />
                {/* <Route path="expeditions/:id" element={<DetailsExpedition />} /> */}
                <Route path="certificateur/expeditions" element={<CertifierExpeditions />} />
                <Route path="espace-client/produit/:id" element={<ProduitDetails />} />
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
        <li>
          <Link to="/admin/enregistrer-acteur">Enregistrer un acteur</Link>
        </li>
        <li>
          <Link to="/admin/ajouter-contrat-delegue">
            Ajouter un contrat délégué
          </Link>
        </li>
        <li>
          <Link to="/admin/liste-acteurs">Liste des acteurs</Link>
        </li>
        <li>
          <Link to="/admin/activer-desactiver-acteur">
            Activer / Désactiver un acteur
          </Link>
        </li>
        <li>
          <Link to="/retirer-contrat-delegue">Retirer un contrat délégué</Link>
        </li>
        <li>
          <Link to="/admin/ajouter-role-acteur">
            Ajouter un rôle à un acteur
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default App;
