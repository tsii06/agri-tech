import { useEffect, useState } from "react";
import { getExportateurClientContract } from "../../utils/contract";
import { getIPFSURL } from "../../utils/ipfsUtils";
import { ethers } from "ethers";
import { uploadToIPFS } from "../../utils/ipfsUtils";

export default function CertifierExpeditions() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expeditions, setExpeditions] = useState([]);
  const [onlyPending, setOnlyPending] = useState(true);
  const [fileInputs, setFileInputs] = useState({}); // { [id]: File }

  const loadExpeditions = async () => {
    setLoading(true);
    setMessage("");
    try {
      const contract = await getExportateurClientContract();
      const count = Number(await contract.compteurExpeditions());
      const items = [];
      for (let i = 1; i <= count; i++) {
        try {
          const exp = await contract.getExpedition(i);
          if (!exp || !exp.id) continue;
          const e = {
            id: Number(exp.id),
            ref: exp.ref,
            quantite: Number(exp.quantite),
            prix: Number(exp.prix),
            exportateur: exp.exportateur,
            cid: exp.cid,
            rootMerkle: exp.rootMerkle,
            certifier: Boolean(exp.certifier),
            cidCertificat: exp.cidCertificat
          };
          // enrichir depuis IPFS si disponible
          if (e.cid) {
            try {
              const res = await fetch(getIPFSURL(e.cid));
              if (res.ok) {
                const data = await res.json();
                const root = data && data.items ? data.items : data;
                e.ipfs = root;
                e.nomProduit = root.nomProduit || root.nom || "";
                e.destination = root.destination || "";
                e.transporteur = root.transporteur || "";
              }
            } catch {}
          }
          items.push(e);
        } catch {}
      }
      setExpeditions(items);
    } catch (e) {
      setMessage("Erreur chargement expéditions: " + (e?.message || e));
    }
    setLoading(false);
  };

  useEffect(() => { loadExpeditions(); }, []);

  const handleCertifier = async (id) => {
    setLoading(true);
    setMessage("");
    try {
      const file = fileInputs[id];
      if (!file) {
        throw new Error("Veuillez joindre le certificat (fichier)");
      }

      const upload = await uploadToIPFS(file, {
        type: "certificat-expedition",
        idExpedition: String(id),
      });
      if (!upload?.success || !upload?.cid) {
        throw new Error(upload?.error || "Echec d'upload IPFS");
      }
      const cid = upload.cid;
      const cidBytes32 = ethers.keccak256(ethers.toUtf8Bytes(cid));
      const contract = await getExportateurClientContract();
      const tx = await contract.certifierExpedition(id, cidBytes32);
      await tx.wait();
      setMessage(`Expédition #${id} certifiée avec succès`);
      await loadExpeditions();
    } catch (e) {
      setMessage("Erreur lors de la certification: " + (e?.message || e));
    }
    setLoading(false);
  };

  const filtered = expeditions.filter(e => (onlyPending ? !e.certifier : true));

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2>Certification des expéditions</h2>
        <div className="form-check">
          <input
            id="onlyPending"
            type="checkbox"
            className="form-check-input"
            checked={onlyPending}
            onChange={e => setOnlyPending(e.target.checked)}
          />
          <label htmlFor="onlyPending" className="form-check-label ms-2">
            Afficher uniquement en attente
          </label>
        </div>
      </div>
      {message && <div className="alert alert-info">{message}</div>}
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Référence</th>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Prix</th>
                <th>Certifiée</th>
                <th>Pièce jointe (certificat)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.ref || "-"}</td>
                  <td>{e.nomProduit || "-"}</td>
                  <td>{e.quantite}</td>
                  <td>{e.prix}</td>
                  <td>{e.certifier ? "Oui" : "Non"}</td>
                  <td style={{minWidth: 260}}>
                    {!e.certifier ? (
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        onChange={ev => {
                          const f = ev.target.files && ev.target.files[0];
                          setFileInputs(prev => ({ ...prev, [e.id]: f }));
                        }}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {!e.certifier ? (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleCertifier(e.id)}
                        disabled={loading}
                      >
                        Certifier
                      </button>
                    ) : (
                      <span className="text-muted">Déjà certifiée</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">Aucune expédition</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


