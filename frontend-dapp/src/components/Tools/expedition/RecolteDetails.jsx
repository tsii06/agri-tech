import { Sprout, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getIPFSURL, getUrlDownloadFilePinata } from "../../../utils/ipfsUtils";

const RecolteDetails = ({ recolte }) => {
  const [pdfDownload, setPdfDownload] = useState("");

  const chargerPdfDownload = async () => {
    const url = await getUrlDownloadFilePinata(recolte.certificatPhytosanitaire);
    setPdfDownload(url);
  };

  useEffect(() => {
    chargerPdfDownload();
  }, []);
  
  return (
    <div
      className="card shadow-sm p-4 bg-light border-bottom border-4"
      style={{ width: "100%", margin: "0 auto" }}
    >
      <h6 className="card-title text-start mb-2">
        <span className="text-success">
          <Sprout size={18} /> Récolte #{recolte.id}
        </span>
      </h6>
      <div className="row small">
        <div className="col-md-6 mb-3">
          <label className="text-muted">Date de récolte</label>
          <p className="card-text fw-bold">
            {recolte.dateRecolte || "N/A"}
            {recolte.certifie && (
              <span className="badge bg-success ms-2">Certifié</span>
            )}
          </p>
        </div>
        <div className="col-md-6 mb-3">
          <label className="text-muted mb-2"><User size={18} /> Producteur</label>
          <p className="card-text fw-bold">
            {recolte.producteur.nom || "N/A"} <br />
            <span className="text-muted small">
              {recolte.producteur.localisation || "N/A"}
            </span>
          </p>
        </div>
        <hr />
        <div className="col-md-12 d-flex justify-content-between">
          <label className="text-muted">Certificat phytosanitaire</label>
          <p>
            <a
              href={pdfDownload}
              target="_blank"
              rel="noreferrer"
              download={`recolte-certificat-${recolte.id}.pdf`}
              className="btn btn-outline-success btn-sm"
            >
              Télécharger PDF
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecolteDetails;
