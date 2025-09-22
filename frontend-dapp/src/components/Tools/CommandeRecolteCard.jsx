import { Link } from "react-router-dom";
import { URL_BLOCK_SCAN } from "../../utils/contract";
import { hasRole } from "../../utils/roles";

const CommandeRecolteCard = ({
  commande,
  roles,
  commandeErrors = [],
  validerCommande = () => {},
  setDetailsCondition = () => {},
  setShowDetailsModal = () => {},
  setCommandeSelectionnee = () => {},
  setShowModal = () => {},
}) => {
  const getColorStatutRecolte = (status) => {
    switch (status) {
      case 0:
        return "bg-warning";
      case 1:
        return "bg-success";
      case 2:
        return "bg-danger";
    }
  };

  const getStatutRecolte = (status) => {
    switch (status) {
      case 0:
        return "En attente";
      case 1:
        return "Validé";
      case 2:
        return "Rejeté";
    }
  };

  const getStatutTransport = (statut) => {
    switch (statut) {
      case 0:
        return "En cours";
      case 1:
        return "Livré";
      default:
        return "Inconnu";
    }
  };

  return (
    <div
      className="card shadow-sm p-3"
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 12px 0 rgba(60,72,88,.08)",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="card-title mb-4">Commande #{commande.id}</h5>
      </div>

      <div className="card-text">
        <p>
          <strong>Produit:</strong> {commande.nomProduit}
        </p>
        <p>
          <strong>Récolte:</strong> #{commande.idRecolte}
        </p>
        <p>
          <strong>Quantité:</strong> {commande.quantite} kg
        </p>
        <p>
          <strong>Prix:</strong> {commande.prix} Ariary
        </p>
        <p>
          <strong>Date recolte :</strong> {commande.dateRecolte}
        </p>
        <p>
          <strong>Producteur:</strong> {commande.producteur?.nom || "N/A"}
        </p>

        <p>
          <strong>Transporteur:</strong> {commande.transporteur?.nom || "N/A"}
        </p>

        {commande.statutTransport === 1 && (
          <p>
            <strong>Hash transaction:</strong>{" "}
            <a
              href={URL_BLOCK_SCAN + commande.hashTransaction}
              target="_blank"
              rel="noopener noreferrer"
            >
              {commande.hashTransaction?.slice(0, 6)}...
              {commande.hashTransaction?.slice(-4)}
            </a>
          </p>
        )}

        {commande.ipfsWarning && (
          <p className="text-warning small mb-1">{commande.ipfsWarning}</p>
        )}

        {/* Statuts */}
        <div className="mt-3">
          <div className="d-flex gap-2">
            <span
              className={`badge ${getColorStatutRecolte(
                commande.statutRecolte
              )}`}
            >
              {getStatutRecolte(commande.statutRecolte)}
            </span>
            <span className="badge bg-info">
              {getStatutTransport(commande.statutTransport)}
            </span>
          </div>
        </div>
      </div>

      {/* Btn selon le role de l'user */}
      {/* Erreur du commande */}
      <div className="d-flex justify-content-between">
        {commandeErrors[commande.id] && (
          <div className="alert alert-danger mt-2 py-2 px-3" role="alert">
            {commandeErrors[commande.id]}
          </div>
        )}
      </div>
      {/* Lien vers liste de transporteur */}
      {!commande.payer && commande.statutTransport !== 1 && hasRole(roles, 3) && (
        <div className="mt-2">
          <Link
            to={`/liste-transporteur-commande-recolte/5/${commande.id}`}
            className="btn btn-outline-secondary btn-sm w-100"
          >
            Choisir transporteur
          </Link>
        </div>
      )}
      {commande.enregistrerCondition && (
        <div className="mt-2">
          <button
            className="btn btn-outline-success btn-sm w-100"
            onClick={() => {
              setDetailsCondition({
                temperature: commande.temperature || null,
                humidite: commande.humidite || null,
                cidRapportTransport: commande.cidRapportTransport || null,
                dureeTransport: commande.dureeTransport,
                lieuDepart: commande.lieuDepart,
                destination: commande.destination,
              });
              setShowDetailsModal(true);
            }}
          >
            Voir détails conditions
          </button>
        </div>
      )}
      {/* Afficher btn valider et rejeter si la commande a ete livrer avec success. */}
      {commande.statutRecolte === 0 && commande.statutTransport === 1 && hasRole(roles, 3) && (
        <div className="d-flex gap-1 mt-2">
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
      {/* afficher btn payer si la commande n'a pas encors ete payer et que la commande a ete valider */}
      {!commande.payer && commande.statutRecolte === 1 && hasRole(roles, 3) && (
        <div className="d-flex mt-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setCommandeSelectionnee(commande);
              setShowModal(true);
            }}
          >
            Payer
          </button>
        </div>
      )}
    </div>
  );
};

export default CommandeRecolteCard;
