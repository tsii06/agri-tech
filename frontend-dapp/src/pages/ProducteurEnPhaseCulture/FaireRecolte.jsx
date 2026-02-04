/* eslint-disable react-hooks/exhaustive-deps */
import { useState,  useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  uploadToIPFS,
  deleteFromIPFSByCid,
} from "../../utils/ipfsUtils";
import { useUserContext } from "../../context/useContextt";
import { getParcelle } from "../../utils/contrat/producteur";
import { raccourcirChaine } from "../../utils/stringUtils";
import { useCreateRecolte } from "../../hooks/mutations/mutationRecoltes";

function FaireRecolte() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parcelle, setParcelle] = useState(null);
  const [recolteData, setRecolteData] = useState({
    nomProduit: "",
    quantite: "",
    prix: "",
    dateRecolte: "",
  });
  const [calendrierCultural, setCalendrierCultural] = useState(null);

  // recupere l'id du parcelle
  const { id } = useParams();
  const { account } = useUserContext();

  // useMutation pour la creation de recolte.
  const addRecolteMutation = useCreateRecolte(account);

  useEffect(() => {
    chargerParcelle();
  }, [id]);

  const chargerParcelle = async () => {
    try {
      if (!id || isNaN(Number(id))) return;
      const parcelleData = await getParcelle(Number(id));
      setParcelle(parcelleData);
    } catch (error) {
      console.error("Erreur lors du chargement de la parcelle:", error);
      setError("Impossible de charger les informations de la parcelle.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecolteData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let cidCalendrierCultural = '';

    try {
      // Uploader la calendrier cultural
      if (!calendrierCultural) {
        throw new Error("Calendrier cultural manquant");
      } else {
        const upload = await uploadToIPFS(calendrierCultural, {}, "calendrier-cultural");

        if (!upload.success) {
          throw new Error(
            upload.error || "Erreur lors de l'upload du calendrier cultural"
          );
        } else {
          cidCalendrierCultural = upload.cid;
        }
      }

      // 1) Crée la récolte on-chain + consolidation existante
      await addRecolteMutation.mutateAsync({
        recolteData: {...recolteData, cidCalendrierCultural: cidCalendrierCultural},
        parcelle: parcelle
      });

      alert("Récolte bien enregistrée avec traçabilité IPFS et hash Merkle !");
      navigate("/liste-recolte");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la récolte:", error);
      setError(
        "Impossible d'enregistrer la récolte. Veuillez réessayer plus tard."
      );
      // supprimer calendrier cultural si erreur
      if (cidCalendrierCultural !== '') deleteFromIPFSByCid(cidCalendrierCultural);
    } finally {
      setLoading(false);
    }
  };

  if (!parcelle) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">Faire récolte sur la parcelle #{id}</h2>

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
                  <strong>Producteur:</strong> {raccourcirChaine(parcelle.producteur?.adresse)}
                </p>
                <p>
                  <strong>CID IPFS:</strong> {parcelle.cid ? raccourcirChaine(parcelle.cid) : "Aucun"}
                </p>
              </div>
              <div className="col-md-6">
                <p>
                  <strong>Hash transaction:</strong>{" "}
                  {parcelle.hashTransaction ? raccourcirChaine(parcelle.hashTransaction) : "Non calculé"}
                </p>
                <p>
                  <strong>Statut:</strong> &nbsp;
                  {parcelle.cid ? (
                    <span className="badge bg-success">
                      Données consolidées
                    </span>
                  ) : (
                    <span className="badge bg-warning">
                      Données non consolidées
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger d-flex align-items-center"
          role="alert"
        >
          <div>{error}</div>
        </div>
      )}

      <form className="card shadow-sm p-4" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nom du produit</label>
          <select
            className="form-control"
            required
            name="nomProduit"
            value={recolteData.nomProduit}
            onChange={handleInputChange}
          >
            <option value="">Sélectionnez un produit</option>
            <option value="Girofle">Girofle</option>
            <option value="Poivre noir">Poivre noir</option>
            <option value="Cacao">Cacao</option>
            <option value="Café">Café</option>
            <option value="Cannelle">Cannelle</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Quantité de produit (kg)</label>
          <input
            type="number"
            className="form-control"
            required
            name="quantite"
            value={recolteData.quantite}
            onChange={handleInputChange}
            min="1"
            step="0.1"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Prix unitaire (Ariary/kg)</label>
          <input
            type="number"
            className="form-control"
            required
            name="prix"
            value={recolteData.prix}
            onChange={handleInputChange}
            min="1"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Date de récolte</label>
          <input
            type="date"
            className="form-control"
            required
            name="dateRecolte"
            value={recolteData.dateRecolte}
            onChange={handleInputChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="calendrierCultural" className="form-label">
            Calendrier cultural
          </label>
          <input
            type="file"
            className="form-control"
            id="calendrierCultural"
            onChange={(e) => setCalendrierCultural(e.target.files[0])}
            accept=".pdf,.doc,.docx"
            required
          />
        </div>

        <div className="alert alert-info">
          <strong>Information:</strong> Cette récolte sera automatiquement
          enregistrée sur IPFS avec un hash Merkle pour assurer la traçabilité
          complète du produit.
        </div>

        <button
          disabled={loading}
          className={`btn w-100 mt-3 ${
            loading ? "btn-secondary disabled" : "btn-primary"
          }`}
        >
          {loading ? "Enregistrement en cours..." : "Enregistrer la récolte"}
        </button>
      </form>
    </div>
  );
}

export default FaireRecolte;
