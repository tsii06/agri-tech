import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getContract } from "../utils/contract";

function IntrantsParcelle() {
  const { id } = useParams();
  const [intrants, setIntrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    quantite: ""
  });

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
        parseInt(formData.quantite)
      );
      await tx.wait();
      
      alert("Intrant ajouté avec succès !");
      setFormData({ nom: "", quantite: "" });
      await chargerIntrants();
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'intrant:", error);
      alert("Erreur lors de l'ajout de l'intrant");
    } finally {
      setAjoutEnCours(false);
    }
  };

  const validerIntrant = async (nom, valide) => {
    try {
      const contract = await getContract();
      const tx = await contract.validerIntrant(id, nom, valide);
      await tx.wait();
      
      alert("Intrant validé avec succès !");
      await chargerIntrants();
    } catch (error) {
      console.error("Erreur lors de la validation de l'intrant:", error);
      alert("Erreur lors de la validation de l'intrant");
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
      
      <form onSubmit={ajouterIntrant} className="mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Nom de l'intrant</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <div className="col-md-6">
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
          className={`btn mt-3 ${ajoutEnCours ? "btn-secondary disabled" : "btn-primary"}`}
        >
          {ajoutEnCours ? "Ajout en cours..." : "Ajouter l'intrant"}
        </button>
      </form>
      
      {intrants.length > 0 ? (
        <div className="row g-3">
          {intrants.map((intrant, index) => (
            <div key={index} className="col-md-4">
              <div className="card shadow-sm p-3">
                <h5 className="card-title">{intrant.nom}</h5>
                <p><strong>Quantité:</strong> {intrant.quantite}</p>
                <p>
                  <strong>Statut:</strong> 
                  <span className={`badge ms-2 ${intrant.valide ? "bg-success" : "bg-warning"}`}>
                    {intrant.valide ? "Validé" : "En attente"}
                  </span>
                </p>
                {!intrant.valide && (
                  <div className="mt-3 d-flex gap-2">
                    <button
                      onClick={() => validerIntrant(intrant.nom, true)}
                      className="btn btn-sm btn-success"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => validerIntrant(intrant.nom, false)}
                      className="btn btn-sm btn-danger"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted">Aucun intrant n'a encore été ajouté pour cette parcelle.</div>
      )}
    </div>
  );
}

export default IntrantsParcelle; 