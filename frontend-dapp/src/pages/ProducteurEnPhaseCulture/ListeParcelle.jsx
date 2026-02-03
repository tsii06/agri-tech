import { useState, useEffect } from "react";
import { DEBUT_PARCELLE } from "../../utils/contract";
import ParcelleCard from "../../components/Tools/ParcelleCard";
import { useUserContext } from "../../context/useContextt";
import { Search, ChevronDown } from "lucide-react";
import { hasRole } from "../../utils/roles";
import { getParcelle } from "../../utils/contrat/producteur";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import { producteurEnPhaseCultureRead } from "../../config/onChain/frontContracts";
import { useParcellesProducteur } from "../../hooks/queries/useParcelles";

function MesParcelles() {
  // Utilisation du tableau de rôles
  const { roles, account } = useUserContext();

  // Utiliser le cache de useQuery pour la liste des parcelles du producteur. Recharge les parcelles si cache vide.
  const { data, isLoading, isRefetching } = useParcellesProducteur(account);
  const [parcelles, setParcelles] = useState(() => {
    if (!isLoading && !isRefetching) return data;
    else return [];
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [certifFiltre, setCertifFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [dernierParcelleCharger, setDernierParcelleCharger] = useState(0);

  useEffect(() => {
    if (!account) {
      setLoading(false);
      return;
    }
    // Charger progressivement les parcelles si il n'y en a pas dans les caches. Afficher les parcelles si il y en a.
    if (isLoading) chargerParcelles();
    else setLoading(false);
  }, [account, isLoading]);

  // Maj state lors d'une mutation du cache.
  useEffect(() => {
    if (isRefetching) {
      setParcelles([]);
      chargerParcelles();
    }
  }, [isRefetching]);

  const chargerParcelles = async (e) => {
    let _dernierParcelleCharger = dernierParcelleCharger;
    if (e?.target.value === "actualiser") {
      setParcelles([]);
      _dernierParcelleCharger = 0;
    }
    setLoading(true);
    try {
      const compteurParcellesRaw =
        _dernierParcelleCharger !== 0
          ? _dernierParcelleCharger
          : await producteurEnPhaseCultureRead.read('getCompteurParcelle');
      const compteurParcelles = Number(compteurParcellesRaw);

      console.log("🔍 Debug: Compteur parcelles:", compteurParcelles);
      console.log("🔍 Debug: DEBUT_PARCELLE:", DEBUT_PARCELLE);
      console.log("🔍 Debug: Account connecté:", account);
      console.log("🔍 Debug: Rôles utilisateur:", roles);

      if (compteurParcelles === 0) {
        console.log("⚠️ Aucune parcelle trouvée sur la blockchain");
        setParcelles([]);
        setLoading(false);
        return;
      }

      const parcellesDebug = [];
      let nbrParcelleCharger = 9;
      let i;

      // Utiliser DEBUT_PARCELLE comme point de départ
      for (
        i = compteurParcelles;
        i >= DEBUT_PARCELLE && nbrParcelleCharger > 0;
        i--
      ) {
        try {
          const parcelleRaw = await getParcelle(i, roles, account);

          // Ne pas afficher si il n y a pas de data off-chain
          if (!parcelleRaw.dataOffChain) {
            console.log(`⏭️ Parcelle ${i} ignorée: pas de données off-chain`);
            continue;
          }

          // Vérifier si on doit filtrer par propriétaire
          if (!parcelleRaw.isProprietaire) continue;

          nbrParcelleCharger--;

          console.log(`🔍 Debug: Parcelle ${i}:`, {
            id: parcelleRaw.id,
            producteur: parcelleRaw.producteur?.adresse,
            cid: parcelleRaw.cid,
            dataOffChain: parcelleRaw.dataOffChain,
          });

          parcellesDebug.push({
            id: i,
            producteur: parcelleRaw.producteur?.adresse,
            isMyParcel:
              parcelleRaw.producteur?.adresse?.toLowerCase() ===
              account?.toLowerCase(),
            hasOffChainData: parcelleRaw.dataOffChain,
            userHasRole0: hasRole(roles, 0),
          });

          setParcelles((prev) => [...prev, parcelleRaw]);
        } catch (error) {
          console.error(
            `❌ Erreur lors du chargement de la parcelle ${i}:`,
            error
          );
        }
      }
      setDernierParcelleCharger(i);

      console.log("🔍 Debug: Résumé des parcelles:", parcellesDebug);

      setError(null);
    } catch (error) {
      console.error("❌ Erreur détaillée:", error);
      setError(
        "Impossible de charger les parcelles. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  // Filtrage parcelles selon recherche et certificat
  const parcellesFiltres = parcelles.filter((parcelle) => {
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

  const parcellesAffichees = parcellesFiltres.slice(0, visibleCount);

  if (!account) {
    return (
      <div className="text-center text-muted">
        Veuillez connecter votre wallet pour voir vos parcelles.
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
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
                setVisibleCount(9);
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
          <button
            className="btn btn-primary"
            onClick={chargerParcelles}
            disabled={loading}
            value={"actualiser"}
          >
            🔄 Actualiser
          </button>
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
              {parcelles.length > 0 && (
                <>
                  {parcelles.filter((p) => p.cid).length} parcelles avec données
                  IPFS,
                  {parcelles.filter((p) => !p.cid).length} parcelles sans
                  données IPFS
                </>
              )}
            </p>
          </div>

          {/* LISTE DES PARCELLES */}
          <AnimatePresence>
            {parcelles.length > 0 || loading ? (
              <div className="row g-3">
                {parcellesAffichees.map((parcelle, index) => (
                  <motion.div
                    key={`parcelle-${parcelle.id}-${index}`}
                    className="col-md-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ParcelleCard parcelle={parcelle} userRole={roles} />
                  </motion.div>
                ))}
                {/* Skeleton de chargement */}
                {loading && (
                  <div className="col-md-4">
                    <Skeleton
                      width={"100%"}
                      height={"100%"}
                      style={{ minHeight: 200 }}
                    />
                  </div>
                )}
              </div>
            ) : parcellesFiltres.length === 0 ? (
              <div className="text-center text-muted">
                Aucune parcelle ne correspond à la recherche ou au filtre.
              </div>
            ) : (
              <div className="row g-3">
                {parcellesAffichees.map((parcelle, index) => (
                  <motion.div
                    key={`parcelle-${parcelle.id}-${index}`}
                    className="col-md-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ParcelleCard parcelle={parcelle} userRole={roles} />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Charger les autres parcelles si il en reste */}
          {dernierParcelleCharger >= DEBUT_PARCELLE && (
            <div className="text-center mt-3">
              <button
                className="btn btn-outline-success"
                onClick={chargerParcelles}
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
