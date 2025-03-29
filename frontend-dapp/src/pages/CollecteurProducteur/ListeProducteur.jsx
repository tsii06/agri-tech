import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../../utils/contract";
import { getRoleName } from "../../components/Layout/Header";

function ListeProducteurs() {
  const [producteurs, setProducteurs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acteur, setActeur] = useState({});
  const [_, setState] = useState({});

  useEffect(() => {
    const chargerProducteurs = async () => {
      try {
        const contract = await getContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        console.log("Adresse connectée:", account);

        // Récupérer l'acteur connecté
        const _acteur = await contract.acteurs(account);
        setActeur(_acteur);

        // Obtenir l'adresse du contrat de récolte
        const recolteAddress = await contract.recolte();
        
        // Créer une instance du contrat de récolte
        const recolteContract = new ethers.Contract(
          recolteAddress,
          contract.interface,
          signer
        );

        // Obtenir le nombre total de récoltes
        const compteurRecoltes = await recolteContract.getCompteurRecolte();
        console.log("Nombre total de récoltes:", compteurRecoltes.toString());
        
        // Charger toutes les récoltes pour trouver les producteurs uniques
        const producteursTemp = new Set();
        for (let i = 1; i <= compteurRecoltes; i++) {
          const recolte = await recolteContract.getRecolte(i);
          const producteurAddress = recolte.producteur.toString();
          
          // Vérifier si l'adresse est un producteur
          const acteurInfo = await contract.acteurs(producteurAddress);
          if (Number(acteurInfo.role) === 0) {
            producteursTemp.add(producteurAddress);
          }
        }
        
        // Convertir le Set en tableau d'objets
        const producteursArray = Array.from(producteursTemp).map((address, index) => ({
          id: index + 1,
          address: address,
          role: 0 // On sait que c'est un producteur
        }));
        
        console.log("Producteurs trouvés:", producteursArray);
        setProducteurs(producteursArray);
      } catch (error) {
        console.error("Erreur lors du chargement des producteurs:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerProducteurs();
  }, [_]);

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des producteurs: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 mb-0">Liste des Producteurs</h2>
        </div>

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : producteurs.length === 0 ? (
          <div className="text-center text-muted">
            Aucun producteur n'est enregistré pour le moment.
          </div>
        ) : (
          <div className="row g-3">
            {producteurs.map((producteur) => (
              <div key={producteur.id} className="col-md-4">
                <div className="card border shadow-sm p-3">
                  <h5 className="card-title">Producteur #{producteur.id}</h5>
                  <div className="card-text small">
                    <p><strong>Adresse:</strong> {formatAddress(producteur.address)}</p>
                    <p><strong>Rôle:</strong> {getRoleName(producteur.role)}</p>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    <Link
                      to={`/producteur/${producteur.address}/recoltes`}
                      className="btn btn-sm btn-primary"
                    >
                      Voir les récoltes
                    </Link>
                    {getRoleName(acteur.role) === "COLLECTEUR" && (
                      <Link
                        to={`/producteur/${producteur.address}/recoltes/acheter`}
                        className="btn btn-sm btn-success"
                      >
                        Acheter une récolte
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ListeProducteurs; 