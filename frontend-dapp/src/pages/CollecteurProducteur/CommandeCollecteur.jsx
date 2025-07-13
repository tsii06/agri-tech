import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCollecteurProducteurContract } from "../../utils/contract";
import { useUserContext } from '../../context/useContextt';
import { ClipboardList, Hash, Package2, BadgeEuro, User, Truck, Wallet, Search, ChevronDown, Circle } from "lucide-react";






function CommandeCollecteur() {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [acteur, setActeur] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modePaiement, setModePaiement] = useState(0); // 0 = VirementBancaire
  const [search, setSearch] = useState("");
  const [paiementFiltre, setPaiementFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);

  const { account } = useUserContext();

  const chargerCommandes = async () => {
    try {
      const contract = await getCollecteurProducteurContract();
      const compteurCommandes = await contract.compteurCommandes();
      const commandesTemp = [];
      for (let i = 1; i <= compteurCommandes; i++) {
        const commande = await contract.getCommande(i);
        if (commande.collecteur.toLowerCase() === account.toLowerCase()) {
          commandesTemp.push(commande);
        }
      }
      setActeur(acteur);
      commandesTemp.reverse();
      setCommandes(commandesTemp);
    } catch (error) {
      console.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) {
      alert("Veuillez installer Metamask pour accéder à vos commandes.");
      setIsLoading(false);
      return;
    }
    if (!account) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    chargerCommandes();
  }, [account, acteur]);

  const handlePayer = async (commandeId) => {
    try {
      const contract = await getCollecteurProducteurContract();
      const commande = commandes.find(c => c.id === commandeId);

      // Effectuer le paiement
      // Les paramètres sont: idCommande, montant, mode
      const tx = await contract.effectuerPaiementVersProducteur(
        commandeId,
        commande.prix,
        modePaiement,
        { value: commande.prix }  // Attention: la valeur doit correspondre au montant envoyé

      );
      await tx.wait();

      // Fermer le modal
      setShowModal(false);

      // Rediriger vers la page des produits
      navigate('/liste-produits');

    } catch (error) {
      console.error("Erreur lors du paiement:", error);
    }
  };

  const validerCommande = async (_idCommande, _valide) => {
    setBtnLoading(true);
    try {
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.validerCommandeRecolte(_idCommande, _valide);
      await tx.wait();
      await chargerCommandes();
    } catch (e) {
      console.error("Erreur lors de la vaidation d'une commande :", e.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const getStatutPaiement = (payer) => {
    return payer ? "Payé" : "Non payé";
  };

  const getStatutTransport = (statut) => {
    switch (statut) {
      case 0: return "En cours";
      case 1: return "Livré";
      default: return "Inconnu";
    }
  };

  const getStatutRecolte = (status) => {
    switch (status) {
      case 0: return "En attente";
      case 1: return "Validé";
      case 2: return "Rejeté";
    }
  };
  const getColorStatutRecolte = (status) => {
    switch (status) {
      case 0: return "bg-warning";
      case 1: return "bg-success";
      case 2: return "bg-danger";
    }
  };

  // Filtrage commandes selon recherche et paiement
  const commandesFiltres = commandes.filter((commande) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (commande.nomProduit && commande.nomProduit.toLowerCase().includes(searchLower)) ||
      (commande.id && commande.id.toString().includes(searchLower)) ||
      (commande.idRecolte && commande.idRecolte.toString().includes(searchLower)) ||
      (commande.prix && commande.prix.toString().includes(searchLower));
    const matchPaiement =
      paiementFiltre === "all" ||
      (paiementFiltre === "paye" && commande.payer) ||
      (paiementFiltre === "nonpaye" && !commande.payer);
    return matchSearch && matchPaiement;
  });
  const commandesAffichees = commandesFiltres.slice(0, visibleCount);

  if (!window.ethereum) {
    return (
      <div className="container py-4 text-center text-danger">
        Veuillez installer Metamask pour accéder à vos commandes.
      </div>
    );
  }
  if (!account) {
    return (
      <div className="container py-4 text-center text-muted">
        Veuillez connecter votre wallet pour voir vos commandes.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="container py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between" style={{ marginBottom: 24 }}>
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text"><Search size={16} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(9); }}
              style={{ borderRadius: '0 8px 8px 0' }}
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
        <div className="card p-4 shadow-sm">
          <div style={{ backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))", borderRadius: "8px", padding: "0.75rem 1.25rem", marginBottom: 16 }}>
            <h2 className="h5 mb-0">Mes Commandes Collecteur</h2>
          </div>

          {commandes.length === 0 ? (
            <div className="text-center text-muted">
              Vous n&apos;avez pas encore passé de commandes.
            </div>
          ) : commandesFiltres.length === 0 ? (
            <div className="text-center text-muted">Aucune commande ne correspond à la recherche ou au filtre.</div>
          ) : (
            <div className="row g-3">
              {commandesAffichees.map((commande) => (
                <div key={commande.id} className="col-md-4">
                  <div className="card border shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
                    <div className="d-flex justify-content-center align-items-center mb-2" style={{ fontSize: 32, color: '#4d7c0f' }}>
                      <ClipboardList size={36} />
                    </div>
                    <h5 className="card-title text-center mb-3">{commande.nomProduit}</h5>
                    <div className="card-text small">
                      <p><Hash size={16} className="me-2 text-success" /><strong>ID Commande:</strong> {commande.id}</p>
                      <p><Hash size={16} className="me-2 text-success" /><strong>ID Récolte:</strong> {commande.idRecolte}</p>
                      <p><Package2 size={16} className="me-2 text-success" /><strong>Quantité:</strong> {commande.quantite} kg</p>
                      <p><BadgeEuro size={16} className="me-2 text-success" /><strong>Prix:</strong> {commande.prix} Ar</p>
                      <p><User size={16} className="me-2 text-success" /><strong>Producteur:</strong> {commande.producteur.slice(0, 6)}...{commande.producteur.slice(-4)}</p>
                      <p>
                        <Truck size={16} className="me-2 text-success" />
                        <strong>Transport:</strong>
                        <span className={`badge ms-2 ${commande.statutTransport == 1 ? "bg-success" : "bg-warning"}`}>
                          {getStatutTransport(Number(commande.statutTransport))}
                        </span>
                      </p>
                      <p>
                        <Circle size={16} className="me-2 text-success" />
                        <strong>Status:</strong>
                        <span className={`badge ms-2 ${getColorStatutRecolte(Number(commande.statutRecolte))}`}>
                          {getStatutRecolte(Number(commande.statutRecolte))}
                        </span>
                      </p>
                      <p>
                        <Wallet size={16} className="me-2 text-success" />
                        <strong>Paiement:</strong>
                        <span className={`badge ms-2 ${commande.payer ? "bg-success" : "bg-warning"}`}>
                          {getStatutPaiement(commande.payer)}
                        </span>
                      </p>
                    </div>
                    <div className="mt-3">
                      {/* Pour valider la commande */}
                      {commande.statutTransport == 1 && commande.statutRecolte == 0 && (
                        <>
                          <button
                            onClick={() => validerCommande(commande.id, false)}
                            className="me-1 btn-agrichain-danger"
                            disabled={btnLoading}
                            >
                            Rejeter
                          </button>
                          <button
                            onClick={() => validerCommande(commande.id, true)}
                            className="btn-agrichain"
                            disabled={btnLoading}
                          >
                            Valider
                          </button>
                        </>
                      )}
                      {/* Pour payer la commande */}
                      {!commande.payer && commande.statutRecolte == 1 && (
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
                  <button type="button" className="btn-agrichain-outline" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn-agrichain"
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

export default CommandeCollecteur; 