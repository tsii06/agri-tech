import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Hash, Package2, BadgeEuro, Calendar, FileCheck2, Search, ChevronDown, User
} from "lucide-react";

import { getReadContract, getWriteContract, getProvider } from "../utils/contratDirect";
import { useUserContext } from "../context/useContextt";
import { hasRole } from "../utils/roles";

function ListeProduits() {
  const { address } = useParams();
  const [produits, setProduits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState(null);
  const [_, setState] = useState({});
  const [showModal, setShowModal] = useState(false);          // true: modifier prix ; 'commander': commander
  const [produitSelectionne, setProduitSelectionne] = useState(null);
  const [nouveauPrix, setNouveauPrix] = useState("");
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  const [quantiteCommande, setQuantiteCommande] = useState("");

  // NOTE: on n'utilise pas MetaMask. "account" du contexte peut être nul.
  const { roles } = useUserContext();

  // — helpers BigInt → Number
  const toNum = (x) => (typeof x === "bigint" ? Number(x) : Number(x));
  const toStr = (x) => (x?.toString ? x.toString() : String(x ?? ""));

  // Détection index base 0/1 pour getProduit
  const detectIndexBase = async (contract) => {
    for (const probe of [0, 1]) {
      try {
        await contract.getProduit(probe);
        return probe; // OK
      } catch { /* ignore */ }
    }
    throw new Error("getProduit(0/1) impossible à décoder. Vérifie ABI/adresse/réseau.");
  };

  useEffect(() => {
    const charger = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const read = getReadContract();
        // Vérifs rapides
        const provider = getProvider();
        const code = await provider.getCode(read.target);
        if (code === "0x") {
          throw new Error("Aucun contrat à l'adresse configurée sur ce réseau (getCode=0x).");
        }

        // 1) compteur
        const rawCount = await read.getCompteurProduit();
        const count = Number(rawCount);
        if (!Number.isFinite(count) || count <= 0) {
          setProduits([]);
          setIsLoading(false);
          return;
        }

        // 2) base d'index (0 ou 1)
        const base = await detectIndexBase(read);
        const indices = base === 0
          ? Array.from({ length: count }, (_, k) => k)
          : Array.from({ length: count }, (_, k) => k + 1);

        // 3) Adresse cible (filtre collecteur si rôle 3)
        let cibleLower = null;
        if (address) cibleLower = address.toLowerCase();

        // 4) lecture produits (en parallèle + robustesse)
        const list = await Promise.all(
          indices.map(async (i) => {
            try {
              const p = await read.getProduit(i);
              // p: [id, idRecolte, nom, quantite, prixUnit, dateRecolte, certificatPhytosanitaire, collecteur, statut?]
              const id          = toNum(p.id ?? p[0]);
              const idRecolte   = toNum(p.idRecolte ?? p[1]);
              const nom         = (p.nom ?? p[2]) || "";
              const quantite    = toStr(p.quantite ?? p[3]);
              const prixUnit    = toStr(p.prixUnit ?? p[4]);
              const dateRecolte = (p.dateRecolte ?? p[5]) || "";
              const certif      = (p.certificatPhytosanitaire ?? p[6]) || "";
              const collecteur  = (p.collecteur ?? p[7]) || "";
              const statut      = p.statut !== undefined ? toNum(p.statut) : (p[8] !== undefined ? toNum(p[8]) : 0);

              // Filtre rôle 3 sur le collecteur
              if (hasRole(roles, 3) && cibleLower && collecteur.toLowerCase() !== cibleLower) {
                return null;
              }

              return { id, idRecolte, nom, quantite, prixUnit, dateRecolte, certificatPhytosanitaire: certif, collecteur, statut };
            } catch {
              return null; // trou/erreur → ignorer
            }
          })
        );

        const cleaned = list.filter(Boolean).reverse(); // comme ton code : reverse()
        setProduits(cleaned);
        setError(null);
      } catch (e) {
        console.error("Erreur lors du chargement des produits:", e);
        setError(e.message || "Erreur lors du chargement des produits");
      } finally {
        setIsLoading(false);
      }
    };

    charger();
    // rafraîchir si params changent
  }, [address, roles]);

  // === Actions write: on signe via PRIVATE_KEY ===
  const handleModifierPrix = async (produitId) => {
    setBtnLoading(true);
    try {
      const prix = Number(nouveauPrix);
      if (isNaN(prix) || prix <= 0) {
        setError("Veuillez entrer un prix valide");
        return;
      }
      const write = getWriteContract();
      const tx = await write.setPriceProduit(produitId, prix);
      await tx.wait();

      // mise à jour local
      setProduits((prev) => prev.map(p => p.id === produitId ? { ...p, prixUnit: String(prix) } : p));
      setShowModal(false);
      setProduitSelectionne(null);
      setNouveauPrix("");
      setError(null);
    } catch (e) {
      console.error("Erreur lors de la modification du prix:", e);
      setError("Erreur lors de la modification du prix. Vérifiez la clé privée/solde gaz.");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCommanderProduit = async (produitId) => {
    setBtnLoading(true);
    try {
      const qte = Number(quantiteCommande);
      if (isNaN(qte) || qte <= 0 || qte > Number(produitSelectionne.quantite)) {
        setError("Veuillez entrer une quantité valide");
        return;
      }
      const write = getWriteContract();
      const tx = await write.passerCommande(produitId, qte);
      await tx.wait();

      alert("Commande passée avec succès !");
      setShowModal(false);
      setProduitSelectionne(null);
      setQuantiteCommande("");
      setState({}); // trigger refresh si nécessaire
      setError(null);
    } catch (e) {
      console.error("Erreur lors de la commande d'un produit :", e);
      setError("Erreur lors de la commande. Vérifiez la clé privée/solde gaz.");
    } finally {
      setBtnLoading(false);
    }
  };

  // Filtrage
  const produitsFiltres = produits.filter((produit) => {
    const s = search.toLowerCase();
    const matchSearch =
      (produit.nom && produit.nom.toLowerCase().includes(s)) ||
      (produit.id && produit.id.toString().includes(s));
    const matchStatut =
      statutFiltre === "all" ||
      (statutFiltre === "valide" && produit.statut === 1) ||
      (statutFiltre === "attente" && produit.statut === 0) ||
      (statutFiltre === "rejete" && produit.statut === 2);
    return matchSearch && matchStatut;
  });
  const produitsAffiches = produitsFiltres.slice(0, visibleCount);

  // Comme on n'utilise plus MetaMask, on n'empêche pas l'accès
  // (mais on garde ton message si tu veux).
  // if (!address) { ... }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between" style={{ marginBottom: 24 }}>
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text"><Search size={16} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(9); }}
              style={{ borderRadius: '0 8px 8px 0' }}
            />
          </div>
          <div className="dropdown">
            <button className="btn btn-outline-success dropdown-toggle d-flex align-items-center" type="button" id="dropdownStatut" data-bs-toggle="dropdown" aria-expanded="false">
              <ChevronDown size={16} className="me-1" />
              {statutFiltre === 'all' && 'Tous les statuts'}
              {statutFiltre === 'valide' && 'Validés'}
              {statutFiltre === 'attente' && 'En attente'}
              {statutFiltre === 'rejete' && 'Rejetés'}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownStatut">
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('all')}>Tous les statuts</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('valide')}>Validés</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('attente')}>En attente</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('rejete')}>Rejetés</button></li>
            </ul>
          </div>
        </div>

        <div style={{ backgroundColor: "rgb(240 249 232)", borderRadius: 8, padding: "0.75rem 1.25rem", marginBottom: 16 }}>
          <h2 className="h5 mb-3">{address ? "Produits du collecteur" : "Liste des Produits"}</h2>
          {error && <div className="alert alert-danger d-flex align-items-center" role="alert">{error}</div>}
        </div>

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : produits.length === 0 ? (
          <div className="text-center text-muted">Vous n&apos;avez pas encore de produits.</div>
        ) : produitsFiltres.length === 0 ? (
          <div className="text-center text-muted">Aucun produit ne correspond à la recherche ou au filtre.</div>
        ) : (
          <div className="row g-3">
            {produitsAffiches.map((produit) => (
              <div key={produit.id} className="col-md-4">
                <div className="card border shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
                  <div className="d-flex justify-content-center align-items-center mb-2" style={{ fontSize: 32, color: '#4d7c0f' }}>
                    <Box size={36} />
                  </div>
                  <h5 className="card-title text-center mb-3">{produit.nom}</h5>
                  <div className="card-text small">
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Produit:</strong> {produit.id}</p>
                    <p><Hash size={16} className="me-2 text-success" /><strong>ID Récolte:</strong> {produit.idRecolte}</p>
                    <p><Package2 size={16} className="me-2 text-success" /><strong>Quantité:</strong> {produit.quantite} kg</p>
                    <p><BadgeEuro size={16} className="me-2 text-success" /><strong>Prix unitaire:</strong> {produit.prixUnit} Ar</p>
                    <p><Calendar size={16} className="me-2 text-success" /><strong>Date de récolte:</strong> {produit.dateRecolte}</p>
                    <p><User size={16} className="me-2 text-success" />
                      <strong>Collecteur:</strong>&nbsp;
                      {produit.collecteur.slice(0, 6)}...{produit.collecteur.slice(-4)}
                    </p>
                    <p><FileCheck2 size={16} className="me-2 text-success" /><strong>Certificat phytosanitaire:</strong>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${produit.certificatPhytosanitaire}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ms-2 text-decoration-none text-success"
                      >
                        Voir ici
                      </a>
                    </p>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    {hasRole(roles, 3) && (
                      <button
                        onClick={() => { setProduitSelectionne(produit); setNouveauPrix(produit.prixUnit); setShowModal(true); }}
                        className="btn btn-agrichain"
                      >
                        Modifier le prix
                      </button>
                    )}
                    {hasRole(roles, 6) && (
                      <button
                        onClick={() => { setProduitSelectionne(produit); setShowModal('commander'); }}
                        className="btn-agrichain"
                      >
                        Commander
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Modifier Prix */}
      {showModal === true && produitSelectionne && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog"><div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier le prix de {produitSelectionne.nom}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Prix actuel: {produitSelectionne.prixUnit} Ar</label>
                  <input type="number" className="form-control" value={nouveauPrix}
                         onChange={(e) => setNouveauPrix(e.target.value)} placeholder="Nouveau prix" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="button" className="btn btn-primary"
                        onClick={() => handleModifierPrix(produitSelectionne.id)} disabled={btnLoading}>
                  Confirmer la modification
                </button>
              </div>
            </div></div>
          </div>
        </>
      )}

      {/* Modal Commander */}
      {showModal === 'commander' && produitSelectionne && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog"><div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Commander {produitSelectionne.nom}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Quantité disponible: {produitSelectionne.quantite} kg</label>
                  <input type="number" className="form-control" value={quantiteCommande || ''}
                         onChange={e => setQuantiteCommande(e.target.value)} placeholder="Quantité à commander" />
                </div>
                <div className="mb-3">
                  <p>Prix unitaire: {produitSelectionne.prixUnit} Ar</p>
                  <p>Total: {Number(quantiteCommande) * Number(produitSelectionne.prixUnit) || 0} Ar</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="button" className="btn btn-primary"
                        onClick={() => handleCommanderProduit(produitSelectionne.id)}
                        disabled={!quantiteCommande || Number(quantiteCommande) <= 0 ||
                                  Number(quantiteCommande) > Number(produitSelectionne.quantite) || btnLoading}>
                  Confirmer la commande
                </button>
              </div>
            </div></div>
          </div>
        </>
      )}

      {produitsAffiches.length < produitsFiltres.length && (
        <div className="text-center mt-3">
          <button className="btn btn-outline-success" onClick={() => setVisibleCount(visibleCount + 9)}>
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
}

export default ListeProduits;
