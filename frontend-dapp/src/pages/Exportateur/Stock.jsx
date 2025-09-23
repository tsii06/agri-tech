import { useState, useEffect } from "react";
import {
  DEBUT_COMMANDE_LOT_PRODUIT,
  getCollecteurExportateurContract,
  getRoleOfAddress,
  URL_BLOCK_SCAN,
} from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import {
  Hash,
  Package2,
  Search,
  Archive,
  ShoppingCart,
  LucideTruck,
  Fingerprint,
} from "lucide-react";
import {
  getCommandeProduit,
  getConditionTransportCE,
  getLotProduitEnrichi,
} from "../../utils/collecteurExporatateur";
import { ajouterExpedition } from "../../utils/contrat/exportateurClient";
import { uploadExpedition } from "../../utils/ifps/exportateurClient";
import { useNavigate } from "react-router-dom";
import { deleteFromIPFSByCid, getIPFSURL } from "../../utils/ipfsUtils";
import { AnimatePresence, motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";

function StockExportateur() {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
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
  const nav = useNavigate();
  const [dernierCommandeCharger, setDernierCommandeCharger] = useState(() => 0);

  const chargerCommandes = async (reset = false) => {
    setIsLoading(true);
    try {
      const contract = await getCollecteurExportateurContract();
      let role = userRole;
      if (!role) {
        role = await getRoleOfAddress(account);
        setUserRole(role);
      }

      // Obtenir le nombre total de commandes ou le prochain commande charger
      const compteurCommandesRaw =
        dernierCommandeCharger !== 0
          ? dernierCommandeCharger
          : await contract.getCompteurCommande();
      const compteurCommandes = Number(compteurCommandesRaw);

      let nbrCommandeCharger = 9;
      let i;

      // Charger toutes les commandes
      for (
        i = compteurCommandes;
        i >= DEBUT_COMMANDE_LOT_PRODUIT && nbrCommandeCharger > 0;
        i--
      ) {
        const commandeRaw = await getCommandeProduit(i);

        // ne pas afficher les commandes deja enregistrer dans le stock ou non payer
        if (commandeRaw.enregistre || !commandeRaw.payer) continue;

        // Normaliser adresses
        const exportateurAddr =
          commandeRaw.exportateur?.adresse.toString?.() ||
          commandeRaw.exportateur ||
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
            ...commandeRaw,
            idLotProduit: idLotProduitNum,
            nomProduit: produit?.nom || "",
          };

          // Charger les condition de transport
          if (commandeRaw.enregistrerCondition) {
            const conditions = await getConditionTransportCE(i);
            commandeEnrichie = {
              ...commandeEnrichie,
              ...conditions,
            };
          }

          if (reset) {
            setCommandes([commandeEnrichie]); 
            reset = false;
          } else
            setCommandes((prev) => [...prev, commandeEnrichie]);
          nbrCommandeCharger--;
        }
      }
      setDernierCommandeCharger(i);
    } catch (error) {
      console.error("Erreur lors du chargement des commandes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!account) return;
    chargerCommandes(true);
  }, [account]);

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
    const stockSelected = commandes.filter((el) =>
      selectedStocks.includes(el.id)
    );
    const IsStockSameType = stockSelected.every(
      (el) => el.nomProduit === stockSelected[0].nomProduit
    );
    if (!IsStockSameType) {
      alert("Veuillez choisir des produits de meme type.");
      return;
    }
    // ajouter nomProduit dans ShipmentDetail
    setShipmentDetails((prev) => ({
      ...prev,
      nomProduit: stockSelected[0].nomProduit,
    }));
    setShowShipmentModal(true);
  };

  const handleShipmentDetailChange = (e) => {
    const { name, value } = e.target;
    setShipmentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitShipment = async () => {
    setBtnLoading(true);
    let cid = "";

    try {
      const {
        prixVente,
        dateExpedition,
        lieuDepart,
        destination,
        typeTransport,
        nomProduit,
      } = shipmentDetails;

      if (
        !prixVente ||
        !dateExpedition ||
        !lieuDepart ||
        !destination ||
        !typeTransport
      ) {
        alert(
          "Tous les champs sont obligatoires. Veuillez les remplir avant de soumettre."
        );
        return;
      }

      // creer donnee article sur ipfs
      const ipfsArticle = await uploadExpedition(
        nomProduit,
        dateExpedition,
        lieuDepart,
        destination,
        typeTransport
      );
      cid = ipfsArticle.cid;

      // creer article on-chain
      await ajouterExpedition(selectedStocks, prixVente, ipfsArticle.cid);

      setShowShipmentModal(false);
      setSelectedStocks([]);
      setShipmentDetails({
        prixVente: "",
        dateExpedition: "",
        lieuDepart: "",
        destination: "",
        typeTransport: "",
      });
      nav("/expeditions");
    } catch (error) {
      console.error("Creation expedition : ", error);
      if (cid !== "") deleteFromIPFSByCid(cid);
    } finally {
      setBtnLoading(false);
    }
  };

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
          }}
        >
          <h2 className="h5">Stock exportateur</h2>
        </div>

        {commandes.length > 0 || isLoading ? (
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
            <AnimatePresence>
              {commandesAffichees.map((commande) => (
                <motion.div
                  key={commande.id}
                  className="col-md-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
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
                      <ShoppingCart size={36} />
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
                        <Archive size={16} className="me-2 text-success" />
                        <strong>Collecteur:</strong> {commande.collecteur?.nom}
                      </p>
                      <p>
                        <LucideTruck size={16} className="me-2 text-success" />
                        <strong>Transporteur:</strong>{" "}
                        {commande.transporteur?.nom || "N/A"}
                      </p>
                      {commande.statutTransport === 1 && (
                        <p>
                          <Fingerprint
                            size={16}
                            className="me-2 text-success"
                          />
                          <strong>Hash transaction:</strong>{" "}
                          <a
                            href={URL_BLOCK_SCAN + commande.hashTransaction}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {commande.hashTransaction?.slice(0, 6)}...
                            {commande.hashTransaction?.slice(-4)}
                          </a>
                        </p>
                      )}
                    </div>
                    <div>
                      {/* Btn pour afficher les conditions transport */}
                      {commande.enregistrerCondition && (
                        <button
                          className="btn btn-outline-success btn-sm w-100"
                          onClick={() => {
                            setDetailsCondition({
                              temperature: commande.temperature || null,
                              humidite: commande.humidite || null,
                              cidRapportTransport:
                                commande.cidRapportTransport || null,
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
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="col-md-4">
                <Skeleton
                  width={"100%"}
                  height={"100%"}
                  style={{ minHeight: 200 }}
                />
              </div>
            )}

            {/* Btn pour charger plus de recoltes */}
            {dernierCommandeCharger >= DEBUT_COMMANDE_LOT_PRODUIT && (
              <div className="text-center mt-3">
                <button
                  className="btn btn-outline-success"
                  onClick={() => chargerCommandes(false)}
                >
                  Charger plus
                </button>
              </div>
            )}
          </div>
        ) : commandes.length === 0 ? (
          <div className="text-center text-muted">
            Vous n&apos;avez pas encore passé de commandes.
          </div>
        ) : (
          commandesFiltres.length === 0 && (
            <div className="text-center text-muted">
              Aucune commande ne correspond à la recherche ou au filtre.
            </div>
          )
        )}
      </div>

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
                  {detailsCondition.cidRapportTransport ? (
                    <p>
                      <strong>Rapport de transport :</strong>&nbsp;
                      <a
                        href={getIPFSURL(detailsCondition.cidRapportTransport)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {detailsCondition.cidRapportTransport?.slice(0, 6)}...
                        {detailsCondition.cidRapportTransport?.slice(-4)}
                      </a>
                    </p>
                  ) : (
                    <>
                      <p>
                        <strong>Température :</strong>{" "}
                        {detailsCondition.temperature || "N/A"} °C
                      </p>
                      <p>
                        <strong>Humidité :</strong>{" "}
                        {detailsCondition.humidite || "N/A"} %
                      </p>
                    </>
                  )}

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
                      Prix de vente (en $/kg)
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
                    disabled={btnLoading}
                  >
                    {btnLoading ? "Confirmer..." : "Confirmer"}
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
