import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getCollecteurProducteurContract } from "../../utils/contract";
import { getRoleName } from "../../components/Layout/Header";
import { useUserContext } from '../../context/useContextt';






function CommandeCollecteur() {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acteur, setActeur] = useState({});
  const [_, setState] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modePaiement, setModePaiement] = useState(0); // 0 = VirementBancaire

  const { role, account, verifeActeur } = useUserContext();








  useEffect(() => {
    const chargerCommandes = async () => {
      try {
        const contract = await getCollecteurProducteurContract();
        // const provider = contract.runner.provider;
        // const signer = await provider.getSigner();
        // const account = await signer.getAddress();

        console.log("Adresse connectée:", account);

        // Obtenir le nombre total de commandes
        const compteurCommandes = await contract.compteurCommandes();
        console.log("Nombre total de commandes:", compteurCommandes.toString());
        
        // Charger toutes les commandes
        const commandesTemp = [];
        for (let i = 1; i <= compteurCommandes; i++) {
          const commande = await contract.getCommande(i);
          
          // Vérifier si la commande appartient au collecteur connecté
          if (commande.collecteur.toLowerCase() === account.toLowerCase()) {
            const recolte = await contract.getRecolte(commande.idRecolte);
            
            commandesTemp.push({
              id: commande.id,
              idRecolte: commande.idRecolte,
              quantite: commande.quantite,
              prix: commande.prix,
              payer: commande.payer,
              statutTransport: commande.statutTransport,
              producteur: commande.producteur,
              collecteur: commande.collecteur,
              nomProduit: recolte.nomProduit
            });
          }
        }
        
        console.log("Commandes trouvées:", commandesTemp);
        setActeur(acteur);
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
      const contract = await getCollecteurProducteurContract();
      const commande = commandes.find(c => c.id === commandeId);
      
      // Effectuer le paiement
      // Les paramètres sont: idCommande, montant, mode
      const tx = await contract.effectuerPaiementVersProducteur(
<<<<<<< HEAD
<<<<<<< HEAD
        commandeId,
        commande.prix,
        modePaiement,
        { value: commande.prix }  // Attention: la valeur doit correspondre au montant envoyé
=======
        parseInt(commande.idRecolte),
        parseInt(commande.prix),
        parseInt(commandeId)
>>>>>>> 1cc1a9fadd0f7d33cca1406cc1427007e1f0af29
=======
        parseInt(commande.idRecolte),
        parseInt(commande.prix),
        parseInt(commandeId)
>>>>>>> 1cc1a9fadd0f7d33cca1406cc1427007e1f0af29
      );
      await tx.wait();

      // Fermer le modal
      setShowModal(false);
      
      // Rediriger vers la page des produits
      navigate('/produits');
      
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
                    <p><strong>ID Récolte:</strong> {commande.idRecolte}</p>
                    <p><strong>Quantité:</strong> {commande.quantite} kg</p>
                    <p><strong>Prix:</strong> {commande.prix} Ar</p>
                    <p><strong>Producteur:</strong> {commande.producteur.slice(0, 6)}...{commande.producteur.slice(-4)}</p>
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
                        onClick={() => {
                          setCommandeSelectionnee(commande);
                          setShowModal(true);
                        }}
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

      {/* Modal de paiement */}
      {showModal && commandeSelectionnee && (
        <>
        <div className="modal-backdrop fade show"></div>

        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Payer la commande</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Produit: {commandeSelectionnee.nomProduit}</label>
                  <p><strong>Quantité:</strong> {commandeSelectionnee.quantite} kg</p>
                  <p><strong>Prix total:</strong> {commandeSelectionnee.prix} Ar</p>
                </div>
                <div className="mb-3">
                  <label className="form-label">Mode de paiement</label>
                  <select 
                    className="form-select"
                    value={modePaiement}
                    onChange={(e) => setModePaiement(Number(e.target.value))}
                  >
                    <option value={0}>Virement bancaire</option>
                    <option value={1}>Cash</option>
                    <option value={2}>Mobile Money</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handlePayer(commandeSelectionnee.id)}
                >
                  Confirmer le paiement
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default CommandeCollecteur; 