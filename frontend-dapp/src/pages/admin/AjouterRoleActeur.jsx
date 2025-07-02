import { useState } from "react";
import { getGestionnaireActeursContract } from "../../utils/contract";

const ROLES = [
  { value: 0, label: "Producteur" },
  { value: 1, label: "Fournisseur" },
  { value: 2, label: "Certificateur" },
  { value: 3, label: "Collecteur" },
  { value: 4, label: "Auditeur" },
  { value: 5, label: "Transporteur" },
  { value: 6, label: "Exportateur" },
  { value: 7, label: "Administration" },
];

const AjouterRoleActeur = () => {
  const [adresse, setAdresse] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAjouterRole = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const contract = await getGestionnaireActeursContract();
      const tx = await contract.ajouterRole(adresse, Number(role));
      await tx.wait();
      setMessage("Rôle ajouté avec succès à l'acteur !");
      setIsLoading(false);
    } catch (err) {
      setError("Erreur lors de l'ajout du rôle : " + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Ajouter un rôle à un acteur</h2>
      <div className="mb-3">
        <label className="form-label">Adresse de l&apos;acteur</label>
        <input
          type="text"
          className="form-control"
          value={adresse}
          onChange={e => setAdresse(e.target.value)}
          placeholder="0x..."
          disabled={isLoading}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Rôle à ajouter</label>
        <select
          className="form-select"
          value={role}
          onChange={e => setRole(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Sélectionner un rôle</option>
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <button className="btn-agrichain" onClick={handleAjouterRole} disabled={!adresse || role === "" || isLoading}>
        Ajouter le rôle
      </button>
      {isLoading && <div>Traitement en cours...</div>}
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      {message && <div className="alert alert-success mt-2">{message}</div>}
    </div>
  );
};

export default AjouterRoleActeur; 