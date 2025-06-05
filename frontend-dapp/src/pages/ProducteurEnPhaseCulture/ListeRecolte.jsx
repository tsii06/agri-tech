import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ethers } from "ethers";
import {  getCollecteurProducteurContract, getRoleOfAddress } from "../../utils/contract";
import { useUserContext } from '../../context/useContextt';
import { Leaf, Hash, Package2, BadgeEuro, Calendar, BadgeCheck, BadgeX, Search, ChevronDown } from "lucide-react";

function ListeRecoltes() {
  const { address } = useParams();
  const navigate = useNavigate();
  const [recoltes, setRecoltes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [acteur, setActeur] = useState({});
  const [_, setState] = useState({});
  const [quantiteCommande, setQuantiteCommande] = useState("");
  const [recolteSelectionnee, setRecolteSelectionnee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);

  const { role, account, verifeActeur } = useUserContext();

  const chargerRecoltes = async () => {
    try {
      const contract = await getCollecteurProducteurContract();
      let role = userRole;
      let cible = address ? address.toLowerCase() : (account ? account.toLowerCase() : null);
      if (!role && !address && account) {
        role = await getRoleOfAddress(account);
        setUserRole(role);
        
      }
      console.log(userRole);
      // Obtenir le nombre total de récoltes
      const compteurRecoltes = await contract.compteurRecoltes();
      const recoltesTemp = [];
      for (let i = 1; i <= compteurRecoltes; i++) {
        const recolte = await contract.getRecolte(i);
        if (address && recolte.producteur.toLowerCase() !== address.toLowerCase()) continue;
        recoltesTemp.push(recolte);
      }
      recoltesTemp.reverse();
      setRecoltes(recoltesTemp);
      // console.log(recoltesTemp);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role !== undefined && role !== null) {
      setUserRole(role);
    } else if (account && !address) {
      // Si le contexte n'a pas le rôle, on le récupère
      getRoleOfAddress(account).then(setUserRole);
    }
  }, [role, account, address]);

  useEffect(() => {
    if (!address && !account) return;
    chargerRecoltes();
  }, [address, account]);

  const handleCertifier = async (recolteId) => {
    try {
      const contract = await getCollecteurProducteurContract();
      const certificat = "Certificat de qualité"; // À remplacer par le vrai certificat
      const tx = await contract.certifieRecolte(recolteId, certificat);
      await tx.wait();
      
      chargerRecoltes();

    } catch (error) {
      console.error("Erreur lors de la certification:", error);
      setError(error.message);
    }
  };

  const handleCommander = async (recolteId) => {
    try {
      const contract = await getCollecteurProducteurContract();
      const recolte = recoltes.find(r => r.id === recolteId);
      
      // Vérifier que la quantité est valide
      const quantite = Number(quantiteCommande);
      if (isNaN(quantite) || quantite <= 0) {
        setError("Veuillez entrer une quantité valide");
        return;
      }
      
      if (quantite > Number(recolte.quantite)) {
        setError("La quantité demandée est supérieure à la quantité disponible");
        return;
      }
      
      // Passer la commande
      const tx = await contract.passerCommandeVersProducteur(
        recolteId,
        quantite
      );
      await tx.wait();
      
      // Rediriger vers la page des commandes
      navigate('/liste-collecteur-commande');
    } catch (error) {
      console.error("Erreur lors de la commande:", error);
      setError(error.message);
    }
  };

  const getStatutCertification = (certifie) => {
    return certifie ? "Certifié" : "Non certifié";
  };

  const getStatutCertificationColor = (certifie) => {
    return certifie ? "text-success" : "text-warning";
  };

  // Filtrage récoltes selon recherche et statut
  const recoltesFiltres = recoltes.filter((recolte) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (recolte.nomProduit && recolte.nomProduit.toLowerCase().includes(searchLower)) ||
      (recolte.idParcelle && recolte.idParcelle.toString().includes(searchLower)) ||
      (recolte.prixUnit && recolte.prixUnit.toString().includes(searchLower));
    const matchStatut =
      statutFiltre === "all" ||
      (statutFiltre === "certifie" && recolte.certifie) ||
      (statutFiltre === "noncertifie" && !recolte.certifie);
    return matchSearch && matchStatut;
  });
  const recoltesAffichees = recoltesFiltres.slice(0, visibleCount);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des récoltes: {error}
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
              {statutFiltre === 'all' && 'Toutes les récoltes'}
              {statutFiltre === 'certifie' && 'Certifiées'}
              {statutFiltre === 'noncertifie' && 'Non certifiées'}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownStatut">
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('all')}>Toutes les récoltes</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('certifie')}>Certifiées</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('noncertifie')}>Non certifiées</button></li>
            </ul>
          </div>
        </div>
        <div style={{ backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))", borderRadius: "8px", padding: "0.75rem 1.25rem", marginBottom: 16 }}>
          <h2 className="h5 mb-0">{address ? "Récoltes du producteur" : userRole === 0 ? "Mes Récoltes" : "Liste des Récoltes"}</h2>
        </div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          {!address && userRole === 0 && (
            <Link to="/mes-parcelles" className="btn btn-primary">
              Ajouter une récolte
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : recoltes.length === 0 ? (
          <div className="text-center text-muted">
            {userRole === 0 ? "Vous n'avez pas encore de récoltes enregistrées." : "Aucune récolte n'est enregistrée pour le moment."}
          </div>
        ) : recoltesFiltres.length === 0 ? (
          <div className="text-center text-muted">Aucune récolte ne correspond à la recherche ou au filtre.</div>
        ) : (
          <div className="row g-3">
            {recoltesAffichees.map((recolte) => (
              <div key={recolte.id} className="col-md-4">
                <div className="card border shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
                  <div className="d-flex justify-content-center align-items-center mb-2" style={{ fontSize: 32, color: '#4d7c0f' }}>
                    <Leaf size={36} />
                  </div>
                  <h5 className="card-title text-center mb-3">{recolte.nomProduit}</h5>
                  <div className="card-text small">
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Parcelle:</strong> {recolte.idParcelle}</p>
                    <p><Package2 size={16} className="me-2 text-success" /><strong>Quantité:</strong> {recolte.quantite} kg</p>
                    <p><BadgeEuro size={16} className="me-2 text-success" /><strong>Prix:</strong> {recolte.prixUnit} Ar</p>
                    <p><Calendar size={16} className="me-2 text-success" /><strong>Date de récolte:</strong> {recolte.dateRecolte}</p>
                    <p className={`fw-semibold d-flex align-items-center ${getStatutCertificationColor(recolte.certifie)}`}
                      style={{gap: 6}}>
                      {recolte.certifie ? <BadgeCheck size={16} className="me-1" /> : <BadgeX size={16} className="me-1" />}
                      <strong>Statut:</strong> {getStatutCertification(recolte.certifie)}
                    </p>
                  </div>
                  <div className="mt-3">
                    {userRole === 2 && !recolte.certifie && (
                      <button
                        onClick={() => handleCertifier(recolte.id)}
                        className="btn btn-sm btn-primary me-2"
                      >
                        Certifier
                      </button>
                    )}
                    {userRole === 3 && recolte.certifie && (
                      <button
                        onClick={() => {
                          setRecolteSelectionnee(recolte);
                          setShowModal(true);
                        }}
                        className="btn btn-sm btn-success"
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

      {recoltesAffichees.length < recoltesFiltres.length && (
        <div className="text-center mt-3">
          <button className="btn btn-outline-success" onClick={() => setVisibleCount(visibleCount + 9)}>
            Charger plus
          </button>
        </div>
      )}

      {/* Modal de commande */}
      {showModal && recolteSelectionnee && (
        <>
        <div className="modal-backdrop fade show"></div>

          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Commander {recolteSelectionnee.nomProduit}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Quantité disponible: {recolteSelectionnee.quantite} kg</label>
                    <input
                      type="number"
                      className="form-control"
                      value={quantiteCommande}
                      onChange={(e) => setQuantiteCommande(e.target.value)}
                      placeholder="Quantité à commander"
                    />
                  </div>
                  <div className="mb-3">
                    <p>Prix unitaire: {recolteSelectionnee.prixUnit} Ar</p>
                    <p>Total: {Number(quantiteCommande) * Number(recolteSelectionnee.prixUnit)} Ar</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCommander(recolteSelectionnee.id)}
                  >
                    Confirmer la commande
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

export default ListeRecoltes; 