import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCollecteurProducteurContract } from "../../utils/contract";

function FaireRecolte() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const quantite = useRef();
  const prix = useRef();
  const dateRecolte = useRef();
  const nomProduit = useRef();

  // recupere l'id du parcelle
  const { id } = useParams();




  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const contract = await getCollecteurProducteurContract();

      const tx = await contract.ajoutRecolte(
        parseInt(id),
        parseInt(quantite.current.value),
        parseInt(prix.current.value),
        dateRecolte.current.value,
        nomProduit.current.value
      );

      await tx.wait();
      alert("Récolte bien enregistrée.");
      navigate("/liste-recolte");

    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la récolte:", error);
      setError("Impossible d'enregistrer la récolte. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">Faire récolte sur la parcelle #{id}</h2>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <div>{error}</div>
        </div>
      )}

      <form className="card shadow-sm p-4" onSubmit={handleSubmit}>

        <div className="mb-3">
          <label className="form-label text-muted">Nom du produit</label>
          <select className="form-control" required ref={nomProduit}>
            <option value="">Sélectionnez un produit</option>
            <option value="vanille">Vanille Bourbon</option>
            <option value="girofle">Girofle</option>
            <option value="poivre_noir">Poivre noir</option>
            <option value="curcuma">Curcuma</option>
            <option value="ravintsara">Huile essentielle de Ravintsara</option>

          </select>

        </div>

        <div className="mb-3">
          <label className="form-label text-muted">Quantité de produit</label>
          <input type="number" className="form-control" required ref={quantite} />
        </div>

        <div className="mb-3">
          <label className="form-label text-muted">Prix</label>
          <input type="number" className="form-control" required ref={prix} />
        </div>

        <div className="mb-3">
          <label className="form-label text-muted">Date de récolte</label>
          <input type="date" className="form-control" required ref={dateRecolte} />
        </div>

        <button
          disabled={loading}
          className={`btn w-100 mt-3 ${loading ? "btn-secondary disabled" : "btn-primary"}`}
        >
          {loading ? "Chargement en cours..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

export default FaireRecolte;