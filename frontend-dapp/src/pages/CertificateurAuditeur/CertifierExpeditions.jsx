/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import { deleteFromIPFSByCid } from "../../utils/ipfsUtils";
import { uploadToIPFS } from "../../utils/ipfsUtils";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import {
  useExpeditionsIDs,
  useExpeditionsUnAUn,
} from "../../hooks/queries/useExpeditions";
import { useCertificateExpedition } from "../../hooks/mutations/mutationExpedition";
import { useUserContext } from "../../context/useContextt";

// Nbr de recoltes par chargement
const NBR_ITEMS_PAR_PAGE = 9;

export default function CertifierExpeditions() {
  const [message, setMessage] = useState("");
  const { roles, account } = useUserContext();

  // Recuperation de tab listes des ids commandes recoltes
  const { data: expeditionsIDs } = useExpeditionsIDs();

  // Nbr de recoltes par tranche
  const [expeditionsToShow, setExpeditionsToShow] =
    useState(NBR_ITEMS_PAR_PAGE);
  const idsToFetch = expeditionsIDs?.slice(0, expeditionsToShow) || [];

  // Utilisation cache pour la liste des commandes recoltes.
  const expeditionsUnAUn = useExpeditionsUnAUn(idsToFetch, roles, account);

  // Check si il y a encore des data en loading
  const loading = expeditionsUnAUn.some((q) => q.isFetching);

  // Charger 9 de plus
  const chargerPlus = (plus = NBR_ITEMS_PAR_PAGE) => {
    setExpeditionsToShow((prev) =>
      Math.min(prev + plus, expeditionsIDs?.length)
    );
  };

  // Check si on peut charger plus
  const hasMore = expeditionsToShow < expeditionsIDs?.length;

  const [onlyPending, setOnlyPending] = useState(true);
  const [expeditionSelectionnee, setExpeditionSelectionnee] = useState(null);
  const [showModalCertification, setShowModalCertification] = useState(false);
  const [certificat, setCertificat] = useState(null);
  const [dateEmission, setDateEmission] = useState("");
  const [dateExpiration, setDateExpiration] = useState("");
  const [dateInspection, setDateInspection] = useState("");
  const [autoriteCertificatrice, setAutoriteCertificatrice] = useState("");
  const [numeroCertificat, setNumeroCertificat] = useState("");
  const [region, setRegion] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  // useMutation pour la maj cache.
  const cerificateExpeditionMutation = useCertificateExpedition();

  const handleCertifier = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    setMessage("");
    let cid = "";
    try {
      if (
        !certificat ||
        !dateEmission ||
        !dateExpiration ||
        !dateInspection ||
        !autoriteCertificatrice ||
        !numeroCertificat ||
        !region
      ) {
        throw new Error("Veuillez remplir tous les champs obligatoires.");
      }

      const metadata = {
        dateEmission: dateEmission.toString(),
        dateExpiration: dateExpiration.toString(),
        dateInspection: dateInspection.toString(),
        autoriteCertificatrice: autoriteCertificatrice.toString(),
        numeroCertificat: numeroCertificat.toString(),
        region: region.toString(),
      };

      const upload = await uploadToIPFS(
        certificat,
        {
          type: "certificat-expedition",
          ...metadata,
        },
        "certificat-expedition"
      );
      cid = upload.cid;

      if (!upload?.success || !upload?.cid) {
        throw new Error(upload?.error || "Echec d'upload IPFS");
      }

      await cerificateExpeditionMutation.mutateAsync({
        id: expeditionSelectionnee.id,
        cid: upload.cid,
      });

      setMessage(
        `Expédition #${expeditionSelectionnee.id} certifiée avec succès`
      );
      // Rafraichir la liste depuis le debut.
      setShowModalCertification(false);
    } catch (error) {
      setMessage(
        "Erreur lors de la certification: " + (error?.message || error)
      );
      // supprimer le fichier ipfs si erreur
      if (cid !== "") deleteFromIPFSByCid(cid);
    }
    setBtnLoading(false);
  };

  const filtered = expeditionsUnAUn.filter((q) => {
    const e = q.data;

    // Ne pas filtrer si pas encore charger
    if (q.isLoading || q.isRefetching) return true;

    // Ne pas garder les commandes qui n'apartient pas a l'user si user est collecteur
    if (e.isProprietaire && !e.isProprietaire) return false;

    return onlyPending ? !e.certifier : true;
  });

  // Charger encore plus si le nbr de expedition filtrees === 0 ou si la page n'est pas pleine.
  if (
    hasMore &&
    (filtered.length === 0 ||
      filtered.length % NBR_ITEMS_PAR_PAGE !== 0)
  )
    chargerPlus(
      NBR_ITEMS_PAR_PAGE - (filtered.length % NBR_ITEMS_PAR_PAGE)
    );

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2>Certification des expéditions</h2>
        <div className="form-group d-flex align-items-center">
          <label htmlFor="certifierFilter" className="me-2 mb-0">
            Filtre :
          </label>
          <select
            id="certifierFilter"
            className="form-select"
            style={{ width: 180 }}
            value={onlyPending ? "pending" : "all"}
            onChange={(e) => setOnlyPending(e.target.value === "pending")}
          >
            <option value="pending">Non certifiées</option>
            <option value="all">Toutes</option>
          </select>
        </div>
      </div>
      {message && <div className="alert alert-info">{message}</div>}
      {/* Liste des expeditions */}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Référence</th>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix</th>
              <th>Certifiée</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((q, index) => {
                const e = q.data;

                // Skeleton si encours de chargement
                if (q.isLoading || q.isRefetching)
                  return (
                    <tr key={index}>
                      <td colSpan={7} className="p-0 m-0">
                        <Skeleton width={"100%"} height={"100%"} />
                      </td>
                    </tr>
                  );

                // Afficher expedition
                return (
                  <motion.tr
                    key={`expedition-${e.id}-${index}`}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <td>{e.id}</td>
                    <td>{e.ref || "-"}</td>
                    <td>{e.nomProduit || "-"}</td>
                    <td>{e.quantite}</td>
                    <td>{e.prix} $</td>
                    <td>{e.certifier ? "Oui" : "Non"}</td>
                    <td>
                      {!e.certifier ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            setExpeditionSelectionnee(e);
                            setShowModalCertification(true);
                          }}
                        >
                          Certifier
                        </button>
                      ) : (
                        <span className="text-muted">Déjà certifiée</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
              {loading === false && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Aucune expédition
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Modal de certification */}
      {showModalCertification && (
        <>
          <div
            className="modal-backdrop"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 1040,
            }}
          ></div>
          <div
            className="modal fade show"
            style={{ display: "block", zIndex: 1050 }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Certifier l'expédition #{expeditionSelectionnee?.id}
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
                            value={dateEmission}
                            onChange={(e) => setDateEmission(e.target.value)}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label
                            htmlFor="dateExpiration"
                            className="form-label"
                          >
                            Date d'expiration *
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={dateExpiration}
                            onChange={(e) => setDateExpiration(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="mb-3">
                          <label
                            htmlFor="dateInspection"
                            className="form-label"
                          >
                            Date d'inspection *
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={dateInspection}
                            onChange={(e) => setDateInspection(e.target.value)}
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
                            value={autoriteCertificatrice}
                            onChange={(e) =>
                              setAutoriteCertificatrice(e.target.value)
                            }
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
                            value={numeroCertificat}
                            onChange={(e) =>
                              setNumeroCertificat(e.target.value)
                            }
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
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            required
                          />
                        </div>
                      </div>
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
                        {btnLoading
                          ? "Certification..."
                          : "Certifier la récolte"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
