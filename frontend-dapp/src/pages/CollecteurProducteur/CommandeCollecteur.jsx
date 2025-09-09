import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCollecteurProducteurContract,
  URL_BLOCK_SCAN,
} from "../../utils/contract";
import { useUserContext } from "../../context/useContextt";
import { Search, ChevronDown } from "lucide-react";
import {
  getCommandeRecolte,
  getConditionTransportPC,
  getRecolte,
} from "../../utils/contrat/collecteurProducteur";

function CommandeCollecteur() {
  const navigate = useNavigate();
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [acteur, setActeur] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modePaiement, setModePaiement] = useState(0); // 0 = VirementBancaire
  const [search, setSearch] = useState("");
  const [paiementFiltre, setPaiementFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [commandeErrors, setCommandeErrors] = useState({});
  const [detailsCondition, setDetailsCondition] = useState({});
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { account } = useUserContext();

  const chargerCommandes = async () => {
    try {
      setError(null);
      setWarnings([]);
      const contract = await getCollecteurProducteurContract();
      const compteurCommandesRaw = await contract.compteurCommandes();
      const compteurCommandes = Number(compteurCommandesRaw);
      const commandesTemp = [];

      for (let i = 1; i <= compteurCommandes; i++) {
        const commandeRaw = await getCommandeRecolte(i);
        // Filtrer par collecteur connecté
        const collecteurAddr =
          commandeRaw.collecteur.adresse?.toString?.() || "";
        if (
          collecteurAddr &&
          collecteurAddr.toLowerCase() === account.toLowerCase()
        ) {
          // recuperer condition de transport s'il y en a
          let commande = {};
          if (commandeRaw.enregistrerCondition) {
            const conditions = await getConditionTransportPC(i);
            commande = {
              ...conditions,
            };
          }
          // recuperer le nom du produit
          const recolteOnChain = await getRecolte(commandeRaw.idRecolte);

          commande = {
            ...commande,
            ...commandeRaw,
            nomProduit: recolteOnChain.nomProduit,
          };

          commandesTemp.push(commande);
        }
      }

      setActeur(acteur);
      commandesTemp.reverse();
      setCommandes(commandesTemp);
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
    setIsLoading(true);

    chargerCommandes();
  }, [account, acteur]);

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
      const message =
        error?.reason ||
        error?.data?.message ||
        error?.message ||
        "Erreur lors du paiement";
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
      await chargerCommandes();
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

  const getStatutPaiement = (payer) => {
    return payer ? "Payé" : "Non payé";
  };

  const getStatutTransport = (statut) => {
    switch (statut) {
      case 0:
        return "En cours";
      case 1:
        return "Livré";
      default:
        return "Inconnu";
    }
  };

  const getStatutRecolte = (status) => {
    switch (status) {
      case 0:
        return "En attente";
      case 1:
        return "Validé";
      case 2:
        return "Rejeté";
    }
  };

  const getColorStatutRecolte = (status) => {
    switch (status) {
      case 0:
        return "bg-warning";
      case 1:
        return "bg-success";
      case 2:
        return "bg-danger";
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
  if (isLoading) {
    return (
      <div className="container py-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
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
        {commandes.length > 0 ? (
          <div className="row g-3">
            {commandesAffichees.map((commande, index) => (
              <div
                key={`commande-${commande?.id ?? "na"}-${index}`}
                className="col-md-4"
              >
                <div
                  className="card shadow-sm p-3"
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 2px 12px 0 rgba(60,72,88,.08)",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-4">Commande #{commande.id}</h5>
                  </div>

                  <div className="card-text">
                    <p>
                      <strong>Produit:</strong> {commande.nomProduit}
                    </p>
                    <p>
                      <strong>Récolte:</strong> #{commande.idRecolte}
                    </p>
                    <p>
                      <strong>Quantité:</strong> {commande.quantite} kg
                    </p>
                    <p>
                      <strong>Prix:</strong> {commande.prix} Ariary
                    </p>
                    <p>
                      <strong>Date recolte :</strong> {commande.dateRecolte}
                    </p>
                    <p>
                      <strong>Producteur:</strong>{" "}
                      {commande.producteur?.nom || "N/A"}
                    </p>

                    <p>
                      <strong>Transporteur:</strong>{" "}
                      {commande.transporteur?.nom || "N/A"}
                    </p>

                    {commande.statutTransport === 1 && (
                      <p>
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

                    {commande.ipfsWarning && (
                      <p className="text-warning small mb-1">
                        {commande.ipfsWarning}
                      </p>
                    )}

                    {/* Statuts */}
                    <div className="mt-3">
                      <div className="d-flex gap-2">
                        <span
                          className={`badge ${getColorStatutRecolte(
                            commande.statutRecolte
                          )}`}
                        >
                          {getStatutRecolte(commande.statutRecolte)}
                        </span>
                        <span className="badge bg-info">
                          {getStatutTransport(commande.statutTransport)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between">
                    {/* Actions selon le statut */}
                    {commandeErrors[commande.id] && (
                      <div
                        className="alert alert-danger mt-2 py-2 px-3"
                        role="alert"
                      >
                        {commandeErrors[commande.id]}
                      </div>
                    )}
                  </div>
                  {/* Lien vers liste de transporteur */}
                  {!commande.payer && commande.statutTransport !== 1 && (
                    <div className="mt-2">
                      <Link
                        to={`/liste-transporteur-commande-recolte/5/${commande.id}`}
                        className="btn btn-outline-secondary btn-sm w-100"
                      >
                        Choisir transporteur
                      </Link>
                    </div>
                  )}
                  {commande.enregistrerCondition && (
                    <div className="mt-2">
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
                    </div>
                  )}
                  {/* Afficher btn valider et rejeter si la commande a ete livrer avec success. */}
                  {commande.statutRecolte === 0 &&
                    commande.statutTransport === 1 && (
                      <div className="d-flex gap-1 mt-2">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => validerCommande(commande.id, true)}
                          disabled={btnLoading}
                        >
                          Valider
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => validerCommande(commande.id, false)}
                          disabled={btnLoading}
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                  {/* afficher btn payer si la commande n'a pas encors ete payer et que la commande a ete valider */}
                  {!commande.payer && commande.statutRecolte === 1 && (
                    <div className="d-flex mt-2">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setCommandeSelectionnee(commande);
                          setShowModal(true);
                        }}
                      >
                        Payer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted">Aucune commande trouvée.</div>
        )}

        {commandesAffichees.length < commandesFiltres.length && (
          <div className="text-center mt-3">
            <button
              className="btn btn-outline-success"
              onClick={() => setVisibleCount(visibleCount + 9)}
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

      {/* Overlay pour les modals */}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default CommandeCollecteur;
