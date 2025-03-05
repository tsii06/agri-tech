import { useState } from "react";
import { ethers } from "ethers";
import { getContract, executeContractMethod } from "../utils/contract";

function AjoutActeur() {
  const [roleChoisi, setRoleChoisi] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  const enregistrerActeur = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const provider = contract.runner.provider;
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      await executeContractMethod(
        contract.enregistrerActeur,
        account,
        Number(roleChoisi)
      );

      alert("Acteur enregistré avec succès !");
      
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Enregistrement Acteur</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Choisir un rôle
            </label>
            <select
              value={roleChoisi}
              onChange={(e) => setRoleChoisi(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="0">Collecteur</option>
              <option value="1">Exportateur</option>
            </select>
          </div>
          <button
            onClick={enregistrerActeur}
            disabled={isLoading}
            className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
              isLoading 
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Enregistrement en cours..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AjoutActeur; 