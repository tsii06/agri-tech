import React, { useEffect, useState } from "react";
import { getCollecteurExportateurContract, getCollecteurProducteurContract, getProducteurContract } from "../../utils/contract";
import { getIPFSURL } from "../../utils/ipfsUtils";
import { keccak256 } from "ethers";

function hashTx(tx) {
  return keccak256(Buffer.from(JSON.stringify(tx)));
}

function buildMerkleTree(transactions) {
  let leaves = transactions.map(hashTx);
  let level = leaves;
  while (level.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        nextLevel.push(keccak256(Buffer.concat([
          Buffer.from(level[i].slice(2), 'hex'),
          Buffer.from(level[i+1].slice(2), 'hex')
        ])));
      } else {
        nextLevel.push(level[i]);
      }
    }
    level = nextLevel;
  }
  return { root: level[0], leaves };
}

export default function ExpeditionProduits() {
  const [commandes, setCommandes] = useState([]);
  const [selection, setSelection] = useState({}); // { commandeId: quantite }
  const [loading, setLoading] = useState(false);
  const [merkleRoot, setMerkleRoot] = useState("");
  const [traceTxs, setTraceTxs] = useState([]);
  const [message, setMessage] = useState("");

  // 1. Charger les commandes payées
  useEffect(() => {
    const chargerCommandesPayees = async () => {
      setLoading(true);
      try {
        const contract = await getCollecteurExportateurContract();
        const compteur = await contract.getCompteurCommande();
        const temp = [];
        for (let i = 1; i <= compteur; i++) {
          try {
            const commande = await contract.getCommande(i);
            if (commande.payer || commande.payer === true) {
              const commandeEnrichie = {
                id: i,
                idLotProduit: Number(commande.idLotProduit),
                quantite: Number(commande.quantite),
                prix: Number(commande.prix),
                payer: Boolean(commande.payer),
                statutTransport: Number(commande.statutTransport),
                statutProduit: Number(commande.statutProduit),
                collecteur: commande.collecteur?.toString?.() || "",
                exportateur: commande.exportateur?.toString?.() || "",
                cid: commande.cid || "",
                hashMerkle: commande.hashMerkle || ""
              };

              // Charger les données IPFS de la commande
              if (commandeEnrichie.cid) {
                try {
                  const response = await fetch(getIPFSURL(commandeEnrichie.cid));
                  if (response.ok) {
                    const ipfsData = await response.json();
                    const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                    commandeEnrichie.nomProduit = root.nomProduit || "";
                    commandeEnrichie.ipfsRoot = root;
                  }
                } catch (ipfsError) {
                  console.log("Erreur lors du chargement IPFS de la commande:", ipfsError);
                }
              }

              temp.push(commandeEnrichie);
            }
          } catch (error) {
            console.log("Erreur lors du chargement de la commande", i, ":", error);
          }
        }
        setCommandes(temp);
      } catch (e) {
        setMessage("Erreur lors du chargement des commandes : " + (e?.message || e));
      }
      setLoading(false);
    };
    chargerCommandesPayees();
  }, []);

  // 2. Gestion de la sélection et des quantités
  const handleSelect = (id, checked) => {
    setSelection(sel => {
      const copy = { ...sel };
      if (!checked) delete copy[id];
      else copy[id] = copy[id] || "";
      return copy;
    });
  };
  
  const handleQuantite = (id, value) => {
    setSelection(sel => ({ ...sel, [id]: value }));
  };

  // 3. Récupération de la traçabilité et construction Merkle
  const handleExpedier = async () => {
    setLoading(true);
    setMessage("");
    try {
      const contractCE = await getCollecteurExportateurContract();
      const contractCP = await getCollecteurProducteurContract();
      const contractPP = await getProducteurContract();
      let allTxs = [];

      for (const commandeId of Object.keys(selection)) {
        const commande = commandes.find(c => c.id === parseInt(commandeId));
        if (!commande) continue;

        // 1. Commande
        allTxs.push({ type: "commande", ...commande });

        // 2. Lot de produit
        if (commande.idLotProduit > 0) {
          try {
            const lotProduit = await contractCE.getLotProduit(commande.idLotProduit);
            const lotProduitEnrichi = {
              id: Number(lotProduit.id),
              idRecoltes: lotProduit.idRecolte || [],
              quantite: Number(lotProduit.quantite),
              prix: Number(lotProduit.prix),
              collecteur: lotProduit.collecteur?.toString?.() || "",
              cid: lotProduit.cid || "",
              hashMerkle: lotProduit.hashMerkle || ""
            };

            // Charger les données IPFS du lot de produit
            if (lotProduitEnrichi.cid) {
              try {
                const response = await fetch(getIPFSURL(lotProduitEnrichi.cid));
                if (response.ok) {
                  const ipfsData = await response.json();
                  const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                  lotProduitEnrichi.ipfsRoot = root;
                }
              } catch (ipfsError) {
                console.log("Erreur lors du chargement IPFS du lot de produit:", ipfsError);
              }
            }

            allTxs.push({ type: "lotProduit", ...lotProduitEnrichi });

            // 3. Produits du lot
            if (lotProduitEnrichi.idRecoltes && lotProduitEnrichi.idRecoltes.length > 0) {
              const compteurProduits = Number(await contractCE.getCompteurProduit());
              for (let j = 1; j <= compteurProduits; j++) {
                try {
                  const produit = await contractCE.getProduit(j);
                  if (lotProduitEnrichi.idRecoltes.includes(Number(produit.idRecolte))) {
                    const produitEnrichi = {
                      id: Number(produit.id),
                      idRecolte: Number(produit.idRecolte),
                      quantite: Number(produit.quantite),
                      collecteur: produit.collecteur?.toString?.() || "",
                      enregistre: Boolean(produit.enregistre),
                      hashMerkle: produit.hashMerkle || ""
                    };
                    allTxs.push({ type: "produit", ...produitEnrichi });
                  }
                } catch (error) {
                  console.log("Erreur lors du chargement du produit", j, ":", error);
                }
              }
            }

            // 4. Récoltes associées
            for (const idRecolte of lotProduitEnrichi.idRecoltes) {
              try {
                const recolte = await contractCP.getRecolte(idRecolte);
                const recolteEnrichie = {
                  id: Number(recolte.id),
                  idParcelles: recolte.idParcelle || [],
                  quantite: Number(recolte.quantite),
                  prixUnit: Number(recolte.prixUnit),
                  certifie: Boolean(recolte.certifie),
                  certificatPhytosanitaire: recolte.certificatPhytosanitaire || "",
                  producteur: recolte.producteur?.toString?.() || "",
                  hashMerkle: recolte.hashMerkle || "",
                  cid: recolte.cid || ""
                };

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
                    }
                  } catch (ipfsError) {
                    console.log("Erreur lors du chargement IPFS de la récolte:", ipfsError);
                  }
                }

                allTxs.push({ type: "recolte", ...recolteEnrichie });

                // 5. Parcelles associées
                for (const idParcelle of recolteEnrichie.idParcelles) {
                  try {
                    const parcelle = await contractPP.getParcelle(idParcelle);
                    const parcelleEnrichie = {
                      id: Number(parcelle.id),
                      producteur: parcelle.producteur?.toString?.() || "",
                      cid: parcelle.cid || "",
                      hashMerkle: parcelle.hashMerkle || ""
                    };

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
                        }
                      } catch (ipfsError) {
                        console.log("Erreur lors du chargement IPFS de la parcelle:", ipfsError);
                      }
                    }

                    allTxs.push({ type: "parcelle", ...parcelleEnrichie });
                  } catch (parcelleError) {
                    console.error("Erreur lors du chargement de la parcelle", idParcelle, ":", parcelleError);
                  }
                }
              } catch (recolteError) {
                console.error("Erreur lors du chargement de la récolte", idRecolte, ":", recolteError);
              }
            }
          } catch (lotProduitError) {
            console.error("Erreur lors du chargement du lot de produit:", lotProduitError);
          }
        }

        // 6. Conditions de transport (si disponibles)
        try {
          const compteurConditions = Number(await contractCE.getCompteurConditions());
          for (let i = 1; i <= compteurConditions; i++) {
            try {
              const condition = await contractCE.getCondition(i);
              if (condition && condition.cid) {
                const response = await fetch(getIPFSURL(condition.cid));
                if (response.ok) {
                  const ipfsData = await response.json();
                  const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                  allTxs.push({ 
                    type: "conditionTransport", 
                    id: Number(condition.id),
                    temperature: root.temperature || "",
                    humidite: root.humidite || "",
                    ipfsRoot: root,
                    hashMerkle: condition.hashMerkle || ""
                  });
                }
              }
            } catch (conditionError) {
              console.log("Erreur lors du chargement de la condition", i, ":", conditionError);
            }
          }
        } catch (error) {
          console.log("Aucune condition de transport trouvée:", error);
        }
      }

      // Nettoie les null éventuels
      allTxs = allTxs.filter(Boolean);
      setTraceTxs(allTxs);
      
      // Merkle
      const { root } = buildMerkleTree(allTxs);
      setMerkleRoot(root);
      setMessage("Expédition prête. Racine de Merkle calculée.");
    } catch (e) {
      setMessage("Erreur lors de la récupération de la traçabilité : " + (e?.message || e));
    }
    setLoading(false);
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Expédition de produits (Exportateur)</h2>
      {message && <div className="alert alert-info">{message}</div>}
      {loading && <div>Chargement...</div>}
      <form onSubmit={e => { e.preventDefault(); handleExpedier(); }}>
        <table className="table">
          <thead>
            <tr>
              <th>Sélection</th>
              <th>Commande ID</th>
              <th>Produit</th>
              <th>Quantité totale</th>
              <th>Quantité à expédier</th>
              <th>Prix</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map(commande => (
              <tr key={commande.id}>
                <td>
                  <input type="checkbox" checked={selection[commande.id] !== undefined}
                    onChange={e => handleSelect(commande.id, e.target.checked)} />
                </td>
                <td>{commande.id}</td>
                <td>{commande.nomProduit || "N/A"}</td>
                <td>{commande.quantite} kg</td>
                <td>
                  {selection[commande.id] !== undefined && (
                    <input type="number" min={1} max={commande.quantite} value={selection[commande.id]}
                      onChange={e => handleQuantite(commande.id, e.target.value)} className="form-control" style={{ width: 100 }} />
                  )}
                </td>
                <td>{commande.prix} Ar</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-success" type="submit" disabled={loading || Object.keys(selection).length === 0}>
          Expédier
        </button>
      </form>
      {merkleRoot && (
        <div className="mt-4">
          <h5>Racine de Merkle :</h5>
          <code>{merkleRoot}</code>
          <h6 className="mt-3">Transactions utilisées :</h6>
          <pre style={{ maxHeight: 300, overflow: 'auto', background: '#f8f9fa', padding: 12 }}>
            {JSON.stringify(traceTxs, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 