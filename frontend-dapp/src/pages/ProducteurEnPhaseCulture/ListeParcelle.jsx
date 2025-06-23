import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getContract } from "../../utils/contract";
import ParcelleCard from "../../components/Tools/ParcelleCard";
import { useUserContext } from '../../context/useContextt';
import { Search, ChevronDown } from "lucide-react";
import {hasRole} from '../../utils/roles';


function MesParcelles() {
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [certifFiltre, setCertifFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);

  // Utilisation du tableau de rôles
  const { roles, account, verifeActeur } = useUserContext();

  useEffect(() => {
    if (account) {
      // console.log("dans useEffect :", roles);
      chargerParcelles();
    }
  }, [account]);


  const chargerParcelles = async () => {
    try {
      const contract = await getContract();
      const compteurParcelles = await contract.getCompteurParcelle();

      if (compteurParcelles === 0) {
        setParcelles([]);
        setLoading(false);
        return;
      }

      const parcellesPromises = [];
      let parcelle;
      for (let i = 1; i <= compteurParcelles; i++) {
        parcelle = await contract.getParcelle(i);

        // Afficher uniquement les parcelles de l'adresse connectée si c'est un producteur
        if(roles.includes(0))
          if (parcelle.producteur.toLowerCase() !== account.toLowerCase())
            continue;

        parcellesPromises.push(parcelle);
      }

      setParcelles(parcellesPromises);
      setError(null);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      setError("Impossible de charger les parcelles. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  
      // console.log("endehors useEffect :", roles);

  // Filtrage parcelles selon recherche et certificat
  const parcellesFiltres = parcelles.filter((parcelle) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (parcelle.produit && parcelle.produit.toLowerCase().includes(searchLower)) ||
      (parcelle.id && parcelle.id.toString().includes(searchLower)) ||
      (parcelle.qualiteSemence && parcelle.qualiteSemence.toLowerCase().includes(searchLower)) ||
      (parcelle.methodeCulture && parcelle.methodeCulture.toLowerCase().includes(searchLower));
    const matchCertif =
      certifFiltre === "all" ||
      (certifFiltre === "avec" && parcelle.certificatPhytosanitaire) ||
      (certifFiltre === "sans" && !parcelle.certificatPhytosanitaire);
    return matchSearch && matchCertif;
  });
  const parcellesAffichees = parcellesFiltres.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={chargerParcelles}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between" style={{marginBottom: 24}}>
          <div className="input-group" style={{maxWidth: 320}}>
            <span className="input-group-text"><Search size={16} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(9); }}
              style={{borderRadius: '0 8px 8px 0'}}
            />
          </div>
          <div className="dropdown">
            <button className="btn btn-outline-success dropdown-toggle d-flex align-items-center" type="button" id="dropdownCertif" data-bs-toggle="dropdown" aria-expanded="false">
              <ChevronDown size={16} className="me-1" />
              {certifFiltre === 'all' && 'Toutes les parcelles'}
              {certifFiltre === 'avec' && 'Avec certificat'}
              {certifFiltre === 'sans' && 'Sans certificat'}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownCertif">
              <li><button className="dropdown-item" onClick={() => setCertifFiltre('all')}>Toutes les parcelles</button></li>
              <li><button className="dropdown-item" onClick={() => setCertifFiltre('avec')}>Avec certificat</button></li>
              <li><button className="dropdown-item" onClick={() => setCertifFiltre('sans')}>Sans certificat</button></li>
            </ul>
          </div>
        </div>
        <div className="">
          <div style={{ backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))", borderRadius: "8px", padding: "0.75rem 1.25rem", marginBottom: 16 }}>
            <h2 className="h5 mb-0">Liste des Parcelles</h2>
          </div>
          {parcelles.length > 0 ? (
        <div className="row g-3">
          {parcellesAffichees.map((parcelle) => (
            <div key={parcelle.id} className="col-md-4">
              <ParcelleCard 
                parcelle={parcelle}
                userRole={roles}
              />
            </div>
          ))}
        </div>
      ) : parcellesFiltres.length === 0 ? (
        <div className="text-center text-muted">Aucune parcelle ne correspond à la recherche ou au filtre.</div>
      ) : (
        <div className="row g-3">
          {parcellesAffichees.map((parcelle) => (
            <div key={parcelle.id} className="col-md-4">
              <ParcelleCard 
                parcelle={parcelle}
                userRole={roles}
              />
            </div>
          ))}
        </div>
      )}

      {parcellesAffichees.length < parcellesFiltres.length && (
        <div className="text-center mt-3">
          <button className="btn btn-outline-success" onClick={() => setVisibleCount(visibleCount + 9)}>
            Charger plus
          </button>
        </div>
      )}
        </div>
      </div>

      
    </div>
  );
}

export default MesParcelles; 