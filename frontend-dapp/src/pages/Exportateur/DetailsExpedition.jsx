import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getExportateurClientContract } from "../../utils/contract";
import { getIPFSURL } from "../../utils/ipfsUtils";

export default function DetailsExpedition() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expedition, setExpedition] = useState(null);

  useEffect(() => {
    const fetchOne = async () => {
      setLoading(true);
      setMessage("");
      try {
        const contract = await getExportateurClientContract();
        const exp = await contract.getExpedition(Number(id));
        const e = {
          id: Number(exp.id),
          ref: exp.ref,
          idCommandeProduit: (exp.idCommandeProduit || []).map((x) => Number(x)),
          quantite: Number(exp.quantite),
          prix: Number(exp.prix),
          exportateur: exp.exportateur,
          cid: exp.cid,
          rootMerkle: exp.rootMerkle,
          certifier: Boolean(exp.certifier),
          cidCertificat: exp.cidCertificat
        };
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
              e.dateExpedition = root.dateExpedition || root.date || "";
              e.numeroTracking = root.numeroTracking || "";
              e.observations = root.observations || "";
            }
          } catch {}
        }
        setExpedition(e);
      } catch (e) {
        setMessage("Erreur chargement expédition: " + (e?.message || e));
      }
      setLoading(false);
    };
    fetchOne();
  }, [id]);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2>Détail expédition #{id}</h2>
        <Link to="/expeditions" className="btn btn-outline-secondary">Retour à la liste</Link>
      </div>
      {message && <div className="alert alert-info">{message}</div>}
      {loading && <div>Chargement...</div>}
      {expedition && (
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>Référence:</strong> {expedition.ref || "-"}</p>
                <p><strong>Produit:</strong> {expedition.nomProduit || "-"}</p>
                <p><strong>Quantité:</strong> {expedition.quantite}</p>
                <p><strong>Prix:</strong> {expedition.prix}</p>
                <p><strong>Certifiée:</strong> {expedition.certifier ? "Oui" : "Non"}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Destination:</strong> {expedition.destination || "-"}</p>
                <p><strong>Transporteur:</strong> {expedition.transporteur || "-"}</p>
                <p><strong>Date expédition:</strong> {expedition.dateExpedition || "-"}</p>
                <p><strong>Tracking:</strong> {expedition.numeroTracking || "-"}</p>
              </div>
            </div>

            <hr />
            <div className="mb-2"><strong>Commandes produits liées:</strong></div>
            <div>
              {(expedition.idCommandeProduit && expedition.idCommandeProduit.length > 0) ? (
                <ul>
                  {expedition.idCommandeProduit.map((cid) => (
                    <li key={cid}>Commande produit #{cid}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted">Aucune</span>
              )}
            </div>

            <hr />
            <div className="mb-2"><strong>IPFS:</strong></div>
            {expedition.cid ? (
              <a href={getIPFSURL(expedition.cid)} target="_blank" rel="noreferrer">
                {expedition.cid.substring(0, 16)}...
              </a>
            ) : (
              <span className="text-muted">Non disponible</span>
            )}

            {expedition.rootMerkle && (
              <div className="mt-2">
                <div className="mb-1"><strong>Root Merkle:</strong></div>
                <code>{expedition.rootMerkle}</code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


