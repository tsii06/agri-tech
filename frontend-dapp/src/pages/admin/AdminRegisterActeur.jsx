import { useState } from "react";
import { ROLES } from "../../utils/contrat/gestionnaireActeurs";
import { useCreateActeur } from "../../hooks/mutations/mutationActeurs";

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
    telephone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // useMutation pour la creation d'acteurs
  const createMutation = useCreateActeur();

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
      await createMutation.mutateAsync({
        adresse: form.adresse,
        role: Number(form.role),
        typeEntite: Number(form.typeEntite),
        nom: form.nom,
        nifOuCin: form.nifOuCin,
        adresseOfficielle: form.adresseOfficielle,
        email: form.email,
        telephone: form.telephone,
      });
      setMessage("Acteur enregistré avec succès !");
    } catch (err) {
      console.error("Enregistrement acteur : ", err);
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
