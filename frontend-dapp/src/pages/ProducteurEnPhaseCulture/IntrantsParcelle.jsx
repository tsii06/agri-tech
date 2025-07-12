import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getContract } from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import { hasRole } from "../../utils/roles";
import myPinataSDK, { uploadFile } from "../../utils/pinata";



function IntrantsParcelle() {
  const { id } = useParams();
  const [intrants, setIntrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [formData, setFormData] = useState({
    categorie: "",
    nom: "",
    quantite: "",
  });
  const { roles, account } = useUserContext();
  const [certificat, setCertificat] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // pour la certification
  const [selectedIntrant, setSelectedIntrant] = useState({});
  const dateEmission = useRef();
  const dateExpiration = useRef();
  const dateInspection = useRef();
  const autoriteCertificatrice = useRef();

  useEffect(() => {
    chargerIntrants();
  }, [id]);

  const chargerIntrants = async () => {
    try {
      const contract = await getContract();
      const intrantsData = await contract.getIntrants(id);
      // intrantsData est encore un objet il faut la convertir
      setIntrants(Object.values(intrantsData));
    } catch (error) {
      console.error("Erreur lors du chargement des intrants:", error);
      alert("Erreur lors du chargement des intrants");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const ajouterIntrant = async (e) => {
    e.preventDefault();
    setAjoutEnCours(true);

    try {
      const contract = await getContract();
      const tx = await contract.ajouterIntrant(
        id,
        formData.nom,
        parseInt(formData.quantite),
        formData.categorie, // categorie
        account
      );
      await tx.wait();

      setFormData({ nom: "", quantite: "" });
      await chargerIntrants();
      alert("Intrant ajouté avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'intrant:", error);
      alert("Erreur lors de l'ajout de l'intrant");
    } finally {
      setAjoutEnCours(false);
    }
  };

  const validerIntrant = async (event, valide) => {
    event.preventDefault();
    let idCertificat = 0;
    try {
      const contract = await getContract();
      const parcelle = await contract.getParcelle(id);
      let hashIpfs = "";
      const metadata = {
        dateEmission: dateEmission.current.value,
        dateExpiration: dateExpiration.current.value,
        dateInspection: dateInspection.current.value,
        autoriteCertificatrice: autoriteCertificatrice.current.value,
        idParcelle: id,
        categorie: selectedIntrant.categorie,
        adresseFournisseur: selectedIntrant.fournisseur,
        adresseProducteur: parcelle.producteur,
        adresseCertificateur: account
      };
      // uploader d'abord le certificate
      const upload = await uploadFile(certificat, metadata);
      if (!upload)
        return;
      else {
        hashIpfs = upload.cid;
        idCertificat = upload.id;
      }

      const tx = await contract.validerIntrant(id, selectedIntrant.id, valide, hashIpfs);
      await tx.wait();

      await chargerIntrants();
      alert("Intrant validé avec succès !");
      setShowModal(false);
    } catch (error) {
      console.error("Erreur lors de la validation de l'intrant:", error);
      alert("Erreur lors de la validation de l'intrant");
      // supprimer le certificat uploader sur ipfs si il y a erreur lors de la validation de l'intrant.
      await myPinataSDK.files.public.delete([idCertificat]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="h4 mb-4">Intrants de la parcelle #{id}</h2>

      {hasRole(roles, 1) && (
        <form onSubmit={ajouterIntrant} className="mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Categorie</label>
              <select
                type="text"
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Sélectionner une catégorie</option>
                <option value="engrais">Engrais</option>
                <option value="pesticides">Pesticides</option>
                <option value="semences">Semences</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Nom de l&apos;intrant</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Quantité</label>
              <input
                type="number"
                name="quantite"
                value={formData.quantite}
                onChange={handleChange}
                required
                min="1"
                className="form-control"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={ajoutEnCours}
            className={`btn-agrichain mt-3${ajoutEnCours ? " disabled" : ""}`}
          >
            {ajoutEnCours ? "Ajout en cours..." : "Ajouter l'intrant"}
          </button>
        </form>
      )}

      {intrants.length > 0 ? (
        <div className="row g-3">
          {intrants.map((intrant, index) => (
            <div key={index} className="col-md-4">
              <div className="card shadow-sm p-3">
                <h5 className="card-title">{intrant.nom}</h5>
                <p><strong>Categorie:</strong> {intrant.categorie}</p>
                <p><strong>Quantité:</strong> {intrant.quantite} KG</p>
                <p><strong>Adresse du fournisseur:</strong> {intrant.fournisseur}</p>
                <p>
                  <strong>Statut:</strong>
                  <span className={`badge ms-2 ${intrant.valide ? "bg-success" : "bg-warning"}`}>
                    {intrant.valide ? "certifié" : "Encore non certifié"}
                  </span>
                </p>
                {!intrant.valide && hasRole(roles, 2) ? (
                  <div className="mt-3 d-flex gap-2">
                    <button
                      onClick={() => { setShowModal(true); setSelectedIntrant(intrant) }}
                      className="btn-agrichain-outline"
                    >
                      Certifier
                    </button>
                  </div>
                ) : (
                  <p>
                    <strong>Certificat:</strong>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${intrant.certificatPhytosanitaire}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ms-2 text-decoration-none text-success"
                    >
                      Voir ici
                    </a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted">Aucun intrant n&apos;a encore été ajouté pour cette parcelle.</div>
      )}

      {/* MODAL CERTIFICATION INTRANT (AJOUT METADATA) */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>

          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <form action="" onSubmit={(event) => validerIntrant(event, true)}>
                <div className="modal-content bg-light">
                  <div className="modal-header">
                    <h5 className="modal-title">Ajout certificat de l&apos;intrant &quot;{selectedIntrant.nom}&quot;</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>

                  {/* Corps du modal */}
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="certificat" className="form-label text-muted">Certificat</label>
                      <input type="file" id="certificat" className="form-control" placeholder="Username" onChange={e => setCertificat(e.target.files[0])} required />
                    </div>
                    <div className="row mb-3">
                      <div className="col">
                        <label className="form-label text-muted">Date d&apos;emession</label>
                        <input type="date" className="form-control" required ref={dateEmission} />
                      </div>
                      <div className="col">
                        <label className="form-label text-muted">Date d&apos;expiration</label>
                        <input type="date" className="form-control" required ref={dateExpiration} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Date d&apos;inspection</label>
                      <input type="date" className="form-control" required ref={dateInspection} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="autorite_certificatrice" className="form-label text-muted">Autorité certificatrice</label>
                      <input type="text" className="form-control" required id="autorite_certificatrice" ref={autoriteCertificatrice} />
                    </div>
                  </div>

                  {/* Pied du modal */}
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                    >
                      Certifier
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default IntrantsParcelle; 