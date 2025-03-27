import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import AjoutActeur from "./pages/AjoutActeur";
import ListeProduits from "./pages/ListeProduits";
import PasserCommande from "./pages/PasserCommande";
import ValiderProduit from "./pages/ValiderProduit";
import EffectuerPaiement from "./pages/EffectuerPaiement";
import EnregistrerCondition from "./pages/EnregistrerCondition";
import MettreAJourTransport from "./pages/MettreAJourTransport";
import MesCommandes from "./pages/MesCommandes";
import CreerParcelle from "./pages/CreerParcelle";
import MesParcelles from "./pages/MesParcelles";
import PhotosParcelle from "./pages/PhotosParcelle";
import IntrantsParcelle from "./pages/IntrantsParcelle";
import InspectionsParcelle from "./pages/InspectionsParcelle";

function App() {
  const [state, setState] = useState({});

  return (
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
            <Route path="passer-commande/:id" element={<PasserCommande />} />
            <Route path="valider-produit/:id" element={<ValiderProduit />} />
            <Route path="effectuer-paiement/:id" element={<EffectuerPaiement />} />
            <Route path="enregistrer-condition/:id" element={<EnregistrerCondition />} />
            <Route path="mettre-a-jour-transport/:id" element={<MettreAJourTransport />} />
            <Route path="creer-parcelle" element={<CreerParcelle />} />
            <Route path="mes-parcelles" element={<MesParcelles />} />
            <Route path="parcelle/:id/photos" element={<PhotosParcelle />} />
            <Route path="parcelle/:id/intrants" element={<IntrantsParcelle />} />
            <Route path="parcelle/:id/inspections" element={<InspectionsParcelle />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
