import { useState, useEffect } from "react";
import { getCollecteurExportateurContract, getRoleOfAddress } from "../../utils/contract";
import { useUserContext } from '../../context/useContextt';
import { ShoppingCart, Hash, Package2, BadgeEuro, User, Truck, Wallet, Search, ChevronDown } from "lucide-react";

function MesCommandesExportateur() {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [_, setState] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modePaiement, setModePaiement] = useState(0); // 0 = VirementBancaire
  const [userRole, setUserRole] = useState(null);
  const { account } = useUserContext();
  const [search, setSearch] = useState("");
  const [paiementFiltre, setPaiementFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    if (!account) return;
    const chargerCommandes = async () => {
      try {
        const contract = await getCollecteurExportateurContract();
        let role = userRole;
        if (!role) {
          role = await getRoleOfAddress(account);
          setUserRole(role);
        }
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();

        console.log("Adresse connectée:", account);
        
        // Obtenir le nombre total de commandes
        const compteurCommandes = await contract.getCompteurCommande();
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
  }, [account]);

  const handlePayer = async (commandeId) => {
    try {
      const contract = await getCollecteurExportateurContract();
      const commande = commandes.find(c => c.id === commandeId);
      
      // Effectuer le paiement
      const tx = await contract.effectuerPaiement(
        commandeId,
        commande.prix,
        modePaiement,
        { value: commande.prix }  // La valeur envoyée doit correspondre au prix
      );
      await tx.wait();
      
      // Mettre à jour l'état local
      const commandesTemp = [...commandes];
      const index = commandesTemp.findIndex(c => c.id === commandeId);
      if (index !== -1) {
        commandesTemp[index].payer = true;
        setCommandes(commandesTemp);
      }

      // Fermer le modal
      setShowModal(false);
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
    switch(Number(statut)) {
      case 0: return "En cours";
      case 1: return "Livré";
      default: return "Inconnu";
    }
  };

  const getStatutTransportColor = (statut) => {
    switch(Number(statut)) {
      case 0: return "text-info";
      case 1: return "text-success";
      default: return "text-secondary";
    }
  };

  // Filtrage commandes selon recherche et paiement
  const commandesFiltres = commandes.filter((commande) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (commande.nomProduit && commande.nomProduit.toLowerCase().includes(searchLower)) ||
      (commande.id && commande.id.toString().includes(searchLower)) ||
      (commande.idProduit && commande.idProduit.toString().includes(searchLower)) ||
      (commande.prix && commande.prix.toString().includes(searchLower));
    const matchPaiement =
      paiementFiltre === "all" ||
      (paiementFiltre === "paye" && commande.payer) ||
      (paiementFiltre === "nonpaye" && !commande.payer);
    return matchSearch && matchPaiement;
  });
  const commandesAffichees = commandesFiltres.slice(0, visibleCount);

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
        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between" style={{marginBottom: 24}}>
          <div className="input-group" style={{maxWidth: 320}}>
            <span className="input-group-text"><Search size={16} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(9); }}
              style={{borderRadius: '0 8px 8px 0'}}
            />
          </div>
          <div className="dropdown">
            <button className="btn btn-outline-success dropdown-toggle d-flex align-items-center" type="button" id="dropdownPaiement" data-bs-toggle="dropdown" aria-expanded="false">
              <ChevronDown size={16} className="me-1" />
              {paiementFiltre === 'all' && 'Toutes les commandes'}
              {paiementFiltre === 'paye' && 'Payées'}
              {paiementFiltre === 'nonpaye' && 'Non payées'}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownPaiement">
              <li><button className="dropdown-item" onClick={() => setPaiementFiltre('all')}>Toutes les commandes</button></li>
              <li><button className="dropdown-item" onClick={() => setPaiementFiltre('paye')}>Payées</button></li>
              <li><button className="dropdown-item" onClick={() => setPaiementFiltre('nonpaye')}>Non payées</button></li>
            </ul>
          </div>
        </div>
        <div style={{ backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))", borderRadius: "8px", padding: "0.75rem 1.25rem", marginBottom: 16 }}>
          <h2 className="h5 mb-0">Mes Commandes Exportateur</h2>
        </div>
        
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
        ) : commandesFiltres.length === 0 ? (
          <div className="text-center text-muted">Aucune commande ne correspond à la recherche ou au filtre.</div>
        ) : (
          <div className="row g-3">
            {commandesAffichees.map((commande) => (
              <div key={commande.id} className="col-md-4">
                <div className="card border shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
                  <div className="d-flex justify-content-center align-items-center mb-2" style={{ fontSize: 32, color: '#4d7c0f' }}>
                    <ShoppingCart size={36} />
                  </div>
                  <h5 className="card-title text-center mb-3">{commande.nomProduit}</h5>
                  <div className="card-text small">
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Commande:</strong> {commande.id}</p>
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Produit:</strong> {commande.idProduit}</p>
                    <p><Package2 size={16} className="me-2 text-success" /><strong>Quantité:</strong> {commande.quantite} kg</p>
                    <p><BadgeEuro size={16} className="me-2 text-success" /><strong>Prix:</strong> {commande.prix} Ar</p>
                    <p><User size={16} className="me-2 text-success" /><strong>Collecteur:</strong> {commande.collecteur.slice(0, 6)}...{commande.collecteur.slice(-4)}</p>
                    <p className={`fw-semibold d-flex align-items-center ${getStatutPaiementColor(commande.payer)}`}
                      style={{gap: 6}}>
                      <Wallet size={16} className="me-1" />
                      <strong>Paiement:</strong> {getStatutPaiement(commande.payer)}
                    </p>
                    <p className={`fw-semibold d-flex align-items-center ${getStatutTransportColor(commande.statutTransport)}`}
                      style={{gap: 6}}>
                      <Truck size={16} className="me-1" />
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
                        className="btn-agrichain"
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
      )}

      {commandesAffichees.length < commandesFiltres.length && (
        <div className="text-center mt-3">
          <button className="btn-agrichain-outline" onClick={() => setVisibleCount(visibleCount + 9)}>
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
}

export default MesCommandesExportateur; 