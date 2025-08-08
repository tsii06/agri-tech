import React, { useEffect, useState } from "react";
import { getCollecteurExportateurContract, getCollecteurProducteurContract, getProducteurEnPhaseCultureContract } from "../../utils/contract";
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
  const [produits, setProduits] = useState([]);
  const [selection, setSelection] = useState({}); // { produitId: quantite }
  const [loading, setLoading] = useState(false);
  const [merkleRoot, setMerkleRoot] = useState("");
  const [traceTxs, setTraceTxs] = useState([]);
  const [message, setMessage] = useState("");

  // 1. Charger les produits déjà payés
  useEffect(() => {
    const chargerProduitsPayes = async () => {
      setLoading(true);
      try {
        const contract = await getCollecteurExportateurContract();
        const compteur = await contract.getCompteurProduit();
        const temp = [];
        for (let i = 1; i <= compteur; i++) {
          const prod = await contract.getProduit(i);
          if (prod.payer || prod.payer === true) {
            temp.push({ ...prod, id: i });
          }
        }
        setProduits(temp);
      } catch (e) {
        setMessage("Erreur lors du chargement des produits : " + (e?.message || e));
      }
      setLoading(false);
    };
    chargerProduitsPayes();
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
      const contractExport = await getCollecteurExportateurContract();
      const contractProd = await getCollecteurProducteurContract();
      const contractParcelle = await getProducteurEnPhaseCultureContract();
      let allTxs = [];
      for (const prodId of Object.keys(selection)) {
        // Produit
        const produit = await contractExport.getProduit(prodId);

        // Commande liée (si applicable)
        let commande = null;
        if (contractExport.getCommande) {
          try {
            commande = await contractExport.getCommande(prodId);
          } catch {}
        }

        // Récolte
        const recolte = await contractProd.getRecolte(produit.idRecolte);

        // Parcelle
        const parcelle = await contractParcelle.getParcelle(recolte.idParcelle);

        // Conditions de transport (si applicable)
        let conditions = [];
        if (contractProd.getConditions) {
          try {
            conditions = await contractProd.getConditions(recolte.idParcelle);
          } catch {}
        }

        // Paiements (si applicable)
        let paiements = [];
        if (contractProd.getPaiements) {
          try {
            paiements = await contractProd.getPaiements(prodId);
          } catch {}
        }

        // Inspections (si applicable)
        let inspections = [];
        if (contractParcelle.getInspections) {
          try {
            inspections = await contractParcelle.getInspections(recolte.idParcelle);
          } catch {}
        }

        // Intrants (si applicable)
        let intrants = [];
        if (contractParcelle.getIntrants) {
          try {
            intrants = await contractParcelle.getIntrants(recolte.idParcelle);
          } catch {}
        }

        // Photos (si applicable)
        let photos = [];
        if (contractParcelle.getPhotos) {
          try {
            photos = await contractParcelle.getPhotos(recolte.idParcelle);
          } catch {}
        }

        // Ajoute tout à la trace
        allTxs.push(
          { type: "produit", ...produit },
          commande ? { type: "commande", ...commande } : null,
          { type: "recolte", ...recolte },
          { type: "parcelle", ...parcelle },
          ...conditions.map(c => ({ type: "condition", ...c })),
          ...paiements.map(p => ({ type: "paiement", ...p })),
          ...inspections.map(i => ({ type: "inspection", ...i })),
          ...intrants.map(i => ({ type: "intrant", ...i })),
          ...photos.map(url => ({ type: "photo", url }))
        );
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
              <th>Nom</th>
              <th>Quantité totale</th>
              <th>Quantité à expédier</th>
            </tr>
          </thead>
          <tbody>
            {produits.map(prod => (
              <tr key={prod.id}>
                <td>
                  <input type="checkbox" checked={selection[prod.id] !== undefined}
                    onChange={e => handleSelect(prod.id, e.target.checked)} />
                </td>
                <td>{prod.nom}</td>
                <td>{prod.quantite}</td>
                <td>
                  {selection[prod.id] !== undefined && (
                    <input type="number" min={1} max={prod.quantite} value={selection[prod.id]}
                      onChange={e => handleQuantite(prod.id, e.target.value)} className="form-control" style={{ width: 100 }} />
                  )}
                </td>
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