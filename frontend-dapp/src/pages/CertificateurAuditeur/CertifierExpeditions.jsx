/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
import { useEffect, useState } from "react";
import { DEBUT_EXPEDITION } from "../../utils/contract";
import { deleteFromIPFSByCid } from "../../utils/ipfsUtils";
import { uploadToIPFS } from "../../utils/ipfsUtils";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import { exportateurClientRead } from "../../config/onChain/frontContracts";
import { getExpedition } from "../../utils/contrat/exportateurClient";
import { useExpeditions } from "../../hooks/queries/useExpeditions";
import { useCertificateExpedition } from "../../hooks/mutations/mutationExpedition";

export default function CertifierExpeditions() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Utilisation de cache pour la liste des expeditions.
  const { data, isLoading, isRefetching } = useExpeditions();
  const [expeditions, setExpeditions] = useState(() => {
    if (!isLoading && !isRefetching) return data;
    else return [];
  });

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

  // Pour le chargement progressive des expeditions
  const [dernierExpeditionCharger, setDernierExpeditionChanger] = useState(0);

  // useMutation pour la maj cache.
  const cerificateExpeditionMutation = useCertificateExpedition();

  const loadExpeditions = async (reset = false) => {
    let _dernierExpeditionCharger = dernierExpeditionCharger;
    setLoading(true);
    setMessage("");
    try {
      const count =
        _dernierExpeditionCharger !== 0 && !reset
          ? _dernierExpeditionCharger
          : Number(await exportateurClientRead.read("compteurExpeditions"));
      let i;
      for (i = count; i >= DEBUT_EXPEDITION; i--) {
        const exp = await getExpedition(i);
        if (!exp || !exp.id) continue;
        // Ajoute un a un les expeditions dans expeditions.
        if (reset) {
          setExpeditions([exp]);
          reset = false;
        } else setExpeditions((prev) => [...prev, exp]);
      }
      // Pour reconnaitre le dernier expedition charger.
      setDernierExpeditionChanger(i);
    } catch (e) {
      setMessage("Erreur chargement expéditions: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) loadExpeditions(true);
    else setLoading(false);
  }, [isLoading]);

  // Maj cache si mutation expedition.
  useEffect(() => {
    if (isRefetching) {
      console.log("Rafraichissement de la liste des expeditions.");
      loadExpeditions(true);
    }
  }, [isRefetching]);

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
      setDernierExpeditionChanger(0);
      setExpeditions([]);
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

  const filtered = expeditions.filter((e) =>
    onlyPending ? !e.certifier : true
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
              {filtered.map((e, index) => (
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
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Aucune expédition
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="p-0 m-0">
                    <Skeleton width={"100%"} height={"100%"} />
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
