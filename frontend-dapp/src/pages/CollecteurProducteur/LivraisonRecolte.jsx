import { useState, useEffect } from "react";
import {
  getCollecteurExportateurContract,
  getCollecteurProducteurContract,
} from "../../utils/contract";
import { getIPFSURL, uploadConsolidatedData } from "../../utils/ipfsUtils";
import { ShoppingCart, Hash, Package2, User, Truck, Fingerprint, Sprout, Package, ChevronUp, ChevronDown } from "lucide-react";
import { useUserContext } from "../../context/useContextt";
import {
  getCommandeRecolte,
  getConditionTransportPC,
} from "../../utils/contrat/collecteurProducteur";
import { getCommandeProduit, getConditionTransportCE } from "../../utils/collecteurExporatateur";

function LivraisonRecolte() {
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [temperature, setTemperature] = useState("");
  const [humidite, setHumidite] = useState("");
  const [dureeTransport, setDureeTransport] = useState("");
  const [lieuDepart, setLieuDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [commandes, setCommandes] = useState([]);
  const [commandesRecolte, setCommandesRecolte] = useState([]);
  const [error, setError] = useState(null);
  const [detailsCondition, setDetailsCondition] = useState({});

  const { account } = useUserContext();

  const chargerDetails = async () => {
    try {
      const contract = await getCollecteurExportateurContract();
      // Charger toutes les commandes (CommandeProduit)
      const compteurCommandesRaw = await contract.getCompteurCommande();
      const compteurCommandes = Number(compteurCommandesRaw);
      let commandesTemp = [];

      for (let i = compteurCommandes; i > 0; i--) {
        const c = await getCommandeProduit(i);

        // si commande n'est pas au transporteur ne pas l'afficher
        if (c.transporteur.adresse?.toLowerCase() !== account.toLowerCase()) continue;

        // recuperer condition de transport si deja enregister
        let commandeEnrichie = {};
        if (c.enregistrerCondition) {
          const conditions = await getConditionTransportCE(i);
          commandeEnrichie = {
            ...c,
            ...conditions,
          };
        }

        commandesTemp.push(commandeEnrichie);
      }
      setCommandes(commandesTemp);

      // Charger les CommandeRecolte (CollecteurProducteur)
      const contractCP = await getCollecteurProducteurContract();
      const compteurCommandesRecolte = await contractCP.getCompteurCommandes();
      const commandesRecolteTemp = [];

      for (let i = compteurCommandesRecolte; i > 0 ; i--) {
        const c = await getCommandeRecolte(i);

        // ignorer les commandes que le transporteur n'a pas access.
        if (c.transporteur.adresse?.toLowerCase() !== account.toLowerCase())
          continue;

        // recuperer condition de transport si deja enregister
        let commandeRecolteEnrichie = {};
        if (c.enregistrerCondition) {
          const condition = await getConditionTransportPC(i);
          commandeRecolteEnrichie = {
            ...c,
            ...condition,
          };
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
      case 0:
        return <span className="badge ms-2 bg-warning fw-bold">En cours</span>;
      case 1:
        return <span className="badge ms-2 bg-success fw-bold">Livré</span>;
      default:
        return "Inconnu";
    }
  };

  const handleSubmitStatut = async (commandeId) => {
    setIsProcessing(true);
    setBtnLoading(true);
    try {
      const contract = await getCollecteurExportateurContract();
      const tx = await contract.mettreAJourStatutTransport(
        Number(commandeId),
        1
      );
      await tx.wait();
      await chargerDetails();
      alert("Statut de transport mis à jour avec succès !");
      setError(null);
    } catch (error) {
      console.error(
        "Erreur lors de la mise a jour du status transport de la commande d'un produit : ",
        error.message
      );
      setError(
        "Erreur lors de la mise a jour du status transport de la commande d'un produit. Veuillez reessayer plus tard."
      );
    } finally {
      setIsProcessing(false);
      setBtnLoading(false);
    }
  };

  const handleEnregistrerCondition = async (commandeId) => {
    setIsProcessing(true);
    try {
      // 1) Créer les données de condition et uploader sur IPFS (JSON)
      const conditionData = {
        type: "condition-transport-produit",
        commandeId: Number(commandeId),
        temperature: temperature || null,
        humidite: humidite || null,
        dureeTransport: dureeTransport || null,
        lieuDepart: lieuDepart || null,
        destination: destination || null,
        timestamp: Date.now(),
        version: "1.0",
      };
      const uploaded = await uploadConsolidatedData(
        conditionData,
        "conditions-transport"
      );
      if (!uploaded.success) {
        throw new Error("Echec upload IPFS des conditions");
      }
      // 2) Enregistrer côté contrat (signature: (id, cid))
      const contract = await getCollecteurExportateurContract();
      const tx = await contract.enregistrerCondition(
        Number(commandeId),
        uploaded.cid
      );
      await tx.wait();
      await chargerDetails();
      alert("Condition de transport enregistrée !");
      setShowConditionModal(false);
      setTemperature("");
      setHumidite("");
      setDureeTransport("");
      setLieuDepart("");
      setDestination("");
      setError(null);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut de transport (Produit):",
        error.message
      );
      setError(
        "Erreur lors de la mise à jour du statut de transport (Produit). Veuillez réessayer plus tard."
      );
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
      const tx = await contract.mettreAJourStatutTransport(
        Number(commandeId),
        1
      );
      await tx.wait();
      await chargerDetails();
      alert("Statut de transport (Récolte) mis à jour avec succès !");
      setError(null);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut de transport (Récolte):",
        error
      );
      setError(
        "Erreur lors de la mise à jour du statut de transport (Récolte). Veuillez réessayer plus tard."
      );
    } finally {
      setIsProcessing(false);
      setBtnLoading(false);
    }
  };

  // Handler pour enregistrer condition CommandeRecolte
  const handleEnregistrerConditionRecolte = async (commandeId) => {
    setIsProcessing(true);
    try {
      // 1) Créer les données et uploader sur IPFS (JSON)
      const conditionData = {
        type: "condition-transport-recolte",
        temperature: temperature || null,
        humidite: humidite || null,
        dureeTransport: dureeTransport || null,
        lieuDepart: lieuDepart || null,
        destination: destination || null,
        timestamp: Date.now(),
        version: "1.0",
      };
      const uploaded = await uploadConsolidatedData(
        conditionData,
        "conditions-transport"
      );
      if (!uploaded.success) {
        throw new Error("Echec upload IPFS des conditions");
      }
      // 2) Enregistrer côté contrat CP (signature: (id, cid))
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.enregistrerCondition(
        Number(commandeId),
        uploaded.cid
      );
      await tx.wait();
      await chargerDetails();
      alert("Condition de transport (Récolte) enregistrée !");
      setShowConditionModal(false);
      setTemperature("");
      setHumidite("");
      setDureeTransport("");
      setLieuDepart("");
      setDestination("");
      setError(null);
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement de la condition de transport (Récolte):",
        error.message
      );
      setError(
        "Erreur lors de l'enregistrement de la condition de transport (Récolte). Veuillez réessayer plus tard."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Ajout des états pour gérer l'ouverture/fermeture des sections
  const [isRecolteOpen, setIsRecolteOpen] = useState(true);
  const [isProduitOpen, setIsProduitOpen] = useState(true);

  // Fonction pour basculer l'état des sections
  const toggleRecolte = () => setIsRecolteOpen(!isRecolteOpen);
  const toggleProduit = () => setIsProduitOpen(!isProduitOpen);

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
        <h2 className="h5 mb-3 d-flex justify-content-between align-items-center">
          <span><Sprout /> Liste des Commandes sur <strong>Récolte</strong></span>
          <button className="btn" onClick={toggleRecolte}>
            {isRecolteOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
        </h2>
        <div
          className={`row g-3 overflow-hidden transition-all ${isRecolteOpen ? "max-h-screen" : "max-h-0"}`}
          style={{ transition: "max-height 0.5s ease-in-out" }}
        >
          {isRecolteOpen && commandesRecolte.map((cmd) => (
            <div key={cmd.id} className="col-md-4">
              <div className="card shadow-sm p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h4 className="card-title my-2">
                    Commande Récolte#{cmd.id}
                  </h4>
                </div>

                <p>
                  <Sprout size={16} className="me-2 text-success" />
                  <strong>Récolte:</strong> #{cmd.idRecolte}
                </p>
                <p>
                  <Package2 size={16} className="me-2 text-success" />
                  <strong>Quantité:</strong> {cmd.quantite} kg
                </p>
                <p>
                  <User size={16} className="me-2 text-success" />
                  <strong>Producteur:</strong> {cmd.producteur.nom || "N/A"}
                </p>
                <p>
                  <User size={16} className="me-2 text-success" />
                  <strong>Collecteur:</strong> {cmd.collecteur.nom || "N/A"}
                </p>
                <p>
                  <Fingerprint size={16} className="me-2 text-success" />
                  <strong>Hash merkle:</strong> {cmd.hashMerkle?.slice(0,6)}...{cmd.hashMerkle?.slice(-4)}
                </p>
                <p>
                  <Truck size={16} className="me-2 text-success" />
                  <strong>Transport:</strong>{" "}
                  {getStatutTransportLabel(cmd.statutTransport)}
                </p>

                <div className="d-flex gap-2 mt-3">
                  {!cmd.enregistrerCondition && (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        setShowConditionModal(`recolte-${cmd.id}`);
                      }}
                    >
                      Condition de transport
                    </button>
                  )}
                  {cmd.statutTransport == 0 && cmd.enregistrerCondition && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleSubmitStatutRecolte(cmd.id)}
                      disabled={btnLoading}
                    >
                      Livrer
                    </button>
                  )}
                  {cmd.enregistrerCondition && (
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => {
                        setDetailsCondition({
                          temperature: cmd.temperature,
                          humidite: cmd.humidite,
                          dureeTransport: cmd.dureeTransport,
                          lieuDepart: cmd.lieuDepart,
                          destination: cmd.destination,
                        });
                        setShowDetailsModal(true);
                      }}
                    >
                      Voir détails conditions
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LISTE DES COMMANDES SUR LES PRODUITS DES COLLECTEURS */}
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3 d-flex justify-content-between align-items-center">
          <span><Package /> Liste des Commandes sur <strong>Produit</strong></span>
          <button className="btn" onClick={toggleProduit}>
            {isProduitOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
        </h2>
        <div
          className={`row g-3 overflow-hidden transition-all ${isProduitOpen ? "max-h-screen" : "max-h-0"}`}
          style={{ transition: "max-height 0.5s ease-in-out" }}
        >
          {isProduitOpen && commandes.map((commande) => (
            <div key={commande.id} className="col-md-4">
              <div className="card shadow-sm p-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h4 className="card-title my-2">
                    Commande Produit#{commande.id}
                  </h4>
                </div>

                <p>
                  <Package size={16} className="me-2 text-success" />
                  <strong>Produit:</strong> #{commande.idLotProduit}
                </p>
                <p>
                  <Package2 size={16} className="me-2 text-success" />
                  <strong>Quantité:</strong> {commande.quantite} kg
                </p>
                <p>
                  <User size={16} className="me-2 text-success" />
                  <strong>Collecteur:</strong>{" "} {commande.collecteur.nom || "N/A"}
                </p>
                <p>
                  <User size={16} className="me-2 text-success" />
                  <strong>Exportateur:</strong>{" "} {commande.exportateur.nom || "N/A"}
                </p>
                <p>
                  <Fingerprint size={16} className="me-2 text-success" />
                  <strong>Hash merkle:</strong> {commande.hashMerkle?.slice(0,6)}...{commande.hashMerkle?.slice(-4)}
                </p>
                <p>
                  <Truck size={16} className="me-2 text-success" />
                  <strong>Transport:</strong>{" "}
                  {getStatutTransportLabel(commande.statutTransport)}
                </p>

                <div className="d-flex gap-2 mt-3">
                  {!commande.enregistrerCondition && (
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        setShowConditionModal(`produit-${commande.id}`);
                      }}
                    >
                      Condition de transport
                    </button>
                  )}
                  {commande.statutTransport == 0 &&
                    commande.enregistrerCondition && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleSubmitStatut(commande.id)}
                        disabled={btnLoading}
                      >
                        Livrer
                      </button>
                    )}
                  {commande.enregistrerCondition && (
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => {
                        setDetailsCondition({
                          temperature: commande.temperature,
                          humidite: commande.humidite,
                          dureeTransport: commande.dureeTransport,
                          lieuDepart: commande.lieuDepart,
                          destination: commande.destination,
                        });
                        setShowDetailsModal(true);
                      }}
                    >
                      Voir détails conditions
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal pour enregistrer les conditions de transport */}
      {showConditionModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Enregistrer les conditions de transport
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConditionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="temperature" className="form-label">
                    Température (°C)
                  </label>
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
                  <label htmlFor="humidite" className="form-label">
                    Humidité (%)
                  </label>
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
                <div className="mb-3">
                  <label htmlFor="dureeTransport" className="form-label">
                    Durée de transport (en heures)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="dureeTransport"
                    value={dureeTransport}
                    onChange={(e) => setDureeTransport(e.target.value)}
                    min="0"
                    placeholder="5"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="lieuDepart" className="form-label">
                    Lieu de départ
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="lieuDepart"
                    value={lieuDepart}
                    onChange={(e) => setLieuDepart(e.target.value)}
                    placeholder="Antananarivo"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="destination" className="form-label">
                    Destination
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Toamasina"
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
                    if (showConditionModal.startsWith("recolte-")) {
                      const commandeId = showConditionModal.replace(
                        "recolte-",
                        ""
                      );
                      handleEnregistrerConditionRecolte(commandeId);
                    } else {
                      const commandeId = showConditionModal.replace(
                        "produit-",
                        ""
                      );
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

      {/* Modal pour afficher les détails des conditions de transport */}
      {showDetailsModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Détails des conditions de transport
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Température :</strong>{" "}
                  {detailsCondition.temperature || "N/A"} °C
                </p>
                <p>
                  <strong>Humidité :</strong>{" "}
                  {detailsCondition.humidite || "N/A"} %
                </p>
                <p>
                  <strong>Durée de transport :</strong>{" "}
                  {detailsCondition.dureeTransport || "N/A"} heures
                </p>
                <p>
                  <strong>Lieu de départ :</strong>{" "}
                  {detailsCondition.lieuDepart || "N/A"}
                </p>
                <p>
                  <strong>Destination :</strong>{" "}
                  {detailsCondition.destination || "N/A"}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour les modals */}
      {showConditionModal && <div className="modal-backdrop fade show"></div>}
      {showDetailsModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default LivraisonRecolte;
