import React, { useState } from "react";
import { uploadPhoto } from '../../utils/pinata';
import { getContract } from "../../utils/contract";
import { useParams } from "react-router-dom";

function PhotosParcelle() {
  const { id } = useParams(); // id de la parcelle
  const [selectedFile, setSelectedFile] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage("");
    setIpfsUrl("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setMessage("");
    try {
      // 1. Upload sur IPFS via uploadPhoto
      const res = await uploadPhoto(selectedFile, id);
      if (res && (res.IpfsHash || res.cid)) {
        const hash = res.IpfsHash || res.cid;
        const url = `https://gateway.pinata.cloud/ipfs/${hash}`;
        setIpfsUrl(url);

        // 2. Appel du smart contract pour enregistrer la photo
        const contract = await getContract();
        const tx = await contract.ajouterPhoto(id, url);
        await tx.wait();

        setMessage("Photo ajoutée et enregistrée sur la blockchain !");
      } else {
        setMessage("Erreur lors de l'upload sur IPFS.");
      }
    } catch (e) {
      setMessage("Erreur lors de l'ajout de la photo : " + (e?.message || e));
    }
    setLoading(false);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        className="form-control"
        onChange={handleFileChange}
      />
      <button className="btn btn-success mt-2" onClick={handleUpload} disabled={!selectedFile || loading}>
        {loading ? "Envoi..." : "Uploader et enregistrer"}
      </button>
      {ipfsUrl && (
        <div className="mt-3">
          <p>Image uploadée sur IPFS :</p>
          <a href={ipfsUrl} target="_blank" rel="noopener noreferrer">{ipfsUrl}</a>
          <img src={ipfsUrl} alt="Aperçu" style={{ maxWidth: 200, display: "block", marginTop: 8 }} />
        </div>
      )}
      {message && <div className="alert alert-info mt-2">{message}</div>}
    </div>
  );
}

export default PhotosParcelle; 