import React from 'react';
import { validateIntrantForHarvest } from '../../utils/ipfsUtils';

const IntrantsDisplay = ({ intrants, maxVisible = 3, dateRecolte, dateRecoltePrecedente }) => {
  if (!intrants || intrants.length === 0) {
    return (
      <div className="mb-2">
        <strong>Intrants utilisés:</strong>
        <div className="mt-1">
          <span className="badge bg-light text-muted">Aucun intrant enregistré</span>
        </div>
      </div>
    );
  }

  // Fonction pour formater la période d'application
  const formatPeriodeApplication = () => {
    if (!dateRecolte) return "";
    const dateDebut = dateRecoltePrecedente ? 
      new Date(dateRecoltePrecedente).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) :
      "Début parcelle";
    const dateFin = new Date(dateRecolte).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    return `Période: ${dateDebut} → ${dateFin}`;
  };

  return (
    <div className="mb-2">
      <strong>Intrants utilisés:</strong>
      {dateRecolte && (
        <div className="mt-1 mb-1">
          <small className="text-muted">{formatPeriodeApplication()}</small>
        </div>
      )}
      <div className="mt-1">
        {intrants.slice(0, maxVisible).map((intrant, index) => {
          // Utiliser la fonction de validation dédiée
          const conformeRegle = validateIntrantForHarvest(intrant, dateRecolte, dateRecoltePrecedente);
          
          let badgeClass = "bg-secondary";
          if (dateRecolte) {
            badgeClass = conformeRegle ? "bg-success" : "bg-warning text-dark";
          }
          
          const tooltipText = `${intrant.nom || intrant.type || 'Intrant'} - Ajouté le: ${intrant.dateAjout || 'Date inconnue'}${intrant.quantite ? ` - Quantité: ${intrant.quantite}` : ''}${intrant.unite ? ` ${intrant.unite}` : ''}${intrant.description ? ` - ${intrant.description}` : ''}${dateRecolte ? (conformeRegle ? ' ✓ Conforme à la règle' : ' ⚠️ Hors période réglementaire') : ''}`;
          
          return (
            <span 
              key={index} 
              className={`badge ${badgeClass} me-1 mb-1`}
              title={tooltipText}
              style={{ cursor: 'help' }}
            >
              {intrant.nom || intrant.type || 'Intrant'}
              {intrant.quantite && (
                <small className="ms-1">({intrant.quantite}{intrant.unite || ''})</small>
              )}
              {dateRecolte && !conformeRegle && <span className="ms-1">⚠️</span>}
            </span>
          );
        })}
        {intrants.length > maxVisible && (
          <span 
            className="badge bg-light text-dark"
            title={`Autres intrants: ${intrants.slice(maxVisible).map(i => i.nom || i.type || 'Intrant').join(', ')}`}
            style={{ cursor: 'help' }}
          >
            +{intrants.length - maxVisible} autres
          </span>
        )}
      </div>
    </div>
  );
};

export default IntrantsDisplay;