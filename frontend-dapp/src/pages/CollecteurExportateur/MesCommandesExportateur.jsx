import { useState, useEffect } from "react";
import {
  DEBUT_COMMANDE_LOT_PRODUIT,
  getCollecteurExportateurContract,
  getRoleOfAddress,
  URL_BLOCK_SCAN,
} from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import {
  ShoppingCart,
  Hash,
  Package2,
  BadgeEuro,
  Truck,
  Wallet,
  Search,
  ChevronDown,
  Eye,
  Box,
  Fingerprint,
  Archive,
  LucideTruck,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import {
  getCommandeProduit,
  getConditionTransportCE,
  getLotProduitEnrichi,
} from "../../utils/collecteurExporatateur";

function MesCommandesExportateur({ onlyPaid = false }) {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modePaiement, setModePaiement] = useState(0); // 0 = VirementBancaire
  const [userRole, setUserRole] = useState(null);
  const { account } = useUserContext();
  const [search, setSearch] = useState("");
  const [paiementFiltre, setPaiementFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [expandedId, setExpandedId] = useState(null);
  const location = useLocation();
  const [detailsCondition, setDetailsCondition] = useState({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Déterminer si on est sur la page stock
  const isStockPage = location.pathname === "/stock";

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
        for (let i = DEBUT_COMMANDE_LOT_PRODUIT; i <= compteurCommandes; i++) {
          const commandeRaw = await getCommandeProduit(i);

          // Normaliser adresses
          const exportateurAddr =
            commandeRaw.exportateur?.adresse.toString?.() ||
            commandeRaw.exportateur ||
            "";
          const collecteurAddr =
            commandeRaw.collecteur?.adresse.toString?.() ||
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

            commandesTemp.push(commandeEnrichie);
          }
        }

        // Inverser le tri des commandes pour que les plus récentes soient en premier
        commandesTemp.reverse();
        setCommandes(commandesTemp);
      } catch (error) {
        console.error("Erreur lors du chargement des commandes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    chargerCommandes();
  }, [account, userRole, location.state]);

  const handlePayer = async (commandeId) => {
    setBtnLoading(true);
    try {
      const contract = await getCollecteurExportateurContract();
      const commande = commandes.find((c) => c.id === commandeId);

      // Effectuer le paiement
      const tx = await contract.effectuerPaiement(
        commandeId,
        commande.prix,
        modePaiement,
        { value: commande.prix } // La valeur envoyée doit correspondre au prix
      );
      await tx.wait();

      // Mettre à jour l'état local
      const commandesTemp = [...commandes];
      const index = commandesTemp.findIndex((c) => c.id === commandeId);
      if (index !== -1) {
        commandesTemp[index].payer = true;
        setCommandes(commandesTemp);
      }

      // Fermer le modal
      setShowModal(false);
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleValiderCommande = async (commandeId) => {
    try {
      const contract = await getCollecteurExportateurContract();
      const tx = await contract.mettreAJourStatutCommande(
        Number(commandeId),
        1
      );
      await tx.wait();
      // Mettre à jour localement le statutProduit
      const next = commandes.map((c) =>
        c.id === commandeId ? { ...c, statutProduit: 1 } : c
      );
      setCommandes(next);
    } catch (e) {
      console.error("Erreur lors de la validation de la commande:", e);
    }
  };

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

    // Si on est sur la page stock, filtrer seulement les commandes payées
    if (isStockPage) {
      return matchSearch && commande.payer;
    }

    const matchPaiement =
      paiementFiltre === "all" ||
      (paiementFiltre === "paye" && commande.payer) ||
      (paiementFiltre === "nonpaye" && !commande.payer);
    return matchSearch && matchPaiement;
  });
  const commandesAffichees = commandesFiltres.slice(0, visibleCount);

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
          <div className="dropdown">
            <button
              className="btn btn-outline-success dropdown-toggle d-flex align-items-center"
              type="button"
              id="dropdownPaiement"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <ChevronDown size={16} className="me-1" />
              {paiementFiltre === "all" && "Toutes les commandes"}
              {paiementFiltre === "paye" && "Payées"}
              {paiementFiltre === "nonpaye" && "Non payées"}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownPaiement">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setPaiementFiltre("all")}
                >
                  Toutes les commandes
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setPaiementFiltre("paye")}
                >
                  Payées
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setPaiementFiltre("nonpaye")}
                >
                  Non payées
                </button>
              </li>
            </ul>
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
          <h2 className="h5 mb-3">
            {isStockPage
              ? "Stock - Commandes Payées"
              : "Mes Commandes Exportateur"}
          </h2>

          <div className="row">
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <ShoppingCart size={20} className="me-2 text-success" />
                <span className="small">
                  <strong>
                    {isStockPage
                      ? commandes.filter((c) => c.payer).length
                      : commandes.length}
                  </strong>{" "}
                  {isStockPage ? "commandes payées" : "commandes au total"}
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
            {commandesAffichees.map((commande) => (
              <div key={commande.id} className="col-md-4">
                <div
                  className="card border shadow-sm p-3"
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 2px 12px 0 rgba(60,72,88,.08)",
                  }}
                >
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
                      <BadgeEuro size={16} className="me-2 text-success" />
                      <strong>Prix:</strong> {commande.prix} Ar
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
                        <Fingerprint size={16} className="me-2 text-success" />
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
                  <div>
                    {/* Lien vers liste de transporteur */}
                    {!commande.payer &&
                      !isStockPage &&
                      commande.statutTransport !== 1 && (
                        <div className="mt-2">
                          <Link
                            to={`/liste-transporteur-commande-produit/5/${commande.id}`}
                            className="btn btn-outline-secondary btn-sm w-100"
                          >
                            Choisir transporteur
                          </Link>
                        </div>
                      )}

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

                    {!isStockPage &&
                      !commande.payer &&
                      commande.statutProduit === 1 && (
                        <button
                          onClick={() => {
                            setCommandeSelectionnee(commande);
                            setShowModal(true);
                          }}
                          className="btn-agrichain mt-2"
                        >
                          Payer
                        </button>
                      )}

                    {!isStockPage &&
                      Number(commande.statutTransport) === 1 &&
                      Number(commande.statutProduit) !== 1 && (
                        <div className="mt-2">
                          <button
                            onClick={() => handleValiderCommande(commande.id)}
                            className="btn btn-success btn-sm"
                          >
                            Valider la commande
                          </button>
                        </div>
                      )}
                    {isStockPage && commande.payer && (
                      <Link
                        to={`/stock/${commande.id}`}
                        className="btn btn-primary btn-sm d-flex align-items-center gap-1 mt-2"
                      >
                        <Eye size={16} />
                        Voir détails
                      </Link>
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

      {/* Modal de paiement */}
      {showModal && commandeSelectionnee && (
        <>
          <div className="modal-backdrop fade show"></div>{" "}
          {/* Ajout de l'arrière-plan assombri */}
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Payer la commande</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Produit: {commandeSelectionnee.nomProduit}
                    </label>
                    <p>
                      <strong>Quantité:</strong> {commandeSelectionnee.quantite}{" "}
                      kg
                    </p>
                    <p>
                      <strong>Prix total:</strong> {commandeSelectionnee.prix}{" "}
                      Ar
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mode de paiement</label>
                    <select
                      className="form-select"
                      value={modePaiement}
                      onChange={(e) => setModePaiement(Number(e.target.value))}
                    >
                      <option value={0}>Virement bancaire</option>
                      <option value={1}>Cash</option>
                      <option value={2}>Mobile Money</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handlePayer(commandeSelectionnee.id)}
                    disabled={btnLoading}
                  >
                    {btnLoading
                      ? "Confirmer le paiement..."
                      : "Confirmer le paiement"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
    </div>
  );
}

export default MesCommandesExportateur;
