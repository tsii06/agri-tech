import { useParams, Link } from "react-router-dom";
import { Package2, Hash, Truck, Box, BadgeCheck, FileText, ThermometerSun, Droplets, Layers3, Shield, GitBranch } from "lucide-react";
import { createMerkleTreeFromData, getMerkleProof, verifyMerkleProof, sha256 } from "../../utils/merkleUtils";

export default function ProduitDetails() {
  const { id } = useParams();

  // Données statiques inspirées de StructLib pour une traçabilité complète
  const data = {
    produit: {
      id,
      nom: "Café Arabica - Lot Premium",
      categorie: "Café",
      quantite: 100,
      prixUnit: 25000,
      idRecolte: 42,
      collecteur: "0x12a3...bCd9",
      hashMerkle: "0xabc123...",
      cid: "bafybeiproduitcid..."
    },
    commande: {
      id: 310,
      quantite: 100,
      prix: 2500000,
      payer: true,
      statutTransport: 2,
      exportateur: "0x98f4...de21",
      collecteur: "0x12a3...bCd9",
      cid: "bafybeicommandecid...",
      hashMerkle: "0xdef456..."
    },
    lotProduit: {
      id: 77,
      idRecoltes: [42, 43],
      quantite: 200,
      prix: 4800000,
      collecteur: "0x12a3...bCd9",
      cid: "bafybeilotcid...",
      hashMerkle: "0xaaa999..."
    },
    recoltes: [
      {
        id: 42,
        idParcelles: [5, 6],
        quantite: 120,
        prixUnit: 20000,
        certifie: true,
        certificatPhytosanitaire: "bafybeicertphytosanitaire...",
        producteur: "0xa1b2...c3d4",
        hashMerkle: "0x111111...",
        cid: "bafybeirecolte42...",
        nomProduit: "Café Arabica",
        dateRecolte: "2025-07-12"
      },
      {
        id: 43,
        idParcelles: [7],
        quantite: 80,
        prixUnit: 21000,
        certifie: false,
        certificatPhytosanitaire: "",
        producteur: "0xa1b2...c3d4",
        hashMerkle: "0x222222...",
        cid: "bafybeirecolte43...",
        nomProduit: "Café Arabica",
        dateRecolte: "2025-07-10"
      }
    ],
    parcelles: [
      { id: 5, producteur: "0xa1b2...c3d4", cid: "bafybeiparcelle5...", hashMerkle: "0xaaaa...", nom: "Colline Est", superficie: 2.3 },
      { id: 6, producteur: "0xa1b2...c3d4", cid: "bafybeiparcelle6...", hashMerkle: "0xbbbb...", nom: "Vallée Nord", superficie: 1.8 },
      { id: 7, producteur: "0xa1b2...c3d4", cid: "bafybeiparcelle7...", hashMerkle: "0xcccc...", nom: "Plateau Ouest", superficie: 3.1 }
    ],
    conditionsTransport: {
      id: 9,
      temperature: "18°C",
      humidite: "55%",
      cid: "bafybeiconditions...",
      hashMerkle: "0x333333..."
    },
    expedition: {
      id: 12,
      ref: "EXP-2025-00012",
      idCommandeProduit: [310],
      quantite: 100,
      prix: 2600000,
      exportateur: "0x98f4...de21",
      cid: "bafybeiexpcid...",
      rootMerkle: "0x444444...",
      certifier: true,
      cidCertificat: "0x555555..."
    }
  };

  // Merkle demo (statique à partir de quelques items textuels)
  const merkleDemoItems = [
    `commande:${data.commande.id}:${data.commande.quantite}:${data.commande.prix}`,
    `lot:${data.lotProduit.id}:${data.lotProduit.quantite}`,
    `expedition:${data.expedition.ref}:${data.expedition.quantite}`,
    `produit:${data.produit.id}:${data.produit.nom}`,
  ];
  const { hashes: demoHashes, root: demoRoot } = createMerkleTreeFromData(merkleDemoItems);
  const targetIndex = 2; // expédition
  const targetHash = demoHashes[targetIndex];
  const proofObj = getMerkleProof(demoHashes, targetHash);
  const verified = verifyMerkleProof(targetHash, proofObj.proof, proofObj.root, proofObj.index);

  const Section = ({ title, children }) => (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
      <div className="card-body p-4">
        <h5 className="mb-3 d-flex align-items-center gap-2" style={{ color: "#2e7d32" }}>
          {title}
        </h5>
        {children}
      </div>
    </div>
  );

  const Badge = ({ ok, textTrue = "Oui", textFalse = "Non" }) => (
    <span className={`badge ${ok ? "bg-success" : "bg-secondary"}`}>{ok ? textTrue : textFalse}</span>
  );

  return (
    <div style={{ background: "#f7faf9" }}>
      <div className="container py-4 py-md-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="h4 mb-0">Traçabilité du produit #{id}</h2>
          <Link to="/espace-client" className="btn btn-outline-success">Retour</Link>
        </div>

        {/* En-tête produit */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <div className="mb-2 d-flex align-items-center gap-2"><Package2 size={16} className="text-success" /><strong>Nom</strong></div>
                  <div>{data.produit.nom}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <div className="mb-2 d-flex align-items-center gap-2"><Box size={16} className="text-success" /><strong>Quantité</strong></div>
                  <div>{data.produit.quantite} kg</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <div className="mb-2 d-flex align-items-center gap-2"><BadgeCheck size={16} className="text-success" /><strong>Prix unitaire</strong></div>
                  <div>{data.produit.prixUnit} Ar</div>
                </div>
              </div>
            </div>
            <div className="row g-3 mt-1">
              <div className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <div className="mb-2 d-flex align-items-center gap-2"><Shield size={16} className="text-success" /><strong>Collecteur</strong></div>
                  <div>{data.produit.collecteur}</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <div className="mb-2 d-flex align-items-center gap-2"><GitBranch size={16} className="text-success" /><strong>Hash Merkle</strong></div>
                  <div className="text-muted" title={data.produit.hashMerkle}>{String(data.produit.hashMerkle).slice(0, 12)}...</div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <div className="mb-2 d-flex align-items-center gap-2"><FileText size={16} className="text-success" /><strong>CID IPFS</strong></div>
                  <div className="text-muted" title={data.produit.cid}>{String(data.produit.cid).slice(0, 14)}...</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline synthétique */}
        <Section title={<><Layers3 size={18} /> Parcours (timeline)</>}>
          <div className="row g-3">
            {[
              { step: "Récolte", detail: `Récoltes ${data.recoltes.map(r=>`#${r.id}`).join(", " )}` },
              { step: "Lot constitué", detail: `Lot #${data.lotProduit.id}` },
              { step: "Commande", detail: `Commande #${data.commande.id} - Payée` },
              { step: "Expédition", detail: `Réf ${data.expedition.ref} - Certifiée` },
            ].map((it, idx) => (
              <div key={idx} className="col-md-3">
                <div className="border rounded p-3 h-100 text-center">
                  <div className="fw-semibold" style={{ color: "#2e7d32" }}>{it.step}</div>
                  <div className="small text-muted mt-1">{it.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Commande */}
        <Section title={<><Hash size={18} /> Commande</>}>
          <div className="row g-3">
            <div className="col-md-3"><strong>ID</strong><div>{data.commande.id}</div></div>
            <div className="col-md-3"><strong>Quantité</strong><div>{data.commande.quantite} kg</div></div>
            <div className="col-md-3"><strong>Prix</strong><div>{data.commande.prix} Ar</div></div>
            <div className="col-md-3"><strong>Payée</strong><div><Badge ok={data.commande.payer} /></div></div>
          </div>
          <div className="row g-3 mt-1">
            <div className="col-md-4"><strong>Collecteur</strong><div>{data.commande.collecteur}</div></div>
            <div className="col-md-4"><strong>Exportateur</strong><div>{data.commande.exportateur}</div></div>
            <div className="col-md-4"><strong>CID</strong><div className="text-muted">{data.commande.cid.slice(0,14)}...</div></div>
          </div>
        </Section>

        {/* Lot de produit */}
        <Section title={<><Box size={18} /> Lot de produit</>}>
          <div className="row g-3">
            <div className="col-md-3"><strong>ID Lot</strong><div>{data.lotProduit.id}</div></div>
            <div className="col-md-3"><strong>Quantité</strong><div>{data.lotProduit.quantite} kg</div></div>
            <div className="col-md-3"><strong>Prix</strong><div>{data.lotProduit.prix} Ar</div></div>
            <div className="col-md-3"><strong>Collecteur</strong><div>{data.lotProduit.collecteur}</div></div>
          </div>
          <div className="row g-3 mt-1">
            <div className="col-md-6"><strong>Récoltes</strong><div>{data.lotProduit.idRecoltes.join(", ")}</div></div>
            <div className="col-md-3"><strong>Hash Merkle</strong><div className="text-muted">{data.lotProduit.hashMerkle.slice(0,12)}...</div></div>
            <div className="col-md-3"><strong>CID</strong><div className="text-muted">{data.lotProduit.cid.slice(0,14)}...</div></div>
          </div>
        </Section>

        {/* Récoltes et parcelles */}
        <Section title={<><Package2 size={18} /> Récoltes et parcelles</>}>
          <div className="row g-3">
            {data.recoltes.map((r) => (
              <div key={r.id} className="col-md-6">
                <div className="border rounded p-3 h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="fw-semibold">Récolte #{r.id}</div>
                    <Badge ok={r.certifie} textTrue="Certifiée" textFalse="Non certifiée" />
                  </div>
                  <div className="small text-muted">{r.nomProduit} — {r.dateRecolte}</div>
                  <div className="mt-2 small">Parcelles: {r.idParcelles.join(", ")}</div>
                  <div className="mt-1 small">Quantité: {r.quantite} kg • Prix unitaire: {r.prixUnit} Ar</div>
                  <div className="mt-1 small">Producteur: {r.producteur}</div>
                  <div className="mt-1 small">CID: <span className="text-muted">{r.cid.slice(0,14)}...</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="row g-3 mt-1">
            {data.parcelles.map((p) => (
              <div key={p.id} className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <div className="fw-semibold">Parcelle #{p.id} — {p.nom}</div>
                  <div className="small text-muted">Superficie: {p.superficie} ha</div>
                  <div className="small">Producteur: {p.producteur}</div>
                  <div className="small text-muted">CID: {p.cid.slice(0,14)}...</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Conditions transport */}
        <Section title={<><ThermometerSun size={18} /> Conditions de transport</>}>
          <div className="row g-3">
            <div className="col-md-3"><strong>Température</strong><div>{data.conditionsTransport.temperature}</div></div>
            <div className="col-md-3"><strong>Humidité</strong><div>{data.conditionsTransport.humidite}</div></div>
            <div className="col-md-3"><strong>Hash</strong><div className="text-muted">{data.conditionsTransport.hashMerkle.slice(0,12)}...</div></div>
            <div className="col-md-3"><strong>CID</strong><div className="text-muted">{data.conditionsTransport.cid.slice(0,14)}...</div></div>
          </div>
        </Section>

        {/* Expédition et certification */}
        <Section title={<><Truck size={18} /> Expédition et certification</>}>
          <div className="row g-3">
            <div className="col-md-3"><strong>Référence</strong><div>{data.expedition.ref}</div></div>
            <div className="col-md-2"><strong>Quantité</strong><div>{data.expedition.quantite} kg</div></div>
            <div className="col-md-2"><strong>Prix</strong><div>{data.expedition.prix} Ar</div></div>
            <div className="col-md-3"><strong>Exportateur</strong><div>{data.expedition.exportateur}</div></div>
            <div className="col-md-2"><strong>Certifiée</strong><div><Badge ok={data.expedition.certifier} /></div></div>
          </div>
          <div className="row g-3 mt-1">
            <div className="col-md-6"><strong>Root Merkle</strong><div className="text-muted">{data.expedition.rootMerkle}</div></div>
            <div className="col-md-6"><strong>CID Certificat (bytes32)</strong><div className="text-muted">{data.expedition.cidCertificat}</div></div>
          </div>
        </Section>

        {/* Vérification Merkle (démo statique) */}
        <Section title={<><GitBranch size={18} /> Vérification Merkle (exemple)</>}>
          <div className="row g-3">
            <div className="col-md-12">
              <div className="alert alert-light border">
                <div className="mb-2"><strong>Items</strong>: {merkleDemoItems.join(" | ")}</div>
                <div className="mb-2"><strong>Root calculée</strong>: <code>{demoRoot}</code></div>
                <div className="mb-2"><strong>Index ciblé</strong>: {proofObj.index} ("{merkleDemoItems[targetIndex]}")</div>
                <div className="mb-2"><strong>Hash ciblé</strong>: <code>{targetHash}</code></div>
                <div className="mb-2"><strong>Preuve</strong>:
                  <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(proofObj.proof, null, 2)}</pre>
                </div>
                <div className="mt-2">
                  <strong>Vérification:</strong> {verified ? <span className="text-success">VALIDE</span> : <span className="text-danger">INVALIDE</span>}
                </div>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}


