import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getCollecteurExportateurContract, getCollecteurProducteurContract } from "../../utils/contract";
import { ShoppingCart, Hash, Package2, User, Truck } from "lucide-react";

function LivraisonRecolte() {
  const { id } = useParams(); // id de la commande
  const [commande, setCommande] = useState(null);
  const [produit, setProduit] = useState(null);
  const [statut, setStatut] = useState("0");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [temperature, setTemperature] = useState("");
  const [humidite, setHumidite] = useState("");
  const [commandes, setCommandes] = useState([]);
  const [commandesRecolte, setCommandesRecolte] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const chargerDetails = async () => {
      try {
        const contract = await getCollecteurExportateurContract();
        // Charger toutes les commandes (CommandeProduit)
        const compteurCommandes = await contract.getCompteurCommande();
        const commandesTemp = [];
        for (let i = 1; i <= compteurCommandes; i++) {
          const c = await contract.getCommande(i);
          const p = await contract.getProduit(c.idProduit); // pour avoir le nom du produit commander
          commandesTemp.push({
            id: c.id.toString(),
            idProduit: c.idProduit.toString(),
            quantite: c.quantite.toString(),
            statutTransport: Number(c.statutTransport),
            prix: c.prix.toString(),
            payer: c.payer,
            collecteur: c.collecteur,
            exportateur: c.exportateur,
            nomProduit: p.nom
          });
        }
        setCommandes(commandesTemp);
        // Charger les CommandeRecolte (CollecteurProducteur)
        const contractCP = await getCollecteurProducteurContract();
        const compteurCommandesRecolte = await contractCP.getCompteurCommandes();
        const commandesRecolteTemp = [];
        for (let i = 1; i <= compteurCommandesRecolte; i++) {
          const c = await contractCP.commandes(i);
          commandesRecolteTemp.push({
            id: c.id.toString(),
            idRecolte: c.idRecolte.toString(),
            quantite: c.quantite.toString(),
            prix: c.prix.toString(),
            statutTransport: Number(c.statutTransport),
            payer: c.payer,
            producteur: c.producteur,
            collecteur: c.collecteur
          });
        }
        setCommandesRecolte(commandesRecolteTemp);
        // Charger la commande sélectionnée si id fourni
        if (id) {
          const c = await contract.getCommande(id);
        setCommande({
            id: c.id.toString(),
            idProduit: c.idProduit.toString(),
            quantite: c.quantite.toString(),
            statutTransport: Number(c.statutTransport),
            prix: c.prix.toString(),
            payer: c.payer,
            collecteur: c.collecteur,
            exportateur: c.exportateur
          });
          // Charger le produit associé
          const produitInfo = await contract.getProduit(c.idProduit);
        setProduit({
          nom: produitInfo.nom,
          quantite: produitInfo.quantite.toString()
        });
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
      chargerDetails();
  }, [id]);

  const getStatutTransportLabel = (statutCode) => {
    switch(statutCode) {
      case 0: return <span className="text-info fw-bold">En cours</span>;
      case 1: return <span className="text-success fw-bold">Livré</span>;
      default: return "Inconnu";
    }
  };

  const getStatutTransportColor = (statut) => {
    switch(Number(statut)) {
      case 0: return "text-info";
      case 1: return "text-success";
      default: return "text-secondary";
    }
  };

  const handleSubmitStatut = async (commandeId) => {
    setIsProcessing(true);
    try {
      const contract = await getCollecteurExportateurContract();
      await contract.mettreAJourStatutTransport(Number(commandeId), 1);
      alert("Statut de transport mis à jour avec succès !");
      setIsProcessing(false);
      window.location.reload();
    } catch (error) {
      setIsProcessing(false);
      setError(error.message);
    }
  };

  const handleEnregistrerCondition = async (commandeId) => {
    setIsProcessing(true);
    try {
      const contract = await getCollecteurExportateurContract();
      await contract.enregistrerCondition(Number(commandeId), temperature, humidite);
      alert("Condition de transport enregistrée !");
      setShowConditionModal(false);
      setTemperature("");
      setHumidite("");
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      setError(error.message);
    }
  };

  // Handler pour MAJ statut CommandeRecolte
  const handleSubmitStatutRecolte = async (commandeId) => {
    setIsProcessing(true);
    try {
      const contract = await getCollecteurProducteurContract();
      await contract.mettreAJourStatutTransport(Number(commandeId), 1);
      alert("Statut de transport (Récolte) mis à jour avec succès !");
      setIsProcessing(false);
      setStatut("0");
      window.location.reload();
    } catch (error) {
      setIsProcessing(false);
      setError(error.message);
    }
  };

  // Handler pour enregistrer condition CommandeRecolte
  const handleEnregistrerConditionRecolte = async (commandeId) => {
    setIsProcessing(true);
    try {
      const contract = await getCollecteurProducteurContract();
      await contract.enregistrerCondition(Number(commandeId), temperature, humidite);
      alert("Condition de transport (Récolte) enregistrée !");
      setShowConditionModal(false);
      setTemperature("");
      setHumidite("");
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      setError(error.message);
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
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3">Liste des Commandes (Produit)</h2>
        {error && <div className="alert alert-danger">{error}</div>}

        {/* LISTE DES COMMANDES SUR LES PRODUITS DES COLLECTEURS */}
        <div className="row g-3">
          {commandes.map((commande) => (
            <div key={commande.id} className="col-md-4">
                <div className="card border shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
                  <div className="d-flex justify-content-center align-items-center mb-2" style={{ fontSize: 32, color: '#4d7c0f' }}>
                    <ShoppingCart size={36} />
                  </div>
                  <h5 className="card-title text-center mb-3">{commande.nomProduit}</h5>
                  <div className="card-text small">
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Commande:</strong> {commande.id}</p>
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Produit:</strong> {commande.idProduit}</p>
                    <p><Package2 size={16} className="me-2 text-success" /><strong>Quantité:</strong> {commande.quantite} kg</p>
                    <p><User size={16} className="me-2 text-success" /><strong>Collecteur:</strong> {commande.collecteur.slice(0, 6)}...{commande.collecteur.slice(-4)}</p>
                    <p className={`fw-semibold d-flex align-items-center ${getStatutTransportColor(commande.statutTransport)}`}
                      style={{gap: 6}}>
                      <Truck size={16} className="me-1" />
                      <strong>Transport:</strong> {getStatutTransportLabel(commande.statutTransport)}
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn-agrichain-outline" onClick={() => { setShowConditionModal(commande.id); }}>
                      Condition de transport
                    </button>
                    <button className="btn-agrichain" onClick={() => handleSubmitStatut(commande.id)}>
                      Changer le statut
                    </button>
                </div>
                </div>
              </div>
          ))}
        </div>
      </div>

      {/* LISTE DES COMMANDES SUR LES RECOLTES DES PRODUCTEURS */}
      <div className="card p-4 shadow-sm my-4">
        <h2 className="h5 mb-3">Liste des Commandes (Récolte)</h2>
        <div className="row g-3">
          {commandesRecolte.map((cmd) => (
            <div key={cmd.id} className="col-md-6">
              <div className="card shadow-sm p-3 mb-3">
                <h5 className="card-title">Commande Récolte #{cmd.id}</h5>
                <p><strong>ID Récolte:</strong> {cmd.idRecolte}</p>
                <p><strong>Quantité:</strong> {cmd.quantite}</p>
                <p><strong>Prix:</strong> {cmd.prix}</p>
                <p><strong>Statut transport:</strong> {getStatutTransportLabel(cmd.statutTransport)}</p>
                <p><strong>Producteur:</strong> {cmd.producteur}</p>
                <p><strong>Collecteur:</strong> {cmd.collecteur}</p>
                <div className="d-flex gap-2">
                  <button className="btn-agrichain-outline" onClick={() => { setShowConditionModal(`recolte-${cmd.id}`); }}>
                    Condition de transport
                  </button>
                  <button className="btn-agrichain" onClick={() => handleSubmitStatutRecolte(cmd.id)}>
                    Changer le statut
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Modal Condition de transport */}
      {showConditionModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {showConditionModal.toString().startsWith("recolte-")
                    ? `Enregistrer la condition de transport (Commande Récolte #${showConditionModal.replace("recolte-", "")})`
                    : `Enregistrer la condition de transport (Commande #${showConditionModal})`}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowConditionModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Température</label>
                  <input type="text" className="form-control" value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="Ex: 25C" />
                </div>
          <div className="mb-3">
                  <label className="form-label">Humidité</label>
                  <input type="text" className="form-control" value={humidite} onChange={e => setHumidite(e.target.value)} placeholder="Ex: 60%" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConditionModal(false)}>
                  Annuler
                </button>
                {showConditionModal.toString().startsWith("recolte-") ? (
                  <button type="button" className="btn btn-primary" onClick={() => handleEnregistrerConditionRecolte(showConditionModal.replace("recolte-", ""))} disabled={isProcessing || !temperature || !humidite}>
                    {isProcessing ? "Enregistrement..." : "Enregistrer"}
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => handleEnregistrerCondition(showConditionModal)} disabled={isProcessing || !temperature || !humidite}>
                    {isProcessing ? "Enregistrement..." : "Enregistrer"}
                  </button>
                )}
              </div>
            </div>
          </div>
      </div>
      )}
    </div>
  );
}

export default LivraisonRecolte; 