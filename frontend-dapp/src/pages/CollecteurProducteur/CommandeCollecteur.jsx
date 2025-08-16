import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCollecteurProducteurContract } from "../../utils/contract";
import { useUserContext } from '../../context/useContextt';
import { getIPFSURL } from "../../utils/ipfsUtils";
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
        let commande = await contract.getCommande(i);
        if (commande.collecteur.toLowerCase() === account.toLowerCase()) {
          
          // Charger les données IPFS consolidées si la commande a un CID
          if (commande.cid) {
            try {
              const response = await fetch(getIPFSURL(commande.cid));
              if (response.ok) {
                const ipfsData = await response.json();
                
                // Fusionner les données blockchain avec les données IPFS
                commande = {
                  ...commande,
                  // Données de base de la commande
                  nomProduit: ipfsData.nomProduit || "Produit non spécifié",
                  // Métadonnées IPFS
                  ipfsTimestamp: ipfsData.timestamp,
                  ipfsVersion: ipfsData.version,
                  // Hash Merkle de la récolte associée
                  recolteHashMerkle: ipfsData.recolteHashMerkle || ""
                };
              }
            } catch (ipfsError) {
              console.log(`Erreur lors du chargement IPFS pour la commande ${i}:`, ipfsError);
              // Garder les données blockchain de base si IPFS échoue
              commande = {
                ...commande,
                nomProduit: "Données IPFS non disponibles",
                ipfsTimestamp: null,
                ipfsVersion: null,
                recolteHashMerkle: ""
              };
            }
          } else {
            // Commande sans CID IPFS (ancienne structure)
            commande = {
              ...commande,
              nomProduit: "Données non consolidées",
              ipfsTimestamp: null,
              ipfsVersion: null,
              recolteHashMerkle: ""
            };
          }

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
    setBtnLoading(true);
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
    } finally {
      setBtnLoading(false);
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

        <div style={{ backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))", borderRadius: "8px", padding: "0.75rem 1.25rem", marginBottom: 16 }}>
          <h2 className="h5 mb-0">Mes Commandes</h2>
          <p className="text-muted mb-0">
            {commandes.length > 0 && (
              <>
                {commandes.filter(c => c.cid).length} commandes avec données IPFS, 
                {commandes.filter(c => !c.cid).length} commandes sans données IPFS
              </>
            )}
          </p>
        </div>

        {/* LISTE DES COMMANDES */}
        {commandes.length > 0 ? (
          <div className="row g-3">
            {commandesAffichees.map((commande) => (
              <div key={commande.id} className="col-md-4">
                <div className="card shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Commande #{commande.id}</h5>
                    <div>
                      {commande.cid && commande.hashMerkle ? (
                        <span className="badge bg-success me-1">
                          IPFS + Merkle
                        </span>
                      ) : commande.cid ? (
                        <span className="badge bg-warning me-1">
                          IPFS uniquement
                        </span>
                      ) : (
                        <span className="badge bg-secondary me-1">
                          Données non consolidées
                        </span>
                      )}
                      <span className={`badge ${commande.payer ? 'bg-success' : 'bg-warning'}`}>
                        {getStatutPaiement(commande.payer)}
                      </span>
                    </div>
                  </div>

                  <div className="card-text">
                    <p><strong>Produit:</strong> {commande.nomProduit}</p>
                    <p><strong>ID Récolte:</strong> {commande.idRecolte}</p>
                    <p><strong>Quantité:</strong> {commande.quantite} kg</p>
                    <p><strong>Prix:</strong> {commande.prix} Ariary</p>
                    <p><strong>Producteur:</strong> {commande.producteur}</p>
                    
                    {/* Informations IPFS et Merkle */}
                    {commande.cid && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <p className="mb-1">
                          <strong>CID IPFS:</strong> 
                          <a
                            href={getIPFSURL(commande.cid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ms-2 text-decoration-none text-primary"
                            title="Voir les données consolidées sur IPFS"
                          >
                            {commande.cid.substring(0, 10)}...
                          </a>
                        </p>
                        
                        {commande.hashMerkle && (
                          <p className="mb-1">
                            <strong>Hash Merkle:</strong> 
                            <span className="ms-2 text-muted" title={commande.hashMerkle}>
                              {commande.hashMerkle.substring(0, 10)}...
                            </span>
                          </p>
                        )}

                        {commande.ipfsTimestamp && (
                          <p className="mb-1 text-muted small">
                            <strong>Dernière mise à jour IPFS:</strong> {new Date(commande.ipfsTimestamp).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Statuts */}
                    <div className="mt-3">
                      <div className="d-flex gap-2 mb-2">
                        <span className={`badge ${getColorStatutRecolte(commande.statutRecolte)}`}>
                          {getStatutRecolte(commande.statutRecolte)}
                        </span>
                        <span className="badge bg-info">
                          {getStatutTransport(commande.statutTransport)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between mt-3">
                    {/* Actions selon le statut */}
                    {!commande.payer && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setCommandeSelectionnee(commande);
                          setShowModal(true);
                        }}
                      >
                        Payer
                      </button>
                    )}

                    {commande.statutRecolte === 0 && (
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => validerCommande(commande.id, true)}
                          disabled={btnLoading}
                        >
                          Valider
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => validerCommande(commande.id, false)}
                          disabled={btnLoading}
                        >
                          Rejeter
                        </button>
                      </div>
                    )}

                    {/* Lien vers les détails complets IPFS */}
                    {commande.cid && (
                      <a
                        href={getIPFSURL(commande.cid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary btn-sm"
                      >
                        Voir données IPFS
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted">Aucune commande trouvée.</div>
        )}

        {commandesAffichees.length < commandesFiltres.length && (
          <div className="text-center mt-3">
            <button className="btn btn-outline-success" onClick={() => setVisibleCount(visibleCount + 9)}>
              Charger plus
            </button>
          </div>
        )}
      </div>

      {/* Modal de paiement */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Payer la commande #{commandeSelectionnee?.id}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Montant à payer : <strong>{commandeSelectionnee?.prix} Ariary</strong></p>
                <div className="mb-3">
                  <label htmlFor="modePaiement" className="form-label">Mode de paiement</label>
                  <select
                    className="form-select"
                    id="modePaiement"
                    value={modePaiement}
                    onChange={(e) => setModePaiement(parseInt(e.target.value))}
                  >
                    <option value={0}>Virement Bancaire</option>
                    <option value={1}>Chèque</option>
                    <option value={2}>Espèces</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handlePayer(commandeSelectionnee.id)}
                  disabled={btnLoading}
                >
                  {btnLoading ? "Paiement..." : "Confirmer le paiement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour les modals */}
      {showModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
}

export default CommandeCollecteur; 