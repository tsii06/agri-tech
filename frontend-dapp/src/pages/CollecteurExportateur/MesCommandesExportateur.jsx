import { useState, useEffect } from "react";
import { getCollecteurExportateurContract, getRoleOfAddress } from "../../utils/contract";
import { useUserContext } from '../../context/useContextt';
import { ShoppingCart, Hash, Package2, BadgeEuro, User, Truck, Wallet, Search, ChevronDown, Eye, Box } from "lucide-react";
import { getIPFSURL } from '../../utils/ipfsUtils';
import { useLocation, Link } from 'react-router-dom';
import { getLotProduitEnrichi } from "../../utils/collecteurExporatateur";

function MesCommandesExportateur({ onlyPaid = false }) {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modePaiement, setModePaiement] = useState(0); // 0 = VirementBancaire
  const [userRole, setUserRole] = useState(null);
  const { account } = useUserContext();
  const [search, setSearch] = useState("");
  const [paiementFiltre, setPaiementFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [expandedId, setExpandedId] = useState(null);
  const location = useLocation();

  // Déterminer si on est sur la page stock
  const isStockPage = location.pathname === '/stock';

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

        // Obtenir le nombre total de commandes
        const compteurCommandesRaw = await contract.getCompteurCommande();
        const compteurCommandes = Number(compteurCommandesRaw);
        
        // Charger toutes les commandes
        const commandesTemp = [];
        for (let i = 1; i <= compteurCommandes; i++) {
          const commandeRaw = await contract.getCommande(i);

          // Normaliser adresses
          const exportateurAddr = commandeRaw.exportateur?.toString?.() || commandeRaw.exportateur || "";
          const collecteurAddr = commandeRaw.collecteur?.toString?.() || commandeRaw.collecteur || "";
          if (!exportateurAddr) continue;
          
          // Vérifier si la commande appartient à l'exportateur connecté
          if (exportateurAddr.toLowerCase() === account.toLowerCase()) {
            // Normaliser types primitifs
            const idLotProduitNum = Number(commandeRaw.idLotProduit ?? 0);
            const produit = idLotProduitNum > 0 ? await getLotProduitEnrichi(idLotProduitNum) : {};

            let commandeEnrichie = {
              id: Number(commandeRaw.id ?? i),
              idLotProduit: idLotProduitNum,
              quantite: Number(commandeRaw.quantite ?? 0),
              prix: Number(commandeRaw.prix ?? 0),
              payer: Boolean(commandeRaw.payer),
              statutTransport: Number(commandeRaw.statutTransport ?? 0),
              statutProduit: Number(commandeRaw.statutProduit ?? 0),
              collecteur: collecteurAddr,
              exportateur: exportateurAddr,
              nomProduit: produit?.nom || "",
              cid: produit.cid || "",
              hashMerkle: produit.hashMerkle || ""
            };

            // Charger les données IPFS si un CID existe
            if (commandeEnrichie.cid) {
              try {
                const response = await fetch(getIPFSURL(commandeEnrichie.cid));
                if (response.ok) {
                  const ipfsData = await response.json();
                  const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                  commandeEnrichie = {
                    ...commandeEnrichie,
                    nomProduit: root.nomProduit || produit?.nom || commandeEnrichie.nomProduit,
                    ipfsTimestamp: ipfsData.timestamp,
                    ipfsVersion: ipfsData.version,
                    produitHashMerkle: root.produitHashMerkle || ipfsData.produitHashMerkle || "",
                    ipfsRoot: root,
                    ipfsType: root.type || ipfsData.type || null
                  };
                }
              } catch (ipfsError) {
                console.log(`Erreur lors du chargement IPFS pour la commande ${i}:`, ipfsError);
              }
            }
            
            commandesTemp.push(commandeEnrichie);
          }
        }
        
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
  }, [account, userRole]);

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

  const handleValiderCommande = async (commandeId) => {
    try {
      const contract = await getCollecteurExportateurContract();
      const tx = await contract.mettreAJourStatutCommande(Number(commandeId), 1);
      await tx.wait();
      // Mettre à jour localement le statutProduit
      const next = commandes.map(c => c.id === commandeId ? { ...c, statutProduit: 1 } : c);
      setCommandes(next);
    } catch (e) {
      console.error("Erreur lors de la validation de la commande:", e);
      setError(e?.reason || e?.data?.message || e?.message || "Erreur lors de la validation de la commande");
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

  const getStatutProduit = (statut) => {
    switch(Number(statut)) {
      case 0: return "En attente";
      case 1: return "Valider";
      case 2: return "Rejeter";
      default: return "Inconnu";
    }
  };

  const getStatutTransportColor = (statut) => {
    switch(Number(statut)) {
      case 0: return "text-secondary";
      case 1: return "text-success";
      default: return "text-info";
    }
  };

  const getStatutProduitColor = (statut) => {
    switch(Number(statut)) {
      case 0: return "text-secondary";
      case 1: return "text-success";
      case 2: return "text-danger";
      default: return "text-info";
    }
  };

  // Filtrage commandes selon recherche et paiement
  const commandesFiltres = commandes.filter((commande) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (commande.nomProduit && commande.nomProduit.toLowerCase().includes(searchLower)) ||
      (commande.id && commande.id.toString().includes(searchLower)) ||
      (commande.idLotProduit && commande.idLotProduit.toString().includes(searchLower)) ||
      (commande.prix && commande.prix.toString().includes(searchLower));
    
    // Si on est sur la page stock, filtrer seulement les commandes payées
    if (isStockPage) {
      return matchSearch && commande.payer;
    }
    
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
          <h2 className="h5 mb-3">
            {isStockPage ? "Stock - Commandes Payées" : "Mes Commandes Exportateur"}
          </h2>
          
          {/* Statistiques IPFS */}
          <div className="row">
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-primary" />
                <span className="small">
                  <strong>{commandes.filter(c => c.cid).length}</strong> commandes avec données IPFS
                </span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-warning" />
                <span className="small">
                  <strong>{commandes.filter(c => c.hashMerkle).length}</strong> commandes avec hash Merkle
                </span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <ShoppingCart size={20} className="me-2 text-success" />
                <span className="small">
                  <strong>{isStockPage ? commandes.filter(c => c.payer).length : commandes.length}</strong> {isStockPage ? "commandes payées" : "commandes au total"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : commandes.length === 0 ? (
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
                    <ShoppingCart size={36} />
                  </div>
                  <h5 className="card-title text-center mb-3">{commande.nomProduit}</h5>
                  <div className="card-text small">
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Commande:</strong> {commande.id}</p>
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Lot Produit:</strong> {commande.idLotProduit}</p>
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
                    <p className={`fw-semibold d-flex align-items-center ${getStatutProduitColor(commande.statutProduit)}`}
                      style={{gap: 6}}>
                      <Box size={16} className="me-1" />
                      <strong>Status:</strong> {getStatutProduit(commande.statutProduit)}
                    </p>
                    
                    {/* Informations IPFS et Merkle */}
                    {commande.cid && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <p className="mb-1 small">
                          <Hash size={14} className="me-1 text-primary" />
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
                          <p className="mb-1 small">
                            <Hash size={14} className="me-1 text-warning" />
                            <strong>Hash Merkle:</strong> 
                            <span className="ms-2 text-muted" title={commande.hashMerkle}>
                              {commande.hashMerkle.substring(0, 10)}...
                            </span>
                          </p>
                        )}
                        
                        {commande.ipfsTimestamp && (
                          <p className="mb-1 small text-muted">
                            <strong>Mise à jour IPFS:</strong> {new Date(commande.ipfsTimestamp).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    {!isStockPage && !commande.payer && commande.statutProduit === 1 && (
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
                    {!isStockPage && Number(commande.statutTransport) === 1 && Number(commande.statutProduit) !== 1 && (
                      <button
                        onClick={() => handleValiderCommande(commande.id)}
                        className="btn btn-success btn-sm"
                      >
                        Valider la commande
                      </button>
                    )}
                    {isStockPage && commande.payer && (
                      <Link
                        to={`/stock/${commande.id}`}
                        className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                      >
                        <Eye size={16} />
                        Voir détails
                      </Link>
                    )}
                    {commande.cid && (
                      <button
                        onClick={() => setExpandedId(expandedId === commande.id ? null : commande.id)}
                        className="btn btn-outline-primary btn-sm"
                      >
                        {expandedId === commande.id ? 'Masquer détails IPFS' : 'Voir détails IPFS'}
                      </button>
                    )}
                  </div>
                  {expandedId === commande.id && commande.ipfsRoot && (
                    <div className="mt-3">
                      <div className="alert alert-secondary" role="alert" style={{ whiteSpace: 'pre-wrap' }}>
                        <div className="mb-2"><strong>Type:</strong> {commande.ipfsType || 'inconnu'}</div>
                        <pre className="mb-0" style={{ maxHeight: 240, overflow: 'auto' }}>{JSON.stringify(commande.ipfsRoot, null, 2)}</pre>
                      </div>
                    </div>
                  )}
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