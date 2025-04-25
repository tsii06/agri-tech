import React from 'react';
import { Link } from 'react-router-dom';

const ParcelleCard = ({ 
  parcelle, 
  userRole, // 'producteur', 'collecteur', 'exportateur', 'certificateur'
  onRecolter 
}) => {
  const {
    id,
    produit,
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
    if (userRole === 0) {
      links.push(
        <Link key="photos" to={`/parcelle/${id}/photos`} className="btn btn-link">
          Photos
        </Link>,
        <Link key="recolter" to={`/parcelle/${id}/faire-recolte`} className="btn btn-link">
          Récolter
        </Link>
      );
    }

    // Liens pour le collecteur
    if (userRole === 1) {
      links.push(
        <Link key="intrants" to={`/parcelle/${id}/intrants`} className="btn btn-link">
          Intrants
        </Link>
      );
    }

    // Liens pour le certificateur
    if (userRole === 2) {
      links.push(
        <Link key="inspections" to={`/parcelle/${id}/inspections`} className="btn btn-link">
          Inspections
        </Link>
      );
    }

    return links;
  };

  return (
    <div className="card shadow-sm p-3">
      <h5 className="card-title">{produit}</h5>
      <div className="card-text">
        <p><strong>Id de la parcelle:</strong> {id}</p>
        <p><strong>Qualité des semences:</strong> {qualiteSemence}</p>
        <p><strong>Méthode de culture:</strong> {methodeCulture}</p>
        <p><strong>Localisation:</strong> {latitude}, {longitude}</p>
        <p><strong>Date de récolte prévue:</strong> {dateRecolte}</p>
        {certificatPhytosanitaire && (
          <p><strong>Certificat phytosanitaire:</strong> {certificatPhytosanitaire}</p>
        )}
      </div>
      <div className="d-flex justify-content-between mt-2">
        {renderLinks()}
      </div>
    </div>
  );
};

export default ParcelleCard;
