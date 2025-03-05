import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

function MesCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const chargerCommandes = async () => {
      try {
        const contract = await getContract();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        console.log("Adresse connectée:", account);

        // Obtenir le nombre total de commandes
        const compteurCommandes = await contract.compteurCommandes();
        console.log("Nombre total de commandes:", compteurCommandes.toString());
        
        // Charger toutes les commandes de l'exportateur
        const commandesTemp = [];
        for (let i = 1; i <= compteurCommandes; i++) {
          const commande = await contract.commandes(i);
          const exportateurAddress = commande.exportateur.toString();
          
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Mes Commandes</h2>
        {isLoading ? (
          <div className="text-center">Chargement...</div>
        ) : commandes.length === 0 ? (
          <div className="text-center text-gray-500">
            Vous n'avez pas encore passé de commandes.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {commandes.map((commande) => (
              <div key={commande.id} className="border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">{commande.nomProduit}</h3>
                <div className="space-y-2 text-sm">
                  <p>Quantité: {commande.quantite}</p>
                  <p>Prix unitaire: {commande.prixUnitaire} ETH</p>
                  <p>Total: {(Number(commande.quantite) * Number(commande.prixUnitaire)).toFixed(6)} ETH</p>
                  <p className={`font-semibold ${getStatutTransportColor(commande.statutTransport)}`}>
                    Statut: {getStatutTransport(commande.statutTransport)}
                  </p>
                </div>
                <div className="mt-4 space-x-2">
                  {commande.statutTransport === 0 && (
                    <Link
                      to={`/effectuer-paiement/${commande.id}`}
                      className="inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Payer
                    </Link>
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

export default MesCommandes; 