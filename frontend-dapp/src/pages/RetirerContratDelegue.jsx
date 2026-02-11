import { useState } from "react";
import { getGestionnaireActeursWrite } from "../config/onChain/frontContracts";

const RetirerContratDelegue = () => {
  const [acteur, setActeur] = useState("");
  const [contrat, setContrat] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const retirerContrat = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const contract = await getGestionnaireActeursWrite();
      await contract.write("retirerContratDelegue", [
        acteur,
        contrat,
      ]);
      setMessage("Contrat délégué retiré avec succès !");
      setIsLoading(false);
    } catch (err) {
      setError("Erreur lors du retrait : " + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Retirer un contrat délégué</h2>
      <div className="mb-3">
        <label className="form-label">Adresse de l&apos;acteur</label>
        <input
          type="text"
          className="form-control"
          value={acteur}
          onChange={(e) => setActeur(e.target.value)}
          placeholder="0x..."
          disabled={isLoading}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">
          Adresse du contrat délégué à retirer
        </label>
        <input
          type="text"
          className="form-control"
          value={contrat}
          onChange={(e) => setContrat(e.target.value)}
          placeholder="0x..."
          disabled={isLoading}
        />
      </div>
      <button
        className="btn-agrichain"
        onClick={retirerContrat}
        disabled={!acteur || !contrat || isLoading}
      >
        Retirer le contrat délégué
      </button>
      {isLoading && <div>Traitement en cours...</div>}
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      {message && <div className="alert alert-success mt-2">{message}</div>}
    </div>
  );
};

export default RetirerContratDelegue;
