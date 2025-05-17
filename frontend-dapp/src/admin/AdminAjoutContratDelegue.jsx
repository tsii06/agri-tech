import React, { useState } from "react";
import { getGestionnaireActeursContract } from "../utils/contract";

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
      setMessage("Erreur : " + (err?.reason || err?.message || err));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2>Ajouter un contrat délégué à un acteur</h2>
      <form onSubmit={handleSubmit}>
        <label>Adresse de l'acteur :
          <input name="acteur" value={form.acteur} onChange={handleChange} required className="form-control" />
        </label>
        <label>Adresse du contrat délégué :
          <input name="contratDelegue" value={form.contratDelegue} onChange={handleChange} required className="form-control" />
        </label>
        <button type="submit" disabled={loading} className="btn btn-primary mt-2">{loading ? "Ajout..." : "Ajouter"}</button>
      </form>
      {message && <div className="alert alert-info mt-2">{message}</div>}
    </div>
  );
} 