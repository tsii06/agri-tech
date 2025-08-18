import { useState, useEffect } from "react";
import { getCollecteurExportateurContract } from "../../utils/contract";
import { useParams } from "react-router-dom";
import { Box, Hash, Package2, BadgeEuro, Calendar, FileCheck2, Search, ChevronDown, User } from "lucide-react";
import { useUserContext } from '../../context/useContextt';
import { hasRole } from '../../utils/roles';
import { getIPFSURL } from '../../utils/ipfsUtils';

function ListeProduits() {
  const { address } = useParams();
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState(null);
  const [_, setState] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const [nouveauPrix, setNouveauPrix] = useState("");
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [quantiteCommande, setQuantiteCommande] = useState("");
  const { roles, account } = useUserContext();

  useEffect(() => {
    if (!account && !address) {
      setIsLoading(false);
      return;
    }
    const chargerProduits = async () => {
      try {
        const contract = await getCollecteurExportateurContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        let cible = address ? address.toLowerCase() : (account ? account.toLowerCase() : null);
        
        // Obtenir le nombre total de produits
        const compteurProduits = await contract.getCompteurProduit();
        const produitsTemp = [];
        
        for (let i = 1; i <= compteurProduits; i++) {
          const produit = await contract.getProduit(i);
          if (hasRole(roles, 3) && cible && produit.collecteur.toLowerCase() !== cible) continue;
          
          let produitEnrichi = {
            id: i,
            idRecolte: produit.idRecolte.toString(),
            nom: produit.nom,
            quantite: produit.quantite.toString(),
            prixUnit: produit.prixUnit.toString(),
            statut: Number(produit.statut),
            dateRecolte: produit.dateRecolte,
            certificatPhytosanitaire: produit.certificatPhytosanitaire,
            collecteur: produit.collecteur.toString(),
            cid: produit.cid || "",
            hashMerkle: produit.hashMerkle || ""
          };

          // Charger les données IPFS si un CID existe
          if (produit.cid) {
            try {
              const response = await fetch(getIPFSURL(produit.cid));
              if (response.ok) {
                const ipfsData = await response.json();
                produitEnrichi = {
                  ...produitEnrichi,
                  nom: ipfsData.nom || produit.nom,
                  dateRecolte: ipfsData.dateRecolte || produit.dateRecolte,
                  ipfsTimestamp: ipfsData.timestamp,
                  ipfsVersion: ipfsData.version,
                  recolteHashMerkle: ipfsData.recolteHashMerkle || ""
                };
              }
            } catch (ipfsError) {
              console.log(`Erreur lors du chargement IPFS pour le produit ${i}:`, ipfsError);
            }
          }
          
          produitsTemp.push(produitEnrichi);
        }
        
        produitsTemp.reverse();
        setProduits(produitsTemp);
        setError(false);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
        setError("Erreur lors du chargement des produits");
      } finally {
        setIsLoading(false);
      }
    };
    chargerProduits();
  }, [address, account, _, roles]);

  const handleModifierPrix = async (produitId) => {
    setBtnLoading(true);
    try {
      const contract = await getCollecteurExportateurContract();

      // Vérifier que le nouveau prix est valide
      const prix = Number(nouveauPrix);
      if (isNaN(prix) || prix <= 0) {
        alert("Veuillez entrer un prix valide");
        return;
      }

      // Modifier le prix
      const tx = await contract.setPriceProduit(
        produitId,
        prix
      );
      await tx.wait();

      // Mettre à jour l'état local
      const produitsTemp = [...produits];
      const index = produitsTemp.findIndex(p => p.id === produitId);
      if (index !== -1) {
        produitsTemp[index].prixUnit = prix.toString();
        setProduits(produitsTemp);
      }

      // Fermer le modal
      setShowModal(false);
      setProduitSelectionne(null);
      setNouveauPrix("");
      setError(false);
    } catch (error) {
      console.error("Erreur lors de la modification du prix:", error);
      setError("Erreur lors de la modification du prix. Veuillez réessayer plus tard.");
    } finally {
      setBtnLoading(false);
    }
  };

  // Filtrage produits selon recherche et statut
  const produitsFiltres = produits.filter((produit) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (produit.nom && produit.nom.toLowerCase().includes(searchLower)) ||
      (produit.id && produit.id.toString().includes(searchLower));
    const matchStatut =
      statutFiltre === "all" ||
      (statutFiltre === "valide" && produit.statut === 1) ||
      (statutFiltre === "attente" && produit.statut === 0) ||
      (statutFiltre === "rejete" && produit.statut === 2);
    return matchSearch && matchStatut;
  });
  const produitsAffiches = produitsFiltres.slice(0, visibleCount);

  // Fonction pour commander un produit (exportateur)
  const handleCommanderProduit = async (produitId) => {
    setBtnLoading(true);
    try {
      const contract = await getCollecteurExportateurContract();
      // Vérifier la quantité
      const quantite = Number(quantiteCommande);
      if (isNaN(quantite) || quantite <= 0 || quantite > Number(produitSelectionne.quantite)) {
        setError("Veuillez entrer une quantité valide");
        return;
      }
      // Appel du smart contract pour commander
      const tx = await contract.passerCommande(
        produitId,
        quantite
      );
      await tx.wait();
      alert("Commande passée avec succès !");
      setShowModal(false);
      setProduitSelectionne(null);
      setQuantiteCommande("");
      // Optionnel : rafraîchir la liste
      setState({});
      setError(false);
    } catch (error) {
      console.error("Erreur lors de la commande d'un produit :", error.message);
      setError("Erreur lors de la commande d'un produit. Veuillez réessayer plus tard.");
    } finally {
      setBtnLoading(false);
    }
  };

  if (!account && !address) {
    return <div className="text-center text-muted">Veuillez connecter votre wallet pour voir les produits.</div>;
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
            <button className="btn btn-outline-success dropdown-toggle d-flex align-items-center" type="button" id="dropdownStatut" data-bs-toggle="dropdown" aria-expanded="false">
              <ChevronDown size={16} className="me-1" />
              {statutFiltre === 'all' && 'Tous les statuts'}
              {statutFiltre === 'valide' && 'Validés'}
              {statutFiltre === 'attente' && 'En attente'}
              {statutFiltre === 'rejete' && 'Rejetés'}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownStatut">
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('all')}>Tous les statuts</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('valide')}>Validés</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('attente')}>En attente</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('rejete')}>Rejetés</button></li>
            </ul>
          </div>
        </div>
        <div style={{ backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))", borderRadius: "8px", padding: "0.75rem 1.25rem", marginBottom: 16 }}>
          <h2 className="h5 mb-3">{address ? "Produits du collecteur" : "Liste des Produits"}</h2>
          
          {/* Statistiques IPFS */}
          <div className="row mb-3">
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-primary" />
                <span className="small">
                  <strong>{produits.filter(p => p.cid).length}</strong> produits avec données IPFS
                </span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-warning" />
                <span className="small">
                  <strong>{produits.filter(p => p.hashMerkle).length}</strong> produits avec hash Merkle
                </span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Package2 size={20} className="me-2 text-success" />
                <span className="small">
                  <strong>{produits.length}</strong> produits au total
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <div>{error}</div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : produits.length === 0 ? (
          <div className="text-center text-muted">
            Vous n&apos;avez pas encore de produits.
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div className="text-center text-muted">Aucun produit ne correspond à la recherche ou au filtre.</div>
        ) : (
          <div className="row g-3">
            {produitsAffiches.map((produit) => (
              <div key={produit.id} className="col-md-4">
                <div className="card border shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
                  <div className="d-flex justify-content-center align-items-center mb-2" style={{ fontSize: 32, color: '#4d7c0f' }}>
                    <Box size={36} />
                  </div>
                  <h5 className="card-title text-center mb-3">{produit.nom}</h5>
                  <div className="card-text small">
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Produit:</strong> {produit.id}</p>
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Récolte:</strong> {produit.idRecolte}</p>
                    <p><Package2 size={16} className="me-2 text-success" /><strong>Quantité:</strong> {produit.quantite} kg</p>
                    <p><BadgeEuro size={16} className="me-2 text-success" /><strong>Prix unitaire:</strong> {produit.prixUnit} Ar</p>
                    <p><Calendar size={16} className="me-2 text-success" /><strong>Date de récolte:</strong> {produit.dateRecolte}</p>
                    <p><User size={16} className="me-2 text-success" />
                      <strong>Collecteur:</strong>&nbsp;
                      {produit.collecteur.slice(0, 6)}...{produit.collecteur.slice(-4)}
                    </p>
                    <p><FileCheck2 size={16} className="me-2 text-success" /><strong>Certificat phytosanitaire:</strong>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${produit.certificatPhytosanitaire}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ms-2 text-decoration-none text-success"
                      >
                        Voir ici
                      </a>
                    </p>
                    
                    {/* Informations IPFS et Merkle */}
                    {produit.cid && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <p className="mb-1 small">
                          <Hash size={14} className="me-1 text-primary" />
                          <strong>CID IPFS:</strong> 
                          <a
                            href={getIPFSURL(produit.cid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ms-2 text-decoration-none text-primary"
                            title="Voir les données consolidées sur IPFS"
                          >
                            {produit.cid.substring(0, 10)}...
                          </a>
                        </p>
                        
                        {produit.hashMerkle && (
                          <p className="mb-1 small">
                            <Hash size={14} className="me-1 text-warning" />
                            <strong>Hash Merkle:</strong> 
                            <span className="ms-2 text-muted" title={produit.hashMerkle}>
                              {produit.hashMerkle.substring(0, 10)}...
                            </span>
                          </p>
                        )}
                        
                        {produit.ipfsTimestamp && (
                          <p className="mb-1 small text-muted">
                            <strong>Mise à jour IPFS:</strong> {new Date(produit.ipfsTimestamp).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    {hasRole(roles, 3) && (
                      <button
                        onClick={() => {
                          setProduitSelectionne(produit);
                          setNouveauPrix(produit.prixUnit);
                          setShowModal(true);
                        }}
                        className="btn btn-agrichain"
                      >
                        Modifier le prix
                      </button>
                    )}
                    {hasRole(roles, 6) && (
                      <button
                        onClick={() => {
                          setProduitSelectionne(produit);
                          setShowModal('commander');
                        }}
                        className="btn-agrichain"
                      >
                        Commander
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de modification du prix */}
      {showModal === true && produitSelectionne && (
        <>
          <div className="modal-backdrop fade show"></div>

          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Modifier le prix de {produitSelectionne.nom}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Prix actuel: {produitSelectionne.prixUnit} Ar</label>
                    <input
                      type="number"
                      className="form-control"
                      value={nouveauPrix}
                      onChange={(e) => setNouveauPrix(e.target.value)}
                      placeholder="Nouveau prix"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleModifierPrix(produitSelectionne.id)}
                    disabled={btnLoading}
                  >
                    Confirmer la modification
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Commander pour l'exportateur */}
      {showModal === 'commander' && produitSelectionne && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Commander {produitSelectionne.nom}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Quantité disponible: {produitSelectionne.quantite} kg</label>
                    <input
                      type="number"
                      className="form-control"
                      value={quantiteCommande || ''}
                      onChange={e => setQuantiteCommande(e.target.value)}
                      placeholder="Quantité à commander"
                    />
                  </div>
                  <div className="mb-3">
                    <p>Prix unitaire: {produitSelectionne.prixUnit} Ar</p>
                    <p>Total: {Number(quantiteCommande) * Number(produitSelectionne.prixUnit) || 0} Ar</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCommanderProduit(produitSelectionne.id)}
                    disabled={!quantiteCommande || Number(quantiteCommande) <= 0 || Number(quantiteCommande) > Number(produitSelectionne.quantite) || btnLoading}
                  >
                    Confirmer la commande
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {produitsAffiches.length < produitsFiltres.length && (
        <div className="text-center mt-3">
          <button className="btn btn-outline-success" onClick={() => setVisibleCount(visibleCount + 9)}>
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
}

export default ListeProduits; 