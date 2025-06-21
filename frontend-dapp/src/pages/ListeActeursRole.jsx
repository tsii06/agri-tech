import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/useContextt";
import { getGestionnaireActeursContract } from "../utils/contract";
import { User, Mail, Phone, BadgeCheck, BadgeX, KeyRound, UserCheck, Search, ChevronDown } from "lucide-react";
import { hasRole } from '../utils/roles';

const ROLES = [
  "Producteur",
  "Fournisseur",
  "Certificateur",
  "Collecteur",
  "Auditeur",
  "Transporteur",
  "Exportateur",
  "Administration"
];

export default function ListeActeursRole() {
  const { roles } = useUserContext();
  const [acteurs, setActeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [actifFiltre, setActifFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);

  // Détermine le rôle cible à afficher selon les rôles utilisateur
  let roleCible = null;
  let titre = "";
  let boutonLabel = "";
  if (hasRole(roles, 6)) { // Exportateur
    roleCible = 3; // Collecteur
    titre = "Liste des Collecteurs";
    boutonLabel = "Voir produit";
  } else if (hasRole(roles, 3)) { // Collecteur
    roleCible = 0; // Producteur
    titre = "Liste des Producteurs";
    boutonLabel = "Voir récolte";
  }

  useEffect(() => {
    if (roleCible === null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    getGestionnaireActeursContract()
      .then(async (contract) => {
        const addresses = await contract.getActeursByRole(roleCible);
        const detailsList = [];
        for (let addr of addresses) {
          try {
            const details = await contract.getDetailsActeur(addr);
            detailsList.push({
              adresse: addr,
              nom: details[4],
              email: details[7],
              telephone: details[8],
              actif: details[2],
              role: details[1],
              idBlockchain: details[0],
            });
          } catch (e) {}
        }
        setActeurs(detailsList);
      })
      .catch((err) => setError("Erreur lors du chargement : " + (err?.reason || err?.message || err)))
      .finally(() => setLoading(false));
  }, [roleCible]);

  // Filtrage acteurs selon recherche et statut
  const acteursFiltres = acteurs.filter((acteur) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (acteur.nom && acteur.nom.toLowerCase().includes(searchLower)) ||
      (acteur.email && acteur.email.toLowerCase().includes(searchLower)) ||
      (acteur.telephone && acteur.telephone.toLowerCase().includes(searchLower)) ||
      (acteur.adresse && acteur.adresse.toLowerCase().includes(searchLower)) ||
      (acteur.idBlockchain && acteur.idBlockchain.toLowerCase().includes(searchLower));
    const matchActif =
      actifFiltre === "all" ||
      (actifFiltre === "actif" && acteur.actif) ||
      (actifFiltre === "inactif" && !acteur.actif);
    return matchSearch && matchActif;
  });
  const acteursAffiches = acteursFiltres.slice(0, visibleCount);

  if (roleCible === null) {
    return <div className="container mt-4">Vous n'avez pas accès à cette page.</div>;
  }

  return (
    <div className="container mt-4">
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
            <button className="btn btn-outline-success dropdown-toggle d-flex align-items-center" type="button" id="dropdownActif" data-bs-toggle="dropdown" aria-expanded="false">
              <ChevronDown size={16} className="me-1" />
              {actifFiltre === 'all' && 'Tous les statuts'}
              {actifFiltre === 'actif' && 'Actifs'}
              {actifFiltre === 'inactif' && 'Inactifs'}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownActif">
              <li><button className="dropdown-item" onClick={() => setActifFiltre('all')}>Tous les statuts</button></li>
              <li><button className="dropdown-item" onClick={() => setActifFiltre('actif')}>Actifs</button></li>
              <li><button className="dropdown-item" onClick={() => setActifFiltre('inactif')}>Inactifs</button></li>
            </ul>
          </div>
        </div>
        <div style={{ backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))", borderRadius: "8px", padding: "0.75rem 1.25rem", marginBottom: 16 }}>
          <h2 className="h5 mb-0">{titre}</h2>
        </div>
        {loading ? (
          <div>Chargement...</div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : acteurs.length === 0 ? (
          <div className="text-center text-muted">Aucun acteur ne correspond à la recherche ou au filtre.</div>
        ) : acteursFiltres.length === 0 ? (
          <div className="text-center text-muted">Aucun acteur ne correspond à la recherche ou au filtre.</div>
        ) : (
          <div className="row">
            {acteursAffiches.map((acteur) => (
              <div className="col-md-4 mb-3" key={acteur.adresse}>
                <div className="card shadow-sm" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
                  <div className="d-flex justify-content-center align-items-center mb-2" style={{ fontSize: 32, color: '#4d7c0f' }}>
                    <User size={36} />
                  </div>
                  <div className="card-body">
                    <h5 className="card-title text-center mb-3">{acteur.nom}</h5>
                    <p><KeyRound size={16} className="me-2 text-success" /><strong>ID Blockchain:</strong> {acteur.idBlockchain}</p>
                    <p><UserCheck size={16} className="me-2 text-success" /><strong>Rôle:</strong> {acteur.role}</p>
                    <p><Mail size={16} className="me-2 text-success" /><strong>Email:</strong> {acteur.email}</p>
                    <p><Phone size={16} className="me-2 text-success" /><strong>Téléphone:</strong> {acteur.telephone}</p>
                    <p><strong>Adresse:</strong> {acteur.adresse}</p>
                    <p className="fw-semibold d-flex align-items-center" style={{gap: 6}}>
                      {acteur.actif ? <BadgeCheck size={16} className="me-1 text-success" /> : <BadgeX size={16} className="me-1 text-danger" />}
                      <strong>Actif:</strong> {acteur.actif ? "Oui" : "Non"}
                    </p>
                    <button
                      className="btn-agrichain"
                      onClick={() => {
                        if (hasRole(roles, 6)) {
                          navigate(`/listeproduit/${acteur.adresse}`);
                        } else if (hasRole(roles, 3)) {
                          navigate(`/listerecolte/${acteur.adresse}`);
                        }
                      }}
                    >
                      {boutonLabel}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {acteursAffiches.length < acteursFiltres.length && (
        <div className="text-center mt-3">
          <button className="btn-agrichain-outline" onClick={() => setVisibleCount(visibleCount + 9)}>
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
} 