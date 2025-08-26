import { useState, useEffect } from "react";
import { getContract } from "../../utils/contract";
import ParcelleCard from "../../components/Tools/ParcelleCard";
import { useUserContext } from '../../context/useContextt';
import { Search, ChevronDown } from "lucide-react";
import { getIPFSURL } from "../../utils/ipfsUtils";
import { hasRole } from "../../utils/roles";

function MesParcelles() {
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [certifFiltre, setCertifFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);

  // Utilisation du tableau de rôles
  const { roles, account } = useUserContext();

  useEffect(() => {
    if (!account) {
      setLoading(false);
      return;
    }
    chargerParcelles();
  }, [account]);

  const chargerParcelles = async () => {
    try {
      const contract = await getContract();
      const compteurParcellesRaw = await contract.getCompteurParcelle();
      const compteurParcelles = Number(compteurParcellesRaw);

      if (compteurParcelles === 0) {
        setParcelles([]);
        setLoading(false);
        return;
      }

      const parcellesPromises = [];
      let parcelle;
      
      for (let i = 1; i <= compteurParcelles; i++) {
        const parcelleRaw = await contract.getParcelle(i);
        // Normaliser la structure ethers en objet simple pour éviter la perte de champs avec l'opérateur spread
        const parcelleBase = {
          id: Number(parcelleRaw.id ?? i),
          producteur: parcelleRaw.producteur?.toString?.() ?? parcelleRaw.producteur,
          cid: parcelleRaw.cid ?? "",
          hashMerkle: parcelleRaw.hashMerkle ?? "",
          certificatPhytosanitaire: parcelleRaw.certificatPhytosanitaire ?? parcelleRaw.certificat ?? ""
        };
        parcelle = parcelleBase;

        // Afficher uniquement les parcelles de l'adresse connectée (route MesParcelles)
        if(hasRole(roles, 0)) {
          if (parcelle.producteur.toLowerCase() !== account.toLowerCase()) {
            continue;
          }
        }

        // Charger les données IPFS consolidées si la parcelle a un CID
        if (parcelle.cid) {
          try {
            const response = await fetch(getIPFSURL(parcelle.cid));
            if (response.ok) {
              const ipfsData = await response.json();
              const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
              
              // Fusionner les données blockchain avec les données IPFS
              parcelle = {
                ...parcelle,
                // Données de base de la parcelle
                qualiteSemence: root.qualiteSemence || "Non spécifiée",
                methodeCulture: root.methodeCulture || "Non spécifiée",
                dateRecolte: root.dateRecolte || "Non spécifiée",
                location: root.location || { lat: 0, lng: 0 },
                // Photos, intrants et inspections depuis IPFS
                photos: root.photos || [],
                intrants: root.intrants || [],
                inspections: root.inspections || [],
                // Certificat depuis IPFS
                certificatPhytosanitaire: root.certificat || parcelle.certificatPhytosanitaire,
                // Métadonnées IPFS
                ipfsTimestamp: ipfsData.timestamp,
                ipfsVersion: ipfsData.version
              };
            }
          } catch (ipfsError) {
            console.log(`Erreur lors du chargement IPFS pour la parcelle ${i}:`, ipfsError);
            // Garder les données blockchain de base si IPFS échoue
            parcelle = {
              ...parcelle,
              qualiteSemence: "Données IPFS non disponibles",
              methodeCulture: "Données IPFS non disponibles",
              dateRecolte: "Données IPFS non disponibles",
              location: { lat: 0, lng: 0 },
              photos: [],
              intrants: [],
              inspections: []
            };
          }
        } else {
          // Parcelle sans CID IPFS (ancienne structure)
          parcelle = {
            ...parcelle,
            qualiteSemence: "Données non consolidées",
            methodeCulture: "Données non consolidées",
            dateRecolte: "Données non consolidées",
            location: { lat: 0, lng: 0 },
            photos: [],
            intrants: [],
            inspections: []
          };
        }

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

  // Filtrage parcelles selon recherche et certificat
  const parcellesFiltres = parcelles.filter((parcelle) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (parcelle.qualiteSemence && parcelle.qualiteSemence.toLowerCase().includes(searchLower)) ||
      (parcelle.id && parcelle.id.toString().includes(searchLower)) ||
      (parcelle.methodeCulture && parcelle.methodeCulture.toLowerCase().includes(searchLower)) ||
      (parcelle.dateRecolte && parcelle.dateRecolte.toLowerCase().includes(searchLower));
    
    const matchCertif =
      certifFiltre === "all" ||
      (certifFiltre === "avec" && parcelle.certificatPhytosanitaire) ||
      (certifFiltre === "sans" && !parcelle.certificatPhytosanitaire);
    
    return matchSearch && matchCertif;
  });
  
  const parcellesAffichees = parcellesFiltres.slice(0, visibleCount);

  if (!account) {
    return <div className="text-center text-muted">Veuillez connecter votre wallet pour voir vos parcelles.</div>;
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
        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between" style={{ marginBottom: 24 }}>
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text"><Search size={16} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(9); }}
              style={{ borderRadius: '0 8px 8px 0' }}
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
            <p className="text-muted mb-0">
              {parcelles.length > 0 && (
                <>
                  {parcelles.filter(p => p.cid).length} parcelles avec données IPFS, 
                  {parcelles.filter(p => !p.cid).length} parcelles sans données IPFS
                </>
              )}
            </p>
          </div>

          {/* LISTE DES PARCELLES */}

          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : parcelles.length > 0 ? (
            <div className="row g-3">
              {parcellesAffichees.map((parcelle, index) => (
                <div key={`parcelle-${parcelle.id}-${index}`} className="col-md-4">
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
              {parcellesAffichees.map((parcelle, index) => (
                <div key={`parcelle-${parcelle.id}-${index}-filtered`} className="col-md-4">
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