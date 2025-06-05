import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Hash, Package2, BadgeCheck, Calendar, FileCheck2, Sprout } from "lucide-react";

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
    <div className="card shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
      <div className="d-flex justify-content-center align-items-center mb-2" style={{ fontSize: 32, color: '#4d7c0f' }}>
        <MapPin size={36} />
      </div>
      <h5 className="card-title text-center mb-3">{produit}</h5>
      <div className="card-text">
        <p><Hash size={16} className="me-2 text-success" /><strong>Id de la parcelle:</strong> {id}</p>
        <p><Sprout size={16} className="me-2 text-success" /><strong>Produit:</strong> {produit}</p>
        <p><Package2 size={16} className="me-2 text-success" /><strong>Qualité des semences:</strong> {qualiteSemence}</p>
        <p><BadgeCheck size={16} className="me-2 text-success" /><strong>Méthode de culture:</strong> {methodeCulture}</p>
        <p><MapPin size={16} className="me-2 text-success" /><strong>Localisation:</strong> {latitude}, {longitude}</p>
        <p><Calendar size={16} className="me-2 text-success" /><strong>Date de récolte prévue:</strong> {dateRecolte}</p>
        {certificatPhytosanitaire && (
          <p><FileCheck2 size={16} className="me-2 text-success" /><strong>Certificat phytosanitaire:</strong> {certificatPhytosanitaire}</p>
        )}
      </div>
      <div className="d-flex justify-content-between mt-2">
        {renderLinks()}
      </div>
    </div>
  );
};

export default ParcelleCard;
