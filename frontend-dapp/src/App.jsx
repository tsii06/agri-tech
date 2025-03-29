import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { UserProvider } from './context/useContextt';

import Header from "./components/Layout/Header";
import AjoutActeur from "./pages/AjoutActeur";
import ListeProduits from "./pages/ListeProduits";
import PasserCommande from "./pages/PasserCommandeVersCollecteur";
import ValiderProduit from "./pages/ValiderProduit";
import EffectuerPaiement from "./pages/EffectuerPaiement";
import EnregistrerCondition from "./pages/EnregistrerCondition";
import MettreAJourTransport from "./pages/MettreAJourTransport";
import MesCommandes from "./pages/CommandeCollecteur";
import CreerParcelle from "./pages/CreerParcelle";
import MesParcelles from "./pages/MesParcelles";
import PhotosParcelle from "./pages/PhotosParcelle";
import IntrantsParcelle from "./pages/IntrantsParcelle";
import InspectionsParcelle from "./pages/InspectionsParcelle";
import FaireRecolte from "./pages/FaireRecolte";
import ListeRecoltes from "./pages/listerecoltes";
// import ListeProducteurs from "./pages/listeProducteur";
import RecoltesProducteur from "./pages/RecoltesProducteur";
import AcheterRecolte from "./pages/AcheterRecolte";

function App() {
  const [state, setState] = useState({});

  return (
    <UserProvider>
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Routes>
          <Route path="/" element={<Header state={state} />}>
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
            <Route path="ajout-acteur" element={<AjoutActeur setState={setState} />} />
            <Route path="liste-produits" element={<ListeProduits />} />
            <Route path="mes-commandes" element={<MesCommandes />} />
            <Route path="passer-commande-collecteur/:id" element={<PasserCommande />} />
            <Route path="valider-produit/:id" element={<ValiderProduit />} />
            <Route path="effectuer-paiement/:id" element={<EffectuerPaiement />} />
            <Route path="enregistrer-condition/:id" element={<EnregistrerCondition />} />
            <Route path="mettre-a-jour-transport/:id" element={<MettreAJourTransport />} />
            <Route path="creer-parcelle" element={<CreerParcelle />} />
            <Route path="mes-parcelles" element={<MesParcelles />} />
            <Route path="parcelle/:id/photos" element={<PhotosParcelle />} />
            <Route path="parcelle/:id/intrants" element={<IntrantsParcelle />} />
            <Route path="parcelle/:id/inspections" element={<InspectionsParcelle />} />
            <Route path="parcelle/:id/faire-recolte" element={<FaireRecolte />} />
            {/*<Route path="liste-producteur" element={<ListeProducteurs />} />*/}
            <Route path="liste-recolte" element={<ListeRecoltes />} />
            <Route path="producteur/:address/recoltes" element={<RecoltesProducteur />} />
            <Route path="producteur/:address/recoltes/acheter" element={<AcheterRecolte />} />
          </Route>
        </Routes>
      </div>
    </Router>
    </UserProvider>
  );
}

export default App;
