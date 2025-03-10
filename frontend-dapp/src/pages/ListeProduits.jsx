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
      const acteurInfo = await contract.acteurs(account);
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
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3">Liste des Produits</h2>
        {isLoading ? (
          <div className="text-center">Chargement...</div>
        ) : (
          <div className="row g-3">
            {produits.map((produit) => (
              <div key={produit.id} className="col-md-4">
                <div className="card border shadow-sm p-3">
                  <h5 className="card-title">{produit.nom}</h5>
                  <div className="card-text small">
                    <p><strong>Quantité:</strong> {produit.quantite}</p>
                    <p><strong>Prix:</strong> {produit.prix} ETH</p>
                    <p><strong>Parcelle ID:</strong> {produit.idParcelle}</p>
                    <p className={`fw-semibold ${
                      produit.statut === 1 ? 'text-success' : 
                      produit.statut === 2 ? 'text-danger' : 'text-warning'
                    }`}>
                      <strong>Statut:</strong> {getStatutProduit(produit.statut)}
                    </p>
                  </div>
                  {role === 1 && produit.statut === 0 && (
                    <div className="mt-3 d-flex gap-2">
                      <a 
                        href={`/valider-produit/${produit.id}`}
                        className="btn btn-sm btn-success"
                      >
                        Valider
                      </a>
                      <a 
                        href={`/passer-commande/${produit.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Commander
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ListeProduits; 