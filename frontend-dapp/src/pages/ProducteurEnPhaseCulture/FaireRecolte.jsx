import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCollecteurProducteurContract, getContract } from "../../utils/contract";
import { uploadConsolidatedData } from "../../utils/ipfsUtils"; 
import { useUserContext } from "../../context/useContextt";

function FaireRecolte() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parcelle, setParcelle] = useState(null);
  const [recolteData, setRecolteData] = useState({
    nomProduit: "",
    quantite: "",
    prix: "",
    dateRecolte: ""
  });

  // recupere l'id du parcelle
  const { id } = useParams();
  const { account } = useUserContext();

  useEffect(() => {
    chargerParcelle();
  }, [id]);

  const chargerParcelle = async () => {
    try {
      if (!id || isNaN(Number(id))) return;
      const contract = await getContract();
      const parcelleData = await contract.getParcelle(Number(id));
      setParcelle(parcelleData);
    } catch (error) {
      console.error("Erreur lors du chargement de la parcelle:", error);
      setError("Impossible de charger les informations de la parcelle.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecolteData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Créer l'objet récolte consolidé pour IPFS
      const recolteConsolidee = {
        type: 'recolte',
        parcelleId: parseInt(id),
        nomProduit: recolteData.nomProduit,
        quantite: parseInt(recolteData.quantite),
        prix: parseInt(recolteData.prix),
        dateRecolte: recolteData.dateRecolte,
        producteur: account,
        parcelleHashMerkle: parcelle?.hashMerkle || "",
        timestamp: Date.now(),
        version: "1.0"
      };

      // 2. Upload des données consolidées sur IPFS
      const recolteUpload = await uploadConsolidatedData(recolteConsolidee, "recolte");
      
      if (!recolteUpload.success) {
        throw new Error("Erreur lors de l'upload des données de récolte sur IPFS");
      }

      // 3. Créer la récolte avec le CID IPFS
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.ajoutRecolte(
        [parseInt(id)], // Tableau de parcelles
        parseInt(recolteData.quantite),
        parseInt(recolteData.prix),
        recolteUpload.cid // CID IPFS
      );
      await tx.wait();

      alert("Récolte bien enregistrée avec traçabilité IPFS et hash Merkle !");
      navigate("/liste-recolte");

    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la récolte:", error);
      setError("Impossible d'enregistrer la récolte. Veuillez réessayer plus tard.");
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
                <p><strong>ID:</strong> {parcelle.id}</p>
                <p><strong>Producteur:</strong> {parcelle.producteur}</p>
                <p><strong>CID IPFS:</strong> {parcelle.cid || "Aucun"}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Hash Merkle:</strong> {parcelle.hashMerkle || "Non calculé"}</p>
                <p><strong>Statut:</strong> 
                  {parcelle.cid ? 
                    <span className="badge bg-success">Données consolidées</span> : 
                    <span className="badge bg-warning">Données non consolidées</span>
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
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
            <option value="Vanille">Vanille</option>
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

        <div className="alert alert-info">
          <strong>Information:</strong> Cette récolte sera automatiquement enregistrée sur IPFS avec un hash Merkle pour assurer la traçabilité complète du produit.
        </div>

        <button
          disabled={loading}
          className={`btn w-100 mt-3 ${loading ? "btn-secondary disabled" : "btn-primary"}`}
        >
          {loading ? "Enregistrement en cours..." : "Enregistrer la récolte"}
        </button>
      </form>
    </div>
  );
}

export default FaireRecolte;