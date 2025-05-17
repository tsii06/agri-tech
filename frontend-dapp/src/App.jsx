import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { UserProvider } from './context/useContextt';

import Header from "./components/Layout/Header";
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
import AdminRegisterActeur from "./admin/AdminRegisterActeur";
import AdminAjoutContratDelegue from "./admin/AdminAjoutContratDelegue";
import AdminListeActeurs from "./admin/AdminListeActeurs";

function App() {
  const [state, setState] = useState({});

  return (
    <UserProvider state={state} >
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Routes>
          <Route path="/" element={<Header state={state} setState={setState} />}>
            <Route index element={
              <div className="row justify-content-center">
                <div className="col-md-8">
                  <div className="card shadow-sm">
                    <div className="card-body">
                      <p className="card-text text-muted">
                        Cette application permet de gérer les produits et les acteurs de la chaîne d'approvisionnement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            } />

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
            <Route path="/produits" element={<ListeProduits />} />
            <Route path="/mes-commandes-exportateur" element={<MesCommandesExportateur />} />
            <Route path="admin" element={<AdminHome />} />
            <Route path="admin/enregistrer-acteur" element={<AdminRegisterActeur />} />
            <Route path="admin/ajouter-contrat-delegue" element={<AdminAjoutContratDelegue />} />
            <Route path="admin/liste-acteurs" element={<AdminListeActeurs />} />
          </Route>
        </Routes>
      </div>
    </Router>
    </UserProvider>
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
      </ul>
    </div>
  );
}

export default App;
