import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getContract } from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import { hasRole } from "../../utils/roles";
import {
  uploadIntrant,
  getIPFSURL,
  getFileFromPinata,
  updateCidParcelle,
  getMetadataFromPinata,
  uploadToIPFS,
  addIntrantToParcelleMaster
} from "../../utils/ipfsUtils";
import myPinataSDK from "../../utils/pinata";

function IntrantsParcelle() {
  const { id } = useParams();
  const [intrants, setIntrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [formData, setFormData] = useState({
    categorie: "",
    nom: "",
    quantite: "",
    dateAjout: ""
  });
  const { roles, account } = useUserContext();
  const [certificat, setCertificat] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [parcelle, setParcelle] = useState(null);
  const [message, setMessage] = useState("");

  // pour la certification
  const [selectedIntrant, setSelectedIntrant] = useState({});
  const dateEmission = useRef(null);
  const dateExpiration = useRef(null);
  const dateInspection = useRef(null);
  const autoriteCertificatrice = useRef(null);
  const numeroCertificat = useRef(null);

  useEffect(() => {
    chargerParcelle();
  }, [id]);

  const chargerParcelle = async () => {
    try {
      const contract = await getContract();
      const parcelleData = await contract.getParcelle(id);
      setParcelle(parcelleData);

      // Si la parcelle a un CID, essayer de récupérer les intrants
      if (parcelleData.cid) {
        try {
          const response = await fetch(getIPFSURL(parcelleData.cid));
          if (response.ok) {
            const data = await response.json();
            const root = data && data.items ? data.items : data;

            // recuperer tous les data necessaire a un intrant
            if (root && root.intrants && Array.isArray(root.intrants)) {
              const intrantsDetails = await getIntrantsDetails(root.intrants);
              setIntrants(intrantsDetails);
            }
          }
        } catch (error) {
          console.log(
            "Pas de intrants existantes ou erreur de récupération IPFS"
          );
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la parcelle:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIntrantsDetails = async (intrants) => {
    let intrantsDetails = [];
    for (let intrant of intrants) {
      const detail = await getFileFromPinata(intrant.cid);
      const metadata = await getMetadataFromPinata(intrant.cid);
      intrantsDetails.push({
        ...intrant,
        ...detail.data.items,
        ...metadata.keyvalues,
        id: metadata.id,
      });
    }
    return intrantsDetails;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const ajouterIntrant = async (e) => {
    e.preventDefault();
    setAjoutEnCours(true);

    try {
      // Preparer les donnees de l'intrant
      const intrantDataIpfs = {
        ...formData,
        idParcelle: id,
        fournisseur: account,
      };

      // 1. Upload sur IPFS
      const resIntrant = await uploadIntrant(intrantDataIpfs);

      const intrantDataDetail = await getFileFromPinata(resIntrant.cid);
      if (resIntrant && resIntrant.success) {
        const intrantData = {
          cid: resIntrant.cid,
          timestamp: Date.now(),
          dateAjout: formData.dateAjout || new Date().toISOString().slice(0, 10),
          ...intrantDataDetail.data.items,
        };

        // 2. Ajouter l'intrant dans le master de la parcelle (avec dateAjout)
        const masterUpload = await addIntrantToParcelleMaster(parcelle, intrantData, intrantData.dateAjout);

        // 7. Mettre à jour l'état local
        setIntrants([...
          intrants,
          intrantData
        ]);
        setParcelle({
          id: parcelle.id,
          producteur: parcelle.producteur,
          cid: masterUpload.cid,
          hashMerkle: parcelle.hashMerkle,
        });

        setMessage(
          "Intrant ajouté et enregistré sur la blockchain avec succès !"
        );
      } else {
        setMessage("Erreur lors de l'upload sur IPFS.");
      }
    } catch (e) {
      console.error("Erreur lors de l'ajout de l'intrant : ", e);
      setMessage("Erreur lors de l'ajout de l'intrant : " + (e?.message || e));
    } finally {
      setAjoutEnCours(false);
    }
  };

  const validerIntrant = async (event, valide) => {
    event.preventDefault();
    setBtnLoading(true);

    try {
      // Créer les données du certificat
      const certificatData = {
        dateEmission: dateEmission.current.value,
        dateExpiration: dateExpiration.current.value,
        dateInspection: dateInspection.current.value,
        autoriteCertificatrice: autoriteCertificatrice.current.value,
        idParcelle: id,
        adresseCertificateur: account,
        numeroCertificat: numeroCertificat.current.value,
        timestamp: Date.now().toString(),
      };

      // Upload du certificat sur IPFS
      const certificatUpload = await uploadToIPFS(certificat, certificatData);

      // mettre a jour les metadata de l'intrant conscerner
      const oldMetada = await getMetadataFromPinata(selectedIntrant.cid);
      await myPinataSDK.files.public.update({
        id: selectedIntrant.id,
        keyvalues: {
          valider: valide ? "true" : "false",
          certificat: certificatUpload.cid,
        },
      });

      // Mettre à jour l'intrant avec le certificat
      const intrantsMisAJour = intrants.map((intrant) => {
        if (intrant.id === selectedIntrant.id) {
          return {
            ...intrant,
            valider: valide ? "true" : "false",
            certificat: certificatUpload.cid,
          };
        }
        return intrant;
      });

      // Mettre à jour l'état local
      setIntrants(intrantsMisAJour);

      setShowModal(false);
      alert(`Intrant ${valide ? "validé" : "rejeté"} avec succès !`);
    } catch (error) {
      console.error("Erreur lors de la validation de l'intrant:", error);
      alert("Erreur lors de la validation: " + error.message);
    } finally {
      setBtnLoading(false);
    }
  };

  const afficherIntrant = (intrant) => {
    return (
      <div key={intrant.cid} className="col-md-6 mb-3">
        <div
          className={`card ${
            intrant.valider === "true" ? "border-success" : "border-warning"
          }`}
        >
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">{intrant.nom}</h6>
            <span
              className={`badge ${
                intrant.valider === "true" ? "bg-success" : "bg-warning"
              }`}
            >
              {intrant.valider === "true" ? "Validé" : "En attente"}
            </span>
          </div>
          <div className="card-body">
            <p>
              <strong>Catégorie:</strong> {intrant.categorie}
            </p>
            <p>
              <strong>Quantité:</strong> {intrant.quantite}
            </p>
            <p>
              <strong>Fournisseur:</strong> {intrant.fournisseur}
            </p>
            <p>
              <strong>CID IPFS:</strong> {intrant.cid || "Non disponible"}
            </p>
            {intrant.certificat && (
              <p>
                <strong>Certificat:</strong>
                <a
                  href={getIPFSURL(intrant.certificat)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-2 text-decoration-none text-success"
                >
                  Voir ici
                </a>
              </p>
            )}
            <p>
              <strong>Ajouté le:</strong>{" "}
              {new Date(intrant.timestamp * 1).toLocaleDateString()}
            </p>

            {hasRole(roles, 2) && intrant.valider === "false" && (
              <button
                className="btn btn-sm btn-outline-primary me-2"
                onClick={() => {
                  setSelectedIntrant(intrant);
                  setShowModal(true);
                }}
              >
                Valider
              </button>
            )}

            {intrant.cid && (
              <a
                href={getIPFSURL(intrant.cid)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-secondary"
              >
                Voir sur IPFS
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center mt-4">Chargement...</div>;
  }

  return (
    <div className="container mt-4">
      <h2>Gestion des intrants de la parcelle #{id}</h2>

      {/* Informations de la parcelle */}
      {parcelle && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Informations de la parcelle</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>ID:</strong> {parcelle.id}
                </p>
                <p>
                  <strong>Producteur:</strong> {parcelle.producteur}
                </p>
                <p>
                  <strong>CID IPFS:</strong> {parcelle.cid || "Aucun"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Hash Merkle:</strong>{" "}
                  {parcelle.hashMerkle || "Non calculé"}
                </p>
                <p>
                  <strong>Nombre d'intrants:</strong> {intrants.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout d'intrant */}
      {hasRole(roles, 1) && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Ajouter un intrant</h5>
          </div>
          <div className="card-body">
            <form onSubmit={ajouterIntrant}>
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label htmlFor="nom" className="form-label">
                      Nom de l'intrant
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label htmlFor="quantite" className="form-label">
                      Quantité
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="quantite"
                      name="quantite"
                      value={formData.quantite}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label htmlFor="categorie" className="form-label">
                      Catégorie
                    </label>
                    <select
                      className="form-select"
                      id="categorie"
                      name="categorie"
                      value={formData.categorie}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Sélectionner...</option>
                      <option value="engrais">Engrais</option>
                      <option value="pesticide">Pesticide</option>
                      <option value="semence">Semence</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label htmlFor="dateAjout" className="form-label">Date d'ajout</label>
                    <input
                      type="date"
                      className="form-control"
                      id="dateAjout"
                      name="dateAjout"
                      value={formData.dateAjout}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={ajoutEnCours}
              >
                {ajoutEnCours ? "Ajout en cours..." : "Ajouter l'intrant"}
              </button>
            </form>

            {message && (
              <div
                className={`alert mt-3 ${
                  message.includes("succès") ? "alert-success" : "alert-info"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste des intrants */}
      <div className="card">
        <div className="card-header">
          <h5>Intrants de la parcelle ({intrants.length})</h5>
        </div>
        <div className="card-body">
          {intrants.length > 0 ? (
            <div className="row">{intrants.map(afficherIntrant)}</div>
          ) : (
            <p className="text-muted">
              Aucun intrant ajouté pour cette parcelle.
            </p>
          )}
        </div>
      </div>

      {/* Modal de validation */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Valider l'intrant</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Valider l'intrant <strong>{selectedIntrant.nom}</strong> ?
                </p>

                <div className="mb-3">
                  <label htmlFor="certificat" className="form-label">
                    Certificat phytosanitaire
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setCertificat(e.target.files[0])}
                    accept=".pdf,.doc,.docx"
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="dateEmission" className="form-label">
                        Date d'émission
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        ref={dateEmission}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="dateExpiration" className="form-label">
                        Date d'expiration
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        ref={dateExpiration}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="dateInspection" className="form-label">
                        Date d'inspection
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        ref={dateInspection}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label
                        htmlFor="autoriteCertificatrice"
                        className="form-label"
                      >
                        Autorité certificatrice
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        ref={autoriteCertificatrice}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="numeroCertificat" className="form-label">
                    Numéro du certificat
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    ref={numeroCertificat}
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
                  className="btn btn-success me-2"
                  onClick={(e) => validerIntrant(e, true)}
                  disabled={btnLoading}
                >
                  {btnLoading ? "Validation..." : "Valider"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour le modal */}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default IntrantsParcelle;
