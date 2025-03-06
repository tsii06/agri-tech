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
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Photos de la parcelle #{id}</h2>

      <form onSubmit={ajouterPhoto} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={nouvellePhoto}
            onChange={(e) => setNouvellePhoto(e.target.value)}
            placeholder="URL de la photo"
            required
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={ajoutEnCours}
            className={`px-4 py-2 rounded-md text-white ${
              ajoutEnCours
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {ajoutEnCours ? "Ajout en cours..." : "Ajouter une photo"}
          </button>
        </div>
      </form>

      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={photo}
                alt={`Photo ${index + 1} de la parcelle ${id}`}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  // e.target.src = "https://via.placeholder.com/400x300?text=Image+non+disponible";
                }}
              />
              <div className="p-4">
                <p className="text-sm text-gray-500">Photo {index + 1}</p>
                <a
                  href={photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  Voir l'image originale
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          Aucune photo n'a encore été ajoutée pour cette parcelle.
        </div>
      )}
    </div>
  );
}

export default PhotosParcelle; 