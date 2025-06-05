import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../../utils/contract";
import { getRoleName } from "../../components/Layout/Header";

function AcheterRecolte() {
  const { address } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [recolte, setRecolte] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acteur, setActeur] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const chargerRecolte = async () => {
      try {
        const contract = await getContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        // Récupérer l'acteur connecté
        const _acteur = await contract.acteurs(account);
        setActeur(_acteur);

        // Vérifier que l'utilisateur est un collecteur
        if (getRoleName(_acteur.role) !== "COLLECTEUR") {
          setError("Seuls les collecteurs peuvent acheter des récoltes");
          setIsLoading(false);
          return;
        }

        // Obtenir l'ID de la récolte depuis l'URL
        const recolteId = searchParams.get('recolteId');
        if (!recolteId) {
          setError("ID de récolte non spécifié");
          setIsLoading(false);
          return;
        }

        // Obtenir l'adresse du contrat de récolte
        const recolteAddress = await contract.recolte();
        
        // Créer une instance du contrat de récolte
        const recolteContract = new ethers.Contract(
          recolteAddress,
          contract.interface,
          signer
        );

        // Récupérer les détails de la récolte
        const recolteData = await recolteContract.getRecolte(recolteId);
        
        // Vérifier que la récolte appartient bien au producteur
        if (recolteData.producteur.toString().toLowerCase() !== address.toLowerCase()) {
          setError("Cette récolte n'appartient pas au producteur spécifié");
          setIsLoading(false);
          return;
        }

        // Vérifier que la récolte n'est pas déjà certifiée
        if (recolteData.certifie) {
          setError("Cette récolte est déjà certifiée et ne peut plus être achetée");
          setIsLoading(false);
          return;
        }

        setRecolte({
          id: recolteId,
          idParcelle: recolteData.idParcelle.toString(),
          quantite: recolteData.quantite.toString(),
          prix: recolteData.prix.toString(),
          dateRecolte: recolteData.dateRecolte,
          nomProduit: recolteData.nomProduit,
          certifie: recolteData.certifie
        });
      } catch (error) {
        console.error("Erreur lors du chargement de la récolte:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerRecolte();
  }, [address, searchParams]);

  const handleAcheter = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      
      // Obtenir l'adresse du contrat de récolte
      const recolteAddress = await contract.recolte();
      
      // Créer une instance du contrat de récolte
      const recolteContract = new ethers.Contract(
        recolteAddress,
        contract.interface,
        contract.signer
      );

      // Appeler la fonction d'achat
      const tx = await recolteContract.acheterRecolte(recolte.id);
      await tx.wait();

      alert("Récolte achetée avec succès!");
      navigate(`/producteur/${address}/recoltes`);
    } catch (error) {
      console.error("Erreur lors de l'achat de la récolte:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h5 mb-0">Acheter une Récolte</h2>
          <div className="text-muted small">
            Producteur: {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </div>
        </div>

        {recolte && (
          <div className="card border shadow-sm p-3">
            <h5 className="card-title">{recolte.nomProduit}</h5>
            <div className="card-text">
              <p><strong>ID Parcelle:</strong> {recolte.idParcelle}</p>
              <p><strong>Quantité:</strong> {recolte.quantite} kg</p>
              <p><strong>Prix:</strong> {recolte.prix} FCFA</p>
              <p><strong>Date de récolte:</strong> {recolte.dateRecolte}</p>
              <p className="text-warning">
                <strong>Total à payer:</strong> {Number(recolte.quantite) * Number(recolte.prix)} FCFA
              </p>
            </div>
            <div className="mt-3">
              <button
                className="btn-agrichain"
                onClick={handleAcheter}
                disabled={loading}
              >
                {loading ? "Transaction en cours..." : "Confirmer l'achat"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AcheterRecolte; 