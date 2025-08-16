import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getCollecteurProducteurContract } from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import { hasRole } from "../../utils/roles";
import { uploadConditionTransport, getIPFSURL, uploadConsolidatedData } from "../../utils/ipfsUtils";
import { calculateConditionMerkleHash } from "../../utils/merkleUtils";

function ConditionsTransport() {
  const { id } = useParams(); // id de la commande
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [commande, setCommande] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [formData, setFormData] = useState({
    temperature: "",
    humidite: "",
    observations: "",
    notes: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const { account, roles } = useUserContext();

  useEffect(() => {
    chargerCommande();
  }, [id]);

  const chargerCommande = async () => {
    try {
      const contract = await getCollecteurProducteurContract();
      const commandeData = await contract.getCommande(id);
      setCommande(commandeData);
      
      // Si la commande a des conditions, essayer de les récupérer
      if (commandeData.conditions && commandeData.conditions.length > 0) {
        setConditions(commandeData.conditions);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la commande:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 1. Créer l'objet condition de transport
      const conditionData = {
        commandeId: id,
        transporteur: account,
        temperature: formData.temperature,
        humidite: formData.humidite,
        observations: formData.observations,
        notes: formData.notes,
        timestamp: Date.now()
      };

      // 2. Upload de la condition sur IPFS
      const conditionUpload = await uploadConditionTransport(selectedFile, conditionData);
      
      if (!conditionUpload.success) {
        throw new Error("Erreur lors de l'upload de la condition sur IPFS");
      }

      // 3. Créer l'objet condition complet
      const nouvelleCondition = {
        ...conditionData,
        cid: conditionUpload.cid,
        id: conditions.length + 1
      };

      // 4. Ajouter la nouvelle condition à la liste
      const nouvellesConditions = [...conditions, nouvelleCondition];

      // 5. Créer un objet consolidé avec toutes les conditions
      const conditionsConsolidees = {
        type: 'conditions-transport',
        commandeId: id,
        conditions: nouvellesConditions,
        timestamp: Date.now()
      };

      // 6. Upload des données consolidées sur IPFS
      const conditionsUpload = await uploadConsolidatedData(conditionsConsolidees, "conditions-transport");
      
      if (!conditionsUpload.success) {
        throw new Error("Erreur lors de l'upload des conditions consolidées");
      }

      // 7. Enregistrer la condition sur la blockchain
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.enregistrerCondition(id, conditionsUpload.cid);
      await tx.wait();

      // 8. Mettre à jour l'état local
      setConditions(nouvellesConditions);
      
      setFormData({ temperature: "", humidite: "", observations: "", notes: "" });
      setSelectedFile(null);
      setMessage("Condition de transport enregistrée avec succès !");
    } catch (e) {
      setMessage("Erreur lors de l'enregistrement de la condition : " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const afficherCondition = (condition) => {
    return (
      <div key={condition.id} className="col-md-6 mb-3">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">Condition #{condition.id}</h6>
          </div>
          <div className="card-body">
            <p><strong>Transporteur:</strong> {condition.transporteur}</p>
            <p><strong>Température:</strong> {condition.temperature}°C</p>
            <p><strong>Humidité:</strong> {condition.humidite}%</p>
            {condition.observations && (
              <p><strong>Observations:</strong> {condition.observations}</p>
            )}
            {condition.notes && (
              <p><strong>Notes:</strong> {condition.notes}</p>
            )}
            <p><strong>Date:</strong> {new Date(condition.timestamp).toLocaleDateString()}</p>
            <p><strong>CID IPFS:</strong> {condition.cid || "Non disponible"}</p>
            
            {condition.cid && (
              <a 
                href={getIPFSURL(condition.cid)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-secondary"
              >
                Voir sur IPFS
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <h2>Conditions de Transport - Commande #{id}</h2>
      
      {/* Informations de la commande */}
      {commande && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Informations de la commande</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>ID:</strong> {commande.id}</p>
                <p><strong>Statut:</strong> {commande.statutTransport}</p>
                <p><strong>Statut produit:</strong> {commande.statutRecolte}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Quantité:</strong> {commande.quantite}</p>
                <p><strong>Prix:</strong> {commande.prix}</p>
                <p><strong>Nombre de conditions:</strong> {conditions.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout de condition */}
      {hasRole(roles, "Transporteur") && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Enregistrer une nouvelle condition de transport</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="temperature" className="form-label">Température (°C) *</label>
                    <input
                      type="number"
                      className="form-control"
                      id="temperature"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleInputChange}
                      required
                      step="0.1"
                      placeholder="25.5"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="humidite" className="form-label">Humidité (%) *</label>
                    <input
                      type="number"
                      className="form-control"
                      id="humidite"
                      name="humidite"
                      value={formData.humidite}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="100"
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="observations" className="form-label">Observations</label>
                <textarea
                  className="form-control"
                  id="observations"
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Observations sur les conditions de transport..."
                />
              </div>

              <div className="mb-3">
                <label htmlFor="notes" className="form-label">Notes additionnelles</label>
                <textarea
                  className="form-control"
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Notes importantes..."
                />
              </div>

              <div className="mb-3">
                <label htmlFor="file" className="form-label">Fichier de condition (optionnel)</label>
                <input
                  type="file"
                  className="form-control"
                  id="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <small className="form-text text-muted">
                  Vous pouvez joindre un fichier pour documenter les conditions de transport.
                </small>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Enregistrement..." : "Enregistrer la condition"}
              </button>
            </form>
            
            {message && (
              <div className={`alert mt-3 ${message.includes('succès') ? 'alert-success' : 'alert-info'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste des conditions */}
      <div className="card">
        <div className="card-header">
          <h5>Conditions de transport enregistrées ({conditions.length})</h5>
        </div>
        <div className="card-body">
          {conditions.length > 0 ? (
            <div className="row">
              {conditions.map(afficherCondition)}
            </div>
          ) : (
            <p className="text-muted">Aucune condition de transport enregistrée pour cette commande.</p>
          )}
        </div>
      </div>

      {/* Informations sur la traçabilité */}
      <div className="card mt-4">
        <div className="card-header">
          <h5>Traçabilité des conditions de transport</h5>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <strong>Information:</strong> Toutes les conditions de transport sont automatiquement enregistrées sur IPFS avec des hash Merkle pour assurer la traçabilité complète du transport des produits.
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <h6>Avantages de la traçabilité IPFS :</h6>
              <ul>
                <li>Enregistrement immuable des conditions</li>
                <li>Vérification d'intégrité avec hash Merkle</li>
                <li>Accès décentralisé aux données</li>
                <li>Historique complet du transport</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6>Données enregistrées :</h6>
              <ul>
                <li>Température et humidité</li>
                <li>Observations du transporteur</li>
                <li>Horodatage précis</li>
                <li>Documents et photos associés</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConditionsTransport;

