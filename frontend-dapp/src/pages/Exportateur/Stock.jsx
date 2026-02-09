/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import { URL_BLOCK_SCAN } from "../../utils/contract";
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
import { uploadExpedition } from "../../utils/ifps/exportateurClient";
import { useNavigate } from "react-router-dom";
import { deleteFromIPFSByCid, getIPFSURL } from "../../utils/ipfsUtils";
import { AnimatePresence, motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import {
  useCommandesLotsProduitsIDs,
  useCommandesLotsProduitsUnAUn,
} from "../../hooks/queries/useCommandesLotsProduits";
import { useCreateExpedition } from "../../hooks/mutations/mutationExpedition";

// Nbr de recoltes par chargement
const NBR_ITEMS_PAR_PAGE = 9;

function StockExportateur() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [search, setSearch] = useState("");
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

  const { roles, account } = useUserContext();

  // Recuperation de tab listes des ids commandes recoltes
  const { data: commandesLotsProduitsIDs } = useCommandesLotsProduitsIDs();

  // Nbr de recoltes par tranche
  const [commandesLotsProduitsToShow, setCommandesLotsProduitsToShow] =
    useState(NBR_ITEMS_PAR_PAGE);
  const idsToFetch =
    commandesLotsProduitsIDs?.slice(0, commandesLotsProduitsToShow) || [];

  // Utilisation cache pour la liste des commandes recoltes.
  const commandesUnAUn = useCommandesLotsProduitsUnAUn(
    idsToFetch,
    roles,
    account,
    true
  );

  // Charger 9 de plus
  const chargerPlus = (plus = NBR_ITEMS_PAR_PAGE) => {
    setCommandesLotsProduitsToShow((prev) =>
      Math.min(prev + plus, commandesLotsProduitsIDs?.length)
    );
  };

  // Check si on peut charger plus
  const hasMore =
    commandesLotsProduitsToShow < commandesLotsProduitsIDs?.length;

  // Filtrage commandes selon recherche et paiement
  const commandesFiltres = commandesUnAUn.filter((q) => {
    const commande = q.data;

    // Ne pas filtrer si pas encore charger
    if (q.isLoading || q.isRefetching) return true;

    // Ne pas garder les commandes qui n'apartient pas a l'user si user est collecteur
    if (commande.isProprietaire && !commande.isProprietaire) return false;

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

  // Charger encore plus si le nbr de recoltes filtrees === 0 ou si la page n'est pas pleine.
  if (
    hasMore &&
    (commandesFiltres.length === 0 ||
      commandesFiltres.length % NBR_ITEMS_PAR_PAGE !== 0)
  )
    chargerPlus(
      NBR_ITEMS_PAR_PAGE - (commandesFiltres.length % NBR_ITEMS_PAR_PAGE)
    );

  // useMutation pour la creation de expedition
  const createMutation = useCreateExpedition();

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
    const stockSelected = commandesFiltres.filter((q) =>
      selectedStocks.includes(q.data.id)
    );
    const IsStockSameType = stockSelected.every(
      (q) => q.data.nomProduit === stockSelected[0].data.nomProduit
    );
    if (!IsStockSameType) {
      alert("Veuillez choisir des produits de meme type.");
      return;
    }
    // ajouter nomProduit dans ShipmentDetail
    setShipmentDetails((prev) => ({
      ...prev,
      nomProduit: stockSelected[0].data.nomProduit,
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
      await createMutation.mutateAsync({
        idCommandes: selectedStocks,
        prix: prixVente,
        cid: ipfsArticle.cid,
      });

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

        {commandesFiltres.length > 0 ? (
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
              {commandesFiltres.map((q, index) => {
                const commande = q.data;

                // Skeleton si data en cours de chargement
                if (q.isLoading || q.isRefetching)
                  return (
                    <div className="col-md-4" key={index}>
                      <Skeleton
                        width={"100%"}
                        height={"100%"}
                        style={{ minHeight: 200 }}
                      />
                    </div>
                  );

                // Afficher commande dans stock
                return (
                  <motion.div
                    key={`${commande.id}-${index}`}
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
                          <strong>ID Lot Produit:</strong>{" "}
                          {commande.idLotProduit}
                        </p>
                        <p>
                          <Package2 size={16} className="me-2 text-success" />
                          <strong>Quantité:</strong> {commande.quantite} kg
                        </p>
                        <p>
                          <Archive size={16} className="me-2 text-success" />
                          <strong>Collecteur:</strong>{" "}
                          {commande.collecteur?.nom}
                        </p>
                        <p>
                          <LucideTruck
                            size={16}
                            className="me-2 text-success"
                          />
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
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Btn pour charger plus de recoltes */}
            {hasMore && (
              <div className="text-center mt-3">
                <button
                  className="btn btn-outline-success"
                  onClick={() => chargerPlus()}
                >
                  Charger plus
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted">Aucune commande trouver.</div>
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
