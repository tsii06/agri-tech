/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import {
  DEBUT_COMMANDE_LOT_PRODUIT,
  DEBUT_COMMANDE_RECOLTE,
  getCollecteurExportateurContract,
  getCollecteurProducteurContract,
} from "../../utils/contract";
import {
  ajouterKeyValuesFileIpfs,
  deleteFromIPFSByCid,
  getIPFSURL,
  uploadConsolidatedData,
  uploadToIPFS,
} from "../../utils/ipfsUtils";
import {
  Package2,
  User,
  Truck,
  Fingerprint,
  Sprout,
  Package,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useUserContext } from "../../context/useContextt";
import {
  getCommandeProduit,
  getConditionTransportCE,
} from "../../utils/collecteurExporatateur";
import Skeleton from "react-loading-skeleton";
import { AnimatePresence, motion } from "framer-motion";
import { collecteurProducteurRead } from "../../config/onChain/frontContracts";
import { useCommandesRecoltesUnAUn } from "../../hooks/queries/useCommandesRecoltes";
import { useConditionTransportCommandeRecolte } from "../../hooks/mutations/mutationCommandesRecoltes";

const contract = await getCollecteurExportateurContract();

// Tab de tous les ids recoltes
const compteurCommandesRecoltes = Number(
  await collecteurProducteurRead.read("compteurCommandes")
);
const commandesRecoltesIDs = Array.from(
  { length: compteurCommandesRecoltes - DEBUT_COMMANDE_RECOLTE + 1 },
  (_, i) => compteurCommandesRecoltes - i
);

// Nbr de recoltes par chargement
const NBR_ITEMS_PAR_PAGE = 9;

function LivraisonRecolte() {
  const [isLoadingProduit, setIsLoadingProduit] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dureeTransport, setDureeTransport] = useState("");
  const [lieuDepart, setLieuDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [commandes, setCommandes] = useState([]);
  const [commandesRecolte, setCommandesRecolte] = useState([]);
  const [error, setError] = useState(null);
  const [detailsCondition, setDetailsCondition] = useState({});
  const [rapportTransport, setRapportTransport] = useState(null);

  // les derniers commandes charger
  const [dernierCommandeProduitCharger, setDernierCommandeProduitCharger] =
    useState(() => 0);

  const { roles, account } = useUserContext();

  // COMMANDES RECOLTES ==================================================================
  // Nbr de commandes recoltes par tranche
  const [commandesRecoltesToShow, setCommandesRecoltesToShow] =
    useState(NBR_ITEMS_PAR_PAGE);
  const idsToFetch = commandesRecoltesIDs.slice(0, commandesRecoltesToShow);

  // Utilisation cache pour la liste des commandes recoltes.
  const commandesRecoltesUnAUn = useCommandesRecoltesUnAUn(
    idsToFetch,
    roles,
    account
  );

  // Charger 9 de plus
  const chargerPlusDeCommandesRecoltes = (plus = NBR_ITEMS_PAR_PAGE) => {
    setCommandesRecoltesToShow((prev) =>
      Math.min(prev + plus, commandesRecoltesIDs.length)
    );
  };

  // Check si on peut charger plus
  const hasMoreCommandesRecoltes =
    commandesRecoltesToShow < commandesRecoltesIDs.length;

  // Filtrage commandes recoltes du cache
  const commandesRecoltesFiltres = commandesRecoltesUnAUn.filter((q) => {
    const commande = q.data;

    // Ne pas filtrer si pas encore charger
    if (q.isLoading || q.isRefetching) return true;

    // Ne pas garder les commandes qui n'apartient pas a l'user si user est collecteur
    if (commande.isProprietaire && !commande.isProprietaire) return false;

    return true;
  });

  // Charger encore plus si le nbr de recoltes filtrees === 0 ou si la page n'est pas pleine.
  if (
    hasMoreCommandesRecoltes &&
    (commandesRecoltesFiltres.length === 0 ||
      commandesRecoltesFiltres.length % NBR_ITEMS_PAR_PAGE !== 0)
  )
    chargerPlusDeCommandesRecoltes(
      NBR_ITEMS_PAR_PAGE -
        (commandesRecoltesFiltres.length % NBR_ITEMS_PAR_PAGE)
    );

  // useMutation pour enregistrement condition transport commande recolte
  const conditionCommandeRecolteMutation =
    useConditionTransportCommandeRecolte();

  const chargerCommandeProduits = async (reset = false) => {
    setIsLoadingProduit(true);

    try {
      // Charger toutes les commandes (CommandeProduit)
      const compteurCommandesRaw =
        dernierCommandeProduitCharger !== 0
          ? dernierCommandeProduitCharger
          : await contract.getCompteurCommande();
      const compteurCommandes = Number(compteurCommandesRaw);

      let nbrCommandeProduitCharger = 9;
      let i;

      for (
        i = compteurCommandes;
        i >= DEBUT_COMMANDE_LOT_PRODUIT && nbrCommandeProduitCharger > 0;
        i--
      ) {
        const c = await getCommandeProduit(i);

        // si commande n'est pas au transporteur ne pas l'afficher
        if (c.transporteur.adresse?.toLowerCase() !== account.toLowerCase())
          continue;

        // recuperer condition de transport si deja enregister
        let commandeEnrichie = {};
        if (c.enregistrerCondition) {
          const conditions = await getConditionTransportCE(i);
          commandeEnrichie = {
            ...c,
            ...conditions,
          };
        } else {
          commandeEnrichie = { ...c };
        }

        if (!reset) setCommandes((prev) => [...prev, commandeEnrichie]);
        else {
          setCommandes([commandeEnrichie]);
          reset = false;
        }
        nbrCommandeProduitCharger--;
      }
      setDernierCommandeProduitCharger(i);
    } catch (error) {
      console.error("Recuperation commande produit : ", error);
    } finally {
      setIsLoadingProduit(false);
    }
  };

  useEffect(() => {
    chargerCommandeProduits(true);
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

      // maj local
      setCommandesRecolte((prev) =>
        prev.map((cmd) =>
          cmd.id === commandeId ? { ...cmd, statutTransport: 1 } : cmd
        )
      );

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
    // Vérification des champs requis
    if (
      !dureeTransport ||
      !lieuDepart ||
      !destination ||
      rapportTransport === null
    ) {
      alert(
        "Veuillez remplir tous les champs obligatoires avant de continuer."
      );
      return;
    }

    setIsProcessing(true);
    let cid = "";
    let cidRapportTransport = "";
    try {
      // Uploader le rapport de transport
      const uploadRapportTransport = await uploadToIPFS(
        rapportTransport,
        {},
        "rapport-transport-produit"
      );
      cidRapportTransport = uploadRapportTransport.cid;

      // 1) Créer les données de condition et uploader sur IPFS (JSON)
      const conditionData = {
        type: "condition-transport-produit",
        commandeId: Number(commandeId),
        dureeTransport: dureeTransport || null,
        lieuDepart: lieuDepart || null,
        destination: destination || null,
        cidRapportTransport: uploadRapportTransport.cid,
        timestamp: Date.now(),
        version: "1.0",
      };
      const uploaded = await uploadConsolidatedData(
        conditionData,
        "conditions-transport-produit"
      );
      if (!uploaded.success) {
        throw new Error("Echec upload IPFS des conditions");
      }
      cid = uploaded.cid;

      // 2) Enregistrer côté contrat (signature: (id, cid))
      const contract = await getCollecteurExportateurContract();
      const tx = await contract.enregistrerCondition(
        Number(commandeId),
        uploaded.cid
      );
      await tx.wait();

      // ajouter hash transaction dans les keyvalues du fichier uploader sur ipfs
      await ajouterKeyValuesFileIpfs(uploaded.cid, {
        hashTransaction: tx.hash,
      });

      // maj local
      setCommandes((prev) =>
        prev.map((cmd) =>
          cmd.id == commandeId
            ? {
                ...cmd,
                enregistrerCondition: true,
                cidRapportTransport: uploadRapportTransport.cid,
                dureeTransport: dureeTransport,
                lieuDepart: lieuDepart,
                destination: destination,
                hashTransaction: tx.hash,
              }
            : cmd
        )
      );

      alert("Condition de transport enregistrée !");
      setShowConditionModal(false);
      // await chargerCommandeProduits(true);
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

      // supprimer fichier ipfs si erreur
      if (cid) deleteFromIPFSByCid(cid);
      if (cidRapportTransport !== "") deleteFromIPFSByCid(cidRapportTransport);
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
      const tx = await contract.mettreAJourStatutTransport(commandeId, 1);
      await tx.wait();

      // maj local
      setCommandesRecolte((prev) =>
        prev.map((cmd) =>
          cmd.id === commandeId ? { ...cmd, statutTransport: 1 } : cmd
        )
      );

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
    // Vérification des champs requis
    if (
      !dureeTransport ||
      !lieuDepart ||
      !destination ||
      rapportTransport === null
    ) {
      alert(
        "Veuillez remplir tous les champs obligatoires avant de continuer."
      );
      return;
    }

    setIsProcessing(true);
    let cid = "";
    let cidRapportTransport = "";
    try {
      // Uploader le rapport de transport
      const uploadRapportTransport = await uploadToIPFS(
        rapportTransport,
        {},
        "rapport-transport-recolte"
      );
      cidRapportTransport = uploadRapportTransport.cid;

      // 1) Créer les données et uploader sur IPFS (JSON)
      const conditionData = {
        type: "condition-transport-recolte",
        dureeTransport: dureeTransport || null,
        lieuDepart: lieuDepart || null,
        destination: destination || null,
        cidRapportTransport: uploadRapportTransport.cid,
        timestamp: Date.now(),
        version: "1.0",
      };
      const uploaded = await uploadConsolidatedData(
        conditionData,
        "conditions-transport-recolte"
      );
      if (!uploaded.success) {
        throw new Error("Echec upload IPFS des conditions");
      }
      cid = uploaded.cid;

      // 2) Enregistrer côté contrat CP (signature: (id, cid))
      const tx = await conditionCommandeRecolteMutation.mutateAsync({
        id: commandeId,
        cid: uploaded.cid,
      });

      // ajouter hash transaction dans les keyvalues du fichier uploader sur ipfs
      await ajouterKeyValuesFileIpfs(uploaded.cid, {
        hashTransaction: tx.hash,
      });

      // maj local
      setCommandesRecolte((prev) =>
        prev.map((cmd) =>
          cmd.id == commandeId
            ? {
                ...cmd,
                enregistrerCondition: true,
                cidRapportTransport: uploadRapportTransport.cid,
                dureeTransport: dureeTransport,
                lieuDepart: lieuDepart,
                destination: destination,
                hashTransaction: tx.hash,
              }
            : cmd
        )
      );

      alert("Condition de transport (Récolte) enregistrée !");
      setShowConditionModal(false);
      setDureeTransport("");
      setLieuDepart("");
      setDestination("");
      setRapportTransport(null);
      setError(null);
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement de la condition de transport (Récolte):",
        error.message
      );
      setError(
        "Erreur lors de l'enregistrement de la condition de transport (Récolte). Veuillez réessayer plus tard."
      );

      // supprimer fichier ipfs si erreur
      if (cid !== "") deleteFromIPFSByCid(cid);
      if (cidRapportTransport !== "") deleteFromIPFSByCid(cidRapportTransport);
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

  return (
    <div className="container py-4">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* LISTE DES COMMANDES SUR LES RECOLTES DES PRODUCTEURS */}
      <div className="card p-4 shadow-sm my-4">
        <h2 className="h5 mb-3 d-flex justify-content-between align-items-center">
          <span>
            <Sprout /> Liste des Commandes sur <strong>Récolte</strong>
          </span>
          <button className="btn" onClick={toggleRecolte}>
            {isRecolteOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
        </h2>
        <div
          className={`row g-3 overflow-hidden transition-all ${
            isRecolteOpen ? "max-h-screen" : "max-h-0"
          }`}
          style={{ transition: "max-height 0.5s ease-in-out" }}
        >
          <AnimatePresence>
            {isRecolteOpen &&
              (commandesRecoltesFiltres.length > 0 ? (
                commandesRecoltesFiltres.map((q, index) => {
                  const cmd = q.data;

                  // Skeleton si la commande est en cours de chargement
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

                  return (
                    <motion.div
                      key={index}
                      className="col-md-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
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
                          <strong>Producteur:</strong>{" "}
                          {cmd.producteur?.nom || "N/A"}
                        </p>
                        <p>
                          <User size={16} className="me-2 text-success" />
                          <strong>Collecteur:</strong>{" "}
                          {cmd.collecteur?.nom || "N/A"}
                        </p>
                        <p>
                          <Fingerprint
                            size={16}
                            className="me-2 text-success"
                          />
                          <strong>Hash transaction:</strong>{" "}
                          {cmd.hashTransaction?.slice(0, 6)}...
                          {cmd.hashTransaction?.slice(-4)}
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
                          {cmd.statutTransport === 0 &&
                            cmd.enregistrerCondition && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() =>
                                  handleSubmitStatutRecolte(cmd.id)
                                }
                                disabled={btnLoading}
                              >
                                {btnLoading ? "Livraison..." : "Livrer"}
                              </button>
                            )}
                          {cmd.enregistrerCondition && (
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() => {
                                setDetailsCondition({
                                  temperature: cmd.temperature || null,
                                  humidite: cmd.humidite || null,
                                  cidRapportTransport:
                                    cmd.cidRapportTransport || null,
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
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center text-muted">
                  Aucune commandes recoltes trouvée.
                </div>
              ))}
          </AnimatePresence>
        </div>

        {/* Btn pour charger plus de commandes recoltes */}
        {hasMoreCommandesRecoltes && (
          <div className="text-center mt-3">
            <button
              className="btn btn-outline-success"
              onClick={() => chargerPlusDeCommandesRecoltes()}
            >
              Charger plus
            </button>
          </div>
        )}
      </div>

      {/* LISTE DES COMMANDES SUR LES PRODUITS DES COLLECTEURS */}
      <div className="card p-4 shadow-sm">
        <h2 className="h5 mb-3 d-flex justify-content-between align-items-center">
          <span>
            <Package /> Liste des Commandes sur <strong>Produit</strong>
          </span>
          <button className="btn" onClick={toggleProduit}>
            {isProduitOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
        </h2>
        <div
          className={`row g-3 overflow-hidden transition-all ${
            isProduitOpen ? "max-h-screen" : "max-h-0"
          }`}
          style={{ transition: "max-height 0.5s ease-in-out" }}
        >
          <AnimatePresence>
            {isProduitOpen &&
              commandes.map((commande) => (
                <motion.div
                  key={commande.id}
                  className="col-md-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
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
                      <strong>Collecteur:</strong>{" "}
                      {commande.collecteur?.nom || "N/A"}
                    </p>
                    <p>
                      <User size={16} className="me-2 text-success" />
                      <strong>Exportateur:</strong>{" "}
                      {commande.exportateur?.nom || "N/A"}
                    </p>
                    <p>
                      <Fingerprint size={16} className="me-2 text-success" />
                      <strong>Hash transaciton:</strong>{" "}
                      {commande.hashTransaction?.slice(0, 6)}...
                      {commande.hashTransaction?.slice(-4)}
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
                            {btnLoading ? "Livrer..." : "Livrer"}
                          </button>
                        )}
                      {commande.enregistrerCondition && (
                        <button
                          className="btn btn-outline-success btn-sm"
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
              ))}
          </AnimatePresence>

          {/* Indicateur de chargement */}
          {isLoadingProduit && (
            <div className="col-md-4">
              <Skeleton
                width={"100%"}
                height={"100%"}
                style={{ minHeight: 200 }}
              />
            </div>
          )}
        </div>

        {/* Btn pour charger plus de commandes produit */}
        {dernierCommandeProduitCharger >= DEBUT_COMMANDE_LOT_PRODUIT && (
          <div className="text-center mt-3">
            <button
              className="btn btn-outline-success"
              onClick={chargerCommandeProduits}
            >
              Charger plus
            </button>
          </div>
        )}
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
                  <label htmlFor="rapportTransport" className="form-label">
                    Rapport de transport
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="rapportTransport"
                    onChange={(e) => setRapportTransport(e.target.files[0])}
                    accept=".pdf,.doc,.docx"
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
                      handleEnregistrerConditionRecolte(Number(commandeId));
                    } else {
                      const commandeId = showConditionModal.replace(
                        "produit-",
                        ""
                      );
                      handleEnregistrerCondition(Number(commandeId));
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
      )}

      {/* Overlay pour les modals */}
      {showConditionModal && <div className="modal-backdrop fade show"></div>}
      {showDetailsModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
}

export default LivraisonRecolte;
