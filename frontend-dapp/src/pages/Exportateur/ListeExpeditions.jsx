import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getExportateurClientContract } from "../../utils/contract";
import { getIPFSURL } from "../../utils/ipfsUtils";

export default function ListeExpeditions() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expeditions, setExpeditions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setMessage("");
      try {
        const contract = await getExportateurClientContract();
        const count = Number(await contract.compteurExpeditions());
        const items = [];
        for (let i = 1; i <= count; i++) {
          try {
            const exp = await contract.getExpedition(i);
            if (exp && exp.id && Number(exp.id) > 0) {
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
              // Essayer de charger IPFS pour nom/infos supplémentaires
              if (e.cid) {
                try {
                  const res = await fetch(getIPFSURL(e.cid));
                  if (res.ok) {
                    const data = await res.json();
                    const root = data && data.items ? data.items : data;
                    e.ipfs = root;
                    e.nomProduit = root.nomProduit || root.nom || "";
                    e.dateExpedition = root.dateExpedition || root.date || "";
                  }
                } catch {}
              }
              items.push(e);
            }
          } catch (err) {
            // ignorer une entrée invalide
          }
        }
        setExpeditions(items);
      } catch (e) {
        setMessage("Erreur chargement expéditions: " + (e?.message || e));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2>Expéditions</h2>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expeditions.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.ref || "-"}</td>
                  <td>{e.nomProduit || "-"}</td>
                  <td>{e.quantite}</td>
                  <td>{e.prix}</td>
                  <td>{e.certifier ? "Oui" : "Non"}</td>
                  <td>
                    <Link className="btn btn-sm btn-outline-primary" to={`/expeditions/${e.id}`}>
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
              {expeditions.length === 0 && (
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


