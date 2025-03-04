import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "./utils/contract";

const Role = {
  // PRODUCTEUR: 0,
  COLLECTEUR: 0,
  EXPORTATEUR: 1
};

function App() {
  const [account, setAccount] = useState(null);
  const [role, setRole] = useState(null);
  const [nomProduit, setNomProduit] = useState("Café Arabica");
  const [quantiteProduit, setQuantiteProduit] = useState("100");
  const [prixProduit, setPrixProduit] = useState("0.01");
  const [idParcelle, setIdParcelle] = useState("1");
  const [dateRecolte, setDateRecolte] = useState(Math.floor(Date.now() / 1000));
  const [certificat, setCertificat] = useState("CERT123");
  const [roleChoisi, setRoleChoisi] = useState("0");

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAccount(userAddress);
      await verifierActeur(userAddress);
    } else {
      alert("Installe Metamask !");
    }
  };

  const verifierActeur = async (userAddress) => {
    try {
      const contract = await getContract();
      const acteur = await contract.getActeur(userAddress);
      
      console.log("Réponse getActeur:", acteur);
      console.log("Type de role:", typeof acteur.role);
      console.log("Valeur de role:", acteur.role);
      
      if (acteur.addr !== ethers.ZeroAddress) {
        const roleNumber = Number(acteur.role);
        setRole(roleNumber);
        console.log("Role défini:", roleNumber);
        console.log("Role.COLLECTEUR:", Role.COLLECTEUR);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'acteur :", error);
    }
  };

  const getContractWithSigner = async () => {
    try {
      const contract = await getContract();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      
      console.log({
        contractAddress: contract.target,
        signerAddress: signerAddress,
        currentAccount: account,
        currentRole: role
      });

      // Vérifier le rôle directement depuis le contrat
      const acteurInfo = await contract.getActeur(signerAddress);
      console.log("Acteur info from contract:", {
        address: acteurInfo.addr,
        role: acteurInfo.role.toString()
      });

      return contract;
    } catch (error) {
      console.error("Erreur dans getContractWithSigner:", error);
      throw error;
    }
  };

  const ajouterNouveauProduit = async () => {
    try {
      if (!account) {
        alert("Veuillez d'abord connecter votre wallet");
        return;
      }

      const contract = await getContractWithSigner();
      
      // Vérifier à nouveau le rôle juste avant la transaction
      const acteurInfo = await contract.getActeur(account);
      console.log("Vérification finale du rôle:", {
        address: account,
        role: acteurInfo.role.toString(),
        roleType: typeof acteurInfo.role,
        isCollecteur: acteurInfo.role.toString() === "1"
      });

      if (acteurInfo.role.toString() !== "0") {
        alert("Vous devez être un collecteur pour ajouter un produit");
        return;
      }

      const prixEnWei = ethers.parseEther(prixProduit);
      
      // Préparer les paramètres
      const params = {
        nomProduit,
        quantiteProduit: BigInt(quantiteProduit),
        prixEnWei,
        idParcelle: BigInt(idParcelle),
        dateRecolte: BigInt(dateRecolte),
        certificat
      };

      console.log("Tentative d'ajout de produit avec paramètres:", params);

      // Envoyer la transaction avec des options spécifiques
      const tx = await contract.ajouterProduit(
        params.idParcelle,
        params.quantiteProduit,
        params.prixEnWei,
        {
          gasLimit: 500000, // Augmenter la limite de gas
          from: account // Spécifier explicitement l'adresse
        }
      );

      console.log("Transaction envoyée:", tx);
      const receipt = await tx.wait();
      console.log("Transaction confirmée:", receipt);

      alert("Produit ajouté avec succès !");

      // Réinitialiser les champs
      setNomProduit("Café Arabica");
      setQuantiteProduit("100");
      setPrixProduit("0.01");
      setIdParcelle("1");
      setDateRecolte(Math.floor(Date.now() / 1000));
      setCertificat("CERT123");

    } catch (error) {
      console.error("Erreur complète:", error);
      
      // Afficher plus de détails sur l'erreur
      if (error.data) {
        console.log("Error data:", error.data);
      }
      if (error.transaction) {
        console.log("Transaction failed:", error.transaction);
      }
      
      alert(`Erreur: ${error.message}`);
    }
  };

  const getRoleName = (roleNumber) => {
    const roles = {
      0: "COLLECTEUR",
      1: "EXPORTATEUR"
    };
    return roles[roleNumber] || "INCONNU";
  };

  const enregistrerActeur = async () => {
    try {
      if (!account) {
        alert("Veuillez d'abord connecter votre wallet");
        return;
      }

      const contract = await getContractWithSigner();
      
      // Afficher les fonctions disponibles dans le contrat
      console.log("Fonctions disponibles:", {
        functions: contract.interface.fragments.map(f => f.name)
      });

      // Essayons avec l'adresse et le rôle
      const tx = await contract.enregistrerActeur(
        account,  // adresse de l'acteur
        Number(roleChoisi)  // rôle en nombre
      );

      console.log("Transaction envoyée:", tx);
      const receipt = await tx.wait();
      console.log("Transaction confirmée:", receipt);

      alert("Acteur enregistré avec succès !");
      await verifierActeur(account);
      
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      // Afficher plus d'informations sur le contrat
      console.log("Contract info:", {
        address: contract.target,
        functions: contract.interface.fragments.map(f => ({
          name: f.name,
          inputs: f.inputs
        }))
      });
      alert("Erreur lors de l'enregistrement: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">DApp Collecteur Exportateur</h1>
            <div className="flex items-center space-x-4">
              {account ? (
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {getRoleName(role)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${role !== null ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connecter Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Enregistrement Acteur */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!role && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Enregistrement Acteur</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Choisir un rôle
                </label>
                <select
                  value={roleChoisi}
                  onChange={(e) => setRoleChoisi(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="0">COLLECTEUR</option>
                  <option value="1">EXPORTATEUR</option>
                </select>
              </div>
              <button
                onClick={enregistrerActeur}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                disabled={!account}
              >
                {!account 
                  ? "Connectez-vous d'abord" 
                  : "S'enregistrer comme " + getRoleName(Number(roleChoisi))}
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
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
                placeholder="Café Arabica"
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
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prix (ETH)
              </label>
              <input
                type="number"
                value={prixProduit}
                onChange={(e) => setPrixProduit(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.01"
                step="0.001"
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
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Certificat Phytosanitaire
              </label>
              <input
                type="text"
                value={certificat}
                onChange={(e) => setCertificat(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="CERT123"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={ajouterNouveauProduit}
                className={`flex-1 px-4 py-2 text-white rounded transition-colors ${
                  Number(role) === Role.COLLECTEUR 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={!account || Number(role) !== Role.COLLECTEUR}
              >
                {!account 
                  ? "Connectez-vous d'abord" 
                  : Number(role) !== Role.COLLECTEUR
                    ? `Réservé aux collecteurs (votre rôle: ${role})` 
                    : "Ajouter le produit"}
              </button>

              {account && role !== Role.COLLECTEUR && (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md">
                  <p className="text-sm">Votre rôle actuel : <span className="font-semibold">{getRoleName(role)}</span></p>
                  <p className="text-xs mt-1">Cette fonction nécessite le rôle COLLECTEUR</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
