import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DEBUT_RECOLTE,
  getCollecteurProducteurContract,
} from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import { Search, ChevronDown } from "lucide-react";
import { hasRole } from "../../utils/roles";
import { uploadCertificatPhytosanitaire } from "../../utils/ipfsUtils";
import { getRecolte } from "../../utils/contrat/collecteurProducteur";
import RecolteCard from "../../components/Tools/RecolteCard";
import { AnimatePresence, motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";

function ListeRecoltes() {
  const { address } = useParams();
  const navigate = useNavigate();
  const [recoltes, setRecoltes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantiteCommande, setQuantiteCommande] = useState("");
  const [recolteSelectionnee, setRecolteSelectionnee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("all");
  const [saisonFiltre, setSaisonFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  // Pour certification
  const [showModalCertification, setShowModalCertification] = useState(false);
  const [certificat, setCertificat] = useState(null);
  const [btnLoading, setBtnLoading] = useState(null);
  const dateEmission = useRef(null);
  const dateExpiration = useRef(null);
  const dateInspection = useRef(null);
  const autoriteCertificatrice = useRef(null);
  const numeroCertificat = useRef(null);
  const region = useRef(null);
  // Pour modification de prix
  const [showModalPrix, setShowModalPrix] = useState(false);
  const [recoltePrixSelectionnee, setRecoltePrixSelectionnee] = useState(null);
  const [nouveauPrix, setNouveauPrix] = useState("");
  const [dernierRecolteCharger, setDernierRecolteCharger] = useState(0);

  // Utilisation du tableau de rôles
  const { roles, account } = useUserContext();

  const chargerRecoltes = async () => {
    setIsLoading(true);
    try {
      const contract = await getCollecteurProducteurContract();
      const compteurRecoltes = dernierRecolteCharger!==0 ? dernierRecolteCharger : await contract.compteurRecoltes();

      console.log(
        "🌾 Début chargement récoltes, compteur:",
        Number(compteurRecoltes)
      );

      let nbrRecolteCharger = 9;
      let i;

      for (i = compteurRecoltes; i >= DEBUT_RECOLTE && nbrRecolteCharger > 0 ; i--) {
        // Filtre les recoltes si 'address' est definie dans l'url
        let recolteRaw;
        if (address !== undefined)
          recolteRaw = await getRecolte(i, [0], address);
        else recolteRaw = await getRecolte(i, roles, account);

        if (!recolteRaw.isProprietaire) continue;

        console.log(`🌾 Récolte ${i}:`, {
          nomProduit: recolteRaw.nomProduit,
          saison: recolteRaw.saison?.nom,
          identifiantSaison: recolteRaw.saison?.identifiant,
          numeroRecolte: recolteRaw.numeroRecolte || "Non défini",
          typeSaison: recolteRaw.saison?.typeSaison || "legacy",
          dureeCulture: recolteRaw.saison?.dureeCultureJours || "Non calculé",
          intrantsCount: recolteRaw.intrantsUtilises?.length || 0,
          intrantsSource: recolteRaw.intrantsSource || "UNKNOWN",
          dateRecolte: recolteRaw.dateRecolteOriginal,
          dateRecoltePrecedente:
            recolteRaw.dateRecoltePrecedente || "Première récolte",
          periodeIntrants: recolteRaw.dateRecoltePrecedente
            ? `${recolteRaw.dateRecoltePrecedente} → ${recolteRaw.dateRecolteOriginal}`
            : `Début → ${recolteRaw.dateRecolteOriginal}`,
          ipfsStored:
            recolteRaw.intrantsSource === "IPFS_STORED"
              ? "📦 Stocké IPFS"
              : "🔄 Calcul dynamique",
        });

        setRecoltes((prev) => [...prev, recolteRaw]);
        nbrRecolteCharger--;
      }
      setDernierRecolteCharger(i);
    } catch (error) {
      console.error("❌ Erreur chargement récoltes:", error);
      setError("Erreur lors du chargement des recoltes. Veuillez reessayer plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!(address && address.length > 0) && !account) {
      setIsLoading(false);
      return;
    }
    chargerRecoltes();
  }, [address, account]);

  const handleCertifier = async (event) => {
    event.preventDefault();
    setBtnLoading(true);

    try {
      // Créer les données du certificat
      const certificatData = {
        dateEmission: dateEmission.current.value,
        dateExpiration: dateExpiration.current.value,
        dateInspection: dateInspection.current.value,
        autoriteCertificatrice: autoriteCertificatrice.current.value,
        adresseCertificateur: account,
        adresseProducteur: recolteSelectionnee.producteur,
        produit: recolteSelectionnee.nomProduit,
        numeroCertificat: numeroCertificat.current.value,
        region: region.current.value,
        idRecolte: recolteSelectionnee.id,
        timestamp: Date.now(),
      };

      // Upload du certificat sur IPFS
      const certificatUpload = await uploadCertificatPhytosanitaire(
        certificat,
        certificatData
      );

      if (!certificatUpload.success) {
        throw new Error("Erreur lors de l'upload du certificat sur IPFS");
      }

      // Certifier la récolte avec le CID du certificat
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.certifieRecolte(
        recolteSelectionnee.id,
        certificatUpload.cid
      );
      await tx.wait();

      await chargerRecoltes();
      alert("Récolte certifiée avec succès !");
      setShowModalCertification(false);
    } catch (error) {
      console.error("Erreur lors de la certification:", error);
      setError(
        "Erreur lors de la certification de la récolte. Veuillez réessayer."
      );
      alert(
        "Erreur lors de la certification de la récolte. Veuillez réessayer."
      );
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCommander = async (recolteId) => {
    setBtnLoading(true);
    try {
      const contract = await getCollecteurProducteurContract();
      const recolte = recoltes.find((r) => r.id === recolteId);

      // Vérifier que la quantité est valide
      const quantite = Number(quantiteCommande);
      if (isNaN(quantite) || quantite <= 0) {
        setError("Veuillez entrer une quantité valide");
        return;
      }

      if (quantite > Number(recolte.quantite)) {
        setError(
          "La quantité demandée est supérieure à la quantité disponible"
        );
        return;
      }

      // Passer la commande
      const tx = await contract.passerCommandeVersProducteur(
        recolteId,
        quantite
      );
      await tx.wait();

      // Rediriger vers la page des commandes
      navigate("/liste-collecteur-commande");
    } catch (error) {
      console.error("Erreur lors de la commande:", error);
      setError("Erreur lors de la commande. Veuillez réessayer.");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleModifierPrix = async (event) => {
    event.preventDefault();
    setBtnLoading(true);
    try {
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.modifierPrixRecolte(
        recoltePrixSelectionnee.id,
        nouveauPrix
      );
      await tx.wait();
      await chargerRecoltes();
      setShowModalPrix(false);
      alert("Prix modifié avec succès !");
    } catch (error) {
      console.error("Erreur lors de la modification du prix:", error);
      alert("Erreur lors de la modification du prix. Veuillez réessayer.");
    } finally {
      setBtnLoading(false);
    }
  };

  // Filtrage recoltes selon recherche, statut et type de saison
  const recoltesFiltres = recoltes.filter((recolte) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (recolte.nomProduit &&
        recolte.nomProduit.toLowerCase().includes(searchLower)) ||
      (recolte.id && recolte.id.toString().includes(searchLower));
    const matchStatut =
      statutFiltre === "all" ||
      (statutFiltre === "certifie" && recolte.certifie) ||
      (statutFiltre === "noncertifie" && !recolte.certifie);
    const matchSaison =
      saisonFiltre === "all" ||
      (saisonFiltre === "dynamique" &&
        recolte.saison?.typeSaison === "dynamique") ||
      (saisonFiltre === "legacy" &&
        (recolte.saison?.periode === "H1" || recolte.saison?.periode === "H2"));
    return matchSearch && matchStatut && matchSaison;
  });
  const recoltesAffichees = recoltesFiltres.slice(0, visibleCount);

  if (!account && !address) {
    return (
      <div className="text-center text-muted">
        Veuillez connecter votre wallet pour voir vos récoltes.
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

          <div className="d-flex gap-2">
            {/* Filtre par statut */}
            <div className="dropdown">
              <button
                className="btn btn-outline-success dropdown-toggle d-flex align-items-center"
                type="button"
                id="dropdownStatut"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <ChevronDown size={16} className="me-1" />
                {statutFiltre === "all" && "Toutes les récoltes"}
                {statutFiltre === "certifie" && "Certifiées"}
                {statutFiltre === "noncertifie" && "Non certifiées"}
              </button>
              <ul className="dropdown-menu" aria-labelledby="dropdownStatut">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setStatutFiltre("all")}
                  >
                    Toutes les récoltes
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setStatutFiltre("certifie")}
                  >
                    Certifiées
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setStatutFiltre("noncertifie")}
                  >
                    Non certifiées
                  </button>
                </li>
              </ul>
            </div>

            {/* Filtre par type de saison */}
            <div className="dropdown">
              <button
                className="btn btn-outline-info dropdown-toggle d-flex align-items-center"
                type="button"
                id="dropdownSaison"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <ChevronDown size={16} className="me-1" />
                {saisonFiltre === "all" && "Toutes cultures"}
                {saisonFiltre === "dynamique" && "Cultures dynamiques"}
                {saisonFiltre === "legacy" && "Anciens systèmes"}
              </button>
              <ul className="dropdown-menu" aria-labelledby="dropdownSaison">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setSaisonFiltre("all")}
                  >
                    Toutes cultures
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setSaisonFiltre("dynamique")}
                  >
                    Cultures dynamiques (nouveau système)
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setSaisonFiltre("legacy")}
                  >
                    Anciens systèmes (H1/H2)
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))",
            borderRadius: "8px",
            padding: "0.75rem 1.25rem",
            marginBottom: 16,
          }}
        >
          <h2 className="h5 mb-0">
            {hasRole(roles, 3) || hasRole(roles, 2)
              ? "Liste des Récoltes"
              : hasRole(roles, 0) && "Mes Récoltes"}
          </h2>
          <p className="text-muted mb-0">
            {recoltes.length > 0 && (
              <>
                {recoltes.filter((r) => r.cid).length} récoltes avec données
                IPFS,
                {recoltes.filter((r) => !r.cid).length} récoltes sans données
                IPFS
                {recoltes.filter((r) => r.saison).length > 0 && (
                  <>
                    {" | "}
                    {
                      recoltes.filter(
                        (r) => r.saison?.typeSaison === "dynamique"
                      ).length
                    }{" "}
                    cultures dynamiques,{" "}
                    {
                      recoltes.filter(
                        (r) =>
                          r.saison?.periode === "H1" ||
                          r.saison?.periode === "H2"
                      ).length
                    }{" "}
                    anciennes saisons
                  </>
                )}
              </>
            )}
          </p>
          <div className="mt-2">
            <small className="text-info">
              🌿 <strong>Nouvelle logique de saison :</strong> Chaque culture
              est définie par la période du premier intrant jusqu'à la récolte,
              avec un numéro séquentiel par parcelle.
              <span className="badge bg-success ms-1">✓ Dynamique</span>
              <span className="badge bg-warning text-dark ms-1">
                ⚠️ Ancien système
              </span>
            </small>
          </div>
        </div>

        {/* LISTE DES RECOLTES */}
        {recoltes.length > 0 || isLoading ? (
          <AnimatePresence>
            <div className="row g-3">
              {recoltesAffichees.map((recolte, index) => (
                <motion.div
                  key={`recolte-${recolte.id}-${index}`}
                  className="col-md-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div
                    className="card shadow-sm p-3"
                    style={{
                      borderRadius: 16,
                      boxShadow: "0 2px 12px 0 rgba(60,72,88,.08)",
                    }}
                  >
                    <RecolteCard recolte={recolte} />

                    {/* Btn pour chaque roles */}
                    <div className="d-flex justify-content-between mt-3">
                      {/* Actions selon le rôle */}
                      {hasRole(roles, 3) && recolte.certifie && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setRecolteSelectionnee(recolte);
                            setShowModal(true);
                          }}
                        >
                          Commander
                        </button>
                      )}

                      {hasRole(roles, 2) && !recolte.certifie && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            setRecolteSelectionnee(recolte);
                            setShowModalCertification(true);
                          }}
                        >
                          Certifier
                        </button>
                      )}

                      {hasRole(roles, 0) && (
                        <button
                          className="btn btn-agrichain"
                          onClick={() => {
                            setRecoltePrixSelectionnee(recolte);
                            setShowModalPrix(true);
                          }}
                        >
                          Modifier le prix
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {/* Skeleton de chargement */}
              {isLoading && (
                <div className="col-md-4">
                  <Skeleton width={'100%'} height={'100%'} style={{ minHeight:200 }} />
                </div>
              )}
            </div>
          </AnimatePresence>
        ) : !isLoading && (
          <div className="text-center text-muted">Aucune récolte trouvée.</div>
        )}

        {/* Btn pour charger plus de recoltes */}
        {dernierRecolteCharger > DEBUT_RECOLTE && (
          <div className="text-center mt-3">
            <button
              className="btn btn-outline-success"
              onClick={chargerRecoltes}
            >
              Charger plus
            </button>
          </div>
        )}
      </div>

      {/* Modal de commande */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Commander la récolte #{recolteSelectionnee?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Quantité disponible :{" "}
                  <strong>{recolteSelectionnee?.quantite} kg</strong>
                </p>
                <div className="mb-3">
                  <label htmlFor="quantiteCommande" className="form-label">
                    Quantité à commander (kg)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="quantiteCommande"
                    value={quantiteCommande}
                    onChange={(e) => setQuantiteCommande(e.target.value)}
                    min="1"
                    max={recolteSelectionnee?.quantite}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCommander(recolteSelectionnee.id)}
                  disabled={btnLoading}
                >
                  {btnLoading && (
                    <span className="spinner-border spinner-border-sm text-light"></span>
                  )}
                  &nbsp;Commander
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de certification */}
      {showModalCertification && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Certifier la récolte #{recolteSelectionnee?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModalCertification(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCertifier}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="certificat" className="form-label">
                          Certificat phytosanitaire *
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          id="certificat"
                          onChange={(e) => setCertificat(e.target.files[0])}
                          accept=".pdf,.doc,.docx"
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="dateEmission" className="form-label">
                          Date d'émission *
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          ref={dateEmission}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="dateExpiration" className="form-label">
                          Date d'expiration *
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          ref={dateExpiration}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="dateInspection" className="form-label">
                          Date d'inspection *
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          ref={dateInspection}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label
                          htmlFor="autoriteCertificatrice"
                          className="form-label"
                        >
                          Autorité certificatrice *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          ref={autoriteCertificatrice}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label
                          htmlFor="numeroCertificat"
                          className="form-label"
                        >
                          Numéro du certificat *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          ref={numeroCertificat}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="region" className="form-label">
                          Région *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          ref={region}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info">
                    <strong>Information:</strong> Le certificat sera
                    automatiquement uploadé sur IPFS et la récolte sera
                    certifiée avec traçabilité complète.
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModalCertification(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={btnLoading}
                    >
                      {btnLoading ? "Certification..." : "Certifier la récolte"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification de prix */}
      {showModalPrix && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Modifier le prix de la récolte #{recoltePrixSelectionnee?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModalPrix(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="nouveauPrix" className="form-label">
                    Nouveau prix unitaire (Ariary)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="nouveauPrix"
                    value={nouveauPrix}
                    onChange={(e) => setNouveauPrix(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModalPrix(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleModifierPrix}
                  disabled={btnLoading}
                >
                  {btnLoading && (
                    <span className="spinner-border spinner-border-sm text-light"></span>
                  )}
                  &nbsp;Modifier le prix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour les modals */}
      {(showModal || showModalCertification || showModalPrix) && (
        <div className="modal-backdrop fade show"></div>
      )}

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default ListeRecoltes;
