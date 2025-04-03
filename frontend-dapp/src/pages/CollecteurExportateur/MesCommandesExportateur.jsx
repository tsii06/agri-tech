import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getCollecteurExportateurContract } from "../../utils/contract";
import { getRoleName } from "../../components/Layout/Header";

function MesCommandesExportateur() {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acteur, setActeur] = useState({});
  const [_, setState] = useState({});

  useEffect(() => {
    const chargerCommandes = async () => {
      try {
        const contract = await getCollecteurExportateurContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        console.log("Adresse connectée:", account);

        // Récupérer l'acteur
        const _acteur = await contract.getActeur(account);

        // Obtenir le nombre total de commandes
        const compteurCommandes = await contract.compteurCommandes();
        console.log("Nombre total de commandes:", compteurCommandes.toString());
        
        // Charger toutes les commandes
        const commandesTemp = [];
        for (let i = 1; i <= compteurCommandes; i++) {
          const commande = await contract.getCommande(i);
          
          // Vérifier si la commande appartient à l'exportateur connecté
          if (commande.exportateur.toLowerCase() === account.toLowerCase()) {
            const produit = await contract.getProduit(commande.idProduit);
            
            commandesTemp.push({
              id: commande.id.toString(),
              idProduit: commande.idProduit.toString(),
              quantite: commande.quantite.toString(),
              prix: commande.prix.toString(),
              payer: commande.payer,
              statutTransport: commande.statutTransport,
              collecteur: commande.collecteur.toString(),
              exportateur: commande.exportateur.toString(),
              nomProduit: produit.nom
            });
          }
        }
        
        console.log("Commandes trouvées:", commandesTemp);
        setActeur(_acteur);
        // Inverser le tri des commandes pour que les plus récentes soient en premier
        commandesTemp.reverse();
        setCommandes(commandesTemp);
      } catch (error) {
        console.error("Erreur lors du chargement des commandes:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerCommandes();
  }, [_]);

  const handlePayer = async (commandeId) => {
    try {
      const contract = await getCollecteurExportateurContract();
      const commande = commandes.find(c => c.id === commandeId);
      
      // Effectuer le paiement
      const tx = await contract.effectuerPaiement(
        commandeId,
        commande.prix,
        0 // ModePaiement.VirementBancaire
      );
      await tx.wait();
      
      // Mettre à jour l'état local
      const commandesTemp = [...commandes];
      const index = commandesTemp.findIndex(c => c.id === commandeId);
      if (index !== -1) {
        commandesTemp[index].payer = true;
        setCommandes(commandesTemp);
      }
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      setError(error.message);
    }
  };

  const getStatutPaiement = (payer) => {
    return payer ? "Payé" : "Non payé";
  };

  const getStatutPaiementColor = (payer) => {
    return payer ? "text-success" : "text-warning";
  };

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
      case 0: return "text-warning";
      case 1: return "text-info";
      case 2: return "text-success";
      default: return "text-secondary";
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
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : commandes.length === 0 ? (
          <div className="text-center text-muted">
            Vous n'avez pas encore passé de commandes.
          </div>
        ) : (
          <div className="row g-3">
            {commandes.map((commande) => (
              <div key={commande.id} className="col-md-4">
                <div className="card border shadow-sm p-3">
                  <h5 className="card-title">{commande.nomProduit}</h5>
                  <div className="card-text small">
                    <p><strong>ID Commande:</strong> {commande.id}</p>
                    <p><strong>ID Produit:</strong> {commande.idProduit}</p>
                    <p><strong>Quantité:</strong> {commande.quantite} kg</p>
                    <p><strong>Prix:</strong> {commande.prix} MADATX</p>
                    <p><strong>Collecteur:</strong> {commande.collecteur.slice(0, 6)}...{commande.collecteur.slice(-4)}</p>
                    <p className={`fw-semibold ${getStatutPaiementColor(commande.payer)}`}>
                      <strong>Paiement:</strong> {getStatutPaiement(commande.payer)}
                    </p>
                    <p className={`fw-semibold ${getStatutTransportColor(commande.statutTransport)}`}>
                      <strong>Transport:</strong> {getStatutTransport(commande.statutTransport)}
                    </p>
                  </div>
                  <div className="mt-3">
                    {!commande.payer && (
                      <button
                        onClick={() => handlePayer(commande.id)}
                        className="btn btn-sm btn-primary"
                      >
                        Payer
                      </button>
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

export default MesCommandesExportateur; 