import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import AjoutProduit from "./pages/AjoutProduit";
import AjoutActeur from "./pages/AjoutActeur";
import ListeProduits from "./pages/ListeProduits";
import PasserCommande from "./pages/PasserCommande";
import ValiderProduit from "./pages/ValiderProduit";
import EffectuerPaiement from "./pages/EffectuerPaiement";
import EnregistrerCondition from "./pages/EnregistrerCondition";
import MettreAJourTransport from "./pages/MettreAJourTransport";
import MesCommandes from "./pages/MesCommandes";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="pt-4">
          <Routes>
            <Route path="/ajout-produit" element={<AjoutProduit />} />
            <Route path="/ajout-acteur" element={<AjoutActeur />} />
            <Route path="/liste-produits" element={<ListeProduits />} />
            <Route path="/mes-commandes" element={<MesCommandes />} />
            <Route path="/passer-commande/:id" element={<PasserCommande />} />
            <Route path="/valider-produit/:id" element={<ValiderProduit />} />
            <Route path="/effectuer-paiement/:id" element={<EffectuerPaiement />} />
            <Route path="/enregistrer-condition/:id" element={<EnregistrerCondition />} />
            <Route path="/mettre-a-jour-transport/:id" element={<MettreAJourTransport />} />
            <Route path="/" element={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Bienvenue sur la DApp Collecteur Exportateur</h2>
                  <p className="text-gray-600">
                    Cette application permet de gérer les produits et les acteurs de la chaîne d'approvisionnement.
                  </p>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
