import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../../utils/contract";
import { getRoleName } from "../../components/Layout/Header";
import { getIPFSURL } from "../../utils/ipfsUtils";

function AcheterRecolte() {
  const { address } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [recolte, setRecolte] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recolteDetails, setRecolteDetails] = useState(null);

  useEffect(() => {
    const chargerRecolte = async () => {
      try {
        const contract = await getContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        // Récupérer l'acteur connecté
        const _acteur = await contract.acteurs(account);

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

        // Charger les données IPFS consolidées si la récolte a un CID
        let recolteEnrichie = {
          id: recolteId,
          idParcelle: recolteData.idParcelle.toString(),
          quantite: recolteData.quantite.toString(),
          prix: recolteData.prix.toString(),
          dateRecolte: recolteData.dateRecolte,
          nomProduit: recolteData.nomProduit,
          certifie: recolteData.certifie,
          producteur: recolteData.producteur,
          cid: recolteData.cid,
          hashMerkle: recolteData.hashMerkle
        };

        if (recolteData.cid) {
          try {
            const response = await fetch(getIPFSURL(recolteData.cid));
            if (response.ok) {
              const ipfsData = await response.json();
              
              // Fusionner avec les données IPFS
              recolteEnrichie = {
                ...recolteEnrichie,
                nomProduit: ipfsData.nomProduit || recolteData.nomProduit,
                dateRecolte: ipfsData.dateRecolte || recolteData.dateRecolte,
                ipfsTimestamp: ipfsData.timestamp,
                ipfsVersion: ipfsData.version,
                parcelleHashMerkle: ipfsData.parcelleHashMerkle || ""
              };
            }
          } catch (ipfsError) {
            console.log("Erreur lors du chargement IPFS:", ipfsError);
          }
        }

        setRecolte(recolteEnrichie);

        // Charger les détails de la parcelle associée si possible
        try {
          const parcelleData = await contract.getParcelle(recolteData.idParcelle);
          setRecolteDetails({
            parcelle: parcelleData,
            // Essayer de charger les données IPFS de la parcelle
            parcelleIPFS: null
          });

          if (parcelleData.cid) {
            try {
              const parcelleResponse = await fetch(getIPFSURL(parcelleData.cid));
              if (parcelleResponse.ok) {
                const parcelleIPFSData = await parcelleResponse.json();
                setRecolteDetails(prev => ({
                  ...prev,
                  parcelleIPFS: parcelleIPFSData
                }));
              }
            } catch (error) {
              console.log("Erreur lors du chargement IPFS de la parcelle:", error);
            }
          }
        } catch (error) {
          console.log("Impossible de charger les détails de la parcelle:", error);
        }

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
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">{recolte.nomProduit}</h5>
              <div>
                {recolte.cid && recolte.hashMerkle ? (
                  <span className="badge bg-success me-1">
                    IPFS + Merkle
                  </span>
                ) : recolte.cid ? (
                  <span className="badge bg-warning me-1">
                    IPFS uniquement
                  </span>
                ) : (
                  <span className="badge bg-secondary me-1">
                    Données non consolidées
                  </span>
                )}
              </div>
            </div>

            <div className="card-text">
              <p><strong>ID Parcelle:</strong> {recolte.idParcelle}</p>
              <p><strong>Quantité:</strong> {recolte.quantite} kg</p>
              <p><strong>Prix:</strong> {recolte.prix} FCFA</p>
              <p><strong>Date de récolte:</strong> {recolte.dateRecolte}</p>
              
              {/* Informations IPFS et Merkle */}
              {recolte.cid && (
                <div className="mt-3 p-2 bg-light rounded">
                  <p className="mb-1">
                    <strong>CID IPFS:</strong> 
                    <a
                      href={getIPFSURL(recolte.cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ms-2 text-decoration-none text-primary"
                      title="Voir les données consolidées sur IPFS"
                    >
                      {recolte.cid.substring(0, 10)}...
                    </a>
                  </p>
                  
                  {recolte.hashMerkle && (
                    <p className="mb-1">
                      <strong>Hash Merkle:</strong> 
                      <span className="ms-2 text-muted" title={recolte.hashMerkle}>
                        {recolte.hashMerkle.substring(0, 10)}...
                      </span>
                    </p>
                  )}

                  {recolte.ipfsTimestamp && (
                    <p className="mb-1 text-muted small">
                      <strong>Dernière mise à jour IPFS:</strong> {new Date(recolte.ipfsTimestamp).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Détails de la parcelle associée */}
              {recolteDetails && recolteDetails.parcelle && (
                <div className="mt-3 p-2 bg-light rounded">
                  <h6>Parcelle associée #{recolteDetails.parcelle.id}</h6>
                  <p className="mb-1">
                    <strong>Producteur:</strong> {recolteDetails.parcelle.producteur}
                  </p>
                  
                  {recolteDetails.parcelle.cid && (
                    <p className="mb-1">
                      <strong>CID IPFS Parcelle:</strong> 
                      <a
                        href={getIPFSURL(recolteDetails.parcelle.cid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ms-2 text-decoration-none text-primary"
                      >
                        {recolteDetails.parcelle.cid.substring(0, 10)}...
                      </a>
                    </p>
                  )}

                  {recolteDetails.parcelle.hashMerkle && (
                    <p className="mb-1">
                      <strong>Hash Merkle Parcelle:</strong> 
                      <span className="ms-2 text-muted" title={recolteDetails.parcelle.hashMerkle}>
                        {recolteDetails.parcelle.hashMerkle.substring(0, 10)}...
                      </span>
                    </p>
                  )}

                  {/* Données IPFS de la parcelle si disponibles */}
                  {recolteDetails.parcelleIPFS && (
                    <div className="mt-2">
                      <p className="mb-1">
                        <strong>Qualité des semences:</strong> {recolteDetails.parcelleIPFS.qualiteSemence || "Non spécifiée"}
                      </p>
                      <p className="mb-1">
                        <strong>Méthode de culture:</strong> {recolteDetails.parcelleIPFS.methodeCulture || "Non spécifiée"}
                      </p>
                      <p className="mb-1">
                        <strong>Photos:</strong> {recolteDetails.parcelleIPFS.photos?.length || 0}
                      </p>
                      <p className="mb-1">
                        <strong>Intrants:</strong> {recolteDetails.parcelleIPFS.intrants?.length || 0}
                      </p>
                      <p className="mb-1">
                        <strong>Inspections:</strong> {recolteDetails.parcelleIPFS.inspections?.length || 0}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="alert alert-info mt-3">
                <strong>Traçabilité:</strong> Cette récolte est liée à une parcelle avec un historique complet sur IPFS, garantissant la transparence et la qualité du produit.
              </div>

              <p className="text-warning mt-3">
                <strong>Total à payer:</strong> {Number(recolte.quantite) * Number(recolte.prix)} FCFA
              </p>
            </div>

            <div className="mt-3 d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={handleAcheter}
                disabled={loading}
              >
                {loading ? "Transaction en cours..." : "Confirmer l'achat"}
              </button>

              {/* Lien vers les données IPFS complètes */}
              {recolte.cid && (
                <a
                  href={getIPFSURL(recolte.cid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-secondary"
                >
                  Voir données IPFS
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AcheterRecolte; 