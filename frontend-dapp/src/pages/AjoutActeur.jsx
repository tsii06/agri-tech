import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContract } from "../utils/contract";

function AjoutActeur({ setState }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const roles = [
    {
      value: "0",
      label: "Producteur",
      description: "Cultive et gère les parcelles agricoles"
    },
    {
      value: "1",
      label: "Fournisseur",
      description: "Fournit les intrants agricoles"
    },
    {
      value: "2",
      label: "Certificateur",
      description: "Valide la qualité des produits et des intrants"
    },
    {
      value: "3",
      label: "Collecteur",
      description: "Collecte et achète les produits agricoles"
    },
    {
      value: "4",
      label: "Auditeur",
      description: "Effectue les inspections des parcelles"
    },
    {
      value: "5",
      label: "Transporteur",
      description: "Gère le transport des produits"
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const contract = await getContract();
      const tx = await contract.enregistrerActeur(
        await window.ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => accounts[0]),
        parseInt(selectedRole)
      );
      await tx.wait();
      
      alert("Acteur enregistré avec succès !");
      setState({});
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">S'enregistrer comme nouvel acteur</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Sélectionnez votre rôle
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <div
                key={role.value}
                className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                  selectedRole === role.value
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-300 hover:border-indigo-400"
                }`}
                onClick={() => setSelectedRole(role.value)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {role.label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {role.description}
                    </p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 ${
                      selectedRole === role.value
                        ? "border-indigo-600 bg-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedRole === role.value && (
                      <svg
                        className="h-4 w-4 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedRole || loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            !selectedRole || loading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Enregistrement en cours..." : "S'enregistrer"}
        </button>
      </form>
    </div>
  );
}

export default AjoutActeur; 