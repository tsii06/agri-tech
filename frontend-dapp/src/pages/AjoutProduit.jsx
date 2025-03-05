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

      const acteurInfo = await executeContractMethod(contract.getActeur, account);
      
      if (acteurInfo.role.toString() !== "0") {
        alert("Vous devez être un collecteur pour ajouter un produit");
        return;
      }

      const prixEnWei = ethers.parseEther(prixProduit);
      
      await executeContractMethod(
        contract.ajouterProduit,
        BigInt(idParcelle),
        BigInt(quantiteProduit),
        prixEnWei,
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
      console.error("Erreur:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Ajouter un nouveau produit</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom du produit
            </label>
            <input
              type="text"
              value={nomProduit}
              onChange={(e) => setNomProduit(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantité
            </label>
            <input
              type="number"
              value={quantiteProduit}
              onChange={(e) => setQuantiteProduit(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prix (ETH)
            </label>
            <input
              type="number"
              step="0.01"
              value={prixProduit}
              onChange={(e) => setPrixProduit(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ID Parcelle
            </label>
            <input
              type="number"
              value={idParcelle}
              onChange={(e) => setIdParcelle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={ajouterNouveauProduit}
            disabled={isLoading}
            className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
              isLoading 
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Transaction en cours..." : "Ajouter le produit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AjoutProduit; 