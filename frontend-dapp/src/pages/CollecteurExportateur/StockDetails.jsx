import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCollecteurExportateurContract, getCollecteurProducteurContract, getProducteurContract } from "../../utils/contract";
import { useUserContext } from '../../context/useContextt';
import { 
  ShoppingCart, Hash, Package2, BadgeEuro, User, Truck, Wallet, 
  TreePine, MapPin, Calendar, Thermometer, Droplets, Eye, ArrowLeft,
  FileText, Shield, Database
} from "lucide-react";
import { getIPFSURL } from '../../utils/ipfsUtils';

function StockDetails() {
  const { id } = useParams();
  const [commande, setCommande] = useState(null);
  const [lotProduit, setLotProduit] = useState(null);
  const [produits, setProduits] = useState([]);
  const [recoltes, setRecoltes] = useState([]);
  const [parcelles, setParcelles] = useState([]);
  const [conditionsTransport, setConditionsTransport] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
        console.log("Commande brute récupérée:", commandeRaw);
        
        const commandeEnrichie = {
          id: Number(commandeRaw.id),
          idLotProduit: Number(commandeRaw.idLotProduit),
          quantite: Number(commandeRaw.quantite),
          prix: Number(commandeRaw.prix),
          payer: Boolean(commandeRaw.payer),
          statutTransport: Number(commandeRaw.statutTransport),
          statutProduit: Number(commandeRaw.statutProduit),
          collecteur: commandeRaw.collecteur?.toString?.() || "",
          exportateur: commandeRaw.exportateur?.toString?.() || "",
          cid: commandeRaw.cid || "",
          hashMerkle: commandeRaw.hashMerkle || ""
        };
        console.log("Commande enrichie:", commandeEnrichie);

        // Charger les données IPFS de la commande
        if (commandeEnrichie.cid) {
          try {
            const response = await fetch(getIPFSURL(commandeEnrichie.cid));
            if (response.ok) {
              const ipfsData = await response.json();
              const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
              commandeEnrichie.nomProduit = root.nomProduit || "";
              commandeEnrichie.ipfsRoot = root;
              commandeEnrichie.ipfsTimestamp = ipfsData.timestamp;
            }
          } catch (ipfsError) {
            console.log("Erreur lors du chargement IPFS de la commande:", ipfsError);
          }
        }
        setCommande(commandeEnrichie);

        // 2. Charger le lot de produit associé
        if (commandeEnrichie.idLotProduit > 0) {
          console.log("Chargement du lot de produit ID:", commandeEnrichie.idLotProduit);
          try {
            const lotProduitRaw = await contractCE.getLotProduit(commandeEnrichie.idLotProduit);
            console.log("Lot de produit brut récupéré:", lotProduitRaw);
            
            const lotProduitEnrichi = {
              id: Number(lotProduitRaw.id),
              idRecoltes: lotProduitRaw.idRecolte || [],
              quantite: Number(lotProduitRaw.quantite),
              prix: Number(lotProduitRaw.prix),
              collecteur: lotProduitRaw.collecteur?.toString?.() || "",
              cid: lotProduitRaw.cid || "",
              hashMerkle: lotProduitRaw.hashMerkle || ""
            };
            console.log("Lot de produit enrichi:", lotProduitEnrichi);

            // Charger les données IPFS du lot de produit
            if (lotProduitEnrichi.cid) {
              try {
                const response = await fetch(getIPFSURL(lotProduitEnrichi.cid));
                if (response.ok) {
                  const ipfsData = await response.json();
                  const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                  lotProduitEnrichi.ipfsRoot = root;
                  lotProduitEnrichi.ipfsTimestamp = ipfsData.timestamp;
                  console.log("Données IPFS du lot de produit chargées:", root);
                }
              } catch (ipfsError) {
                console.log("Erreur lors du chargement IPFS du lot de produit:", ipfsError);
              }
            }

            // 3. Charger les produits du lot
            const produitsDuLot = [];
            if (lotProduitEnrichi.idRecoltes && lotProduitEnrichi.idRecoltes.length > 0) {
              console.log("Chargement des produits du lot, récoltes:", lotProduitEnrichi.idRecoltes);
              
              for (let i = 0; i < lotProduitEnrichi.idRecoltes.length; i++) {
                const idRecolte = Number(lotProduitEnrichi.idRecoltes[i]);
                console.log("Chargement des produits pour la récolte ID:", idRecolte);
                
                const compteurProduits = Number(await contractCE.getCompteurProduit());
                for (let j = 1; j <= compteurProduits; j++) {
                  try {
                    const produitRaw = await contractCE.getProduit(j);
                    if (Number(produitRaw.idRecolte) === idRecolte) {
                      const produitEnrichi = {
                        id: Number(produitRaw.id),
                        idRecolte: Number(produitRaw.idRecolte),
                        quantite: Number(produitRaw.quantite),
                        collecteur: produitRaw.collecteur?.toString?.() || "",
                        enregistre: Boolean(produitRaw.enregistre),
                        hashMerkle: produitRaw.hashMerkle || ""
                      };
                      produitsDuLot.push(produitEnrichi);
                      console.log("Produit trouvé pour la récolte:", produitEnrichi);
                    }
                  } catch (error) {
                    console.log("Erreur lors du chargement du produit", j, ":", error);
                  }
                }
              }
            }
            console.log("Produits du lot trouvés:", produitsDuLot);

            // 4. Charger les récoltes associées
            const recoltesDuLot = [];
            if (lotProduitEnrichi.idRecoltes && lotProduitEnrichi.idRecoltes.length > 0) {
              for (let i = 0; i < lotProduitEnrichi.idRecoltes.length; i++) {
                const idRecolte = Number(lotProduitEnrichi.idRecoltes[i]);
                console.log("Chargement de la récolte ID:", idRecolte);
                try {
                  const recolteRaw = await contractCP.getRecolte(idRecolte);
                  console.log("Récolte brute récupérée:", recolteRaw);
                  
                  const recolteEnrichie = {
                    id: Number(recolteRaw.id),
                    idParcelles: recolteRaw.idParcelle || [],
                    quantite: Number(recolteRaw.quantite),
                    prixUnit: Number(recolteRaw.prixUnit),
                    certifie: Boolean(recolteRaw.certifie),
                    certificatPhytosanitaire: recolteRaw.certificatPhytosanitaire || "",
                    producteur: recolteRaw.producteur?.toString?.() || "",
                    hashMerkle: recolteRaw.hashMerkle || "",
                    cid: recolteRaw.cid || ""
                  };
                  console.log("Récolte enrichie:", recolteEnrichie);

                  // Charger les données IPFS de la récolte
                  if (recolteEnrichie.cid) {
                    try {
                      const response = await fetch(getIPFSURL(recolteEnrichie.cid));
                      if (response.ok) {
                        const ipfsData = await response.json();
                        const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                        recolteEnrichie.nomProduit = root.nomProduit || "";
                        recolteEnrichie.dateRecolte = root.dateRecolte || "";
                        recolteEnrichie.ipfsRoot = root;
                        recolteEnrichie.ipfsTimestamp = ipfsData.timestamp;
                        console.log("Données IPFS de la récolte chargées:", root);
                      }
                    } catch (ipfsError) {
                      console.log("Erreur lors du chargement IPFS de la récolte:", ipfsError);
                    }
                  }
                  recoltesDuLot.push(recolteEnrichie);
                } catch (recolteError) {
                  console.error("Erreur lors du chargement de la récolte", idRecolte, ":", recolteError);
                }
              }
            }
            console.log("Récoltes du lot trouvées:", recoltesDuLot);

            // 5. Charger les parcelles associées
            const parcellesDuLot = [];
            for (const recolte of recoltesDuLot) {
              if (recolte.idParcelles && recolte.idParcelles.length > 0) {
                for (let i = 0; i < recolte.idParcelles.length; i++) {
                  const idParcelle = Number(recolte.idParcelles[i]);
                  console.log("Chargement de la parcelle ID:", idParcelle);
                  try {
                    const parcelleRaw = await contractPP.getParcelle(idParcelle);
                    console.log("Parcelle brute récupérée:", parcelleRaw);
                    
                    const parcelleEnrichie = {
                      id: Number(parcelleRaw.id),
                      producteur: parcelleRaw.producteur?.toString?.() || "",
                      cid: parcelleRaw.cid || "",
                      hashMerkle: parcelleRaw.hashMerkle || ""
                    };
                    console.log("Parcelle enrichie:", parcelleEnrichie);

                    // Charger les données IPFS de la parcelle
                    if (parcelleEnrichie.cid) {
                      try {
                        const response = await fetch(getIPFSURL(parcelleEnrichie.cid));
                        if (response.ok) {
                          const ipfsData = await response.json();
                          const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                          parcelleEnrichie.nom = root.nom || "";
                          parcelleEnrichie.superficie = root.superficie || 0;
                          parcelleEnrichie.photos = root.photos || [];
                          parcelleEnrichie.intrants = root.intrants || [];
                          parcelleEnrichie.inspections = root.inspections || [];
                          parcelleEnrichie.ipfsRoot = root;
                          parcelleEnrichie.ipfsTimestamp = ipfsData.timestamp;
                          console.log("Données IPFS de la parcelle chargées:", root);
                        }
                      } catch (ipfsError) {
                        console.log("Erreur lors du chargement IPFS de la parcelle:", ipfsError);
                      }
                    }
                    parcellesDuLot.push(parcelleEnrichie);
                  } catch (parcelleError) {
                    console.error("Erreur lors du chargement de la parcelle", idParcelle, ":", parcelleError);
                  }
                }
              }
            }
            console.log("Parcelles du lot trouvées:", parcellesDuLot);

            // Stocker les données dans l'état
            setLotProduit(lotProduitEnrichi);
            setProduits(produitsDuLot);
            setRecoltes(recoltesDuLot);
            setParcelles(parcellesDuLot);

          } catch (lotProduitError) {
            console.error("Erreur lors du chargement du lot de produit:", lotProduitError);
          }
        } else {
          console.log("ID de lot de produit invalide:", commandeEnrichie.idLotProduit);
        }

        // 5. Charger les conditions de transport (si disponibles)
        try {
          const compteurConditions = Number(await contractCE.getCompteurConditions());
          console.log("Compteur conditions:", compteurConditions);
          
          for (let i = 1; i <= compteurConditions; i++) {
            try {
              const conditionRaw = await contractCE.getCondition(i);
              console.log("Condition brute récupérée:", conditionRaw);
              
              if (conditionRaw && conditionRaw.cid) {
                const response = await fetch(getIPFSURL(conditionRaw.cid));
                if (response.ok) {
                  const ipfsData = await response.json();
                  const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                  setConditionsTransport({
                    id: Number(conditionRaw.id),
                    temperature: root.temperature || "",
                    humidite: root.humidite || "",
                    ipfsRoot: root,
                    ipfsTimestamp: ipfsData.timestamp,
                    hashMerkle: conditionRaw.hashMerkle || ""
                  });
                  console.log("Condition de transport trouvée:", root);
                  break;
                }
              }
            } catch (conditionError) {
              console.log("Erreur lors du chargement de la condition", i, ":", conditionError);
            }
          }
        } catch (error) {
          console.log("Aucune condition de transport trouvée:", error);
        }

        // 6. Charger les paiements associés à cette commande
        try {
          const compteurPaiements = Number(await contractCE.getCompteurPaiement());
          console.log("Compteur paiements:", compteurPaiements);
          
          for (let i = 1; i <= compteurPaiements; i++) {
            try {
              const paiementRaw = await contractCE.getPaiement(i);
              console.log("Paiement brut récupéré:", paiementRaw);
              
              if (paiementRaw && paiementRaw.montant === commandeEnrichie.prix) {
                console.log("Paiement trouvé pour la commande:", paiementRaw);
              }
            } catch (paiementError) {
              console.log("Erreur lors du chargement du paiement", i, ":", paiementError);
            }
          }
        } catch (error) {
          console.log("Aucun paiement trouvé:", error);
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
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: 50, height: 50}}>
                    <TreePine size={24} />
                  </div>
                  <div className="small">Parcelle</div>
                  <div className="fw-bold">{parcelles.length > 0 ? parcelles[0]?.id || "N/A" : "N/A"}</div>
                </div>
                <div className="text-center flex-fill">
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: 50, height: 50}}>
                    <Package2 size={24} />
                  </div>
                  <div className="small">Récolte</div>
                  <div className="fw-bold">{recoltes.length > 0 ? recoltes[0]?.id || "N/A" : "N/A"}</div>
                </div>
                <div className="text-center flex-fill">
                  <div className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: 50, height: 50}}>
                    <Package2 size={24} />
                  </div>
                  <div className="small">Lot de Produit</div>
                  <div className="fw-bold">{lotProduit?.id || "N/A"}</div>
                </div>
                <div className="text-center flex-fill">
                  <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: 50, height: 50}}>
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
                <span className={`badge ms-2 ${commande?.payer ? 'bg-success' : 'bg-warning'}`}>
                  {commande?.payer ? 'Payé' : 'Non payé'}
                </span>
              </div>
              <div className="mb-3">
                <strong>Transport:</strong> 
                <span className={`badge ms-2 ${commande?.statutTransport === 1 ? 'bg-success' : 'bg-info'}`}>
                  {commande?.statutTransport === 1 ? 'Livré' : 'En cours'}
                </span>
              </div>
              {commande?.cid && (
                <div className="mb-3">
                  <strong>CID IPFS:</strong>
                  <a href={getIPFSURL(commande.cid)} target="_blank" rel="noopener noreferrer" className="ms-2 text-decoration-none">
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
                <strong>Collecteur:</strong> {lotProduit?.collecteur ? `${lotProduit.collecteur.slice(0, 6)}...${lotProduit.collecteur.slice(-4)}` : "N/A"}
              </div>
              <div className="mb-3">
                <strong>Récoltes sources:</strong> {lotProduit?.idRecoltes ? lotProduit.idRecoltes.length : 0} récolte(s)
              </div>
              {lotProduit?.cid && (
                <div className="mb-3">
                  <strong>CID IPFS:</strong>
                  <a href={getIPFSURL(lotProduit.cid)} target="_blank" rel="noopener noreferrer" className="ms-2 text-decoration-none">
                    {lotProduit.cid.substring(0, 10)}...
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails de la récolte */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <Package2 size={20} className="me-2" />
                Récolte #{recoltes.length > 0 ? recoltes[0]?.id || "N/A" : "N/A"}
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Produit:</strong> {recoltes.length > 0 ? (recoltes[0]?.nomProduit || "N/A") : "N/A"}
              </div>
              <div className="mb-3">
                <strong>Date de récolte:</strong> {recoltes.length > 0 ? (recoltes[0]?.dateRecolte || "N/A") : "N/A"}
              </div>
              <div className="mb-3">
                <strong>Quantité:</strong> {recoltes.length > 0 ? (recoltes[0]?.quantite || "N/A") : "N/A"} kg
              </div>
              <div className="mb-3">
                <strong>Prix unitaire:</strong> {recoltes.length > 0 ? (recoltes[0]?.prixUnit || "N/A") : "N/A"} Ar
              </div>
              <div className="mb-3">
                <strong>Certifié:</strong> 
                <span className={`badge ms-2 ${recoltes.length > 0 && recoltes[0]?.certifie ? 'bg-success' : 'bg-warning'}`}>
                  {recoltes.length > 0 ? (recoltes[0]?.certifie ? 'Oui' : 'Non') : "N/A"}
                </span>
              </div>
              <div className="mb-3">
                <strong>Producteur:</strong> {recoltes.length > 0 ? (recoltes[0]?.producteur ? `${recoltes[0].producteur.slice(0, 6)}...${recoltes[0].producteur.slice(-4)}` : "N/A") : "N/A"}
              </div>
              {recoltes.length > 0 && recoltes[0]?.cid && (
                <div className="mb-3">
                  <strong>CID IPFS:</strong>
                  <a href={getIPFSURL(recoltes[0].cid)} target="_blank" rel="noopener noreferrer" className="ms-2 text-decoration-none">
                    {recoltes[0].cid.substring(0, 10)}...
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails de la parcelle */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <TreePine size={20} className="me-2" />
                Parcelle #{parcelles.length > 0 ? parcelles[0]?.id || "N/A" : "N/A"}
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Nom:</strong> {parcelles.length > 0 ? (parcelles[0]?.nom || "N/A") : "N/A"}
              </div>
              <div className="mb-3">
                <strong>Superficie:</strong> {parcelles.length > 0 ? (parcelles[0]?.superficie || 0) : 0} ha
              </div>
              <div className="mb-3">
                <strong>Producteur:</strong> {parcelles.length > 0 ? (parcelles[0]?.producteur ? `${parcelles[0].producteur.slice(0, 6)}...${parcelles[0].producteur.slice(-4)}` : "N/A") : "N/A"}
              </div>
              {parcelles.length > 0 && parcelles[0]?.photos && parcelles[0].photos.length > 0 && (
                <div className="mb-3">
                  <strong>Photos:</strong> {parcelles[0].photos.length} photo(s)
                </div>
              )}
              {parcelles.length > 0 && parcelles[0]?.intrants && parcelles[0].intrants.length > 0 && (
                <div className="mb-3">
                  <strong>Intrants:</strong> {parcelles[0].intrants.length} intrant(s)
                </div>
              )}
              {parcelles.length > 0 && parcelles[0]?.inspections && parcelles[0].inspections.length > 0 && (
                <div className="mb-3">
                  <strong>Inspections:</strong> {parcelles[0].inspections.length} inspection(s)
                </div>
              )}
              {parcelles.length > 0 && parcelles[0]?.cid && (
                <div className="mb-3">
                  <strong>CID IPFS:</strong>
                  <a href={getIPFSURL(parcelles[0].cid)} target="_blank" rel="noopener noreferrer" className="ms-2 text-decoration-none">
                    {parcelles[0].cid.substring(0, 10)}...
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
                  <strong>Température:</strong> {conditionsTransport.temperature}°C
                </div>
                <div className="mb-3">
                  <strong>Humidité:</strong> {conditionsTransport.humidite}%
                </div>
                {conditionsTransport.ipfsRoot && (
                  <div className="mb-3">
                    <strong>Données IPFS:</strong>
                    <pre className="mt-2 small bg-light p-2 rounded" style={{maxHeight: 200, overflow: 'auto'}}>
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
                    <div className="small text-muted mt-1" title={commande.hashMerkle}>
                      {commande.hashMerkle.substring(0, 20)}...
                    </div>
                  </div>
                )}
                {lotProduit?.hashMerkle && (
                  <div className="col-md-3">
                    <strong>Hash Merkle Lot Produit:</strong>
                    <div className="small text-muted mt-1" title={lotProduit.hashMerkle}>
                      {lotProduit.hashMerkle.substring(0, 20)}...
                    </div>
                  </div>
                )}
                {recoltes.length > 0 && recoltes[0]?.hashMerkle && (
                  <div className="col-md-3">
                    <strong>Hash Merkle Récolte:</strong>
                    <div className="small text-muted mt-1" title={recoltes[0].hashMerkle}>
                      {recoltes[0].hashMerkle.substring(0, 20)}...
                    </div>
                  </div>
                )}
                {parcelles.length > 0 && parcelles[0]?.hashMerkle && (
                  <div className="col-md-3">
                    <strong>Hash Merkle Parcelle:</strong>
                    <div className="small text-muted mt-1" title={parcelles[0].hashMerkle}>
                      {parcelles[0].hashMerkle.substring(0, 20)}...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Détails complets de traçabilité */}
        {produits.length > 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <Package2 size={20} className="me-2" />
                  Produits du Lot ({produits.length})
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {produits.map((produit, index) => (
                    <div key={produit.id} className="col-md-4 mb-3">
                      <div className="border rounded p-3">
                        <h6>Produit #{produit.id}</h6>
                        <p><strong>Quantité:</strong> {produit.quantite} kg</p>
                        <p><strong>Récolte source:</strong> #{produit.idRecolte}</p>
                        <p><strong>Enregistré:</strong> {produit.enregistre ? 'Oui' : 'Non'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
                        <p><strong>Produit:</strong> {recolte.nomProduit || "N/A"}</p>
                        <p><strong>Date:</strong> {recolte.dateRecolte || "N/A"}</p>
                        <p><strong>Quantité:</strong> {recolte.quantite} kg</p>
                        <p><strong>Prix unitaire:</strong> {recolte.prixUnit} Ar</p>
                        <p><strong>Certifié:</strong> {recolte.certifie ? 'Oui' : 'Non'}</p>
                        <p><strong>Parcelles:</strong> {recolte.idParcelles ? recolte.idParcelles.length : 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {parcelles.length > 1 && (
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
                        <p><strong>Nom:</strong> {parcelle.nom || "N/A"}</p>
                        <p><strong>Superficie:</strong> {parcelle.superficie} ha</p>
                        <p><strong>Photos:</strong> {parcelle.photos ? parcelle.photos.length : 0}</p>
                        <p><strong>Intrants:</strong> {parcelle.intrants ? parcelle.intrants.length : 0}</p>
                        <p><strong>Inspections:</strong> {parcelle.inspections ? parcelle.inspections.length : 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockDetails;
