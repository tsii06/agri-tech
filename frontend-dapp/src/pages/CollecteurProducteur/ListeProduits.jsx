import { useState, useEffect } from "react";
import {
  getCollecteurExportateurContract,
  getCollecteurProducteurContract,
} from "../../utils/contract";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Hash,
  Package2,
  BadgeEuro,
  Calendar,
  FileCheck2,
  Search,
  ChevronDown,
  User,
} from "lucide-react";
import { useUserContext } from "../../context/useContextt";
import { hasRole } from "../../utils/roles";
import { getIPFSURL, uploadLotProduit } from "../../utils/ipfsUtils";

function ListeProduits() {
  const { address } = useParams();
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [produitFiltreNom, setProduitFiltreNom] = useState(null);
  const [showLotModal, setShowLotModal] = useState(false);
  const [lotPrix, setLotPrix] = useState("");
  const { roles, account } = useUserContext();
  const nav = useNavigate();

  useEffect(() => {
    if (!account && !address) {
      setIsLoading(false);
      return;
    }
    const chargerProduits = async () => {
      try {
        const contract = await getCollecteurExportateurContract();
        const cp = await getCollecteurProducteurContract();
        // Filtrage STABLE: on filtre uniquement si un address est fourni dans l'URL
        const cible = address ? address.toLowerCase() : null;

        // Obtenir le nombre total de produits
        const compteurProduitsRaw = await contract.getCompteurProduit();
        const compteurProduits = Number(compteurProduitsRaw);
        const produitsTemp = [];

        for (let i = 1; i <= compteurProduits; i++) {
          const produitRaw = await contract.getProduit(i);
          const collecteurAddr =
            produitRaw.collecteur?.toString?.() || produitRaw.collecteur || "";
          // Appliquer le filtre UNIQUEMENT si une adresse cible est fournie dans l'URL
          if (
            hasRole(roles, 3) &&
            produitRaw.collecteur.toLowerCase() !== account.toLowerCase()
          )
            continue;

          // ne plus afficher les produits enregistrer
          if (produitRaw.enregistre) continue;

          let produitEnrichi = {
            id: i,
            idRecolte: Number(produitRaw.idRecolte ?? 0),
            nom: "",
            quantite: Number(produitRaw.quantite ?? 0),
            statut: Number(produitRaw.statut ?? produitRaw.enregistre ?? 0),
            dateRecolte: "",
            certificatPhytosanitaire: "",
            collecteur: collecteurAddr,
            hashMerkle: produitRaw.hashMerkle || "",
            enregistre: produitRaw.enregistre || 0,
          };

          // Enrichir depuis la récolte associée (prixUnit et CID JSON)
          try {
            if (produitEnrichi.idRecolte > 0) {
              const recolteRaw = await cp.getRecolte(produitEnrichi.idRecolte);
              produitEnrichi.certificatPhytosanitaire =
                recolteRaw.certificatPhytosanitaire?.toString?.() ||
                recolteRaw.certificatPhytosanitaire ||
                "";
              const recolteCid = recolteRaw.cid || "";
              if (recolteCid) {
                const response = await fetch(getIPFSURL(recolteCid));
                if (response.ok) {
                  const contentType =
                    response.headers.get("content-type") || "";
                  if (contentType.includes("application/json")) {
                    const ipfsData = await response.json();
                    const root =
                      ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                    produitEnrichi.nom =
                      root.nomProduit || produitEnrichi.nom || "Produit";
                    produitEnrichi.dateRecolte =
                      root.dateRecolte || produitEnrichi.dateRecolte || "";
                    produitEnrichi.ipfsTimestamp = ipfsData.timestamp || null;
                    produitEnrichi.ipfsVersion = ipfsData.version || null;
                    produitEnrichi.recolteHashMerkle =
                      root.parcelleHashMerkle || "";
                  }
                }
              }
            }
          } catch (e) {
            // laisser valeurs par défaut
          }

          produitsTemp.push(produitEnrichi);
        }

        produitsTemp.reverse();
        setProduits(produitsTemp);
        setError(false);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
        setError("Erreur lors du chargement des produits");
      } finally {
        setIsLoading(false);
      }
    };
    chargerProduits();
  }, [address, account, roles]);

  const handleCheckboxChange = (produitId, produitNom) => {
    setSelectedProducts((prevSelected) => {
      if (prevSelected.includes(produitId)) {
        setProduitFiltreNom(null); // Reset filter if unselected
        return prevSelected.filter((id) => id !== produitId);
      } else {
        setProduitFiltreNom(produitNom); // Set filter to selected product name
        return [...prevSelected, produitId];
      }
    });
  };

  const handleCreateLot = () => {
    if (selectedProducts.length === 0) {
      alert("Veuillez sélectionner au moins un produit pour créer un lot.");
      return;
    }
    setShowLotModal(true);
  };

  const handleConfirmCreateLot = async () => {
    if (!lotPrix || isNaN(Number(lotPrix)) || Number(lotPrix) <= 0) {
      alert("Veuillez entrer un prix valide pour le lot.");
      return;
    }

    try {
      const contract = await getCollecteurExportateurContract();
      const idLastLot = Number(await contract.compteurLotProduits());

      // Nom du lot a creer
      let nomLot = "";
      for (let p of produits) {
        if (selectedProducts.includes(p.id)) {
          nomLot = p.nom;
          break;
        }
      }

      // Uploader les data du lotProduit
      const dataLot = {
        id: idLastLot + 1,
        nom: nomLot,
        certificatsPhytosanitaires: produits
          .filter((p) => selectedProducts.includes(p.id))
          .map((p) => p.certificatPhytosanitaire),
      };
      const resUploadLot = await uploadLotProduit(dataLot, account);

      const tx = await contract.ajouterLotProduit(
        selectedProducts,
        resUploadLot.cid,
        Number(lotPrix)
      );
      await tx.wait();

      alert("Lot créé avec succès !");
      nav('/liste-lot-produits');
    } catch (error) {
      console.error("Erreur lors de la création du lot:", error);
      alert(
        "Une erreur est survenue lors de la création du lot. Veuillez réessayer."
      );
    }
  };

  // Filtrage produits selon recherche et statut
  const produitsFiltres = produits.filter((produit) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (produit.nom && produit.nom.toLowerCase().includes(searchLower)) ||
      (produit.id && produit.id.toString().includes(searchLower));
    const matchStatut =
      statutFiltre === "all" ||
      (statutFiltre === "valide" && produit.statut === 1) ||
      (statutFiltre === "attente" && produit.statut === 0) ||
      (statutFiltre === "rejete" && produit.statut === 2);
    const matchNom = produitFiltreNom ? produit.nom === produitFiltreNom : true;
    return matchSearch && matchStatut && matchNom;
  });
  const produitsAffiches = produitsFiltres.slice(0, visibleCount);

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
                setVisibleCount(9);
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
            {hasRole(roles, 3) ? "Stock du collecteur" : "Liste des stocks des collecteurs"}
          </h2>

          {/* Statistiques IPFS */}
          <div className="row mb-3">
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-primary" />
                <span className="small">
                  <strong>{produits.filter((p) => p.cid).length}</strong>{" "}
                  produits avec données IPFS
                </span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Hash size={20} className="me-2 text-warning" />
                <span className="small">
                  <strong>{produits.filter((p) => p.hashMerkle).length}</strong>{" "}
                  produits avec hash Merkle
                </span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Package2 size={20} className="me-2 text-success" />
                <span className="small">
                  <strong>{produits.length}</strong> produits au total
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

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : produits.length === 0 ? (
          <div className="text-center text-muted">
            Vous n&apos;avez pas encore de produits.
          </div>
        ) : produitsFiltres.length === 0 ? (
          <div className="text-center text-muted">
            Aucun produit ne correspond à la recherche ou au filtre.
          </div>
        ) : (
          <div className="row g-3">
            {produitsAffiches.map((produit) => (
              <div key={produit.id} className="col-md-4">
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
                      id={`checkbox-${produit.id}`}
                      checked={selectedProducts.includes(produit.id)}
                      onChange={() =>
                        handleCheckboxChange(produit.id, produit.nom)
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`checkbox-${produit.id}`}
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
                  <h5 className="card-title text-center mb-3">{produit.nom}</h5>
                  <div className="card-text small">
                    <p>
                      <Hash size={16} className="me-2 text-success" />
                      <strong>ID Produit:</strong> {produit.id}
                    </p>
                    <p>
                      <Hash size={16} className="me-2 text-success" />
                      <strong>ID Récolte:</strong> {produit.idRecolte}
                    </p>
                    <p>
                      <Package2 size={16} className="me-2 text-success" />
                      <strong>Quantité:</strong> {produit.quantite} kg
                    </p>
                    <p>
                      <Calendar size={16} className="me-2 text-success" />
                      <strong>Date de récolte:</strong> {produit.dateRecolte}
                    </p>
                    <p>
                      <User size={16} className="me-2 text-success" />
                      <strong>Collecteur:</strong>&nbsp;
                      {produit.collecteur.slice(0, 6)}...
                      {produit.collecteur.slice(-4)}
                    </p>
                    <p>
                      <FileCheck2 size={16} className="me-2 text-success" />
                      <strong>Certificat phytosanitaire:</strong>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${produit.certificatPhytosanitaire}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ms-2 text-decoration-none text-success"
                      >
                        Voir ici
                      </a>
                    </p>

                    {/* Informations IPFS et Merkle */}
                    {produit.cid && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <p className="mb-1 small">
                          <Hash size={14} className="me-1 text-primary" />
                          <strong>CID IPFS:</strong>
                          <a
                            href={getIPFSURL(produit.cid)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ms-2 text-decoration-none text-primary"
                            title="Voir les données consolidées sur IPFS"
                          >
                            {produit.cid.substring(0, 10)}...
                          </a>
                        </p>

                        {produit.hashMerkle && (
                          <p className="mb-1 small">
                            <Hash size={14} className="me-1 text-warning" />
                            <strong>Hash Merkle:</strong>
                            <span
                              className="ms-2 text-muted"
                              title={produit.hashMerkle}
                            >
                              {produit.hashMerkle.substring(0, 10)}...
                            </span>
                          </p>
                        )}

                        {produit.ipfsTimestamp && (
                          <p className="mb-1 small text-muted">
                            <strong>Mise à jour IPFS:</strong>{" "}
                            {new Date(
                              produit.ipfsTimestamp
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-3">
          <button
            className="btn btn-primary"
            onClick={handleCreateLot}
            disabled={selectedProducts.length === 0}
          >
            Créer un lot avec les produits sélectionnés
          </button>
        </div>

        {showLotModal && (
          <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal show d-block" tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Créer un lot</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowLotModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Prix par kilo (Ar)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={lotPrix}
                        onChange={(e) => setLotPrix(e.target.value)}
                        placeholder="Entrez le prix par kilo"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowLotModal(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleConfirmCreateLot}
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {produitsAffiches.length < produitsFiltres.length && (
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
  );
}

export default ListeProduits;
