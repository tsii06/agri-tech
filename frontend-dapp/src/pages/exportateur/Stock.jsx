import { useState, useEffect } from "react";
import {
  getCollecteurExportateurContract,
  getRoleOfAddress,
} from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import {
  ShoppingCart,
  Hash,
  Package2,
  BadgeEuro,
  User,
  Truck,
  Wallet,
  Search,
  ChevronDown,
  Eye,
  Box,
} from "lucide-react";
import { getIPFSURL } from "../../utils/ipfsUtils";
import { getLotProduitEnrichi } from "../../utils/collecteurExporatateur";
import { ethers } from "ethers";
import { ajoutArticle } from "../../utils/contrat/exportateurClient";

function StockExportateur() {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const { account } = useUserContext();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);
  const [expandedId, setExpandedId] = useState(null);
  const [detailsCondition, setDetailsCondition] = useState({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState({
    prixVente: "",
    dateExpedition: "",
    lieuDepart: "",
    destination: "",
    typeTransport: "",
  });

  useEffect(() => {
    if (!account) return;
    const chargerCommandes = async () => {
      try {
        const contract = await getCollecteurExportateurContract();
        let role = userRole;
        if (!role) {
          role = await getRoleOfAddress(account);
          setUserRole(role);
        }

        // Obtenir le nombre total de commandes
        const compteurCommandesRaw = await contract.getCompteurCommande();
        const compteurCommandes = Number(compteurCommandesRaw);

        // Charger toutes les commandes
        const commandesTemp = [];
        for (let i = 1; i <= compteurCommandes; i++) {
          const commandeRaw = await contract.getCommande(i);

          // Ne pas afficher les commandes non payer dans l'interface stock
          if (!commandeRaw.payer) continue;

          // Normaliser adresses
          const exportateurAddr =
            commandeRaw.exportateur?.toString?.() ||
            commandeRaw.exportateur ||
            "";
          const collecteurAddr =
            commandeRaw.collecteur?.toString?.() ||
            commandeRaw.collecteur ||
            "";
          if (!exportateurAddr) continue;

          // Vérifier si la commande appartient à l'exportateur connecté
          if (exportateurAddr.toLowerCase() === account.toLowerCase()) {
            // Normaliser types primitifs
            const idLotProduitNum = Number(commandeRaw.idLotProduit ?? 0);
            const produit =
              idLotProduitNum > 0
                ? await getLotProduitEnrichi(idLotProduitNum)
                : {};

            let commandeEnrichie = {
              id: Number(commandeRaw.id ?? i),
              idLotProduit: idLotProduitNum,
              quantite: Number(commandeRaw.quantite ?? 0),
              prix: Number(commandeRaw.prix ?? 0),
              payer: Boolean(commandeRaw.payer),
              statutTransport: Number(commandeRaw.statutTransport ?? 0),
              statutProduit: Number(commandeRaw.statutProduit ?? 0),
              collecteur: collecteurAddr,
              exportateur: exportateurAddr,
              transporteur: commandeRaw.transporteur.toString(),
              nomProduit: produit?.nom || "",
              enregistrerCondition: commandeRaw.enregistrerCondition,
            };

            // Charger les condition de transport
            if (commandeRaw.enregistrerCondition) {
              const conditions = await contract.getCondition(i);
              const res = await fetch(getIPFSURL(conditions.cid));
              if (res.ok) {
                const ipfsData = await res.json();
                const root =
                  ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                commandeEnrichie = {
                  ...commandeEnrichie,
                  temperature: root.temperature,
                  humidite: root.humidite,
                  dureeTransport: root.dureeTransport,
                  lieuDepart: root.lieuDepart,
                  destination: root.destination,
                };
              }
            }

            commandesTemp.push(commandeEnrichie);
          }
        }

        // Inverser le tri des commandes pour que les plus récentes soient en premier
        commandesTemp.reverse();
        setCommandes(commandesTemp);
      } catch (error) {
        console.error("Erreur lors du chargement des commandes:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerCommandes();
  }, [account, userRole]);

  const getStatutPaiement = (payer) => {
    return payer ? "Payé" : "Non payé";
  };

  const getStatutPaiementColor = (payer) => {
    return payer ? "text-success" : "text-warning";
  };

  const getStatutTransport = (statut) => {
    switch (Number(statut)) {
      case 0:
        return "En cours";
      case 1:
        return "Livré";
      default:
        return "Inconnu";
    }
  };

  const getStatutProduit = (statut) => {
    switch (Number(statut)) {
      case 0:
        return "En attente";
      case 1:
        return "Valider";
      case 2:
        return "Rejeter";
      default:
        return "Inconnu";
    }
  };

  const getStatutTransportColor = (statut) => {
    switch (Number(statut)) {
      case 0:
        return "text-secondary";
      case 1:
        return "text-success";
      default:
        return "text-info";
    }
  };

  const getStatutProduitColor = (statut) => {
    switch (Number(statut)) {
      case 0:
        return "text-secondary";
      case 1:
        return "text-success";
      case 2:
        return "text-danger";
      default:
        return "text-info";
    }
  };

  // Filtrage commandes selon recherche et paiement
  const commandesFiltres = commandes.filter((commande) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (commande.nomProduit &&
        commande.nomProduit.toLowerCase().includes(searchLower)) ||
      (commande.id && commande.id.toString().includes(searchLower)) ||
      (commande.idLotProduit &&
        commande.idLotProduit.toString().includes(searchLower)) ||
      (commande.prix && commande.prix.toString().includes(searchLower));

    return matchSearch;
  });
  const commandesAffichees = commandesFiltres.slice(0, visibleCount);

  const handleCheckboxChange = (id) => {
    setSelectedStocks((prev) =>
      prev.includes(id)
        ? prev.filter((stockId) => stockId !== id)
        : [...prev, id]
    );
  };

  const handleCreateShipment = () => {
    if (selectedStocks.length === 0) {
      alert("Veuillez sélectionner au moins un stock.");
      return;
    }
    // Annuler si les produits sont de types differents
    const stockSelected = commandes.filter(el => selectedStocks.includes(el.id));
    const IsStockSameType = stockSelected.every(el => el.nomProduit === stockSelected[0].nomProduit);
    if (!IsStockSameType) {
      alert("Veuillez choisir des produits de meme type.");
      return;
    }
    setShowShipmentModal(true);
  };

  const handleShipmentDetailChange = (e) => {
    const { name, value } = e.target;
    setShipmentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitShipment = async () => {
    const { prixVente, dateExpedition, lieuDepart, destination, typeTransport } = shipmentDetails;

    if (!prixVente || !dateExpedition || !lieuDepart || !destination || !typeTransport) {
      alert("Tous les champs sont obligatoires. Veuillez les remplir avant de soumettre.");
      return;
    }

    await ajoutArticle(selectedStocks, prixVente, "");
    
    setShowShipmentModal(false);
    setSelectedStocks([]);
    setShipmentDetails({
      prixVente: "",
      dateExpedition: "",
      lieuDepart: "",
      destination: "",
      typeTransport: "",
    });
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des commandes: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <div
          className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between"
          style={{ marginBottom: 24 }}
        >
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(9);
              }}
              style={{ borderRadius: "0 8px 8px 0" }}
            />
          </div>
        </div>
        <div
          style={{
            backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))",
            borderRadius: "8px",
            padding: "0.75rem 1.25rem",
            marginBottom: 16,
          }}
        >
          <h2 className="h5 mb-3">Stock exportateur</h2>

          {/* Statistiques IPFS */}
          <div className="row">
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-primary" />
                <span className="small">
                  <strong>{commandes.filter((c) => c.cid).length}</strong>{" "}
                  commandes avec données IPFS
                </span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-warning" />
                <span className="small">
                  <strong>
                    {commandes.filter((c) => c.hashMerkle).length}
                  </strong>{" "}
                  commandes avec hash Merkle
                </span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : commandes.length === 0 ? (
          <div className="text-center text-muted">
            Vous n&apos;avez pas encore passé de commandes.
          </div>
        ) : commandesFiltres.length === 0 ? (
          <div className="text-center text-muted">
            Aucune commande ne correspond à la recherche ou au filtre.
          </div>
        ) : (
          /* LISTE DES COMMANDES */
          <div className="row g-3">
            <div className="d-flex justify-content-center">
              <button
                className="btn btn-primary"
                onClick={handleCreateShipment}
                disabled={selectedStocks.length === 0}
              >
                Créer un lot d'expédition
              </button>
            </div>
            {commandesAffichees.map((commande) => (
              <div key={commande.id} className="col-md-4">
                <div
                  className="card border shadow-sm p-3"
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 2px 12px 0 rgba(60,72,88,.08)",
                  }}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`checkbox-${commande.id}`}
                      checked={selectedStocks.includes(commande.id)}
                      onChange={() => handleCheckboxChange(commande.id)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`checkbox-${commande.id}`}
                    >
                      Sélectionner
                    </label>
                  </div>
                  <div
                    className="d-flex justify-content-center align-items-center mb-2"
                    style={{ fontSize: 32, color: "#4d7c0f" }}
                  >
                    <Box size={36} />
                  </div>
                  <h5 className="card-title text-center mb-3">
                    {commande.nomProduit}
                  </h5>
                  <div className="card-text small">
                    <p>
                      <Hash size={16} className="me-2 text-success" />
                      <strong>ID Commande:</strong> {commande.id}
                    </p>
                    <p>
                      <Hash size={16} className="me-2 text-success" />
                      <strong>ID Lot Produit:</strong> {commande.idLotProduit}
                    </p>
                    <p>
                      <Package2 size={16} className="me-2 text-success" />
                      <strong>Quantité:</strong> {commande.quantite} kg
                    </p>
                    <p>
                      <User size={16} className="me-2 text-success" />
                      <strong>Collecteur:</strong>{" "}
                      {commande.collecteur.slice(0, 6)}...
                      {commande.collecteur.slice(-4)}
                    </p>
                    {commande.transporteur !==
                      ethers.ZeroAddress.toString() && (
                      <p>
                        <User size={16} className="me-2 text-success" />
                        <strong>Transporteur:</strong>{" "}
                        {commande.transporteur.slice(0, 6)}...
                        {commande.transporteur.slice(-4)}
                      </p>
                    )}
                    <p
                      className={`fw-semibold d-flex align-items-center ${getStatutPaiementColor(
                        commande.payer
                      )}`}
                      style={{ gap: 6 }}
                    >
                      <Wallet size={16} className="me-1" />
                      <strong>Paiement:</strong>{" "}
                      {getStatutPaiement(commande.payer)}
                    </p>
                    <p
                      className={`fw-semibold d-flex align-items-center ${getStatutTransportColor(
                        commande.statutTransport
                      )}`}
                      style={{ gap: 6 }}
                    >
                      <Truck size={16} className="me-1" />
                      <strong>Transport:</strong>{" "}
                      {getStatutTransport(commande.statutTransport)}
                    </p>
                    <p
                      className={`fw-semibold d-flex align-items-center ${getStatutProduitColor(
                        commande.statutProduit
                      )}`}
                      style={{ gap: 6 }}
                    >
                      <Box size={16} className="me-1" />
                      <strong>Status:</strong>{" "}
                      {getStatutProduit(commande.statutProduit)}
                    </p>
                  </div>
                  <div className="mt-2">
                    {/* Btn pour afficher les conditions transport */}
                    {commande.enregistrerCondition && (
                      <button
                        className="btn btn-outline-success btn-sm w-100"
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
                  {expandedId === commande.id && commande.ipfsRoot && (
                    <div className="mt-3">
                      <div
                        className="alert alert-secondary"
                        role="alert"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        <div className="mb-2">
                          <strong>Type:</strong>{" "}
                          {commande.ipfsType || "inconnu"}
                        </div>
                        <pre
                          className="mb-0"
                          style={{ maxHeight: 240, overflow: "auto" }}
                        >
                          {JSON.stringify(commande.ipfsRoot, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {commandesAffichees.length < commandesFiltres.length && (
        <div className="text-center mt-3">
          <button
            className="btn-agrichain-outline"
            onClick={() => setVisibleCount(visibleCount + 9)}
          >
            Charger plus
          </button>
        </div>
      )}

      {/* Modal pour afficher les détails des conditions de transport */}
      {showDetailsModal && (
        <div>
          <div className="modal-backdrop fade show"></div>
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
        </div>
      )}

      {/* Modal pour créer un lot d'expédition */}
      {showShipmentModal && (
        <div>
          <div className="modal-backdrop fade show"></div>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Créer un lot d'expédition</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowShipmentModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="prixVente" className="form-label">
                      Prix de vente
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="prixVente"
                      name="prixVente"
                      value={shipmentDetails.prixVente}
                      onChange={handleShipmentDetailChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="dateExpedition" className="form-label">
                      Date d'expédition
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="dateExpedition"
                      name="dateExpedition"
                      value={shipmentDetails.dateExpedition}
                      onChange={handleShipmentDetailChange}
                      required
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
                      name="lieuDepart"
                      value={shipmentDetails.lieuDepart}
                      onChange={handleShipmentDetailChange}
                      required
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
                      name="destination"
                      value={shipmentDetails.destination}
                      onChange={handleShipmentDetailChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="typeTransport" className="form-label">
                      Type de transport
                    </label>
                    <select
                      className="form-select"
                      id="typeTransport"
                      name="typeTransport"
                      value={shipmentDetails.typeTransport}
                      onChange={handleShipmentDetailChange}
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="Routier">Routier</option>
                      <option value="Maritime">Maritime</option>
                      <option value="Aérien">Aérien</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowShipmentModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmitShipment}
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockExportateur;
