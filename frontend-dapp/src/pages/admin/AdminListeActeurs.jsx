import { useEffect, useState } from "react";
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

export default function AdminListeActeurs() {
  const [acteurs, setActeurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    fetchActeurs();
  }, []);

  async function fetchActeurs() {
    setLoading(true);
    setError("");
    try {
      const contract = await getGestionnaireActeursContract();
      let all = [];
      for (let role = 0; role < ROLES.length; role++) {
        const addresses = await contract.getActeursByRole(role);
        for (let addr of addresses) {
          try {
            const details = await contract.getDetailsActeur(addr);
            all.push({
              adresse: addr,
              role,
              typeEntite: details[3],
              nom: details[4],
              nifOuCin: details[5],
              adresseOfficielle: details[6],
              email: details[7],
              telephone: details[8],
              actif: details[2],
              idBlockchain: details[0],
            });
          } catch (e) {
            console.error("Erreur lors de la recuperation de details acteur : ", e);
          }
        }
      }
      setActeurs(all);
    } catch (err) {
      setError("Erreur lors de la récupération des acteurs : " + (err?.reason || err?.message || err));
    }
    setLoading(false);
  }

  function handleEdit(index) {
    setEditIndex(index);
    setEditForm({ ...acteurs[index] });
    setEditMessage("");
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function isValidAddress(addr) {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditLoading(true);
    setEditMessage("");
    if (!isValidAddress(editForm.adresse)) {
      setEditMessage("Adresse Ethereum invalide !");
      setEditLoading(false);
      return;
    }
    try {
      const contract = await getGestionnaireActeursContract();
      const tx = await contract.modifierActeur(
        editForm.adresse,
        editForm.nom,
        editForm.nifOuCin,
        editForm.adresseOfficielle,
        editForm.email,
        editForm.telephone
      );
      await tx.wait();
      setEditMessage("Acteur modifié avec succès !");
      await fetchActeurs();
      setEditIndex(null);
    } catch (err) {
      setEditMessage("Erreur : " + (err?.reason || err?.message || err));
    }
    setEditLoading(false);
  }

  if (loading) return <div>Chargement des acteurs...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2>Liste des acteurs</h2>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Adresse</th>
            <th>Rôle</th>
            <th>Type</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Actif</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {acteurs.map((acteur, i) => (
            <tr key={acteur.adresse}>
              <td>{acteur.adresse}</td>
              <td>{ROLES[acteur.role]}</td>
              <td>{TYPES_ENTITE[acteur.typeEntite]}</td>
              <td>{acteur.nom}</td>
              <td>{acteur.email}</td>
              <td>{acteur.actif ? "Oui" : "Non"}</td>
              <td>
                <button className="btn-agrichain-outline" onClick={() => handleEdit(i)}>Modifier</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editIndex !== null && (
        <div className="card mt-4">
          <div className="card-body">
            <h5>Modifier l&apos;acteur</h5>
            <form onSubmit={handleEditSubmit}>
              <label>Nom:
                <input name="nom" value={editForm.nom} onChange={handleEditChange} className="form-control" required />
              </label>
              <label>NIF ou CIN:
                <input name="nifOuCin" value={editForm.nifOuCin} onChange={handleEditChange} className="form-control" required />
              </label>
              <label>Adresse officielle:
                <input name="adresseOfficielle" value={editForm.adresseOfficielle} onChange={handleEditChange} className="form-control" required />
              </label>
              <label>Email:
                <input name="email" value={editForm.email} onChange={handleEditChange} className="form-control" required />
              </label>
              <label>Téléphone:
                <input name="telephone" value={editForm.telephone} onChange={handleEditChange} className="form-control" required />
              </label>
              <button type="submit" className="btn btn-primary mt-2" disabled={editLoading}>{editLoading ? "Modification..." : "Enregistrer"}</button>
              <button type="button" className="btn btn-secondary mt-2 ms-2" onClick={() => setEditIndex(null)}>Annuler</button>
            </form>
            {editMessage && <div className="alert alert-info mt-2">{editMessage}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 