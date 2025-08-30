import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCollecteurProducteurContract } from "../../utils/contract";
import { useUserContext } from '../../context/useContextt';
import { Search, ChevronDown } from "lucide-react";
import { hasRole } from '../../utils/roles';
import { uploadCertificatPhytosanitaire, getIPFSURL } from "../../utils/ipfsUtils";
import { calculateRecolteMerkleHash } from "../../utils/merkleUtils";

function ListeRecoltes() {
  const { address } = useParams();
  const navigate = useNavigate();
  const [recoltes, setRecoltes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantiteCommande, setQuantiteCommande] = useState("");
  const [recolteSelectionnee, setRecolteSelectionnee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);
  // Pour certification
  const [showModalCertification, setShowModalCertification] = useState(false);
  const [certificat, setCertificat] = useState(null);
  const [btnLoading, setBtnLoading] = useState(null);
  const dateEmission = useRef(null);
  const dateExpiration = useRef(null);
  const dateInspection = useRef(null);
  const autoriteCertificatrice = useRef(null);
  const numeroCertificat = useRef(null);
  const region = useRef(null);

  // Utilisation du tableau de rôles
  const { roles, account } = useUserContext();

  const chargerRecoltes = async () => {
    try {
      const contract = await getCollecteurProducteurContract();
      // let cible = address ? address.toLowerCase() : (account ? account.toLowerCase() : null);
      // Obtenir le nombre total de récoltes
      const compteurRecoltes = await contract.compteurRecoltes();
      const recoltesTemp = [];
      
      for (let i = 1; i <= compteurRecoltes; i++) {
        const recolteRaw = await contract.getRecolte(i);
        let recolte = {
          id: Number(recolteRaw.id ?? i),
          idParcelles: (recolteRaw.idParcelle || []).map((v) => Number(v)),
          quantite: Number(recolteRaw.quantite ?? 0),
          prixUnit: Number(recolteRaw.prixUnit ?? recolteRaw.prix ?? 0),
          certifie: Boolean(recolteRaw.certifie),
          certificatPhytosanitaire: recolteRaw.certificatPhytosanitaire || "",
          producteur: recolteRaw.producteur?.toString?.() || recolteRaw.producteur || "",
          cid: recolteRaw.cid || "",
          hashMerkle: recolteRaw.hashMerkle || "",
          nomProduit: recolteRaw.nomProduit || "",
          dateRecolte: recolteRaw.dateRecolte || ""
        };

        // Afficher uniquement les recoltes de l'adresse connectée si c'est un producteur et pas collecteur
        if (!roles.includes(3))
          if (roles.includes(0))
            if (recolte.producteur.toLowerCase() !== account.toLowerCase())
              continue;
        
        // Filtre les recoltes si 'address' est definie dans l'url
        if (address !== undefined)
          if (recolte.producteur.toLowerCase() !== address.toLowerCase())
            continue;
        
        // Charger les données IPFS consolidées si la récolte a un CID
        if (recolte.cid) {
          try {
            const response = await fetch(getIPFSURL(recolte.cid));
            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              if (contentType.includes('application/json')) {
                const ipfsData = await response.json();
                const root = ipfsData && ipfsData.items ? ipfsData.items : ipfsData;
                // Fusionner les données blockchain avec les données IPFS
                recolte = {
                  ...recolte,
                  nomProduit: root.nomProduit || recolte.nomProduit || "Produit non spécifié",
                  dateRecolte: root.dateRecolte || recolte.dateRecolte || "Date non spécifiée",
                  ipfsTimestamp: ipfsData.timestamp,
                  ipfsVersion: ipfsData.version,
                  parcelleHashMerkle: root.parcelleHashMerkle || ""
                };
              } else {
                // Si ce n'est pas du JSON (ex: PDF), on garde les données blockchain
                // sans lever d'erreur pour que l'affichage reste correct
              }
            }
          } catch (ipfsError) {
            console.debug(`IPFS non JSON ou non lisible pour la récolte ${i}:`, ipfsError?.message || ipfsError);
            // Garder les données blockchain de base si IPFS échoue
            recolte = {
              ...recolte,
              nomProduit: "Données IPFS non disponibles",
              dateRecolte: "Données IPFS non disponibles",
              ipfsTimestamp: null,
              ipfsVersion: null,
              parcelleHashMerkle: ""
            };
          }
        } else {
          // Récolte sans CID IPFS (ancienne structure)
          recolte = {
            ...recolte,
            nomProduit: "Données non consolidées",
            dateRecolte: "Données non consolidées",
            ipfsTimestamp: null,
            ipfsVersion: null,
            parcelleHashMerkle: ""
          };
        }

        recoltesTemp.push(recolte);
      }
      recoltesTemp.reverse();
      setRecoltes(recoltesTemp);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!(address && address.length > 0) && !account) {
      setIsLoading(false);
      return;
    }
    chargerRecoltes();
  }, [address, account]);

  const handleCertifier = async (event) => {
    event.preventDefault();
    setBtnLoading(true);

    try {
      // Créer les données du certificat
      const certificatData = {
        dateEmission: dateEmission.current.value,
        dateExpiration: dateExpiration.current.value,
        dateInspection: dateInspection.current.value,
        autoriteCertificatrice: autoriteCertificatrice.current.value,
        adresseCertificateur: account,
        adresseProducteur: recolteSelectionnee.producteur,
        produit: recolteSelectionnee.nomProduit,
        numeroCertificat: numeroCertificat.current.value,
        region: region.current.value,
        idRecolte: recolteSelectionnee.id,
        timestamp: Date.now()
      };

      // Upload du certificat sur IPFS
      const certificatUpload = await uploadCertificatPhytosanitaire(certificat, certificatData);
      
      if (!certificatUpload.success) {
        throw new Error("Erreur lors de l'upload du certificat sur IPFS");
      }

      // Certifier la récolte avec le CID du certificat
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.certifieRecolte(recolteSelectionnee.id, certificatUpload.cid);
      await tx.wait();

      chargerRecoltes();
      setShowModalCertification(false);
      alert("Récolte certifiée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la certification:", error);
      setError("Erreur lors de la certification de la récolte. Veuillez réessayer.");
      alert("Erreur lors de la certification de la récolte. Veuillez réessayer.");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCommander = async (recolteId) => {
    try {
      const contract = await getCollecteurProducteurContract();
      const recolte = recoltes.find(r => r.id === recolteId);

      // Vérifier que la quantité est valide
      const quantite = Number(quantiteCommande);
      if (isNaN(quantite) || quantite <= 0) {
        setError("Veuillez entrer une quantité valide");
        return;
      }

      if (quantite > Number(recolte.quantite)) {
        setError("La quantité demandée est supérieure à la quantité disponible");
        return;
      }

      // Passer la commande
      const tx = await contract.passerCommandeVersProducteur(
        recolteId,
        quantite
      );
      await tx.wait();

      // Rediriger vers la page des commandes
      navigate('/liste-collecteur-commande');
    } catch (error) {
      console.error("Erreur lors de la commande:", error);
      setError("Erreur lors de la commande. Veuillez réessayer.");
    }
  };

  // Filtrage recoltes selon recherche et statut
  const recoltesFiltres = recoltes.filter((recolte) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      (recolte.nomProduit && recolte.nomProduit.toLowerCase().includes(searchLower)) ||
      (recolte.id && recolte.id.toString().includes(searchLower));
    const matchStatut =
      statutFiltre === "all" ||
      (statutFiltre === "certifie" && recolte.certifie) ||
      (statutFiltre === "noncertifie" && !recolte.certifie);
    return matchSearch && matchStatut;
  });
  const recoltesAffichees = recoltesFiltres.slice(0, visibleCount);

  if (!account && !address) {
    return <div className="text-center text-muted">Veuillez connecter votre wallet pour voir vos récoltes.</div>;
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between" style={{ marginBottom: 24 }}>
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text"><Search size={16} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); setVisibleCount(9); }}
              style={{ borderRadius: '0 8px 8px 0' }}
            />
          </div>
          <div className="dropdown">
            <button className="btn btn-outline-success dropdown-toggle d-flex align-items-center" type="button" id="dropdownStatut" data-bs-toggle="dropdown" aria-expanded="false">
              <ChevronDown size={16} className="me-1" />
              {statutFiltre === 'all' && 'Toutes les récoltes'}
              {statutFiltre === 'certifie' && 'Certifiées'}
              {statutFiltre === 'noncertifie' && 'Non certifiées'}
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownStatut">
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('all')}>Toutes les récoltes</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('certifie')}>Certifiées</button></li>
              <li><button className="dropdown-item" onClick={() => setStatutFiltre('noncertifie')}>Non certifiées</button></li>
            </ul>
          </div>
        </div>
        
        <div style={{ backgroundColor: "rgb(240 249 232 / var(--tw-bg-opacity,1))", borderRadius: "8px", padding: "0.75rem 1.25rem", marginBottom: 16 }}>
          <h2 className="h5 mb-0">
            {hasRole(roles, 3) || hasRole(roles, 2) ? "Liste des Récoltes" : (hasRole(roles, 0) && "Mes Récoltes")}
          </h2>
          <p className="text-muted mb-0">
            {recoltes.length > 0 && (
              <>
                {recoltes.filter(r => r.cid).length} récoltes avec données IPFS, 
                {recoltes.filter(r => !r.cid).length} récoltes sans données IPFS
              </>
            )}
          </p>
        </div>

        {/* LISTE DES RECOLTES */}
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : recoltes.length > 0 ? (
          <div className="row g-3">
            {recoltesAffichees.map((recolte) => (
              <div key={recolte.id} className="col-md-4">
                <div className="card shadow-sm p-3" style={{ borderRadius: 16, boxShadow: '0 2px 12px 0 rgba(60,72,88,.08)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Récolte #{recolte.id}</h5>
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
                      {recolte.certifie ? (
                        <span className="badge bg-success">Certifiée</span>
                      ) : (
                        <span className="badge bg-warning">Non certifiée</span>
                      )}
                    </div>
                  </div>

                  <div className="card-text">
                    <p><strong>Produit:</strong> {recolte.nomProduit}</p>
                    <p><strong>Quantité:</strong> {recolte.quantite} kg</p>
                    <p><strong>Prix unitaire:</strong> {recolte.prixUnit} Ariary</p>
                    <p><strong>Date de récolte:</strong> {recolte.dateRecolte}</p>
                    <p><strong>Producteur:</strong> {recolte.producteur}</p>
                    
                    {/* Informations IPFS et Merkle */}
                    {recolte.cid && (
                      <div className="mt-2 p-2 bg-light rounded">
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

                    {recolte.certificatPhytosanitaire && (
                      <p className="mt-2">
                        <strong>Certificat phytosanitaire:</strong>
                        <a
                          href={getIPFSURL(recolte.certificatPhytosanitaire)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ms-2 text-decoration-none text-success"
                        >
                          Voir ici
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="d-flex justify-content-between mt-3">
                    {/* Actions selon le rôle */}
                    {hasRole(roles, 3) && recolte.certifie && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setRecolteSelectionnee(recolte);
                          setShowModal(true);
                        }}
                      >
                        Commander
                      </button>
                    )}

                    {hasRole(roles, 2) && !recolte.certifie && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => {
                          setRecolteSelectionnee(recolte);
                          setShowModalCertification(true);
                        }}
                      >
                        Certifier
                      </button>
                    )}

                    {/* Lien vers les détails complets IPFS */}
                    {recolte.cid && (
                      <a
                        href={getIPFSURL(recolte.cid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        Voir données IPFS
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted">Aucune récolte trouvée.</div>
        )}

        {recoltesAffichees.length < recoltesFiltres.length && (
          <div className="text-center mt-3">
            <button className="btn btn-outline-success" onClick={() => setVisibleCount(visibleCount + 9)}>
              Charger plus
            </button>
          </div>
        )}
      </div>

      {/* Modal de commande */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Commander la récolte #{recolteSelectionnee?.id}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Quantité disponible : <strong>{recolteSelectionnee?.quantite} kg</strong></p>
                <div className="mb-3">
                  <label htmlFor="quantiteCommande" className="form-label">Quantité à commander (kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="quantiteCommande"
                    value={quantiteCommande}
                    onChange={(e) => setQuantiteCommande(e.target.value)}
                    min="1"
                    max={recolteSelectionnee?.quantite}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCommander(recolteSelectionnee.id)}
                >
                  Commander
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de certification */}
      {showModalCertification && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Certifier la récolte #{recolteSelectionnee?.id}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModalCertification(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCertifier}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="certificat" className="form-label">Certificat phytosanitaire *</label>
                        <input
                          type="file"
                          className="form-control"
                          id="certificat"
                          onChange={(e) => setCertificat(e.target.files[0])}
                          accept=".pdf,.doc,.docx"
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="dateEmission" className="form-label">Date d'émission *</label>
                        <input
                          type="date"
                          className="form-control"
                          ref={dateEmission}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="dateExpiration" className="form-label">Date d'expiration *</label>
                        <input
                          type="date"
                          className="form-control"
                          ref={dateExpiration}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="dateInspection" className="form-label">Date d'inspection *</label>
                        <input
                          type="date"
                          className="form-control"
                          ref={dateInspection}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="autoriteCertificatrice" className="form-label">Autorité certificatrice *</label>
                        <input
                          type="text"
                          className="form-control"
                          ref={autoriteCertificatrice}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="numeroCertificat" className="form-label">Numéro du certificat *</label>
                        <input
                          type="text"
                          className="form-control"
                          ref={numeroCertificat}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="region" className="form-label">Région *</label>
                        <input
                          type="text"
                          className="form-control"
                          ref={region}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info">
                    <strong>Information:</strong> Le certificat sera automatiquement uploadé sur IPFS et la récolte sera certifiée avec traçabilité complète.
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModalCertification(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={btnLoading}
                    >
                      {btnLoading ? "Certification..." : "Certifier la récolte"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour les modals */}
      {(showModal || showModalCertification) && (
        <div className="modal-backdrop fade show"></div>
      )}

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default ListeRecoltes; 