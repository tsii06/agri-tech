import { useState } from "react";
import { getGestionnaireActeursContract } from "../../utils/contract";

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
    <div className="card mt-4" style={{ maxWidth: 600, margin: "auto" }}>
      <div className="card-body">
        <h4 className="card-title mb-4">Enregistrer un nouvel acteur</h4>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-12 mb-3">
              <label className="form-label">Adresse (wallet)</label>
              <input
                name="adresse"
                value={form.adresse}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Rôle</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="form-control"
              >
                {ROLES.map((r, i) => (
                  <option value={i} key={i}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Type d&apos;entité</label>
              <select
                name="typeEntite"
                value={form.typeEntite}
                onChange={handleChange}
                className="form-control"
              >
                {TYPES_ENTITE.map((t, i) => (
                  <option value={i} key={i}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Nom</label>
              <input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">NIF ou CIN</label>
              <input
                name="nifOuCin"
                value={form.nifOuCin}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="col-md-12 mb-3">
              <label className="form-label">Adresse officielle</label>
              <input
                name="adresseOfficielle"
                value={form.adresseOfficielle}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Téléphone</label>
              <input
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="d-flex justify-content-start">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          {message && <div className="alert alert-info mt-3">{message}</div>}
        </form>
      </div>
    </div>
  );
}  