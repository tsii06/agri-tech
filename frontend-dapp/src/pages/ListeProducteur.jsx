import { Link } from "react-router-dom";
import ParcelleCard from "../components/Tools/ParcelleCard";


function MesParcelles() {

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-3">
        <h2 className="h4">Parcelles</h2>
        {userRole === 'producteur' && (
          <Link to="/creer-parcelle" className="btn btn-primary">
            Nouvelle Parcelle
          </Link>
        )}
      </div>

      {parcelles.length > 0 ? (
        <div className="row g-3">
          {parcelles.map((parcelle) => (
            <div key={parcelle.id} className="col-md-4">
              <ParcelleCard 
                parcelle={parcelle}
                userRole={role}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted">Aucune parcelle enregistrée.</p>
          {userRole === 'producteur' && (
            <Link to="/creer-parcelle" className="btn btn-primary">
              Créer une parcelle
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default MesParcelles; 