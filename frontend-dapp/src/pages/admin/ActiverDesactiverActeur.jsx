import { useState } from "react";
import { getGestionnaireActeursContract } from "../../utils/contract";

const ActiverDesactiverActeur = () => {
  const [adresse, setAdresse] = useState("");
  const [statut, setStatut] = useState(null); // null = inconnu, true = actif, false = inactif
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Vérifier le statut de l'acteur
  const verifierStatut = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const contract = await getGestionnaireActeursContract();
      const details = await contract.getDetailsActeur(adresse);
      // details[2] correspond à actif (bool)
      setStatut(details[2]);
      setIsLoading(false);
    } catch (err) {
      setError("Erreur lors de la vérification du statut : " + err.message);
      setIsLoading(false);
      setStatut(null);
    }
  };

  // Activer l'acteur
  const activerActeur = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const contract = await getGestionnaireActeursContract();
      const tx = await contract.activerActeur(adresse);
      await tx.wait();
      setMessage("Acteur activé avec succès !");
      await verifierStatut();
      setIsLoading(false);
    } catch (err) {
      setError("Erreur lors de l'activation : " + err.message);
      setIsLoading(false);
    }
  };

  // Désactiver l'acteur
  const desactiverActeur = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const contract = await getGestionnaireActeursContract();
      const tx = await contract.desactiverActeur(adresse);
      await tx.wait();
      setMessage("Acteur désactivé avec succès !");
      await verifierStatut();
      setIsLoading(false);
    } catch (err) {
      setError("Erreur lors de la désactivation : " + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Activer / Désactiver un acteur</h2>
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
      <button className="btn-agrichain mb-3" onClick={verifierStatut} disabled={!adresse || isLoading}>
        Vérifier le statut
      </button>
      {isLoading && <div>Chargement...</div>}
      {error && <div className="alert alert-danger mt-2">{error}</div>}
      {message && <div className="alert alert-success mt-2">{message}</div>}
      {statut !== null && !isLoading && (
        <div className="mt-3">
          <div>
            Statut actuel : {statut ? <span className="text-success">Actif</span> : <span className="text-danger">Inactif</span>}
          </div>
          {statut ? (
            <button className="btn-agrichain-outline mt-2" onClick={desactiverActeur} disabled={isLoading}>
              Désactiver l&apos;acteur
            </button>
          ) : (
            <button className="btn-agrichain mt-2" onClick={activerActeur} disabled={isLoading}>
              Activer l&apos;acteur
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiverDesactiverActeur; 