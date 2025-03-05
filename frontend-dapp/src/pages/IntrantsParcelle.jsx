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
      setIntrants(intrantsData);
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
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Intrants de la parcelle #{id}</h2>

      <form onSubmit={ajouterIntrant} className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom de l'intrant
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantité
            </label>
            <input
              type="number"
              name="quantite"
              value={formData.quantite}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={ajoutEnCours}
          className={`mt-4 px-4 py-2 rounded-md text-white ${
            ajoutEnCours
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {ajoutEnCours ? "Ajout en cours..." : "Ajouter l'intrant"}
        </button>
      </form>

      {intrants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {intrants.map((intrant, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">{intrant.nom}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Quantité:</span> {intrant.quantite}
                </p>
                <p>
                  <span className="font-medium">Statut:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      intrant.valide
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {intrant.valide ? "Validé" : "En attente"}
                  </span>
                </p>
              </div>
              {!intrant.valide && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => validerIntrant(intrant.nom, true)}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => validerIntrant(intrant.nom, false)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          Aucun intrant n'a encore été ajouté pour cette parcelle.
        </div>
      )}
    </div>
  );
}

export default IntrantsParcelle; 