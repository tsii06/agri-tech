import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

function ListeProduits() {
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState(null);

  const chargerProduits = async () => {
    try {
      const contract = await getContract();
      const provider = contract.runner.provider;
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      // Vérifier le rôle de l'utilisateur
      const acteurInfo = await contract.getActeur(account);
      setRole(Number(acteurInfo.role));

      // Obtenir le nombre total de produits
      const compteurProduits = await contract.compteurProduits();
      
      // Charger tous les produits
      const produitsTemp = [];
      for (let i = 1; i <= compteurProduits; i++) {
        const produit = await contract.produits(i);
        produitsTemp.push({
          id: i,
          nom: produit.nom,
          quantite: produit.quantite.toString(),
          prix: ethers.formatEther(produit.prix),
          idParcelle: produit.idParcelle.toString(),
          statut: Number(produit.statut)
        });
      }
      
      setProduits(produitsTemp);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chargerProduits();
  }, []);

  const getStatutProduit = (statut) => {
    switch(statut) {
      case 0: return "En attente";
      case 1: return "Validé";
      case 2: return "Refusé";
      default: return "Inconnu";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Liste des Produits</h2>
        {isLoading ? (
          <div className="text-center">Chargement...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {produits.map((produit) => (
              <div key={produit.id} className="border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">{produit.nom}</h3>
                <div className="space-y-2 text-sm">
                  <p>Quantité: {produit.quantite}</p>
                  <p>Prix: {produit.prix} ETH</p>
                  <p>Parcelle ID: {produit.idParcelle}</p>
                  <p className={`font-semibold ${
                    produit.statut === 1 ? 'text-green-600' : 
                    produit.statut === 2 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    Statut: {getStatutProduit(produit.statut)}
                  </p>
                </div>
                {role === 1 && produit.statut === 0 && (
                  <div className="mt-4 space-x-2">
                    <button 
                      onClick={() => window.location.href = `/valider-produit/${produit.id}`}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Valider
                    </button>
                    <button 
                      onClick={() => window.location.href = `/passer-commande/${produit.id}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Commander
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ListeProduits; 