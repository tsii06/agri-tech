import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getCollecteurExportateurContract } from "../../utils/contract";
import { getRoleName } from "../../components/Layout/Header";
import { useParams } from "react-router-dom";
import { Box, Hash, Package2, BadgeEuro, Calendar, FileCheck2, BadgeCheck, BadgeX, Search, ChevronDown } from "lucide-react";
import { useUserContext } from '../../context/useContextt';
import { hasRole } from '../../utils/roles';

function ListeProduits() {
  const { address } = useParams();
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
          if (cible && produit.collecteur.toLowerCase() !== cible) continue;
          produitsTemp.push({
            id: i,
            idRecolte: produit.idRecolte.toString(),
            nom: produit.nom,
            quantite: produit.quantite.toString(),
            prixUnit: produit.prixUnit.toString(),
            statut: Number(produit.statut),
            dateRecolte: produit.dateRecolte,
            certificatPhytosanitaire: produit.certificatPhytosanitaire,
            collecteur: produit.collecteur.toString()
          });
        }
        produitsTemp.reverse();
        setProduits(produitsTemp);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    chargerProduits();
  }, [address, account, _]);

  const handleModifierPrix = async (produitId) => {
    try {
      const contract = await getCollecteurExportateurContract();
      
      // Vérifier que le nouveau prix est valide
      const prix = Number(nouveauPrix);
      if (isNaN(prix) || prix <= 0) {
        setError("Veuillez entrer un prix valide");
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
    } catch (error) {
      console.error("Erreur lors de la modification du prix:", error);
      setError(error.message);
    }
  };

  const handleValiderProduit = async (produitId) => {
    try {
      const contract = await getCollecteurExportateurContract();
      
      // Valider le produit (true pour valider, false pour rejeter)
      const tx = await contract.validerProduit(produitId, true);
      await tx.wait();
      
      // Mettre à jour l'état local
      const produitsTemp = [...produits];
      const index = produitsTemp.findIndex(p => p.id === produitId);
      if (index !== -1) {
        produitsTemp[index].statut = 1; // 1 = Validé
        setProduits(produitsTemp);
      }
    } catch (error) {
      console.error("Erreur lors de la validation du produit:", error);
      setError(error.message);
    }
  };

  const getStatutProduit = (statut) => {
    switch(Number(statut)) {
      case 0: return "En attente";
      case 1: return "Validé";
      case 2: return "Rejeté";
      default: return "Inconnu";
    }
  };

  const getStatutProduitColor = (statut) => {
    switch(Number(statut)) {
      case 0: return "text-warning";
      case 1: return "text-success";
      case 2: return "text-danger";
      default: return "text-secondary";
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
    } catch (error) {
      setError(error.message);
    }
  };

  if (!account && !address) {
    return <div className="text-center text-muted">Veuillez connecter votre wallet pour voir les produits.</div>;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des produits: {error}
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
          <h2 className="h5 mb-0">{address ? "Produits du collecteur" : "Liste des Produits"}</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : produits.length === 0 ? (
          <div className="text-center text-muted">
            Vous n'avez pas encore de produits.
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
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Récolte:</strong> {produit.idRecolte}</p>
                    <p><Package2 size={16} className="me-2 text-success" /><strong>Quantité:</strong> {produit.quantite} kg</p>
                    <p><BadgeEuro size={16} className="me-2 text-success" /><strong>Prix unitaire:</strong> {produit.prixUnit} Ar</p>
                    <p><Calendar size={16} className="me-2 text-success" /><strong>Date de récolte:</strong> {produit.dateRecolte}</p>
                    <p><FileCheck2 size={16} className="me-2 text-success" /><strong>Certificat phytosanitaire:</strong> {produit.certificatPhytosanitaire}</p>
                    <p className={`fw-semibold d-flex align-items-center ${getStatutProduitColor(produit.statut)}`}
                      style={{gap: 6}}>
                      {produit.statut === 1 ? <BadgeCheck size={16} className="me-1" /> : produit.statut === 2 ? <BadgeX size={16} className="me-1" /> : <Hash size={16} className="me-1" />}
                      <strong>Statut:</strong> {getStatutProduit(produit.statut)}
                    </p>
                  </div>
                  <div className="mt-3">
                    {hasRole(roles, 3) && produit.statut === 1 && (
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
                    {hasRole(roles, 6) && produit.statut === 0 && (
                      <button
                        onClick={() => handleValiderProduit(produit.id)}
                        className="btn-agrichain-outline"
                      >
                        Valider le produit
                      </button>
                    )}
                    {hasRole(roles, 6) && produit.statut === 1 && (
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
                  disabled={!quantiteCommande || Number(quantiteCommande) <= 0 || Number(quantiteCommande) > Number(produitSelectionne.quantite)}
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