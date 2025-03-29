import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCollecteurProducteurContract } from "../../utils/contract";

function FaireRecolte() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const idParcelle = useRef();
  const quantite = useRef();
  const prix = useRef();
  const dateRecolte = useRef();
  const nomProduit = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const contract = await getCollecteurProducteurContract();

      const tx = await contract.ajoutRecolte(
        parseInt(idParcelle.current.value),
        parseInt(quantite.current.value),
        parseInt(prix.current.value),
        dateRecolte.current.value,
        nomProduit.current.value
      );

      await tx.wait();
      alert("Récolte bien enregistrée.");
      navigate("/mes-recoltes");

    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la récolte:", error);
      setError("Impossible d'enregistrer la récolte. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">Créer une nouvelle récolte</h2>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <div>{error}</div>
        </div>
      )}

      <form className="card shadow-sm p-4" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label text-muted">ID de la parcelle</label>
          <input type="number" className="form-control" required ref={idParcelle} />
        </div>

        <div className="mb-3">
          <label className="form-label text-muted">Nom du produit</label>
          <input type="text" className="form-control" required ref={nomProduit} />
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