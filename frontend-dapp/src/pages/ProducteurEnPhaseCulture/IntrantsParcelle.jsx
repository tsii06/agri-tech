import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getContract } from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import { hasRole } from "../../utils/roles";
import {
  uploadIntrant,
  getIPFSURL,
  uploadConsolidatedData,
  getFileFromPinata,
} from "../../utils/ipfsUtils";
import {
  calculateParcelleMerkleHash,
} from "../../utils/merkleUtils";

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
    for(let intrant of intrants) {
      const detail = await getFileFromPinata(intrant.cid);
      intrantsDetails.push({
        ...intrant,
        ...detail.data.items
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
      const resIntrant = await uploadConsolidatedData(
        intrantDataIpfs,
        "intrant",
        {
          valider: "false",
          certificat: ''
        }
      );
      const intrantDataDetail = await getFileFromPinata(resIntrant.cid);
      if (resIntrant && resIntrant.success) {
        const intrantData = {
          cid: resIntrant.cid,
          timestamp: Date.now(),
          ...intrantDataDetail.data.items
        };

        // 2. Ajouter la nouvelle intrant à la liste existante
        const nouvellesIntrants = [...intrants, intrantData];

        // 3. Charger l'état consolidé actuel de la parcelle (master), le mettre à jour avec les nouvelles intrants
        let master = {};
        try {
          if (parcelle && parcelle.cid) {
            const resp = await fetch(getIPFSURL(parcelle.cid));
            if (resp.ok) {
              const json = await resp.json();
              master = json && json.items ? json.items : json;
            }
          }
        } catch {}

        // S'assurer qu'on a bien un objet master
        if (!master || typeof master !== "object") {
          master = {};
        }
        const masterMisAJour = {
          ...master,
          type: "parcelle",
          parcelleId: id,
          intrants: nouvellesIntrants,
          timestamp: Date.now(),
        };

        // 4. Upload du master consolidé mis à jour (type parcelle)
        const masterUpload = await uploadConsolidatedData(
          masterMisAJour,
          "parcelle"
        );
        if (!masterUpload.success) {
          throw new Error(
            "Erreur lors de l'upload des données de parcelle consolidées"
          );
        }

        // 5. Mettre à jour le CID de la parcelle avec le nouveau master
        const contract = await getContract();
        const tx = await contract.mettreAJourIntrantsParcelle(
          Number(id),
          masterUpload.cid
        );
        await tx.wait();

        // 6. Mettre à jour le hash Merkle de la parcelle
        const hashMerkleMisAJour = calculateParcelleMerkleHash(
          { ...parcelle, cid: masterUpload.cid },
          nouvellesIntrants,
          [], // photos
          [] // inspections
        );

        const txHashMerkle = await contract.ajoutHashMerkleParcelle(
          Number(id),
          hashMerkleMisAJour
        );
        await txHashMerkle.wait();

        // 7. Mettre à jour l'état local
        setIntrants(nouvellesIntrants);
        setParcelle((prev) => ({
          ...prev,
          cid: masterUpload.cid,
          hashMerkle: hashMerkleMisAJour,
        }));

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
        categorie: selectedIntrant.categorie,
        adresseFournisseur: selectedIntrant.fournisseur,
        adresseCertificateur: account,
        numeroCertificat: numeroCertificat.current.value,
        timestamp: Date.now(),
      };

      // Upload du certificat sur IPFS
      const certificatUpload = await uploadIntrant(certificat, certificatData);

      if (!certificatUpload.success) {
        throw new Error("Erreur lors de l'upload du certificat");
      }

      // Mettre à jour l'intrant avec le certificat
      const intrantsMisAJour = intrants.map((intrant) => {
        if (intrant.id === selectedIntrant.id) {
          return {
            ...intrant,
            valide: valide,
            certificatPhytosanitaire: certificatUpload.cid,
            cid: certificatUpload.cid,
          };
        }
        return intrant;
      });

      // Créer un objet consolidé avec tous les intrants mis à jour
      const intrantsConsolides = {
        type: "intrants-parcelle",
        parcelleId: id,
        intrants: intrantsMisAJour,
        timestamp: Date.now(),
      };

      // Upload des données consolidées mises à jour sur IPFS
      const intrantsUpload = await uploadConsolidatedData(
        intrantsConsolides,
        "intrants-parcelle"
      );

      if (!intrantsUpload.success) {
        throw new Error("Erreur lors de l'upload des intrants consolidés");
      }

      // Mettre à jour le CID de la parcelle
      const contract = await getContract();
      const tx = await contract.mettreAJourIntrantsParcelle(
        id,
        intrantsUpload.cid
      );
      await tx.wait();

      // Mettre à jour le hash Merkle de la parcelle
      const hashMerkleMisAJour = calculateParcelleMerkleHash(
        { ...parcelle, cid: intrantsUpload.cid },
        [], // photos
        intrantsMisAJour,
        [] // inspections
      );

      const txHashMerkle = await contract.ajoutHashMerkleParcelle(
        id,
        hashMerkleMisAJour
      );
      await txHashMerkle.wait();

      // Mettre à jour l'état local
      setIntrants(intrantsMisAJour);
      setParcelle((prev) => ({
        ...prev,
        cid: intrantsUpload.cid,
        hashMerkle: hashMerkleMisAJour,
      }));

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
            intrant.valide ? "border-success" : "border-warning"
          }`}
        >
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">{intrant.nom}</h6>
            <span
              className={`badge ${
                intrant.valide ? "bg-success" : "bg-warning"
              }`}
            >
              {intrant.valide ? "Validé" : "En attente"}
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
            {intrant.certificatPhytosanitaire && (
              <p>
                <strong>Certificat:</strong> {intrant.certificatPhytosanitaire}
              </p>
            )}
            <p>
              <strong>Ajouté le:</strong>{" "}
              {new Date(intrant.timestamp).toLocaleDateString()}
            </p>

            {hasRole(roles, 2) && !intrant.valide && (
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
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={(e) => validerIntrant(e, false)}
                  disabled={btnLoading}
                >
                  {btnLoading ? "Rejet..." : "Rejeter"}
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
