import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, executeContractMethod } from "../utils/contract";

function AjoutActeur() {
  const [role, setRole] = useState("0");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const roles = [
    { value: "0", label: "Collecteur" },
    { value: "1", label: "Exportateur" },
    { value: "2", label: "Transporteur" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Obtenir l'adresse du compte connecté
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      const contract = await getContract();
      
      await executeContractMethod(
        contract.enregistrerActeur,
        account,
        Number(role)
      );

      alert("Acteur enregistré avec succès !");
      navigate("/liste-produits");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Enregistrement d'un nouvel acteur</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez votre rôle
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              {roles.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description du rôle :</h3>
            {role === "0" && (
              <p className="text-sm text-gray-600">
                En tant que Collecteur, vous pourrez ajouter des produits et gérer leur disponibilité.
              </p>
            )}
            {role === "1" && (
              <p className="text-sm text-gray-600">
                En tant qu'Exportateur, vous pourrez valider les produits, passer des commandes et effectuer des paiements.
              </p>
            )}
            {role === "2" && (
              <p className="text-sm text-gray-600">
                En tant que Transporteur, vous pourrez enregistrer les conditions de transport et mettre à jour le statut des livraisons.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Enregistrement en cours..." : "S'enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AjoutActeur; 