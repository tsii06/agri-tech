import { useState, useEffect } from "react";
import { getCollecteurExportateurContract, getCollecteurProducteurContract } from "../../utils/contract";
import { getIPFSURL } from "../../utils/ipfsUtils";
import { ShoppingCart, Hash, Package2, User, Truck } from "lucide-react";

function LivraisonRecolte() {
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [temperature, setTemperature] = useState("");
  const [humidite, setHumidite] = useState("");
  const [commandes, setCommandes] = useState([]);
  const [commandesRecolte, setCommandesRecolte] = useState([]);
  const [error, setError] = useState(null);

  const chargerDetails = async () => {
    try {
      const contract = await getCollecteurExportateurContract();
      // Charger toutes les commandes (CommandeProduit)
      const compteurCommandes = await contract.getCompteurCommande();
      const commandesTemp = [];
      
      for (let i = 1; i <= compteurCommandes; i++) {
        const c = await contract.getCommande(i);
        const p = await contract.getProduit(c.idProduit); // pour avoir le nom du produit commander
        
        // Charger les données IPFS consolidées si la commande a un CID
        let commandeEnrichie = {
          id: c.id.toString(),
          idProduit: c.idProduit.toString(),
          quantite: c.quantite.toString(),
          statutTransport: Number(c.statutTransport),
          prix: c.prix.toString(),
          payer: c.payer,
          collecteur: c.collecteur,
          exportateur: c.exportateur,
          nomProduit: p.nom,
          cid: c.cid,
          hashMerkle: c.hashMerkle
        };

        if (c.cid) {
          try {
            const response = await fetch(getIPFSURL(c.cid));
            if (response.ok) {
              const ipfsData = await response.json();
              
              // Fusionner avec les données IPFS
              commandeEnrichie = {
                ...commandeEnrichie,
                nomProduit: ipfsData.nomProduit || p.nom,
                ipfsTimestamp: ipfsData.timestamp,
                ipfsVersion: ipfsData.version,
                produitHashMerkle: ipfsData.produitHashMerkle || ""
              };
            }
          } catch (ipfsError) {
            console.log(`Erreur lors du chargement IPFS pour la commande produit ${i}:`, ipfsError);
          }
        }

        commandesTemp.push(commandeEnrichie);
      }
      setCommandes(commandesTemp);
      
      // Charger les CommandeRecolte (CollecteurProducteur)
      const contractCP = await getCollecteurProducteurContract();
      const compteurCommandesRecolte = await contractCP.getCompteurCommandes();
      const commandesRecolteTemp = [];
      
      for (let i = 1; i <= compteurCommandesRecolte; i++) {
        const c = await contractCP.commandes(i);
        
        // Charger les données IPFS consolidées si la commande a un CID
        let commandeRecolteEnrichie = {
          id: c.id.toString(),
          idRecolte: c.idRecolte.toString(),
          quantite: c.quantite.toString(),
          prix: c.prix.toString(),
          statutTransport: Number(c.statutTransport),
          payer: c.payer,
          producteur: c.producteur,
          collecteur: c.collecteur,
          cid: c.cid,
          hashMerkle: c.hashMerkle
        };

        if (c.cid) {
          try {
            const response = await fetch(getIPFSURL(c.cid));
            if (response.ok) {
              const ipfsData = await response.json();
              
              // Fusionner avec les données IPFS
              commandeRecolteEnrichie = {
                ...commandeRecolteEnrichie,
                nomProduit: ipfsData.nomProduit || "Produit non spécifié",
                ipfsTimestamp: ipfsData.timestamp,
                ipfsVersion: ipfsData.version,
                recolteHashMerkle: ipfsData.recolteHashMerkle || ""
              };
            }
          } catch (ipfsError) {
            console.log(`Erreur lors du chargement IPFS pour la commande récolte ${i}:`, ipfsError);
          }
        }

        commandesRecolteTemp.push(commandeRecolteEnrichie);
      }
      setCommandesRecolte(commandesRecolteTemp);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chargerDetails();
  }, []);

  const getStatutTransportLabel = (statutCode) => {
    switch (statutCode) {
      case 0: return <span className="badge ms-2 bg-warning fw-bold">En cours</span>;
      case 1: return <span className="badge ms-2 bg-success fw-bold">Livré</span>;
      default: return "Inconnu";
    }
  };

  const handleSubmitStatut = async (commandeId) => {
    setIsProcessing(true);
    setBtnLoading(true);
    try {
      const contract = await getCollecteurExportateurContract();
      const tx = await contract.mettreAJourStatutTransport(Number(commandeId), 1);
      await tx.wait();
      await chargerDetails();
      alert("Statut de transport mis à jour avec succès !");
      setError(null);
    } catch (error) {
      console.error("Erreur lors de la mise a jour du status transport de la commande d'un produit : ", error.message);
      setError("Erreur lors de la mise a jour du status transport de la commande d'un produit. Veuillez reessayer plus tard.");
    } finally {
      setIsProcessing(false);
      setBtnLoading(false);
    }
  };

  const handleEnregistrerCondition = async (commandeId) => {
    setIsProcessing(true);
    try {
      const contract = await getCollecteurExportateurContract();
      const tx = await contract.enregistrerCondition(Number(commandeId), temperature, humidite);
      await tx.wait();
      alert("Condition de transport enregistrée !");
      setShowConditionModal(false);
      setTemperature("");
      setHumidite("");
      setError(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de transport (Produit):", error.message);
      setError("Erreur lors de la mise à jour du statut de transport (Produit). Veuillez réessayer plus tard.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler pour MAJ statut CommandeRecolte
  const handleSubmitStatutRecolte = async (commandeId) => {
    setIsProcessing(true);
    setBtnLoading(true);
    try {
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.mettreAJourStatutTransport(Number(commandeId), 1);
      await tx.wait();
      await chargerDetails();
      alert("Statut de transport (Récolte) mis à jour avec succès !");
      setError(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de transport (Récolte):", error);
      setError("Erreur lors de la mise à jour du statut de transport (Récolte). Veuillez réessayer plus tard.");
    } finally {
      setIsProcessing(false);
      setBtnLoading(false);
    }
  };

  // Handler pour enregistrer condition CommandeRecolte
  const handleEnregistrerConditionRecolte = async (commandeId) => {
    setIsProcessing(true);
    try {
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.enregistrerCondition(Number(commandeId), temperature, humidite);
      await tx.wait();
      alert("Condition de transport (Récolte) enregistrée !");
      setShowConditionModal(false);
      setTemperature("");
      setHumidite("");
      setError(null);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la condition de transport (Récolte):", error.message);
      setError("Erreur lors de l'enregistrement de la condition de transport (Récolte). Veuillez réessayer plus tard.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* LISTE DES COMMANDES SUR LES RECOLTES DES PRODUCTEURS */}
      <div className="card p-4 shadow-sm my-4">
        <h2 className="h5 mb-3">Liste des Commandes sur <strong>Récolte</strong></h2>
        <div className="row g-3">
          {commandesRecolte.map((cmd) => (
            <div key={cmd.id} className="col-md-4">
              <div className="card shadow-sm p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">Commande Récolte #{cmd.id}</h5>
                  <div>
                    {cmd.cid && cmd.hashMerkle ? (
                      <span className="badge bg-success me-1">
                        IPFS + Merkle
                      </span>
                    ) : cmd.cid ? (
                      <span className="badge bg-warning me-1">
                        IPFS uniquement
                      </span>
                    ) : (
                      <span className="badge bg-secondary me-1">
                        Données non consolidées
                      </span>
                    )}
                  </div>
                </div>
                
                <p><Hash size={16} className="me-2 text-success" /><strong>ID Commande:</strong> {cmd.id}</p>
                <p><Hash size={16} className="me-2 text-success" /><strong>ID Récolte:</strong> {cmd.idRecolte}</p>
                <p><Package2 size={16} className="me-2 text-success" /><strong>Quantité:</strong> {cmd.quantite} KG</p>
                <p><User size={16} className="me-2 text-success" /><strong>Producteur:</strong> {cmd.producteur.substring(0, 6)}...{cmd.producteur.substring(cmd.producteur.length - 4)}</p>
                <p><User size={16} className="me-2 text-success" /><strong>Collecteur:</strong> {cmd.collecteur.substring(0, 6)}...{cmd.collecteur.substring(cmd.collecteur.length - 4)}</p>
                <p><Truck size={16} className="me-2 text-success" /><strong>Transport:</strong> {getStatutTransportLabel(cmd.statutTransport)}</p>
                
                {/* Informations IPFS et Merkle */}
                {cmd.cid && (
                  <div className="mt-2 p-2 bg-light rounded">
                    <p className="mb-1">
                      <strong>CID IPFS:</strong> 
                      <a
                        href={getIPFSURL(cmd.cid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ms-2 text-decoration-none text-primary"
                        title="Voir les données consolidées sur IPFS"
                      >
                        {cmd.cid.substring(0, 10)}...
                      </a>
                    </p>
                    
                    {cmd.hashMerkle && (
                      <p className="mb-1">
                        <strong>Hash Merkle:</strong> 
                        <span className="ms-2 text-muted" title={cmd.hashMerkle}>
                          {cmd.hashMerkle.substring(0, 10)}...
                        </span>
                      </p>
                    )}

                    {cmd.ipfsTimestamp && (
                      <p className="mb-1 text-muted small">
                        <strong>Dernière mise à jour IPFS:</strong> {new Date(cmd.ipfsTimestamp).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-outline-primary btn-sm" onClick={() => { setShowConditionModal(`recolte-${cmd.id}`); }}>
                    Condition de transport
                  </button>
                  {cmd.statutTransport == 0 && (
                    <button className="btn btn-success btn-sm" onClick={() => handleSubmitStatutRecolte(cmd.id)} disabled={btnLoading}>
                      Livrer
                    </button>
                  )}
                  
                  {/* Lien vers les données IPFS complètes */}
                  {cmd.cid && (
                    <a
                      href={getIPFSURL(cmd.cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Voir données IPFS
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LISTE DES COMMANDES SUR LES PRODUITS DES COLLECTEURS */}
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3">Liste des Commandes sur <strong>Produit</strong></h2>
        <div className="row g-3">
          {commandes.map((commande) => (
            <div key={commande.id} className="col-md-4">
              <div className="card shadow-sm p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">Commande Produit #{commande.id}</h5>
                  <div>
                    {commande.cid && commande.hashMerkle ? (
                      <span className="badge bg-success me-1">
                        IPFS + Merkle
                      </span>
                    ) : commande.cid ? (
                      <span className="badge bg-warning me-1">
                        IPFS uniquement
                      </span>
                    ) : (
                      <span className="badge bg-secondary me-1">
                        Données non consolidées
                      </span>
                    )}
                  </div>
                </div>
                
                <p><Hash size={16} className="me-2 text-success" /><strong>ID Commande:</strong> {commande.id}</p>
                <p><Hash size={16} className="me-2 text-success" /><strong>ID Produit:</strong> {commande.idProduit}</p>
                <p><Package2 size={16} className="me-2 text-success" /><strong>Quantité:</strong> {commande.quantite} KG</p>
                <p><User size={16} className="me-2 text-success" /><strong>Collecteur:</strong> {commande.collecteur.substring(0, 6)}...{commande.collecteur.substring(commande.collecteur.length - 4)}</p>
                <p><User size={16} className="me-2 text-success" /><strong>Exportateur:</strong> {commande.exportateur.substring(0, 6)}...{commande.exportateur.substring(commande.exportateur.length - 4)}</p>
                <p><Truck size={16} className="me-2 text-success" /><strong>Transport:</strong> {getStatutTransportLabel(commande.statutTransport)}</p>
                
                {/* Informations IPFS et Merkle */}
                {commande.cid && (
                  <div className="mt-2 p-2 bg-light rounded">
                    <p className="mb-1">
                      <strong>CID IPFS:</strong> 
                      <a
                        href={getIPFSURL(commande.cid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ms-2 text-decoration-none text-primary"
                        title="Voir les données consolidées sur IPFS"
                      >
                        {commande.cid.substring(0, 10)}...
                      </a>
                    </p>
                    
                    {commande.hashMerkle && (
                      <p className="mb-1">
                        <strong>Hash Merkle:</strong> 
                        <span className="ms-2 text-muted" title={commande.hashMerkle}>
                          {commande.hashMerkle.substring(0, 10)}...
                        </span>
                      </p>
                    )}

                    {commande.ipfsTimestamp && (
                      <p className="mb-1 text-muted small">
                        <strong>Dernière mise à jour IPFS:</strong> {new Date(commande.ipfsTimestamp).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-outline-primary btn-sm" onClick={() => { setShowConditionModal(`produit-${commande.id}`); }}>
                    Condition de transport
                  </button>
                  {commande.statutTransport == 0 && (
                    <button className="btn btn-success btn-sm" onClick={() => handleSubmitStatut(commande.id)} disabled={btnLoading}>
                      Livrer
                    </button>
                  )}
                  
                  {/* Lien vers les données IPFS complètes */}
                  {commande.cid && (
                    <a
                      href={getIPFSURL(commande.cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Voir données IPFS
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal pour enregistrer les conditions de transport */}
      {showConditionModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Enregistrer les conditions de transport</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConditionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="temperature" className="form-label">Température (°C)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="temperature"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    step="0.1"
                    placeholder="25.5"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="humidite" className="form-label">Humidité (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="humidite"
                    value={humidite}
                    onChange={(e) => setHumidite(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConditionModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (showConditionModal.startsWith('recolte-')) {
                      const commandeId = showConditionModal.replace('recolte-', '');
                      handleEnregistrerConditionRecolte(commandeId);
                    } else {
                      const commandeId = showConditionModal.replace('produit-', '');
                      handleEnregistrerCondition(commandeId);
                    }
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour les modals */}
      {showConditionModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
}

export default LivraisonRecolte; 