import { URL_BLOCK_SCAN } from "../../utils/contract";
import { getIPFSURL } from "../../utils/ipfsUtils";
import IntrantsDisplay from "./IntrantsDisplay";

const RecolteCard = ({ recolte }) => {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="card-title mb-0">Récolte #{recolte.id}</h5>
        <div>
          {recolte.cid && recolte.hashTransaction ? (
            <span className="badge bg-success me-1">IPFS + Merkle</span>
          ) : recolte.cid ? (
            <span className="badge bg-warning me-1">IPFS uniquement</span>
          ) : (
            <span className="badge bg-secondary me-1">
              Données non consolidées
            </span>
          )}
          {/* Indicateur source des intrants */}
          {recolte.intrantsSource === "IPFS_STORED" && (
            <span
              className="badge bg-info me-1"
              title="Intrants stockés directement dans IPFS pour cette récolte"
            >
              📦 Intrants IPFS
            </span>
          )}
          {recolte.intrantsSource === "DYNAMIC_CALC" && (
            <span
              className="badge bg-light text-dark me-1"
              title="Intrants calculés dynamiquement à partir des parcelles"
            >
              🔄 Calcul dynamique
            </span>
          )}
          {recolte.certifie ? (
            <span className="badge bg-success">Certifiée</span>
          ) : (
            <span className="badge bg-warning">Non certifiée</span>
          )}
        </div>
      </div>

      <div className="card-text">
        <p>
          <strong>Produit:</strong> {recolte.nomProduit}
        </p>
        <p>
          <strong>Quantité:</strong> {recolte.quantite} kg
        </p>
        <p>
          <strong>Prix unitaire:</strong> {recolte.prixUnit} Ariary
        </p>
        <p>
          <strong>Date de récolte:</strong> {recolte.dateRecolte}
        </p>

        {/* Afficher la saison dynamique */}
        {recolte.saison && (
          <p>
            <strong>Culture:</strong>
            <span className="badge bg-info text-dark ms-2">
              {recolte.saison.nom}
              {recolte.numeroRecolte && (
                <span className="ms-1">(Récolte #{recolte.numeroRecolte})</span>
              )}
            </span>
            {recolte.saison.dureeCultureJours && (
              <small className="text-muted ms-2">
                ({recolte.saison.dureeCultureJours} jours de culture)
              </small>
            )}
          </p>
        )}

        {/* Afficher les intrants utilisés avec le composant dédié */}
        <IntrantsDisplay
          intrants={recolte.intrantsUtilises}
          maxVisible={3}
          dateRecolte={recolte.dateRecolteOriginal}
          dateRecoltePrecedente={recolte.dateRecoltePrecedente}
        />

        <p>
          <strong>Producteur:</strong> {recolte.producteur.nom}
        </p>
        <p>
          <strong>Hash transaction:</strong>&nbsp;
          <a href={URL_BLOCK_SCAN + recolte.hashTransaction} target="_blank">
            {recolte.hashTransaction?.slice(0, 6)}...
            {recolte.hashTransaction?.slice(-4)}
          </a>
        </p>

        {recolte.cidCalendrierCultural && (
          <p>
            <strong>Calendrier cultural:</strong>{" "}
            <a
              href={getIPFSURL(recolte.cidCalendrierCultural)}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-2 text-decoration-none text-success"
            >
              {recolte.cidCalendrierCultural?.slice(0, 6)}...
              {recolte.cidCalendrierCultural?.slice(-4)}
            </a>
          </p>
        )}

        {recolte.certificatPhytosanitaire && (
          <p className="mt-2">
            <strong>Certificat phytosanitaire:</strong>
            <a
              href={getIPFSURL(recolte.certificatPhytosanitaire)}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-2 text-decoration-none text-success"
            >
              {recolte.certificatPhytosanitaire?.slice(0, 6)}...
              {recolte.certificatPhytosanitaire?.slice(-4)}
            </a>
          </p>
        )}
      </div>
    </>
  );
};

export default RecolteCard;
