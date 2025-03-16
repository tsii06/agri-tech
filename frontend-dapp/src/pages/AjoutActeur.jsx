import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContract,getCollecteurContract } from "../utils/contract";

function AjoutActeur({ setState }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const roles = [
    { value: "0", label: "Producteur", description: "Cultive et gère les parcelles agricoles" },
    { value: "1", label: "Fournisseur", description: "Fournit les intrants agricoles" },
    { value: "2", label: "Certificateur", description: "Valide la qualité des produits et des intrants" },
    { value: "3", label: "Collecteur", description: "Collecte et achète les produits agricoles" },
    { value: "4", label: "Auditeur", description: "Effectue les inspections des parcelles" },
    { value: "5", label: "Transporteur", description: "Gère le transport des produits" },
    { value: "6", label: "Exportateur", description: "Passer commande et valide un produit" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // enregistre l'acteur dans les deux contrats
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
    <div className="container mt-5 p-4 bg-white shadow rounded">
    <h2 className="text-center mb-4">S'enregistrer comme nouvel acteur</h2>
    
    <form onSubmit={handleSubmit}>
        <div className="mb-3">
            <label className="form-label">Sélectionnez votre rôle</label>
            <div className="row g-3">
                {roles.map((role) => (
                    <div className="col-md-6" key={role.value}>
                        <div 
                            className="card p-3 border-0 shadow-sm cursor-pointer d-flex flex-column align-items-start"
                            onClick={() => setSelectedRole(role.value)}
                            style={{ transition: '0.3s', borderLeft: selectedRole === role.value ? '5px solid #007bff' : '5px solid transparent' }}
                        >
                            <h5 className="card-title mb-2">{role.label}</h5>
                            <p className="card-text text-muted small">{role.description}</p>
                            {selectedRole === role.value && <div className="text-primary fw-bold mt-auto">✔ Sélectionné</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <button
            type="submit"
            disabled={!selectedRole || loading}
            className="btn w-100 btn-lg mt-3 fw-bold shadow-sm "
            style={{ backgroundColor: !selectedRole || loading ? '#6c757d' : '#007bff', color: 'white' }}
        >
            {loading ? "Enregistrement en cours..." : "S'enregistrer"}
        </button>
    </form>
</div>
  );
}

export default AjoutActeur;
