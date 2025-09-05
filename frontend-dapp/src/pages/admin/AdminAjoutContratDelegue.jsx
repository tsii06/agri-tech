import { useState } from "react";
import { getGestionnaireActeursContract } from "../../utils/contract";

export default function AdminAjoutContratDelegue() {
  const [form, setForm] = useState({
    acteur: "",
    contratDelegue: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  function isValidAddress(addr) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    if (!isValidAddress(form.acteur) || !isValidAddress(form.contratDelegue)) {
      setMessage("Adresse Ethereum invalide !");
      setLoading(false);
      return;
    }
    try {
      const contract = await getGestionnaireActeursContract();
      const tx = await contract.ajouterContratDelegue(
        form.acteur,
        form.contratDelegue
      );
      await tx.wait();
      setMessage("Contrat délégué ajouté avec succès !");
    } catch (err) {
      console.error("Ajout contrat deleguer :", err);
    }
    setLoading(false);
  };

  return (
    <div className="card mt-4" style={{ maxWidth: 600, margin: "auto" }}>
      <div className="card-body">
        <h4 className="card-title mb-4">Ajouter un contrat délégué à un acteur</h4>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Adresse de l&apos;acteur</label>
            <input
              name="acteur"
              value={form.acteur}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="0x..."
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Adresse du contrat délégué</label>
            <input
              name="contratDelegue"
              value={form.contratDelegue}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="0x..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-agrichain"
          >
            {loading ? "Ajout..." : "Ajouter"}
          </button>
        </form>

        {message && (
          <div className="alert alert-info mt-3">{message}</div>
        )}
      </div>
    </div>

  );
} 