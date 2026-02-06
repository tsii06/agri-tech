/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DEBUT_COMMANDE_RECOLTE,
  getCollecteurProducteurContract,
} from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import { Search, ChevronDown } from "lucide-react";
import { getCommandeRecolte } from "../../utils/contrat/collecteurProducteur";
import { getIPFSURL } from "../../utils/ipfsUtils";
import Skeleton from "react-loading-skeleton";
import CommandeRecolteCard from "../../components/Tools/CommandeRecolteCard";
import { AnimatePresence, motion } from "framer-motion";
import { collecteurProducteurRead } from "../../config/onChain/frontContracts";

function CommandeCollecteur() {
  const navigate = useNavigate();
  const location = useLocation();
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [acteur, setActeur] = useState({});
  const [modePaiement, setModePaiement] = useState(0); // 0 = VirementBancaire
  const [search, setSearch] = useState("");
  const [paiementFiltre, setPaiementFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [commandeErrors, setCommandeErrors] = useState({});
  const [detailsCondition, setDetailsCondition] = useState({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dernierCommandeCharger, setDernierCommandeCharger] = useState(() => 0);

  const { roles, account } = useUserContext();

  const chargerCommandes = async (reset = false) => {
    setIsLoading(true);
    try {
      setError(null);
      setWarnings([]);
      const compteurCommandesRaw =
        dernierCommandeCharger !== 0 && reset !== true
          ? dernierCommandeCharger
          : await collecteurProducteurRead.read("compteurCommandes");
      const compteurCommandes = Number(compteurCommandesRaw);

      let nbrCommandeCharger = 9;
      let i;

      for (
        i = compteurCommandes;
        i >= DEBUT_COMMANDE_RECOLTE && nbrCommandeCharger > 0;
        i--
      ) {
        const commandeRaw = await getCommandeRecolte(i, roles, account);

        // Ignorer si pas proprietaire
        if (!commandeRaw.isProprietaire) continue;

        if (reset === true) {
          setCommandes(() => [commandeRaw]);
          reset = false;
        } else setCommandes((prev) => [...prev, commandeRaw]);
        nbrCommandeCharger--;
      }
      setDernierCommandeCharger(i);

      setActeur(acteur);
    } catch (error) {
      console.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) {
      alert("Veuillez installer Metamask pour accéder à vos commandes.");
      setIsLoading(false);
      return;
    }
    if (!account) {
      setIsLoading(false);
      return;
    }

    chargerCommandes(true);
  }, [account, acteur, location.state]); // Ajouter location.state comme dépendance pour réexécuter le useEffect

  const handlePayer = async (commandeId) => {
    setBtnLoading(true);
    try {
      const contract = await getCollecteurProducteurContract();
      const commande = commandes.find((c) => c.id === commandeId);

      // Effectuer le paiement
      // Les paramètres sont: idCommande, montant, mode
      const tx = await contract.effectuerPaiementVersProducteur(
        commandeId,
        commande.prix,
        modePaiement,
        { value: commande.prix } // Attention: la valeur doit correspondre au montant envoyé
      );
      await tx.wait();

      // Fermer le modal
      setShowModal(false);

      // Rediriger vers la page des produits
      navigate("/liste-produits");

      // Nettoyer l'erreur associée le cas échéant
      setCommandeErrors((prev) => {
        const next = { ...prev };
        delete next[commandeId];
        return next;
      });
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
    } finally {
      setBtnLoading(false);
    }
  };

  const validerCommande = async (_idCommande, _valide) => {
    setBtnLoading(true);
    try {
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.validerCommandeRecolte(_idCommande, _valide);
      await tx.wait();

      // maj local
      setCommandes((prev) =>
        prev.map((cmd) =>
          cmd.id == _idCommande
            ? { ...cmd, statutRecolte: _valide ? 1 : 2 }
            : cmd
        )
      );

      // Nettoyer l'erreur associée le cas échéant
      setCommandeErrors((prev) => {
        const next = { ...prev };
        delete next[_idCommande];
        return next;
      });
    } catch (e) {
      const message =
        e?.reason ||
        e?.data?.message ||
        e?.message ||
        "Erreur lors de la validation de la commande";
      console.error("Erreur lors de la validation d'une commande :", message);
    } finally {
      setBtnLoading(false);
    }
  };

  // Filtrage commandes selon recherche et paiement
  const commandesFiltres = commandes.filter((commande) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (commande.nomProduit &&
        commande.nomProduit.toLowerCase().includes(searchLower)) ||
      (commande.id && commande.id.toString().includes(searchLower)) ||
      (commande.idRecolte &&
        commande.idRecolte.toString().includes(searchLower)) ||
      (commande.prix && commande.prix.toString().includes(searchLower));
    const matchPaiement =
      paiementFiltre === "all" ||
      (paiementFiltre === "paye" && commande.payer) ||
      (paiementFiltre === "nonpaye" && !commande.payer);
    return matchSearch && matchPaiement;
  });
  const commandesAffichees = commandesFiltres.slice(0, visibleCount);

  if (!window.ethereum) {
    return (
      <div className="container py-4 text-center text-danger">
        Veuillez installer Metamask pour accéder à vos commandes.
      </div>
    );
  }
  if (!account) {
    return (
      <div className="container py-4 text-center text-muted">
        Veuillez connecter votre wallet pour voir vos commandes.
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        {error && (
          <div
            className="alert alert-danger d-flex align-items-center"
            role="alert"
          >
            <div>{error}</div>
          </div>
        )}
        {warnings && warnings.length > 0 && (
          <div className="alert alert-warning" role="alert">
            Certaines données IPFS n'ont pas pu être chargées ({warnings.length}
            ). L'affichage utilise les données on-chain.
          </div>
        )}
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
          <h2 className="h5 mb-0">Mes Commandes</h2>
          <p className="text-muted mb-0">
            {commandes.length > 0 && (
              <>
                {commandes.filter((c) => c.cid).length} commandes avec données
                IPFS,
                {commandes.filter((c) => !c.cid).length} commandes sans données
                IPFS
              </>
            )}
          </p>
        </div>

        {/* LISTE DES COMMANDES */}
        {commandes.length > 0 || isLoading ? (
          <div className="row g-3">
            <AnimatePresence>
              {commandesAffichees.map((commande, index) => (
                <motion.div
                  key={`commande-${commande?.id ?? "na"}-${index}`}
                  className="col-md-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <CommandeRecolteCard
                    commande={commande}
                    roles={roles}
                    commandeErrors={commandeErrors}
                    validerCommande={validerCommande}
                    setDetailsCondition={setDetailsCondition}
                    setShowDetailsModal={setShowDetailsModal}
                    setCommandeSelectionnee={setCommandeSelectionnee}
                    setShowModal={setShowModal}
                    btnLoading={btnLoading}
                  />
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
          </div>
        ) : (
          <div className="text-center text-muted">Aucune commande trouvée.</div>
        )}

        {/* Btn pour charger plus de recoltes */}
        {dernierCommandeCharger >= DEBUT_COMMANDE_RECOLTE && (
          <div className="text-center mt-3">
            <button
              className="btn btn-outline-success"
              onClick={chargerCommandes}
            >
              Charger plus
            </button>
          </div>
        )}
      </div>

      {/* Modal de paiement */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Payer la commande #{commandeSelectionnee?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Montant à payer :{" "}
                  <strong>{commandeSelectionnee?.prix} Ariary</strong>
                </p>
                <div className="mb-3">
                  <label htmlFor="modePaiement" className="form-label">
                    Mode de paiement
                  </label>
                  <select
                    className="form-select"
                    id="modePaiement"
                    value={modePaiement}
                    onChange={(e) => setModePaiement(parseInt(e.target.value))}
                  >
                    <option value={0}>Virement Bancaire</option>
                    <option value={1}>Chèque</option>
                    <option value={2}>Espèces</option>
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
                  {btnLoading ? "Paiement..." : "Confirmer le paiement"}
                </button>
              </div>
            </div>
          </div>
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

      {/* Overlay pour les modals */}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default CommandeCollecteur;
