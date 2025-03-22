import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, executeContractMethod, getCollecteurContract } from "../utils/contract";

function AjoutProduit() {
  const navigate = useNavigate();
  const [quantiteProduit, setQuantiteProduit] = useState("100");
  const [prixProduit, setPrixProduit] = useState("0.01");
  const [idParcelle, setIdParcelle] = useState("1");
  const [dateRecolte, setDateRecolte] = useState(Math.floor(Date.now() / 1000));
  const [certificat, setCertificat] = useState("CERT123");
  const [isLoading, setIsLoading] = useState(false);

  const ajouterNouveauProduit = async () => {
    try {
      setIsLoading(true);
      const contractCE = await getCollecteurContract();
      const provider = contractCE.runner.provider;
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      const acteurInfo = await executeContractMethod(contractCE, contractCE.getActeur, account);
      
      if (acteurInfo.role.toString() !== "3") {
        alert("Vous devez être un collecteur pour ajouter un produit");
        return;
      }

      const prixEnWei = ethers.parseEther(prixProduit);
      
      const tx = await executeContractMethod(
        contractCE,
        contractCE.ajouterProduit,
        BigInt(idParcelle),
        BigInt(quantiteProduit),
        prixEnWei,
        {
          gasLimit: 500000,
          from: account
        }
      );
      await tx.wait();

      alert("Produit ajouté avec succès !");

      navigate("/liste-produits");

    } catch (error) {
      console.error("Erreur ajout produit:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
 <div className="container py-4">
      <div className="card shadow-sm p-4">
        <h2 className="h5 mb-3">Ajouter un nouveau produit</h2>
        <div className="mb-3">
          <label className="form-label">Quantité</label>
          <input
            type="number"
            value={quantiteProduit}
            onChange={(e) => setQuantiteProduit(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Prix (ETH)</label>
          <input
            type="number"
            step="0.01"
            value={prixProduit}
            onChange={(e) => setPrixProduit(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">ID Parcelle</label>
          <input
            type="number"
            value={idParcelle}
            onChange={(e) => setIdParcelle(e.target.value)}
            className="form-control"
          />
        </div>
        <button
          onClick={ajouterNouveauProduit}
          disabled={isLoading}
          className={`btn w-100 ${isLoading ? "btn-secondary disabled" : "btn-primary"}`}
        >
          {isLoading ? "Transaction en cours..." : "Ajouter le produit"}
        </button>
      </div>
    </div>
  );
}

export default AjoutProduit; 