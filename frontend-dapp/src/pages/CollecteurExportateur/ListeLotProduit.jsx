/* eslint-disable react-hooks/rules-of-hooks */
import { useState } from "react";
import {
  getCollecteurExportateurContract,
  URL_BLOCK_SCAN,
} from "../../utils/contract";
import { useNavigate, useParams } from "react-router-dom";
import {
  Group,
  Hash,
  Package2,
  BadgeEuro,
  Search,
  ChevronDown,
  User,
  Fingerprint,
} from "lucide-react";
import { useUserContext } from "../../context/useContextt";
import { hasRole } from "../../utils/roles";
import Skeleton from "react-loading-skeleton";
import { AnimatePresence, motion } from "framer-motion";
import {
  useLotsProduitsIDs,
  useLotsProduitsUnAUn,
} from "../../hooks/queries/useLotsProduits";
import { useUpdatePrixLotProduit } from "../../hooks/mutations/mutationLotsProduits";

const NBR_ITEMS_PAR_PAGE = 9;

function ListeLotProduits() {
  const { address } = useParams();
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState(null);
  const [, setState] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const [nouveauPrix, setNouveauPrix] = useState("");
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("all");
  const [quantiteCommande, setQuantiteCommande] = useState("");
  const { roles, account } = useUserContext();
  const nav = useNavigate();

  // Recuperation de la liste de id lots produits
  const { data: lotsProduitsIDs } = useLotsProduitsIDs();

  // Nbr de recoltes par tranche
  const [lotsProduitsToShow, setLotsProduitsToShow] =
    useState(NBR_ITEMS_PAR_PAGE);
  const idsToFetch = lotsProduitsIDs?.slice(0, lotsProduitsToShow) || [];

  // Utiliser cache pour stocker liste recolte. ================= //
  // Si address est definie, recuperer les lots de produits de l'address, si non celles de l'user.
  const lotsProduitsUnAUn =
    address === undefined
      ? useLotsProduitsUnAUn(idsToFetch, roles, account)
      : useLotsProduitsUnAUn(idsToFetch, [3], address);

  // Charger 9 de plus
  const chargerPlus = (plus = NBR_ITEMS_PAR_PAGE) => {
    setLotsProduitsToShow((prev) =>
      Math.min(prev + plus, lotsProduitsIDs?.length)
    );
  };

  // Check si on peut charger plus
  const hasMore = lotsProduitsToShow < lotsProduitsIDs?.length;

  // useMutation pour la modification prix
  const updatePrixMutation = useUpdatePrixLotProduit();

  const handleModifierPrix = async (produitId) => {
    setBtnLoading(true);
    try {
      // Vérifier que le nouveau prix est valide
      const prix = Number(nouveauPrix);
      if (isNaN(prix) || prix <= 0) {
        alert("Veuillez entrer un prix valide");
        return;
      }

      // Modifier le prix
      await updatePrixMutation.mutateAsync({
        id: produitId,
        prix: prix,
      });

      // Fermer le modal
      setShowModal(false);
      setProduitSelectionne(null);
      setNouveauPrix("");
      setError(false);
    } catch (error) {
      console.error("Erreur lors de la modification du prix:", error);
      setError(
        "Erreur lors de la modification du prix. Veuillez réessayer plus tard."
      );
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCommanderProduit = async (produitId) => {
    setBtnLoading(true);
    try {
      const contract = await getCollecteurExportateurContract();
      // Vérifier la quantité
      const quantite = Number(quantiteCommande);
      if (
        isNaN(quantite) ||
        quantite <= 0 ||
        quantite > Number(produitSelectionne.quantite)
      ) {
        setError("Veuillez entrer une quantité valide");
        return;
      }
      // Appel du smart contract pour commander
      const tx = await contract.passerCommande(produitId, quantite);
      await tx.wait();
      alert("Commande passée avec succès !");
      setShowModal(false);
      setProduitSelectionne(null);
      setQuantiteCommande("");
      // Optionnel : rafraîchir la liste
      setState({});
      setError(false);
      nav("/mes-commandes-exportateur");
    } catch (error) {
      console.error("Erreur lors de la commande d'un produit :", error.message);
      setError(
        "Erreur lors de la commande d'un produit. Veuillez réessayer plus tard."
      );
    } finally {
      setBtnLoading(false);
    }
  };

  // Filtrage produits selon recherche et statut
  const produitsFiltres = lotsProduitsUnAUn.filter((q) => {
    const produit = q.data;
    // Ne pas filtrer si pas encore charger
    if (q.isLoading || q.isRefetching) return true;

    // Ne pas garder les recoltes qui n'apartient pas a l'user si user est producteur, ou ce qui n'appartiennent pas a address si definit.
    if (produit.isProprietaire && !produit.isProprietaire) return false;

    const searchLower = search.toLowerCase();
    const matchSearch =
      (produit.nom && produit.nom.toLowerCase().includes(searchLower)) ||
      (produit.id && produit.id.toString().includes(searchLower));
    const matchStatut =
      statutFiltre === "all" ||
      (statutFiltre === "valide" && produit.statut === 1) ||
      (statutFiltre === "attente" && produit.statut === 0) ||
      (statutFiltre === "rejete" && produit.statut === 2);
    return matchSearch && matchStatut;
  });

  // Charger encore plus si le nbr de recoltes filtrees === 0 ou si la page n'est pas pleine.
  if (
    hasMore &&
    (produitsFiltres.length === 0 ||
      produitsFiltres.length % NBR_ITEMS_PAR_PAGE !== 0)
  )
    chargerPlus(
      NBR_ITEMS_PAR_PAGE - (produitsFiltres.length % NBR_ITEMS_PAR_PAGE)
    );

  if (!account && !address) {
    return (
      <div className="text-center text-muted">
        Veuillez connecter votre wallet pour voir les produits.
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
              }}
              style={{ borderRadius: "0 8px 8px 0" }}
            />
          </div>
          <div className="dropdown">
            <button
              className="btn btn-outline-success dropdown-toggle d-flex align-items-center"
              type="button"
              id="dropdownStatut"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <ChevronDown size={16} className="me-1" />
              {statutFiltre === "all" && "Tous les statuts"}
              {statutFiltre === "valide" && "Validés"}
              {statutFiltre === "attente" && "En attente"}
              {statutFiltre === "rejete" && "Rejetés"}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownStatut">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setStatutFiltre("all")}
                >
                  Tous les statuts
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setStatutFiltre("valide")}
                >
                  Validés
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setStatutFiltre("attente")}
                >
                  En attente
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => setStatutFiltre("rejete")}
                >
                  Rejetés
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
            {address ? "Produits du collecteur" : "Liste des Lots de Produits"}
          </h2>

          {/* Statistiques IPFS */}
          <div className="row mb-3">
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-primary" />
                <span className="small">
                  <strong>
                    {produitsFiltres.filter((q) => q.data?.cid).length}
                  </strong>{" "}
                  produits avec données IPFS
                </span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-warning" />
                <span className="small">
                  <strong>
                    {produitsFiltres.filter((q) => q.data?.hashMerkle).length}
                  </strong>{" "}
                  produits avec hash Merkle
                </span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Package2 size={20} className="me-2 text-success" />
                <span className="small">
                  <strong>{produitsFiltres.length}</strong> produits au total
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div
              className="alert alert-danger d-flex align-items-center"
              role="alert"
            >
              <div>{error}</div>
            </div>
          )}
        </div>

        {produitsFiltres.length > 0 ? (
          /* Affichage des lots de produits */
          <div className="row g-3">
            <AnimatePresence>
              {produitsFiltres.map((q, index) => {
                const produit = q.data;

                // Skeleton si la recolte est encours de chargement
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

                // Afficher lot produit
                return (
                  <motion.div
                    key={produit.id}
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
                      <div
                        className="d-flex justify-content-center align-items-center mb-2"
                        style={{ fontSize: 32, color: "#4d7c0f" }}
                      >
                        <Group size={36} />
                      </div>
                      <h5 className="card-title text-center mb-3">
                        {produit.nom} #{produit.id}
                      </h5>
                      <div className="card-text small">
                        <p>
                          <Hash size={16} className="me-2 text-success" />
                          <strong>ID Lot Produit:</strong> {produit.id}
                        </p>
                        <p>
                          <Hash size={16} className="me-2 text-success" />
                          <strong>IDs Récoltes:</strong>{" "}
                          {produit.idRecolte.join(", ")}
                        </p>
                        <p>
                          <Package2 size={16} className="me-2 text-success" />
                          <strong>Quantité:</strong> {produit.quantite} kg
                        </p>
                        <p>
                          <BadgeEuro size={16} className="me-2 text-success" />
                          <strong>Prix unitaire:</strong> {produit.prixUnit} Ar
                        </p>
                        <p>
                          <User size={16} className="me-2 text-success" />
                          <strong>Collecteur:</strong>&nbsp;
                          {produit.collecteur.nom}
                        </p>
                        {produit.hashTransaction &&
                          produit.hashTransaction !== "" && (
                            <p>
                              <Fingerprint
                                size={16}
                                className="me-2 text-success"
                              />
                              <strong>Hash transaction:</strong>&nbsp;
                              <a
                                href={URL_BLOCK_SCAN + produit.hashTransaction}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {produit.hashTransaction?.slice(0, 6)}...
                                {produit.hashTransaction?.slice(-4)}
                              </a>
                            </p>
                          )}
                      </div>
                      <div className="mt-3">
                        {/* Actions pour le collecteur */}
                        {hasRole(roles, 3) && (
                          <button
                            onClick={() => {
                              setProduitSelectionne(produit);
                              setNouveauPrix(produit.prixUnit);
                              setShowModal(true);
                            }}
                            className="btn btn-agrichain"
                          >
                            Modifier le prix
                          </button>
                        )}
                        {/* Actions pour le exportateur */}
                        {hasRole(roles, 6) && (
                          <button
                            onClick={() => {
                              setProduitSelectionne(produit);
                              setShowModal("commander");
                            }}
                            className="btn-agrichain"
                          >
                            Commander
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Btn pour charger plus de lots produits */}
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
          <div className="text-center text-muted">Aucun produit trouver.</div>
        )}
      </div>

      {/* Modal de modification du prix */}
      {showModal === true && produitSelectionne && (
        <>
          <div className="modal-backdrop fade show"></div>

          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Modifier le prix de {produitSelectionne.nom}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Prix actuel: {produitSelectionne.prixUnit} Ar
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={nouveauPrix}
                      onChange={(e) => setNouveauPrix(e.target.value)}
                      placeholder="Nouveau prix"
                    />
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
                    onClick={() => handleModifierPrix(produitSelectionne.id)}
                    disabled={btnLoading}
                  >
                    Confirmer la modification
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Commander pour l'exportateur */}
      {showModal === "commander" && produitSelectionne && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Commander {produitSelectionne.nom}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      Quantité disponible: {produitSelectionne.quantite} kg
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={quantiteCommande || ""}
                      onChange={(e) => setQuantiteCommande(e.target.value)}
                      placeholder="Quantité à commander"
                    />
                  </div>
                  <div className="mb-3">
                    <p>Prix unitaire: {produitSelectionne.prixUnit} Ar</p>
                    <p>
                      Total:{" "}
                      {Number(quantiteCommande) *
                        Number(produitSelectionne.prixUnit) || 0}{" "}
                      Ar
                    </p>
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
                    onClick={() =>
                      handleCommanderProduit(produitSelectionne.id)
                    }
                    disabled={
                      !quantiteCommande ||
                      Number(quantiteCommande) <= 0 ||
                      Number(quantiteCommande) >
                        Number(produitSelectionne.quantite) ||
                      btnLoading
                    }
                  >
                    {btnLoading
                      ? "Confirmer la commande..."
                      : "Confirmer la commande"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ListeLotProduits;
