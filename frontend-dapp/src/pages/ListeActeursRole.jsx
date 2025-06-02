import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/useContextt";
import { getGestionnaireActeursContract } from "../utils/contract";
import { fetchFromIPFS } from "../utils/ipfs";

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6); // Nombre d'acteurs par page
  const [totalActeurs, setTotalActeurs] = useState(0);

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

  // Effet pour réinitialiser la page actuelle lorsque roleCible change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleCible]);

  useEffect(() => {
    if (roleCible === null) {
      setLoading(false);
      setActeurs([]); // Vider les acteurs si pas de rôle cible
      return;
    }
    setLoading(true);
    setError("");
    getGestionnaireActeursContract()
      .then(async (contract) => {
        const startIndex = (currentPage - 1) * pageSize;
        const { page: addresses, totalCount } = await contract.getActeursByRolePaginated(roleCible, startIndex, pageSize);

        setTotalActeurs(Number(totalCount)); // Assurez-vous que totalCount est un nombre

        const detailsList = [];
        for (let addr of addresses) {
          try {
            const details = await contract.getDetailsActeur(addr);

            const idBlockchain = details[0];
            // const roleNum = Number(details[1]); // Already known via roleCible, but can be kept if needed for other logic
            const estActif = details[2];
            const offChainDetailsHash = details[6];

            let nom = "Détails non fournis (pas de hash)";
            let email = "N/A";
            let telephone = "N/A";

            if (offChainDetailsHash && offChainDetailsHash.trim() !== "") {
              nom = "Chargement détails IPFS..."; // Initial placeholder while fetching
              try {
                const ipfsData = await fetchFromIPFS(offChainDetailsHash);
                if (ipfsData) {
                  nom = ipfsData.nom || "Nom non disponible (IPFS)";
                  email = ipfsData.email || "Email non disponible (IPFS)";
                  telephone = ipfsData.telephone || "Téléphone non disponible (IPFS)";
                } else {
                  nom = "Détails indisponibles (IPFS)";
                  email = "Erreur IPFS";
                  telephone = "Erreur IPFS";
                }
              } catch (ipfsError) {
                console.error("Error fetching IPFS data for actor " + addr + ":", ipfsError);
                nom = "Erreur chargement IPFS";
                email = "Erreur IPFS";
                telephone = "Erreur IPFS";
              }
            }

            detailsList.push({
              adresse: addr,
              nom: nom,
              email: email,
              telephone: telephone,
              actif: estActif,
              // role: roleNum,
              idBlockchain: idBlockchain,
            });
          } catch (e) {
            console.error("Erreur lors de la récupération des détails pour l'acteur " + addr + ":", e);
            // Optionnel: Pousser des données placeholder si getDetailsActeur échoue
            detailsList.push({
              adresse: addr,
              nom: "Erreur Contrat",
              email: "N/A",
              telephone: "N/A",
              actif: false,
              idBlockchain: "N/A",
            });
          }
        }
        setActeurs(detailsList);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des acteurs paginés:", err);
        setError("Erreur lors du chargement : " + (err?.reason || err?.message || "Erreur inconnue"));
        setActeurs([]); // Vider en cas d'erreur aussi
      })
      .finally(() => setLoading(false));
  }, [roleCible, currentPage, pageSize]);

  if (roleCible === null) {
    return <div className="container mt-4">Vous n'avez pas accès à cette page.</div>;
  }

  const totalPages = Math.ceil(totalActeurs / pageSize);

  return (
    <div className="container mt-4">
      <h2>{titre}</h2>
      {loading ? (
        <div>Chargement...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : acteurs.length === 0 && totalActeurs === 0 ? (
        <p>Aucun acteur trouvé pour ce rôle.</p>
      ) : (
        <>
          <div className="row">
            {acteurs.map((acteur) => (
              <div className="col-md-4 mb-3" key={acteur.adresse}>
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">{acteur.nom}</h5>
                    <p className="card-text">ID Blockchain: {acteur.idBlockchain}</p>
                    {/* <p className="card-text">Adresse : {acteur.adresse}</p> */}
                    <p className="card-text">Email : {acteur.email}</p>
                    <p className="card-text">Téléphone : {acteur.telephone}</p>
                    <p className="card-text">Actif : {acteur.actif ? "Oui" : "Non"}</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        if (role === 6) { // Exportateur voit Collecteurs
                          navigate(`/listeproduit/${acteur.adresse}`); // Navigue vers produits du collecteur
                        } else if (role === 3) { // Collecteur voit Producteurs
                          navigate(`/listerecolte/${acteur.adresse}`); // Navigue vers récoltes du producteur
                        }
                      }}
                      disabled={!acteur.actif} // Désactiver si l'acteur n'est pas actif
                    >
                      {boutonLabel}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalActeurs > pageSize && (
            <nav aria-label="Page navigation" className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                    Précédent
                  </button>
                </li>
                <li className="page-item disabled">
                  <span className="page-link">
                    Page {currentPage} sur {totalPages}
                  </span>
                </li>
                <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages}>
                    Suivant
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}