import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCollecteurExportateurContract,
  getCollecteurProducteurContract,
  getProducteurContract,
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
  TreePine,
  MapPin,
  Calendar,
  Thermometer,
  Droplets,
  Eye,
  ArrowLeft,
  FileText,
  Shield,
  Database,
  Download,
  GitBranch,
} from "lucide-react";
import { getIPFSURL } from "../../utils/ipfsUtils";
import { keccak256 } from "ethers";
import { getLotProduitEnrichi } from "../../utils/collecteurExporatateur";

// Fonction pour hasher une transaction
function hashTx(tx) {
  return keccak256(Buffer.from(JSON.stringify(tx)));
}

// Fonction pour construire l'arbre de Merkle
function buildMerkleTree(transactions) {
  let leaves = transactions.map(hashTx);
  let level = leaves;
  let tree = [leaves];

  while (level.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        nextLevel.push(
          keccak256(
            Buffer.concat([
              Buffer.from(level[i].slice(2), "hex"),
              Buffer.from(level[i + 1].slice(2), "hex"),
            ])
          )
        );
      } else {
        nextLevel.push(level[i]);
      }
    }
    level = nextLevel;
    tree.push(level);
  }

  return {
    root: level[0],
    leaves,
    tree,
    proof: generateProof(tree, 0), // Preuve pour la première transaction
  };
}

// Fonction pour générer une preuve Merkle
function generateProof(tree, leafIndex) {
  const proof = [];
  let index = leafIndex;

  for (let i = 0; i < tree.length - 1; i++) {
    const level = tree[i];
    const isRightNode = index % 2 === 1;
    const siblingIndex = isRightNode ? index - 1 : index + 1;

    if (siblingIndex < level.length) {
      proof.push({
        hash: level[siblingIndex],
        isRight: !isRightNode,
      });
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

function StockDetails() {
  const { id } = useParams();
  const [commande, setCommande] = useState(null);
  const [lotProduit, setLotProduit] = useState(null);
  const [recoltes, setRecoltes] = useState([]);
  const [parcelles, setParcelles] = useState([]);
  const [conditionsTransport, setConditionsTransport] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [merkleTree, setMerkleTree] = useState(null);
  const [isGeneratingMerkle, setIsGeneratingMerkle] = useState(false);
  const [showMerkleDetails, setShowMerkleDetails] = useState(false);
  const { account } = useUserContext();

  useEffect(() => {
    if (!account || !id) return;

    const chargerDetails = async () => {
      try {
        setIsLoading(true);
        const contractCE = await getCollecteurExportateurContract();
        const contractCP = await getCollecteurProducteurContract();
        const contractPP = await getProducteurContract();

        // 1. Charger la commande
        const commandeRaw = await contractCE.getCommande(Number(id));

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
          collecteur: commandeRaw.collecteur,
          exportateur: commandeRaw.exportateur,
          nomProduit: produit?.nom || "",
          cid: produit.cid || "",
          hashMerkle: produit.hashMerkle || "",
        };

        // Charger les données IPFS si un CID existe
        if (commandeEnrichie.cid) {
          try {
            const response = await fetch(getIPFSURL(commandeEnrichie.cid));
            if (response.ok) {
              const ipfsData = await response.json();
              const root =
                ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
              commandeEnrichie = {
                ...commandeEnrichie,
                nomProduit:
                  root.nomProduit ||
                  produit?.nom ||
                  commandeEnrichie.nomProduit,
                ipfsTimestamp: ipfsData.timestamp,
                ipfsVersion: ipfsData.version,
                produitHashMerkle:
                  root.produitHashMerkle || ipfsData.produitHashMerkle || "",
                ipfsRoot: root,
                ipfsType: root.type || ipfsData.type || null,
              };
            }
          } catch (ipfsError) {
            console.log(
              `Erreur lors du chargement IPFS pour la commande ${i}:`,
              ipfsError
            );
          }
        }
        setCommande(commandeEnrichie);

        // 2. Charger le lot de produit associé
        if (commandeEnrichie.idLotProduit > 0) {
          try {
            const lotProduitRaw = await contractCE.getLotProduit(
              commandeEnrichie.idLotProduit
            );

            const lotProduitEnrichi = {
              id: Number(lotProduitRaw.id),
              idRecoltes: lotProduitRaw.idRecolte || [],
              quantite: Number(lotProduitRaw.quantite),
              prix: Number(lotProduitRaw.prix),
              collecteur: lotProduitRaw.collecteur?.toString?.() || "",
              cid: lotProduitRaw.cid || "",
              hashMerkle: lotProduitRaw.hashMerkle || "",
            };

            // Charger les données IPFS du lot de produit
            if (lotProduitEnrichi.cid) {
              try {
                const response = await fetch(getIPFSURL(lotProduitEnrichi.cid));
                if (response.ok) {
                  const ipfsData = await response.json();
                  const root =
                    ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                  lotProduitEnrichi.ipfsRoot = root;
                  lotProduitEnrichi.ipfsTimestamp = ipfsData.timestamp;
                }
              } catch (ipfsError) {
                console.error(
                  "Erreur lors du chargement IPFS du lot de produit:",
                  ipfsError
                );
              }
            }

            // 4. Charger les récoltes associées
            const recoltesDuLot = [];
            if (
              lotProduitEnrichi.idRecoltes &&
              lotProduitEnrichi.idRecoltes.length > 0
            ) {
              for (let i = 0; i < lotProduitEnrichi.idRecoltes.length; i++) {
                const idRecolte = Number(lotProduitEnrichi.idRecoltes[i]);
                try {
                  const recolteRaw = await contractCP.getRecolte(idRecolte);

                  const recolteEnrichie = {
                    id: Number(recolteRaw.id),
                    idParcelles: recolteRaw.idParcelle || [],
                    quantite: Number(recolteRaw.quantite),
                    prixUnit: Number(recolteRaw.prixUnit),
                    certifie: Boolean(recolteRaw.certifie),
                    certificatPhytosanitaire:
                      recolteRaw.certificatPhytosanitaire || "",
                    producteur: recolteRaw.producteur?.toString?.() || "",
                    hashMerkle: recolteRaw.hashMerkle || "",
                    cid: recolteRaw.cid || "",
                  };

                  // Charger les données IPFS de la récolte
                  if (recolteEnrichie.cid) {
                    try {
                      const response = await fetch(
                        getIPFSURL(recolteEnrichie.cid)
                      );
                      if (response.ok) {
                        const ipfsData = await response.json();
                        const root =
                          ipfsData && ipfsData.items
                            ? ipfsData.items
                            : ipfsData;
                        recolteEnrichie.nomProduit = root.nomProduit || "";
                        recolteEnrichie.dateRecolte = root.dateRecolte || "";
                        recolteEnrichie.ipfsRoot = root;
                        recolteEnrichie.ipfsTimestamp = ipfsData.timestamp;
                      }
                    } catch (ipfsError) {
                      console.error(
                        "Erreur lors du chargement IPFS de la récolte:",
                        ipfsError
                      );
                    }
                  }
                  recoltesDuLot.push(recolteEnrichie);
                } catch (recolteError) {
                  console.error(
                    "Erreur lors du chargement de la récolte",
                    idRecolte,
                    ":",
                    recolteError
                  );
                }
              }
            }

            // 5. Charger les parcelles associées
            const parcellesDuLot = [];
            for (const recolte of recoltesDuLot) {
              if (recolte.idParcelles && recolte.idParcelles.length > 0) {
                for (let i = 0; i < recolte.idParcelles.length; i++) {
                  const idParcelle = Number(recolte.idParcelles[i]);
                  try {
                    const parcelleRaw = await contractPP.getParcelle(
                      idParcelle
                    );

                    const parcelleEnrichie = {
                      id: Number(parcelleRaw.id),
                      producteur: parcelleRaw.producteur?.toString?.() || "",
                      cid: parcelleRaw.cid || "",
                      hashMerkle: parcelleRaw.hashMerkle || "",
                    };

                    // Charger les données IPFS de la parcelle
                    if (parcelleEnrichie.cid) {
                      try {
                        const response = await fetch(
                          getIPFSURL(parcelleEnrichie.cid)
                        );
                        if (response.ok) {
                          const ipfsData = await response.json();
                          const root =
                            ipfsData && ipfsData.items
                              ? ipfsData.items
                              : ipfsData;
                          parcelleEnrichie.nom = root.nom || "";
                          parcelleEnrichie.location = root.location || {
                            lat: 0,
                            lng: 0,
                          };
                          parcelleEnrichie.photos = root.photos || [];
                          parcelleEnrichie.intrants = root.intrants || [];
                          parcelleEnrichie.inspections = root.inspections || [];
                          parcelleEnrichie.certificat = root.certificat || "";
                          parcelleEnrichie.ipfsRoot = root;
                          parcelleEnrichie.ipfsTimestamp = ipfsData.timestamp;
                        }
                      } catch (ipfsError) {
                        console.error(
                          "Erreur lors du chargement IPFS de la parcelle:",
                          ipfsError
                        );
                      }
                    }
                    parcellesDuLot.push(parcelleEnrichie);
                  } catch (parcelleError) {
                    console.error(
                      "Erreur lors du chargement de la parcelle",
                      idParcelle,
                      ":",
                      parcelleError
                    );
                  }
                }
              }
            }

            // enleve les doublants
            const parcellesDuLotClean = [
              ...new Map(
                parcellesDuLot.map((item) => [item.id, item])
              ).values(),
            ];

            // Stocker les données dans l'état
            setLotProduit(lotProduitEnrichi);
            setRecoltes(recoltesDuLot);
            setParcelles(parcellesDuLotClean);
          } catch (lotProduitError) {
            console.error(
              "Erreur lors du chargement du lot de produit:",
              lotProduitError
            );
          }
        } else {
          console.error(
            "ID de lot de produit invalide:",
            commandeEnrichie.idLotProduit
          );
        }

        // 5. Charger les conditions de transport (si disponibles)
        try {
          const compteurConditions = Number(
            await contractCE.getCompteurCondition()
          );

          for (let i = 1; i <= compteurConditions; i++) {
            try {
              const conditionRaw = await contractCE.getCondition(i);

              if (conditionRaw && conditionRaw.cid) {
                const response = await fetch(getIPFSURL(conditionRaw.cid));
                if (response.ok) {
                  const ipfsData = await response.json();
                  const root =
                    ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                  setConditionsTransport({
                    id: Number(conditionRaw.id),
                    temperature: root.temperature || "",
                    humidite: root.humidite || "",
                    ipfsRoot: root,
                    ipfsTimestamp: ipfsData.timestamp,
                    hashMerkle: conditionRaw.hashMerkle || "",
                  });
                  break;
                }
              }
            } catch (conditionError) {
              console.error(
                "Erreur lors du chargement de la condition",
                i,
                ":",
                conditionError
              );
            }
          }
        } catch (error) {
          console.error("Aucune condition de transport trouvée:", error);
        }

        // 6. Charger les paiements associés à cette commande
        try {
          const compteurPaiements = Number(
            await contractCE.getCompteurPaiement()
          );

          for (let i = 1; i <= compteurPaiements; i++) {
            try {
              const paiementRaw = await contractCE.getPaiement(i);

              if (
                paiementRaw &&
                paiementRaw.montant === commandeEnrichie.prix
              ) {
              }
            } catch (paiementError) {
              console.error(
                "Erreur lors du chargement du paiement",
                i,
                ":",
                paiementError
              );
            }
          }
        } catch (error) {
          console.error("Aucun paiement trouvé:", error);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des détails:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerDetails();
  }, [account, id]);

  // Fonction pour générer l'arbre de Merkle
  const generateMerkleTree = async () => {
    setIsGeneratingMerkle(true);
    try {
      const allTransactions = [];

      // 1. Ajouter la commande
      if (commande) {
        allTransactions.push({
          type: "commande",
          id: commande.id,
          data: {
            idLotProduit: commande.idLotProduit,
            quantite: commande.quantite,
            prix: commande.prix,
            payer: commande.payer,
            statutTransport: commande.statutTransport,
            statutProduit: commande.statutProduit,
            collecteur: commande.collecteur,
            exportateur: commande.exportateur,
            nomProduit: commande.nomProduit,
            cid: commande.cid,
            hashMerkle: commande.hashMerkle,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 2. Ajouter le lot de produit
      if (lotProduit) {
        allTransactions.push({
          type: "lotProduit",
          id: lotProduit.id,
          data: {
            idRecoltes: lotProduit.idRecoltes,
            quantite: lotProduit.quantite,
            prix: lotProduit.prix,
            collecteur: lotProduit.collecteur,
            cid: lotProduit.cid,
            hashMerkle: lotProduit.hashMerkle,
            ipfsData: lotProduit.ipfsRoot,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 4. Ajouter toutes les récoltes
      recoltes.forEach((recolte) => {
        allTransactions.push({
          type: "recolte",
          id: recolte.id,
          data: {
            idParcelles: recolte.idParcelles,
            quantite: recolte.quantite,
            prixUnit: recolte.prixUnit,
            certifie: recolte.certifie,
            certificatPhytosanitaire: recolte.certificatPhytosanitaire,
            producteur: recolte.producteur,
            nomProduit: recolte.nomProduit,
            dateRecolte: recolte.dateRecolte,
            cid: recolte.cid,
            hashMerkle: recolte.hashMerkle,
            ipfsData: recolte.ipfsRoot,
            timestamp: new Date().toISOString(),
          },
        });
      });

      // 5. Ajouter toutes les parcelles
      parcelles.forEach((parcelle) => {
        allTransactions.push({
          type: "parcelle",
          id: parcelle.id,
          data: {
            producteur: parcelle.producteur,
            nom: parcelle.nom,
            superficie: parcelle.superficie,
            photos: parcelle.photos,
            intrants: parcelle.intrants,
            inspections: parcelle.inspections,
            cid: parcelle.cid,
            hashMerkle: parcelle.hashMerkle,
            ipfsData: parcelle.ipfsRoot,
            timestamp: new Date().toISOString(),
          },
        });
      });

      // 6. Ajouter les conditions de transport
      if (conditionsTransport) {
        allTransactions.push({
          type: "conditionTransport",
          id: conditionsTransport.id,
          data: {
            temperature: conditionsTransport.temperature,
            humidite: conditionsTransport.humidite,
            ipfsData: conditionsTransport.ipfsRoot,
            hashMerkle: conditionsTransport.hashMerkle,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // 7. Ajouter les paiements
      paiements.forEach((paiement) => {
        allTransactions.push({
          type: "paiement",
          id: paiement.id,
          data: {
            montant: paiement.montant,
            payeur: paiement.payeur,
            destinataire: paiement.destinataire,
            hashMerkle: paiement.hashMerkle,
            timestamp: new Date().toISOString(),
          },
        });
      });

      // Construire l'arbre de Merkle
      const merkleResult = buildMerkleTree(allTransactions);
      setMerkleTree(merkleResult);
      setShowMerkleDetails(true);
    } catch (error) {
      console.error("Erreur lors de la génération de l'arbre Merkle:", error);
      alert("Erreur lors de la génération de l'arbre Merkle: " + error.message);
    } finally {
      setIsGeneratingMerkle(false);
    }
  };

  // Fonction pour exporter les données
  const exportMerkleData = () => {
    if (!merkleTree) return;

    const exportData = {
      commandeId: id,
      timestamp: new Date().toISOString(),
      merkleRoot: merkleTree.root,
      merkleTree: merkleTree.tree,
      proof: merkleTree.proof,
      leaves: merkleTree.leaves,
      traceabilityData: {
        commande,
        lotProduit,
        recoltes,
        parcelles,
        conditionsTransport,
        paiements,
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `traceability-commande-${id}-merkle-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          Erreur lors du chargement des détails: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-4">
        <Link to="/stock" className="btn btn-outline-secondary me-3">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="h3 mb-0">Traçabilité - Commande #{id}</h1>
      </div>

      {/* Chaîne de traçabilité */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <Database size={20} className="me-2" />
                Chaîne de traçabilité
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div className="text-center flex-fill">
                  <div
                    className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{ width: 50, height: 50 }}
                  >
                    <TreePine size={24} />
                  </div>
                  <div className="small">Parcelle</div>
                  <div className="fw-bold">
                    {parcelles.length > 0
                      ? parcelles.map((p) => p.id).join(", ") || "N/A"
                      : "N/A"}
                  </div>
                </div>
                <div className="text-center flex-fill">
                  <div
                    className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{ width: 50, height: 50 }}
                  >
                    <Package2 size={24} />
                  </div>
                  <div className="small">Récolte</div>
                  <div className="fw-bold">
                    {recoltes.length > 0
                      ? lotProduit.idRecoltes.join(", ") || "N/A"
                      : "N/A"}
                  </div>
                </div>
                <div className="text-center flex-fill">
                  <div
                    className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{ width: 50, height: 50 }}
                  >
                    <Package2 size={24} />
                  </div>
                  <div className="small">Lot de Produit</div>
                  <div className="fw-bold">{lotProduit?.id || "N/A"}</div>
                </div>
                <div className="text-center flex-fill">
                  <div
                    className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{ width: 50, height: 50 }}
                  >
                    <Truck size={24} />
                  </div>
                  <div className="small">Commande</div>
                  <div className="fw-bold">{commande?.id || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Détails de la commande */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <ShoppingCart size={20} className="me-2" />
                Commande #{commande?.id}
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Produit:</strong> {commande?.nomProduit || "N/A"}
              </div>
              <div className="mb-3">
                <strong>Quantité:</strong> {commande?.quantite} kg
              </div>
              <div className="mb-3">
                <strong>Prix:</strong> {commande?.prix} Ar
              </div>
              <div className="mb-3">
                <strong>Statut:</strong>
                <span
                  className={`badge ms-2 ${
                    commande?.payer ? "bg-success" : "bg-warning"
                  }`}
                >
                  {commande?.payer ? "Payé" : "Non payé"}
                </span>
              </div>
              <div className="mb-3">
                <strong>Transport:</strong>
                <span
                  className={`badge ms-2 ${
                    commande?.statutTransport === 1 ? "bg-success" : "bg-info"
                  }`}
                >
                  {commande?.statutTransport === 1 ? "Livré" : "En cours"}
                </span>
              </div>
              {commande?.cid && (
                <div className="mb-3">
                  <strong>CID IPFS:</strong>
                  <a
                    href={getIPFSURL(commande.cid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-2 text-decoration-none"
                  >
                    {commande.cid.substring(0, 10)}...
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails du lot de produit */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <Package2 size={20} className="me-2" />
                Lot de Produit #{lotProduit?.id}
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Quantité totale:</strong> {lotProduit?.quantite} kg
              </div>
              <div className="mb-3">
                <strong>Prix unitaire:</strong> {lotProduit?.prix} Ar
              </div>
              <div className="mb-3">
                <strong>Collecteur:</strong>{" "}
                {lotProduit?.collecteur
                  ? `${lotProduit.collecteur.slice(
                      0,
                      6
                    )}...${lotProduit.collecteur.slice(-4)}`
                  : "N/A"}
              </div>
              <div className="mb-3">
                <strong>Récoltes sources:</strong>{" "}
                {lotProduit?.idRecoltes ? lotProduit.idRecoltes.length : 0}{" "}
                récolte(s)
              </div>
              {lotProduit?.cid && (
                <div className="mb-3">
                  <strong>CID IPFS:</strong>
                  <a
                    href={getIPFSURL(lotProduit.cid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-2 text-decoration-none"
                  >
                    {lotProduit.cid.substring(0, 10)}...
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conditions de transport */}
        {conditionsTransport && (
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">
                  <Truck size={20} className="me-2" />
                  Conditions de transport
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <strong>Température:</strong>{" "}
                  {conditionsTransport.temperature}°C
                </div>
                <div className="mb-3">
                  <strong>Humidité:</strong> {conditionsTransport.humidite}%
                </div>
                {conditionsTransport.ipfsRoot && (
                  <div className="mb-3">
                    <strong>Données IPFS:</strong>
                    <pre
                      className="mt-2 small bg-light p-2 rounded"
                      style={{ maxHeight: 200, overflow: "auto" }}
                    >
                      {JSON.stringify(conditionsTransport.ipfsRoot, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hash Merkle pour la traçabilité */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <Shield size={20} className="me-2" />
                Sécurité et traçabilité
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {commande?.hashMerkle && (
                  <div className="col-md-3">
                    <strong>Hash Merkle Commande:</strong>
                    <div
                      className="small text-muted mt-1"
                      title={commande.hashMerkle}
                    >
                      {commande.hashMerkle.substring(0, 20)}...
                    </div>
                  </div>
                )}
                {lotProduit?.hashMerkle && (
                  <div className="col-md-3">
                    <strong>Hash Merkle Lot Produit:</strong>
                    <div
                      className="small text-muted mt-1"
                      title={lotProduit.hashMerkle}
                    >
                      {lotProduit.hashMerkle.substring(0, 20)}...
                    </div>
                  </div>
                )}
                {recoltes.length > 0 && recoltes[0]?.hashMerkle && (
                  <div className="col-md-3">
                    <strong>Hash Merkle Récolte:</strong>
                    <div
                      className="small text-muted mt-1"
                      title={recoltes[0].hashMerkle}
                    >
                      {recoltes[0].hashMerkle.substring(0, 20)}...
                    </div>
                  </div>
                )}
                {parcelles.length > 0 && parcelles[0]?.hashMerkle && (
                  <div className="col-md-3">
                    <strong>Hash Merkle Parcelle:</strong>
                    <div
                      className="small text-muted mt-1"
                      title={parcelles[0].hashMerkle}
                    >
                      {parcelles[0].hashMerkle.substring(0, 20)}...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Détails complets de traçabilité */}
        {recoltes.length > 1 && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <Package2 size={20} className="me-2" />
                  Toutes les Récoltes ({recoltes.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {recoltes.map((recolte, index) => (
                    <div key={recolte.id} className="col-md-4 mb-3">
                      <div className="border rounded p-3">
                        <h6>Récolte #{recolte.id}</h6>
                        <p>
                          <strong>Produit:</strong>{" "}
                          {recolte.nomProduit || "N/A"}
                        </p>
                        <p>
                          <strong>Date:</strong> {recolte.dateRecolte || "N/A"}
                        </p>
                        <p>
                          <strong>Quantité:</strong> {recolte.quantite} kg
                        </p>
                        <p>
                          <strong>Prix unitaire:</strong> {recolte.prixUnit} Ar
                        </p>
                        <p>
                          <strong>Certificat phytosanitaire :</strong>{" "}
                          <a
                            href={getIPFSURL(recolte.certificatPhytosanitaire)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ms-2 text-decoration-none text-success"
                          >
                            Voir ici
                          </a>
                        </p>
                        <p>
                          <strong>Parcelles:</strong>{" "}
                          {recolte.idParcelles ? recolte.idParcelles.length : 0}
                        </p>
                        {/* Informations IPFS et Merkle */}
                        {recolte.cid && (
                          <div className="mt-2 p-2 bg-light rounded">
                            <p className="mb-1">
                              <strong>CID IPFS:</strong>
                              <a
                                href={getIPFSURL(recolte.cid)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ms-2 text-decoration-none text-primary"
                                title="Voir les données consolidées sur IPFS"
                              >
                                {recolte.cid.substring(0, 10)}...
                              </a>
                            </p>

                            {recolte.hashMerkle && (
                              <p className="mb-1">
                                <strong>Hash Merkle:</strong>
                                <span
                                  className="ms-2 text-muted"
                                  title={recolte.hashMerkle}
                                >
                                  {recolte.hashMerkle.substring(0, 10)}...
                                </span>
                              </p>
                            )}

                            {recolte.ipfsTimestamp && (
                              <p className="mb-1 text-muted small">
                                <strong>Dernière mise à jour IPFS:</strong>{" "}
                                {new Date(
                                  recolte.ipfsTimestamp
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {parcelles.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <TreePine size={20} className="me-2" />
                  Toutes les Parcelles ({parcelles.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {parcelles.map((parcelle, index) => (
                    <div key={parcelle.id} className="col-md-4 mb-3">
                      <div className="border rounded p-3">
                        <h6>Parcelle #{parcelle.id}</h6>
                        <div className="card-body">
                          <div className="mb-3">
                            <strong>Coordonnees :</strong> &nbsp;
                            {parcelle.location &&
                            parcelle.location.lat &&
                            parcelle.location.lng
                              ? `${parcelle.location.lat.toFixed(
                                  4
                                )}, ${parcelle.location.lng.toFixed(4)}`
                              : "Non spécifiée"}
                          </div>
                          <div className="mb-3">
                            <strong>Certificat :</strong>{" "}
                            <a
                              href={getIPFSURL(parcelle.certificat)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ms-2 text-decoration-none text-success"
                            >
                              Voir ici
                            </a>
                          </div>
                          <div className="mb-3">
                            <strong>Producteur:</strong>{" "}
                            {parcelles.length > 0
                              ? parcelle.producteur
                                ? `${parcelle.producteur.slice(
                                    0,
                                    6
                                  )}...${parcelle.producteur.slice(-4)}`
                                : "N/A"
                              : "N/A"}
                          </div>
                          <div className="mb-3">
                            <strong>Photos:</strong> {parcelle.photos.length}{" "}
                            photo(s)
                          </div>
                          <div className="mb-3">
                            <strong>Intrants:</strong>{" "}
                            {parcelle.intrants.length} intrant(s)
                          </div>
                          <div className="mb-3">
                            <strong>Inspections:</strong>{" "}
                            {parcelle.inspections
                              ? parcelle.inspections.length
                              : 0}{" "}
                            inspection(s)
                          </div>
                          {/* Informations IPFS et Merkle */}
                          {parcelle.cid && (
                            <div className="mt-2 p-2 bg-light rounded">
                              <p className="mb-1">
                                <strong>CID IPFS:</strong>
                                <a
                                  href={getIPFSURL(parcelle.cid)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ms-2 text-decoration-none text-primary"
                                  title="Voir les données consolidées sur IPFS"
                                >
                                  {parcelle.cid.substring(0, 10)}...
                                </a>
                              </p>

                              {parcelle.hashMerkle && (
                                <p className="mb-1">
                                  <strong>Hash Merkle:</strong>
                                  <span
                                    className="ms-2 text-muted"
                                    title={parcelle.hashMerkle}
                                  >
                                    {parcelle.hashMerkle.substring(0, 10)}...
                                  </span>
                                </p>
                              )}

                              {parcelle.ipfsTimestamp && (
                                <p className="mb-1 text-muted small">
                                  <strong>Dernière mise à jour IPFS:</strong>{" "}
                                  {new Date(
                                    parcelle.ipfsTimestamp
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section Arbre de Merkle */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <GitBranch size={20} className="me-2" />
                Arbre de Merkle - Traçabilité Complète
              </h5>
              <div>
                <button
                  className="btn btn-primary me-2"
                  onClick={generateMerkleTree}
                  disabled={isGeneratingMerkle || !commande}
                >
                  {isGeneratingMerkle ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></div>
                      Génération...
                    </>
                  ) : (
                    <>
                      <Shield size={16} className="me-2" />
                      Générer l'Arbre Merkle
                    </>
                  )}
                </button>
                {merkleTree && (
                  <button
                    className="btn btn-success"
                    onClick={exportMerkleData}
                  >
                    <Download size={16} className="me-2" />
                    Exporter
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {!merkleTree ? (
                <div className="text-center text-muted py-4">
                  <GitBranch size={48} className="mb-3" />
                  <p>
                    Cliquez sur "Générer l'Arbre Merkle" pour créer l'arbre de
                    traçabilité complet
                  </p>
                  <p className="small">
                    L'arbre Merkle garantit l'intégrité et l'authenticité de
                    toute la chaîne de traçabilité
                  </p>
                </div>
              ) : (
                <div>
                  {/* Racine de Merkle */}
                  <div className="alert alert-success">
                    <h6 className="mb-2">
                      <Shield size={16} className="me-2" />
                      Racine de Merkle (Root Hash)
                    </h6>
                    <code className="d-block bg-light p-2 rounded">
                      {merkleTree.root}
                    </code>
                    <small className="text-muted">
                      Cette racine unique représente l'intégrité de toute la
                      chaîne de traçabilité
                    </small>
                  </div>

                  {/* Statistiques */}
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-primary">
                          {merkleTree.leaves.length}
                        </h4>
                        <small className="text-muted">
                          Feuilles (Transactions)
                        </small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-success">
                          {merkleTree.tree.length}
                        </h4>
                        <small className="text-muted">Niveaux</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-info">{merkleTree.proof.length}</h4>
                        <small className="text-muted">Preuves</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-center">
                        <h4 className="text-warning">
                          {new Date().toLocaleDateString()}
                        </h4>
                        <small className="text-muted">Généré le</small>
                      </div>
                    </div>
                  </div>

                  {/* Détails de l'arbre */}
                  {showMerkleDetails && (
                    <div>
                      <h6 className="mb-3">
                        <Eye size={16} className="me-2" />
                        Détails de l'Arbre
                      </h6>

                      {/* Feuilles (Transactions) */}
                      <div className="mb-4">
                        <h6>Feuilles (Transactions) :</h6>
                        <div className="row">
                          {merkleTree.leaves.map((leaf, index) => (
                            <div key={index} className="col-md-6 mb-2">
                              <div className="border rounded p-2 bg-light">
                                <small className="text-muted">
                                  Hash #{index + 1}:
                                </small>
                                <div
                                  className="small text-truncate"
                                  title={leaf}
                                >
                                  {leaf.substring(0, 20)}...
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Preuves Merkle */}
                      <div className="mb-4">
                        <h6>Preuves Merkle (pour la première transaction) :</h6>
                        <div className="row">
                          {merkleTree.proof.map((proof, index) => (
                            <div key={index} className="col-md-6 mb-2">
                              <div className="border rounded p-2">
                                <small className="text-muted">
                                  Niveau {index + 1} -{" "}
                                  {proof.isRight ? "Droite" : "Gauche"}:
                                </small>
                                <div
                                  className="small text-truncate"
                                  title={proof.hash}
                                >
                                  {proof.hash.substring(0, 20)}...
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Arbre complet (optionnel) */}
                      <div className="mb-4">
                        <h6>Structure de l'Arbre :</h6>
                        <div className="bg-light p-3 rounded">
                          {merkleTree.tree.map((level, levelIndex) => (
                            <div key={levelIndex} className="mb-2">
                              <small className="text-muted">
                                Niveau {levelIndex + 1}:
                              </small>
                              <div className="d-flex flex-wrap">
                                {level.map((hash, hashIndex) => (
                                  <span
                                    key={hashIndex}
                                    className="badge bg-secondary me-1 mb-1"
                                    title={hash}
                                  >
                                    {hash.substring(0, 8)}...
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Informations de sécurité */}
                      <div className="alert alert-info">
                        <h6>
                          <Shield size={16} className="me-2" />
                          Sécurité et Intégrité
                        </h6>
                        <ul className="mb-0 small">
                          <li>
                            Chaque modification des données change la racine de
                            Merkle
                          </li>
                          <li>
                            Les preuves permettent de vérifier l'appartenance
                            sans révéler l'arbre complet
                          </li>
                          <li>
                            L'arbre garantit l'intégrité de toute la chaîne de
                            traçabilité
                          </li>
                          <li>
                            Impossible de modifier une transaction sans détecter
                            la fraude
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockDetails;
