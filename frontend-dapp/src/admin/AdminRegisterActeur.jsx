import React, { useState } from "react";
import { getGestionnaireActeursContract } from "../utils/contract";

const ROLES = [
  "Producteur",
  "Fournisseur",
  "Certificateur",
  "Collecteur",
  "Auditeur",
  "Transporteur",
  "Exportateur",
  "Administration"
];

const TYPES_ENTITE = ["Individu", "Organisation"];

export default function AdminRegisterActeur() {
  const [form, setForm] = useState({
    adresse: "",
    role: 0,
    typeEntite: 0,
    nom: "",
    nifOuCin: "",
    adresseOfficielle: "",
    email: "",
    telephone: ""
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
    if (!isValidAddress(form.adresse)) {
      setMessage("Adresse Ethereum invalide !");
      setLoading(false);
      return;
    }
    try {
      const contract = await getGestionnaireActeursContract();
      const tx = await contract.enregistrerActeur(
        form.adresse,
        Number(form.role),
        Number(form.typeEntite),
        form.nom,
        form.nifOuCin,
        form.adresseOfficielle,
        form.email,
        form.telephone
      );
      await tx.wait();
      setMessage("Acteur enregistré avec succès !");
    } catch (err) {
      setMessage("Erreur : " + (err?.reason || err?.message || err));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h2>Enregistrer un nouvel acteur</h2>
      <form onSubmit={handleSubmit}>
        <label>Adresse (wallet):
          <input name="adresse" value={form.adresse} onChange={handleChange} required className="form-control" />
        </label>
        <label>Rôle:
          <select name="role" value={form.role} onChange={handleChange} className="form-control">
            {ROLES.map((r, i) => <option value={i} key={i}>{r}</option>)}
          </select>
        </label>
        <label>Type d'entité:
          <select name="typeEntite" value={form.typeEntite} onChange={handleChange} className="form-control">
            {TYPES_ENTITE.map((t, i) => <option value={i} key={i}>{t}</option>)}
          </select>
        </label>
        <label>Nom:
          <input name="nom" value={form.nom} onChange={handleChange} required className="form-control" />
        </label>
        <label>NIF ou CIN:
          <input name="nifOuCin" value={form.nifOuCin} onChange={handleChange} required className="form-control" />
        </label>
        <label>Adresse officielle:
          <input name="adresseOfficielle" value={form.adresseOfficielle} onChange={handleChange} required className="form-control" />
        </label>
        <label>Email:
          <input name="email" value={form.email} onChange={handleChange} required className="form-control" />
        </label>
        <label>Téléphone:
          <input name="telephone" value={form.telephone} onChange={handleChange} required className="form-control" />
        </label>
        <button type="submit" disabled={loading} className="btn btn-primary mt-2">{loading ? "Enregistrement..." : "Enregistrer"}</button>
      </form>
      {message && <div className="alert alert-info mt-2">{message}</div>}
    </div>
  );
} 