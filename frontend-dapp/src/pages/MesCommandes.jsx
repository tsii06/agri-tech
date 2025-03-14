import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { getCollecteurContract } from "../utils/contract";

function MesCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const chargerCommandes = async () => {
      try {
        const contract = await getCollecteurContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        console.log("Adresse connectée:", account);

        // Obtenir le nombre total de commandes
        const compteurCommandes = await contract.getCompteurCommande();
        console.log("Nombre total de commandes:", compteurCommandes.toString());
        
        // Charger toutes les commandes de l'exportateur
        const commandesTemp = [];
        for (let i = 1; i <= compteurCommandes; i++) {
          const commande = await contract.getCommande(i);
          const exportateurAddress = commande.exportateur.toString();

          // Verifie si la commande appartient a l'user
          if(exportateurAddress.toLowerCase() !== account.toLowerCase())
            continue;
          
          console.log(`Commande ${i}:`, {
            exportateur: exportateurAddress,
            account: account,
            match: exportateurAddress.toLowerCase() === account.toLowerCase()
          });

          // Vérifier si la commande appartient à l'utilisateur connecté
          // if (exportateurAddress.toLowerCase() === account.toLowerCase()) {
            // Charger les détails du produit associé
            console.log("exportateurAddress", exportateurAddress);
            console.log("account", account);
            const produit = await contract.produits(commande.idProduit);
            
            commandesTemp.push({
              id: i,
              idProduit: commande.idProduit.toString(),
              quantite: commande.quantite.toString(),
              statutTransport: Number(commande.statutTransport),
              nomProduit: produit.nom,
              prixUnitaire: ethers.formatEther(produit.prix),
              payer: commande.payer,
              exportateur: exportateurAddress
            });
          // }
        }
        
        console.log("Commandes trouvées:", commandesTemp);
        setCommandes(commandesTemp);
      } catch (error) {
        console.error("Erreur lors du chargement des commandes:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerCommandes();
  }, []);

  const getStatutTransport = (statut) => {
    switch(statut) {
      case 0: return "En attente";
      case 1: return "En cours";
      case 2: return "Livré";
      default: return "Inconnu";
    }
  };

  const getStatutTransportColor = (statut) => {
    switch(statut) {
      case 0: return "text-yellow-600";
      case 1: return "text-blue-600";
      case 2: return "text-green-600";
      default: return "text-gray-600";
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des commandes: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3">Mes Commandes</h2>
        {isLoading ? (
          <div className="text-center">Chargement...</div>
        ) : commandes.length === 0 ? (
          <div className="text-center text-muted">Vous n'avez pas encore passé de commandes.</div>
        ) : (
          <div className="row g-3">
            {commandes.map((commande) => (
              <div key={commande.id} className="col-md-4">
                <div className="card border shadow-sm p-3">
                  <h5 className="card-title">{commande.nomProduit}</h5>
                  <div className="card-text small">
                    <p><strong>Quantité:</strong> {commande.quantite}</p>
                    <p><strong>Prix unitaire:</strong> {commande.prixUnitaire} ETH</p>
                    <p><strong>Total:</strong> {(Number(commande.quantite) * Number(commande.prixUnitaire)).toFixed(6)} ETH</p>
                    <p className={`fw-semibold ${getStatutTransportColor(commande.statutTransport)}`}>
                      <strong>Statut:</strong> {getStatutTransport(commande.statutTransport)}
                    </p>
                  </div>
                  <div className="mt-3">
                    {commande.statutTransport === 0 && !commande.payer ? (
                      <Link
                        to={`/effectuer-paiement/${commande.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        Payer
                      </Link>
                    ) : (
                      <button className="btn btn-primary" disabled>Deja payer</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MesCommandes; 