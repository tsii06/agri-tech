import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/useContextt";
import { getGestionnaireActeursContract } from "../utils/contract";

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
  const { role } = useUserContext();
  const [acteurs, setActeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Détermine le rôle cible à afficher selon le rôle utilisateur
  let roleCible = null;
  let titre = "";
  let boutonLabel = "";
  if (role === 6) { // Exportateur
    roleCible = 3; // Collecteur
    titre = "Liste des Collecteurs";
    boutonLabel = "Voir produit";
  } else if (role === 3) { // Collecteur
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

  if (roleCible === null) {
    return <div className="container mt-4">Vous n'avez pas accès à cette page.</div>;
  }

  return (
    <div className="container mt-4">
      <h2>{titre}</h2>
      {loading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="row">
          {acteurs.map((acteur) => (
            <div className="col-md-4 mb-3" key={acteur.adresse}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{acteur.nom}</h5>
                  <p className="card-text">Adresse : {acteur.adresse}</p>
                  <p className="card-text">Email : {acteur.email}</p>
                  <p className="card-text">Téléphone : {acteur.telephone}</p>
                  <p className="card-text">Actif : {acteur.actif ? "Oui" : "Non"}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      if (role === 6) {
                        navigate(`/listeproduit/${acteur.adresse}`);
                      } else if (role === 3) {
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
  );
} 