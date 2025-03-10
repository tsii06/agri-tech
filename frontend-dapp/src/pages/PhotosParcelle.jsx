import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getContract } from "../utils/contract";

function PhotosParcelle() {
  const { id } = useParams();
  const [photos, setPhotos] = useState([]);
  const [nouvellePhoto, setNouvellePhoto] = useState("");
  const [loading, setLoading] = useState(true);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  useEffect(() => {
    chargerPhotos();
  }, [id]);

  const chargerPhotos = async () => {
    try {
      const contract = await getContract();
      const photosData = await contract.getPhotos(id);
      // photosData est encore un objet alors il faut la convertir
      setPhotos(Object.values(photosData));
    } catch (error) {
      console.error("Erreur lors du chargement des photos:", error);
      alert("Erreur lors du chargement des photos");
    } finally {
      setLoading(false);
    }
  };

  const ajouterPhoto = async (e) => {
    e.preventDefault();
    setAjoutEnCours(true);

    try {
      const contract = await getContract();
      const tx = await contract.ajouterPhoto(id, nouvellePhoto);
      await tx.wait();
      
      alert("Photo ajoutée avec succès !");
      setNouvellePhoto("");
      await chargerPhotos();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la photo:", error);
      alert("Erreur lors de l'ajout de la photo");
    } finally {
      setAjoutEnCours(false);
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
      <h2 className="h4 mb-4">Photos de la parcelle #{id}</h2>
      
      <form onSubmit={ajouterPhoto} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            value={nouvellePhoto}
            onChange={(e) => setNouvellePhoto(e.target.value)}
            placeholder="URL de la photo"
            required
            className="form-control"
          />
          <button
            type="submit"
            disabled={ajoutEnCours}
            className={`btn ${ajoutEnCours ? "btn-secondary disabled" : "btn-primary"}`}
          >
            {ajoutEnCours ? "Ajout en cours..." : "Ajouter une photo"}
          </button>
        </div>
      </form>
      
      {photos.length > 0 ? (
        <div className="row g-3">
          {photos.map((photo, index) => (
            <div key={index} className="col-md-4">
              <div className="card shadow-sm">
                <img
                  src={photo}
                  alt={`Photo ${index + 1} de la parcelle ${id}`}
                  className="card-img-top"
                  onError={(e) => {
                    // e.target.src = "https://via.placeholder.com/400x300?text=Image+non+disponible";
                  }}
                />
                <div className="card-body">
                  <p className="text-muted small">Photo {index + 1}</p>
                  <a
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-link p-0"
                  >
                    Voir l'image originale
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted">Aucune photo n'a encore été ajoutée pour cette parcelle.</div>
      )}
    </div>
  );
}

export default PhotosParcelle; 