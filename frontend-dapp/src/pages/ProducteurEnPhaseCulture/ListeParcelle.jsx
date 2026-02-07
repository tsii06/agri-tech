import { useState } from "react";
import ParcelleCard from "../../components/Tools/ParcelleCard";
import { useUserContext } from "../../context/useContextt";
import { Search, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import {
  useParcellesIDs,
  useParcellesUnAUn,
} from "../../hooks/queries/useParcelles";

const NBR_ITEMS_PAR_PAGE = 9;

function MesParcelles() {
  // Utilisation du tableau de rôles
  const { roles, account } = useUserContext();

  // Recuperation de la liste de id lots produits
  const { data: parcellesIDs } = useParcellesIDs();

  // Nbr de recoltes par tranche
  const [parcellesToShow, setParcellesToShow] = useState(NBR_ITEMS_PAR_PAGE);
  const idsToFetch = parcellesIDs?.slice(0, parcellesToShow) || [];

  // Utiliser cache pour stocker liste parcelles. ================= //
  const parcellesUnAUn = useParcellesUnAUn(idsToFetch, roles, account);

  // Charger 9 de plus
  const chargerPlus = (plus = NBR_ITEMS_PAR_PAGE) => {
    setParcellesToShow((prev) =>
      Math.min(prev + plus, parcellesIDs?.length || 0)
    );
  };

  // Check si on peut charger plus
  const hasMore = parcellesToShow < parcellesIDs?.length;

  const [search, setSearch] = useState("");
  const [certifFiltre, setCertifFiltre] = useState("all");

  // Filtrage parcelles selon recherche et certificat
  const parcellesFiltres = parcellesUnAUn.filter((q) => {
    const parcelle = q.data;

    // Ne pas filtrer si pas encore charger
    if (q.isLoading || q.isRefetching) return true;

    // Ne pas garder les parcelles qui n'apartient pas a l'user si user est collecteur
    if (parcelle.isProprietaire && !parcelle.isProprietaire) return false;

    const searchLower = search.toLowerCase();
    const matchSearch =
      (parcelle.qualiteSemence &&
        parcelle.qualiteSemence.toLowerCase().includes(searchLower)) ||
      (parcelle.id && parcelle.id.toString().includes(searchLower)) ||
      (parcelle.methodeCulture &&
        parcelle.methodeCulture.toLowerCase().includes(searchLower)) ||
      (parcelle.dateRecolte &&
        parcelle.dateRecolte.toLowerCase().includes(searchLower));

    const matchCertif =
      certifFiltre === "all" ||
      (certifFiltre === "avec" && parcelle.certificatPhytosanitaire) ||
      (certifFiltre === "sans" && !parcelle.certificatPhytosanitaire);

    return matchSearch && matchCertif;
  });

  if (!account) {
    return (
      <div className="text-center text-muted">
        Veuillez connecter votre wallet pour voir vos parcelles.
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <div
          className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between"
          style={{ marginBottom: 24 }}
        >
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              style={{ borderRadius: "0 8px 8px 0" }}
            />
          </div>
          <div className="dropdown">
            <button
              className="btn btn-outline-success dropdown-toggle d-flex align-items-center"
              type="button"
              id="dropdownCertif"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <ChevronDown size={16} className="me-1" />
              {certifFiltre === "all" && "Toutes les parcelles"}
              {certifFiltre === "avec" && "Avec certificat"}
              {certifFiltre === "sans" && "Sans certificat"}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownCertif">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setCertifFiltre("all")}
                >
                  Toutes les parcelles
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setCertifFiltre("avec")}
                >
                  Avec certificat
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setCertifFiltre("sans")}
                >
                  Sans certificat
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="">
          <div
            style={{
              backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))",
              borderRadius: "8px",
              padding: "0.75rem 1.25rem",
              marginBottom: 16,
            }}
          >
            <h2 className="h5 mb-0">Liste des Parcelles</h2>
            <p className="text-muted mb-0">
              {parcellesFiltres.length > 0 && (
                <>
                  {parcellesFiltres.filter((q) => q.data?.cid).length} parcelles avec données
                  IPFS,
                  {parcellesFiltres.filter((q) => !q.data?.cid).length} parcelles sans
                  données IPFS
                </>
              )}
            </p>
          </div>

          {/* LISTE DES PARCELLES */}
          <AnimatePresence>
            {parcellesFiltres.length > 0 ? (
              <div className="row g-3">
                {parcellesFiltres.map((q, index) => {
                  const parcelle = q.data;

                  // Skeleton si chargement donnee
                  if (q.isLoading || q.isRefetching)
                    return (
                      <div className="col-md-4" key={index}>
                        <Skeleton
                          width={"100%"}
                          height={"100%"}
                          style={{ minHeight: 200 }}
                        />
                      </div>
                    );

                  // Afficher parcelle
                  return (
                    <motion.div
                      key={`parcelle-${parcelle.id}-${index}`}
                      className="col-md-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <ParcelleCard parcelle={parcelle} userRole={roles} />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted">
                Aucune parcelle trouver.
              </div>
            )}
          </AnimatePresence>

          {/* Charger les autres parcelles si il en reste */}
          {hasMore && (
            <div className="text-center mt-3">
              <button
                className="btn btn-outline-success"
                onClick={() => chargerPlus()}
              >
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
