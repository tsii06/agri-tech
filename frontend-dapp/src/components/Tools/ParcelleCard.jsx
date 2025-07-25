import { Link } from 'react-router-dom';
import { MapPin, Package2, BadgeCheck, Calendar, FileCheck2 } from "lucide-react";
import { hasRole } from '../../utils/roles';

const ParcelleCard = ({
  parcelle,
  userRole, // 'producteur', 'collecteur', 'exportateur', 'certificateur'
}) => {
  const {
    id,
    qualiteSemence,
    methodeCulture,
    latitude,
    longitude,
    dateRecolte,
    certificatPhytosanitaire
  } = parcelle;

  const renderLinks = () => {
    const links = [];

    // Liens pour le producteur
    if (hasRole(userRole, 0)) {
      links.push(
        <Link key="photos" to={`/parcelle/${id}/photos`} className="btn btn-link">
          Photos
        </Link>,
        <Link key="recolter" to={`/parcelle/${id}/faire-recolte`} className="btn btn-link">
          Récolter
        </Link>
      );
    }

    // Liens pour le fournisseur
    if (hasRole(userRole, 1)) {
      links.push(
        <Link key="intrants-fournisseur" to={`/parcelle/${id}/intrants`} className="btn btn-link">
          Voir les intrants
        </Link>
      );
    }

    // Liens pour le certificateur
    if (hasRole(userRole, 2)) {
      links.push(
        <Link key="intrants-certificateur" to={`/parcelle/${id}/intrants`} className="btn btn-link">
          Voir les intrants
        </Link>
      );
    }

    return links;
  };

  return (
    <div className="card shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
      <div className="d-flex justify-content-center align-items-center mb-2" style={{ fontSize: 32, color: '#4d7c0f' }}>
        <MapPin size={36} />
      </div>
      <h5 className="card-title text-center mb-3"><strong>ID:</strong> {id}</h5>
      <div className="card-text">
        <p><Package2 size={16} className="me-2 text-success" /><strong>Qualité des semences:</strong> {qualiteSemence}</p>
        <p><BadgeCheck size={16} className="me-2 text-success" /><strong>Méthode de culture:</strong> {methodeCulture}</p>
        <p><MapPin size={16} className="me-2 text-success" /><strong>Localisation:</strong> {latitude}, {longitude}</p>
        <p><Calendar size={16} className="me-2 text-success" /><strong>Date de récolte prévue:</strong> {dateRecolte}</p>
        {certificatPhytosanitaire && (
          <p>
            <FileCheck2 size={16} className="me-2 text-success" />
            <strong>Certificat phytosanitaire:</strong>
            <a
              href={`https://gateway.pinata.cloud/ipfs/${certificatPhytosanitaire}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-2 text-decoration-none text-success"
            >
              Voir ici
            </a>
          </p>
        )}
      </div>
      <div className="d-flex justify-content-between mt-2">
        {renderLinks()}
      </div>
    </div>
  );
};

export default ParcelleCard;
