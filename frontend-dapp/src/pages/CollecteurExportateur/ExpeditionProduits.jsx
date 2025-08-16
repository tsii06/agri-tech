import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getCollecteurExportateurContract } from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import { hasRole } from "../../utils/roles";
import { getIPFSURL } from "../../utils/ipfsUtils";
import { Package2, Truck, Globe, Calendar, User, Hash } from "lucide-react";

function ExpeditionProduits() {
  const { id } = useParams(); // id de la commande
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [commande, setCommande] = useState(null);
  const [produit, setProduit] = useState(null);
  const [expeditionData, setExpeditionData] = useState({
    destination: "",
    transporteur: "",
    dateExpedition: "",
    numeroTracking: "",
    observations: "",
    documents: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const { account, roles } = useUserContext();

  useEffect(() => {
    chargerCommande();
  }, [id]);

  const chargerCommande = async () => {
    try {
      const contract = await getCollecteurExportateurContract();
      const commandeData = await contract.getCommande(id);
      setCommande(commandeData);
      
      // Charger les détails du produit associé
      if (commandeData.idProduit) {
        const produitData = await contract.getProduit(commandeData.idProduit);
        setProduit(produitData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la commande:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpeditionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 1. Créer l'objet expédition
      const expedition = {
        commandeId: id,
        exportateur: account,
        destination: expeditionData.destination,
        transporteur: expeditionData.transporteur,
        dateExpedition: expeditionData.dateExpedition,
        numeroTracking: expeditionData.numeroTracking,
        observations: expeditionData.observations,
        documents: selectedFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        })),
        timestamp: Date.now()
      };

      // 2. Créer un objet consolidé avec toutes les données d'expédition
      const expeditionConsolidee = {
        type: 'expedition-produit',
        commandeId: id,
        expedition: expedition,
        produit: produit,
        commande: commande,
        timestamp: Date.now(),
        version: "1.0"
      };

      // 3. Enregistrer l'expédition sur la blockchain
      const contract = await getCollecteurExportateurContract();
      const tx = await contract.enregistrerExpedition(
        id,
        expeditionData.destination,
        expeditionData.transporteur,
        expeditionData.dateExpedition,
        expeditionData.numeroTracking
      );
      await tx.wait();

      setMessage("Expédition enregistrée avec succès !");
      
      // Réinitialiser le formulaire
      setExpeditionData({
        destination: "",
        transporteur: "",
        dateExpedition: "",
        numeroTracking: "",
        observations: "",
        documents: []
      });
      setSelectedFiles([]);
      
    } catch (e) {
      setMessage("Erreur lors de l'enregistrement de l'expédition : " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Expédition de Produits - Commande #{id}</h2>
      
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
                <p><strong>Statut transport:</strong> {commande.statutTransport === 0 ? "En cours" : "Livré"}</p>
                <p><strong>Paiement:</strong> {commande.payer ? "Payé" : "Non payé"}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Quantité:</strong> {commande.quantite}</p>
                <p><strong>Prix:</strong> {commande.prix}</p>
                <p><strong>Collecteur:</strong> {commande.collecteur}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informations du produit */}
      {produit && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Informations du produit</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>ID Produit:</strong> {produit.id}</p>
                <p><strong>Nom:</strong> {produit.nom}</p>
                <p><strong>Catégorie:</strong> {produit.categorie}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Fournisseur:</strong> {produit.fournisseur}</p>
                <p><strong>Prix unitaire:</strong> {produit.prixUnitaire}</p>
                <p><strong>Stock disponible:</strong> {produit.stockDisponible}</p>
              </div>
            </div>

            {/* Informations IPFS et Merkle */}
            {produit.cid && (
              <div className="mt-3 p-2 bg-light rounded">
                <p className="mb-1">
                  <strong>CID IPFS:</strong> 
                  <a
                    href={getIPFSURL(produit.cid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-2 text-decoration-none text-primary"
                    title="Voir les données consolidées sur IPFS"
                  >
                    {produit.cid.substring(0, 10)}...
                  </a>
                </p>
                
                {produit.hashMerkle && (
                  <p className="mb-1">
                    <strong>Hash Merkle:</strong> 
                    <span className="ms-2 text-muted" title={produit.hashMerkle}>
                      {produit.hashMerkle.substring(0, 10)}...
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulaire d'expédition */}
      {hasRole(roles, "Exportateur") && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Enregistrer une nouvelle expédition</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="destination" className="form-label">Destination *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="destination"
                      name="destination"
                      value={expeditionData.destination}
                      onChange={handleInputChange}
                      required
                      placeholder="Pays, ville..."
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="transporteur" className="form-label">Transporteur *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="transporteur"
                      name="transporteur"
                      value={expeditionData.transporteur}
                      onChange={handleInputChange}
                      required
                      placeholder="Nom du transporteur..."
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="dateExpedition" className="form-label">Date d'expédition *</label>
                    <input
                      type="date"
                      className="form-control"
                      id="dateExpedition"
                      name="dateExpedition"
                      value={expeditionData.dateExpedition}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="numeroTracking" className="form-label">Numéro de suivi</label>
                    <input
                      type="text"
                      className="form-control"
                      id="numeroTracking"
                      name="numeroTracking"
                      value={expeditionData.numeroTracking}
                      onChange={handleInputChange}
                      placeholder="Numéro de tracking..."
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
                  value={expeditionData.observations}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Observations sur l'expédition..."
                />
              </div>

              <div className="mb-3">
                <label htmlFor="files" className="form-label">Documents d'expédition (optionnel)</label>
                <input
                  type="file"
                  className="form-control"
                  id="files"
                  onChange={handleFileChange}
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <small className="form-text text-muted">
                  Vous pouvez joindre plusieurs fichiers pour documenter l'expédition.
                </small>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Fichiers sélectionnés:</label>
                  <ul className="list-group">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{file.name}</span>
                        <span className="badge bg-primary rounded-pill">
                          {(file.size / 1024).toFixed(2)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Enregistrement..." : "Enregistrer l'expédition"}
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

      {/* Informations sur la traçabilité */}
      <div className="card mt-4">
        <div className="card-header">
          <h5>Traçabilité de l'expédition</h5>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <strong>Information:</strong> Toutes les expéditions sont automatiquement enregistrées avec traçabilité complète, incluant les données IPFS et hash Merkle pour assurer l'intégrité de la chaîne logistique.
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <h6>Avantages de la traçabilité :</h6>
              <ul>
                <li>Suivi complet de l'expédition</li>
                <li>Vérification d'intégrité avec hash Merkle</li>
                <li>Historique détaillé du transport</li>
                <li>Documents d'expédition centralisés</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6>Données enregistrées :</h6>
              <ul>
                <li>Destination et transporteur</li>
                <li>Date d'expédition</li>
                <li>Numéro de suivi</li>
                <li>Documents et observations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card mt-4">
        <div className="card-header">
          <h5>Actions rapides</h5>
        </div>
        <div className="card-body">
          <div className="d-flex gap-2">
            {produit && produit.cid && (
              <a
                href={getIPFSURL(produit.cid)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary"
              >
                <Package2 size={16} className="me-2" />
                Voir données produit IPFS
              </a>
            )}
            
            <button
              className="btn btn-outline-secondary"
              onClick={() => window.history.back()}
            >
              <Truck size={16} className="me-2" />
              Retour aux commandes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpeditionProduits;
