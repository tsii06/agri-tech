import { Link } from "react-router-dom";
import {
  MapPin,
  Package2,
  BadgeCheck,
  Calendar,
  FileCheck2,
  Hash,
  Database,
  AlertCircle,
  ShieldCheck,
  Fingerprint,
  User,
} from "lucide-react";
import { hasRole } from "../../utils/roles";
import { getIPFSURL } from "../../utils/ipfsUtils";
import { URL_BLOCK_SCAN } from "../../utils/contract";

const ParcelleCard = ({
  parcelle,
  userRole, // 'producteur', 'collecteur', 'exportateur', 'certificateur'
}) => {
  const {
    id,
    producteur,
    qualiteSemence,
    methodeCulture,
    location,
    dateRecolte,
    certificatPhytosanitaire,
    cid,
    hashTransaction,
    photos = [],
    intrants = [],
    inspections = [],
    ipfsTimestamp,
    ipfsVersion,
  } = parcelle;

  const renderLinks = () => {
    const links = [];

    // Liens pour le producteur
    if (hasRole(userRole, 0)) {
      links.push(
        <Link
          key="photos"
          to={`/parcelle/${id}/photos`}
          className="btn btn-link"
        >
          Photos ({photos.length})
        </Link>,
        <Link
          key="intrants-fournisseur"
          to={`/parcelle/${id}/intrants`}
          className="btn btn-link"
        >
          Intrants ({intrants.length})
        </Link>,
        <Link
          key="recolter"
          to={`/parcelle/${id}/faire-recolte`}
          className="btn btn-link"
        >
          Récolter
        </Link>
      );
    }

    // Liens pour le fournisseur
    if (hasRole(userRole, 1)) {
      links.push(
        <Link
          key="intrants-fournisseur"
          to={`/parcelle/${id}/intrants`}
          className="btn btn-link"
        >
          Intrants ({intrants.length})
        </Link>
      );
    }

    // Liens pour le certificateur
    if (hasRole(userRole, 2)) {
      links.push(
        <Link
          key="intrants-certificateur"
          to={`/parcelle/${id}/intrants`}
          className="btn btn-link"
        >
          Intrants ({intrants.length})
        </Link>
      );
    }

    // Liens pour le auditeur
    if (hasRole(userRole, 4)) {
      links.push(
        <Link
          key="inspections-auditeur"
          to={`/parcelle/${id}/inspections`}
          className="btn btn-link"
        >
          Inspections ({inspections.length})
        </Link>
      );
    }

    return links;
  };

  const renderStatusBadge = () => {
    if (cid && hashTransaction) {
      return (
        <span className="badge bg-success me-2">
          <Database size={12} className="me-1" />
          IPFS + Merkle
        </span>
      );
    } else if (cid) {
      return (
        <span className="badge bg-warning me-2">
          <Database size={12} className="me-1" />
          IPFS uniquement
        </span>
      );
    } else {
      return (
        <span className="badge bg-secondary me-2">
          <AlertCircle size={12} className="me-1" />
          Données non consolidées
        </span>
      );
    }
  };

  return (
    <div
      className="card shadow-sm p-3 position-relative"
      style={{ borderRadius: 16, boxShadow: "0 2px 12px 0 rgba(60,72,88,.08)" }}
    >
      {/* Badge Status in the top-right corner */}
      <div className="position-absolute" style={{ top: 10, right: 10 }}>
        {renderStatusBadge()}
      </div>

      <div
        className="d-flex justify-content-center align-items-center mt-4 mb-2"
        style={{ fontSize: 32, color: "#4d7c0f" }}
      >
        <MapPin size={36} />
      </div>

      <div className="d-flex justify-content-center mb-2">
        <h5 className="card-title mb-0">
          <strong>Parcelle#{id}</strong>
        </h5>
      </div>

      <div className="card-text">
        <p>
          <Package2 size={16} className="me-2 text-success" />
          <strong>Qualité des semences:</strong> {qualiteSemence}
        </p>

        <p>
          <BadgeCheck size={16} className="me-2 text-success" />
          <strong>Méthode de culture:</strong> {methodeCulture}
        </p>

        <p>
          <MapPin size={16} className="me-2 text-success" />
          <strong>Localisation:</strong>
          {location && location.lat && location.lng
            ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
            : "Non spécifiée"}
        </p>

        <p>
          <Calendar size={16} className="me-2 text-success" />
          <strong>Date de récolte prévue:</strong> {dateRecolte}
        </p>

        <p>
          <User size={16} className="me-2 text-success" />
          <strong>Producteur:</strong> {producteur?.nom || "N/A"}
        </p>

        <p>
          <Fingerprint size={16} className="me-2 text-success" />
          <strong>Hash transaction:</strong>&nbsp;
          <a href={URL_BLOCK_SCAN + hashTransaction} target="_blank">
            {hashTransaction?.slice(0, 6)}...
            {hashTransaction?.slice(-4)}
          </a>
        </p>

        {/* Certificat phytosanitaire */}
        {certificatPhytosanitaire && (
          <p className="mt-2">
            <FileCheck2 size={16} className="me-2 text-success" />
            <strong>Certificat phytosanitaire:</strong>
            <a
              href={getIPFSURL(certificatPhytosanitaire)}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-2 text-decoration-none text-success"
            >
              Voir ici
            </a>
          </p>
        )}

        {/* Statistiques de la parcelle */}
        <div className="mt-2 p-2 bg-light rounded">
          <div className="row text-center">
            <div className="col-4">
              <div className="text-primary fw-bold">{photos.length}</div>
              <div className="small text-muted">Photos</div>
            </div>
            <div className="col-4">
              <div className="text-success fw-bold">{intrants.length}</div>
              <div className="small text-muted">Intrants</div>
            </div>
            <div className="col-4">
              <div className="text-info fw-bold">{inspections.length}</div>
              <div className="small text-muted">Inspections</div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-3">{renderLinks()}</div>
    </div>
  );
};

export default ParcelleCard;
