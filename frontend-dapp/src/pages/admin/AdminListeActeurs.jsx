import { useState } from "react";
import { getGestionnaireActeursContract } from "../../utils/contract";
import { ROLES } from "../../utils/contrat/gestionnaireActeurs";
import {
  useActeursUnAUn,
  useAddressActeurs,
} from "../../hooks/queries/useActeurs";
import Skeleton from "react-loading-skeleton";
import { raccourcirChaine } from "../../utils/stringUtils";

const TYPES_ENTITE = ["Individu", "Organisation"];

export default function AdminListeActeurs() {
  const [editIndex, setEditIndex] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  // Recuperer tous les address de tous les acteurs
  const { data: tabAddress, isLoading } = useAddressActeurs();

  // Recuperer tous les acteurs un a un
  const acteurs = useActeursUnAUn(tabAddress);

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
      // await fetchActeurs();
      setEditIndex(null);
    } catch (err) {
      setEditMessage("Erreur : " + (err?.reason || err?.message || err));
    }
    setEditLoading(false);
  }

  return (
    <div className="container mt-4">
      <h2>Liste des acteurs</h2>
      <table className="table table-bordered table-striped">
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
          {/* Skeleton pour le cahrgement initiale */}
          {isLoading && (
            <tr>
              <td colSpan={7} className="p-0 m-0">
                <Skeleton width={"100%"} height={"100%"} />
              </td>
            </tr>
          )}

          {acteurs.map((q, i) => {
            const acteur = q.data;

            // Skeleton si encours de chargement
            if (q.isLoading || q.isFetching)
              return (
                <tr key={i}>
                  <td colSpan={7} className="p-0 m-0">
                    <Skeleton width={"100%"} height={"100%"} />
                  </td>
                </tr>
              );

            // Afficher acteurs
            return (
              <tr key={i}>
                <td>{raccourcirChaine(acteur.adresse)}</td>
                <td>{acteur.roles.map((role) => `${ROLES[role]}\n`)}</td>
                <td>{TYPES_ENTITE[acteur.typeEntite]}</td>
                <td>{acteur.nom}</td>
                <td>{acteur.email}</td>
                <td>{acteur.actif ? "Oui" : "Non"}</td>
                <td>
                  <button
                    className="btn-agrichain-outline"
                    onClick={() => handleEdit(i)}
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            );
          })}

          {/* Si aucun acteur n'est pas encore enregistrer */}
          {!isLoading && acteurs.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center">
                Aucun acteurs trouver.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editIndex !== null && (
        <div className="card mt-4">
          <div className="card-body">
            <h5>Modifier l&apos;acteur</h5>
            <form onSubmit={handleEditSubmit}>
              <label>
                Nom:
                <input
                  name="nom"
                  value={editForm.nom}
                  onChange={handleEditChange}
                  className="form-control"
                  required
                />
              </label>
              <label>
                NIF ou CIN:
                <input
                  name="nifOuCin"
                  value={editForm.nifOuCin}
                  onChange={handleEditChange}
                  className="form-control"
                  required
                />
              </label>
              <label>
                Adresse officielle:
                <input
                  name="adresseOfficielle"
                  value={editForm.adresseOfficielle}
                  onChange={handleEditChange}
                  className="form-control"
                  required
                />
              </label>
              <label>
                Email:
                <input
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="form-control"
                  required
                />
              </label>
              <label>
                Téléphone:
                <input
                  name="telephone"
                  value={editForm.telephone}
                  onChange={handleEditChange}
                  className="form-control"
                  required
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary mt-2"
                disabled={editLoading}
              >
                {editLoading ? "Modification..." : "Enregistrer"}
              </button>
              <button
                type="button"
                className="btn btn-secondary mt-2 ms-2"
                onClick={() => setEditIndex(null)}
              >
                Annuler
              </button>
            </form>
            {editMessage && (
              <div className="alert alert-info mt-2">{editMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
