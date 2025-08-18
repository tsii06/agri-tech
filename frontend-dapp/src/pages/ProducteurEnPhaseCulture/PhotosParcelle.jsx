import React, { useState, useEffect } from "react";
import { uploadPhotoParcelle, getIPFSURL } from '../../utils/ipfsUtils';
import { getContract } from "../../utils/contract";
import { useParams } from "react-router-dom";
import { calculateParcelleMerkleHash } from "../../utils/merkleUtils";

function PhotosParcelle() {
  const { id } = useParams(); // id de la parcelle
  const [selectedFile, setSelectedFile] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [parcelle, setParcelle] = useState(null);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    chargerParcelle();
  }, [id]);

  const chargerParcelle = async () => {
    try {
      if (!id || isNaN(Number(id))) {
        throw new Error("Identifiant de parcelle invalide");
      }
      const contract = await getContract();
      const parcelleData = await contract.getParcelle(Number(id));
      setParcelle(parcelleData);
      
      // Si la parcelle a un CID, essayer de récupérer les photos
      if (parcelleData.cid) {
        try {
          const response = await fetch(getIPFSURL(parcelleData.cid));
          if (response.ok) {
            const data = await response.json();
            const root = data && data.items ? data.items : data;
            if (root && root.photos && Array.isArray(root.photos)) {
              setPhotos(root.photos);
            }
          }
        } catch (error) {
          console.log("Pas de photos existantes ou erreur de récupération IPFS");
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la parcelle:", error);
    }
  };

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
      // 1. Upload sur IPFS via uploadPhotoParcelle
      const res = await uploadPhotoParcelle(selectedFile, id);
      if (res && res.success) {
        const photoData = {
          cid: res.cid,
          timestamp: Date.now(),
          filename: selectedFile.name,
          size: selectedFile.size
        };

        // 2. Ajouter la nouvelle photo à la liste existante
        const nouvellesPhotos = [...photos, photoData];
        
        // 3. Charger l'état consolidé actuel de la parcelle (master), le mettre à jour avec les nouvelles photos
        let master = {};
        try {
          if (parcelle && parcelle.cid) {
            const resp = await fetch(getIPFSURL(parcelle.cid));
            if (resp.ok) {
              const json = await resp.json();
              master = json && json.items ? json.items : json;
            }
          }
        } catch {}

        // S'assurer qu'on a bien un objet master
        if (!master || typeof master !== 'object') {
          master = {};
        }
        const masterMisAJour = {
          ...master,
          type: 'parcelle',
          parcelleId: id,
          photos: nouvellesPhotos,
          timestamp: Date.now()
        };

        // 4. Upload du master consolidé mis à jour (type parcelle)
        const { uploadConsolidatedData } = await import("../../utils/ipfsUtils");
        const masterUpload = await uploadConsolidatedData(masterMisAJour, "parcelle");
        if (!masterUpload.success) {
          throw new Error("Erreur lors de l'upload des données de parcelle consolidées");
        }

        // 5. Mettre à jour le CID de la parcelle avec le nouveau master
        const contract = await getContract();
        const tx = await contract.mettreAJourPhotosParcelle(Number(id), masterUpload.cid);
        await tx.wait();

        // 6. Mettre à jour le hash Merkle de la parcelle
        const hashMerkleMisAJour = calculateParcelleMerkleHash(
          { ...parcelle, cid: masterUpload.cid },
          nouvellesPhotos,
          [], // intrants
          []  // inspections
        );

        const txHashMerkle = await contract.ajoutHashMerkleParcelle(Number(id), hashMerkleMisAJour);
        await txHashMerkle.wait();

        // 7. Mettre à jour l'état local
        setPhotos(nouvellesPhotos);
        setParcelle(prev => ({ ...prev, cid: masterUpload.cid, hashMerkle: hashMerkleMisAJour }));
        
        setIpfsUrl(getIPFSURL(res.cid));
        setMessage("Photo ajoutée et enregistrée sur la blockchain avec succès !");
        setSelectedFile(null);
      } else {
        setMessage("Erreur lors de l'upload sur IPFS.");
      }
    } catch (e) {
      setMessage("Erreur lors de l'ajout de la photo : " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const afficherPhoto = (photo) => {
    return (
      <div key={photo.cid} className="col-md-4 mb-3">
        <div className="card">
          <img 
            src={getIPFSURL(photo.cid)} 
            className="card-img-top" 
            alt="Photo parcelle"
            style={{ height: "200px", objectFit: "cover" }}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/300x200?text=Photo+non+disponible";
            }}
          />
          <div className="card-body">
            <p className="card-text">
              <small className="text-muted">
                Ajoutée le {new Date(photo.timestamp).toLocaleDateString()}
              </small>
            </p>
            <a 
              href={getIPFSURL(photo.cid)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary"
            >
              Voir en grand
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <h2>Gestion des photos de la parcelle #{id}</h2>
      
      {/* Section d'ajout de photo */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Ajouter une nouvelle photo</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={handleFileChange}
              />
            </div>
            <div className="col-md-4">
              <button 
                className="btn btn-success w-100" 
                onClick={handleUpload} 
                disabled={!selectedFile || loading}
              >
                {loading ? "Envoi..." : "Uploader et enregistrer"}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`alert mt-3 ${message.includes('succès') ? 'alert-success' : 'alert-info'}`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Affichage des photos existantes */}
      {photos.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h5>Photos de la parcelle ({photos.length})</h5>
          </div>
          <div className="card-body">
            <div className="row">
              {photos.map(afficherPhoto)}
            </div>
          </div>
        </div>
      )}

      {/* Affichage de la photo nouvellement uploadée */}
      {ipfsUrl && (
        <div className="card mt-3">
          <div className="card-header">
            <h5>Dernière photo ajoutée</h5>
          </div>
          <div className="card-body">
            <img 
              src={ipfsUrl} 
              alt="Photo récemment ajoutée" 
              className="img-fluid"
              style={{ maxHeight: "400px" }}
            />
            <div className="mt-2">
              <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                Voir sur IPFS
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Informations de la parcelle */}
      {parcelle && (
        <div className="card mt-3">
          <div className="card-header">
            <h5>Informations de la parcelle</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>ID:</strong> {parcelle.id}</p>
                <p><strong>Producteur:</strong> {parcelle.producteur}</p>
                <p><strong>CID IPFS:</strong> {parcelle.cid || "Aucun"}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Hash Merkle:</strong> {parcelle.hashMerkle || "Non calculé"}</p>
                <p><strong>Nombre de photos:</strong> {photos.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotosParcelle; 