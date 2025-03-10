import { useState } from "react";
import { ethers } from "ethers";
import { getContract, executeContractMethod } from "../utils/contract";

function AjoutProduit() {
  const [nomProduit, setNomProduit] = useState("Café Arabica");
  const [quantiteProduit, setQuantiteProduit] = useState("100");
  const [prixProduit, setPrixProduit] = useState("0.01");
  const [idParcelle, setIdParcelle] = useState("1");
  const [dateRecolte, setDateRecolte] = useState(Math.floor(Date.now() / 1000));
  const [certificat, setCertificat] = useState("CERT123");
  const [isLoading, setIsLoading] = useState(false);

  const ajouterNouveauProduit = async () => {
    try {
      setIsLoading(true);
      const contract = await getContract();
      const provider = contract.runner.provider;
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      const acteurInfo = await executeContractMethod(contract.acteurs, account);
      
      if (acteurInfo.role.toString() !== "0") {
        alert("Vous devez être un collecteur pour ajouter un produit");
        return;
      }

      const prixEnWei = ethers.parseEther(prixProduit);
      
      await executeContractMethod(
        contract.ajouterProduit,
        BigInt(idParcelle),
        BigInt(quantiteProduit),
        prixProduit,
        {
          gasLimit: 500000,
          from: account
        }
      );

      alert("Produit ajouté avec succès !");

      // Réinitialiser les champs
      setNomProduit("Café Arabica");
      setQuantiteProduit("100");
      setPrixProduit("0.01");
      setIdParcelle("1");
      setDateRecolte(Math.floor(Date.now() / 1000));
      setCertificat("CERT123");

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
          <label className="form-label">Nom du produit</label>
          <input
            type="text"
            value={nomProduit}
            onChange={(e) => setNomProduit(e.target.value)}
            className="form-control"
          />
        </div>
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