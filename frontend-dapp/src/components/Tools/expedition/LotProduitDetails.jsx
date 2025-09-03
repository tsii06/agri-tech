import { Package } from "lucide-react";

const LotProduitDetails = ({ lotProduit }) => {
  return (
    <div
      className="card shadow-sm p-4 bg-light"
      style={{ width: "100%", margin: "0 auto" }}
    >
      <h6 className="card-title text-start mb-2">
        <span className="text-success"><Package size={18} /> Produit collecté #{lotProduit.id}</span>
      </h6>
      <div className="row small">
        <div className="col-md-6 mb-3">
          <label className="text-muted">Nom du produit</label>
          <p className="card-text fw-bold">
            {lotProduit.nom || "N/A"}
          </p>
        </div>
        <div className="col-md-6 mb-3 text-end">
          <label className="text-muted">Quantité</label>
          <p className="card-text fw-bold">
            {lotProduit.quantite ? `${lotProduit.quantite} kg` : "N/A"}
          </p>
        </div>
        <div className="col-md-6 mb-3">
          <label className="text-muted">Collecteur</label>
          <p className="card-text fw-bold">
            {lotProduit.collecteur.nom || "N/A"} <br />
            <span className="text-muted small">
              {lotProduit.collecteur.adresseOfficielle || "N/A"}
            </span>
          </p>
        </div>
        {/* <div className="col-md-6 mb-3 text-end">
          <img
            src={lotProduit.imageUrl || "https://via.placeholder.com/100"}
            alt="Produit"
            style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
          />
        </div> */}
      </div>
    </div>
  );
};

export default LotProduitDetails;