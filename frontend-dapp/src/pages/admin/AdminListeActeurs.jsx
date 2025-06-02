import React, { useEffect, useState } from "react";
import { getGestionnaireActeursContract } from "../../utils/contract";
import { fetchFromIPFS } from "../../utils/ipfs";

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
            const offChainDetailsHash = details[6];
            let ipfsDataContent = { nom: "N/A", email: "N/A", telephone: "N/A", nifOuCin: "N/A", adresseOfficielle: "N/A" };

            if (offChainDetailsHash && offChainDetailsHash.trim() !== "") {
              try {
                const ipfsData = await fetchFromIPFS(offChainDetailsHash);
                if (ipfsData) {
                  ipfsDataContent.nom = ipfsData.nom || "Non disponible (IPFS)";
                  ipfsDataContent.email = ipfsData.email || "Non disponible (IPFS)";
                  ipfsDataContent.telephone = ipfsData.telephone || "Non disponible (IPFS)";
                  ipfsDataContent.nifOuCin = ipfsData.nifOuCin || "Non disponible (IPFS)";
                  ipfsDataContent.adresseOfficielle = ipfsData.adresseOfficielle || "Non disponible (IPFS)";
                } else {
                  ipfsDataContent.nom = "Données IPFS non trouvées";
                }
              } catch (ipfsError) {
                console.error("Erreur fetch IPFS pour " + addr + ":", ipfsError);
                ipfsDataContent.nom = "Erreur IPFS";
              }
            }

            all.push({
              adresse: addr,
              role, // role is the loop variable for roles index
              typeEntite: Number(details[3]), // typeEntite is details[3]
              nom: ipfsDataContent.nom,
              nifOuCin: ipfsDataContent.nifOuCin,
              adresseOfficielle: ipfsDataContent.adresseOfficielle,
              email: ipfsDataContent.email,
              telephone: ipfsDataContent.telephone,
              actif: details[2], // actif is details[2]
              idBlockchain: details[0], // idBlockchain is details[0]
              offChainDetailsHash: offChainDetailsHash // Store the hash itself
            });
          } catch (e) {
            console.error("Erreur getDetailsActeur pour " + addr + ":", e);
            // Optionnel: ajouter un placeholder si getDetailsActeur échoue
             all.push({
              adresse: addr,
              role,
              nom: "Erreur Contrat",
              idBlockchain: "N/A",
              actif: false,
              offChainDetailsHash: "N/A"
            });
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
      // Appel modifié pour modifierActeur
      const tx = await contract.modifierActeur(
        editForm.adresse,
        editForm.offChainDetailsHash
      );
      await tx.wait();
      setEditMessage("Détails off-chain de l'acteur (hash) modifiés avec succès !");
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
            <th>NIF/CIN</th>
            <th>Adresse Officielle</th>
            <th>Email</th>
            <th>Téléphone</th>
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
              <td>{acteur.nifOuCin}</td>
              <td>{acteur.adresseOfficielle}</td>
              <td>{acteur.email}</td>
              <td>{acteur.telephone}</td>
              <td>{acteur.actif ? "Oui" : "Non"}</td>
              <td>
                <button className="btn btn-sm btn-warning" onClick={() => handleEdit(i)}>Modifier</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editIndex !== null && (
        <div className="card mt-4">
          <div className="card-body">
            <h5>Modifier l'acteur (Hash des détails Off-Chain)</h5>
            <p>Adresse: {editForm.adresse}</p>
            <p>ID Blockchain: {editForm.idBlockchain}</p>
            <p>Rôle actuel: {ROLES[editForm.role]}</p>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-3">
                <label htmlFor="offChainDetailsHashInput" className="form-label">Off-Chain Details Hash (IPFS):</label>
                <input
                  id="offChainDetailsHashInput"
                  name="offChainDetailsHash"
                  value={editForm.offChainDetailsHash || ''}
                  onChange={handleEditChange}
                  className="form-control"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary mt-2" disabled={editLoading}>
                {editLoading ? "Modification..." : "Enregistrer le nouveau Hash"}
              </button>
              <button type="button" className="btn btn-secondary mt-2 ms-2" onClick={() => setEditIndex(null)}>Annuler</button>
            </form>
            {editMessage && <div className="alert alert-info mt-2">{editMessage}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 