import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCollecteurProducteurContract } from "../../utils/contract";
import { useUserContext } from '../../context/useContextt';
import { Search, ChevronDown } from "lucide-react";
import { hasRole } from '../../utils/roles';
import myPinataSDK, { uploadFile } from "../../utils/pinata";




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
        const recolte = await contract.getRecolte(i);

        // Afficher uniquement les recoltes de l'adresse connectée si c'est un producteur et pas collecteur
        if (!roles.includes(3))
          if (roles.includes(0))
            if (recolte.producteur.toLowerCase() !== account.toLowerCase())
              continue;

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

    let hashIpfs = "";
    let idCertificat = 0;
    const metadata = {
      dateEmission: dateEmission.current.value,
      dateExpiration: dateExpiration.current.value,
      dateInspection: dateInspection.current.value,
      autoriteCertificatrice: autoriteCertificatrice.current.value,
      adresseCertificateur: account,
      adresseProducteur: recolteSelectionnee.producteur,
      produit: recolteSelectionnee.nomProduit,
      numeroCertificat: numeroCertificat.current.value,
      region: region.current.value,
    };
    // uploader d'abord le certificate
    const upload = await uploadFile(certificat, metadata);
    if (!upload) {
      setBtnLoading(false);
      return;
    }
    else {
      hashIpfs = upload.cid;
      idCertificat = upload.id;
    }

    try {
      const contract = await getCollecteurProducteurContract();
      const tx = await contract.certifieRecolte(recolteSelectionnee.id, hashIpfs);
      await tx.wait();

      chargerRecoltes();
      setShowModalCertification(false);
    } catch (error) {
      console.error("Erreur lors de la certification:", error);
      setError("Erreur lors de la certification de la récolte. Veuillez réessayer.");
      alert("Erreur lors de la certification de la récolte. Veuillez réessayer.");
      // supprimer le certificat uploader sur ipfs si il y a erreur lors de la validation de l'intrant.
      await myPinataSDK.files.public.delete([idCertificat]);
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
        </div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          {!address && hasRole(roles, 0) && (
            <Link to="/mes-parcelles" className="btn btn-primary">
              Ajouter une récolte
            </Link>
          )}
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <div>{error}</div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : recoltes.length === 0 ? (
          <div className="text-center text-muted">
            {hasRole(roles, 0) ? "Vous n'avez pas encore de récoltes enregistrées." : "Aucune récolte n'est enregistrée pour le moment."}
          </div>
        ) : recoltesFiltres.length === 0 ? (
          <div className="text-center text-muted">Aucune récolte ne correspond à la recherche ou au filtre.</div>
        ) : (
          <div className="row g-3">
            {recoltesAffichees.map((recolte) => (
              <div key={recolte.id} className="col-md-4">
                <div className="card border shadow-sm p-3">
                  <h5 className="card-title">{recolte.nomProduit}</h5>
                  <div className="card-text small">
                    <p><strong>ID recolte:</strong> {recolte.id}</p>
                    <p><strong>ID parcelle:</strong> {recolte.idParcelle}</p>
                    <p><strong>Producteur:</strong> {`${recolte.producteur.substring(0, 6)}...${recolte.producteur.substring(recolte.producteur.length - 4)}`}</p>
                    <p><strong>Quantité:</strong> {recolte.quantite}</p>
                    <p><strong>Prix unitaire:</strong> {recolte.prixUnit} Ar</p>
                    <p><strong>Date de récolte:</strong> {recolte.dateRecolte}</p>
                    <p>
                      <strong>Statut:</strong>
                      <span className={`badge ms-2 ${recolte.certifie ? "bg-success" : "bg-warning"}`}>
                        {recolte.certifie ? "certifié" : "Encore non certifié"}
                      </span>
                    </p>
                    {recolte.certifie && (
                      <p>
                        <strong>Certificat:&nbsp;</strong>
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${recolte.certificatPhytosanitaire}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ms-2 text-decoration-none text-success"
                        >
                          Voir ici
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="mt-3">
                    {hasRole(roles, 2) && !recolte.certifie && (
                      <button
                        onClick={() => { setShowModalCertification(true); setRecolteSelectionnee(recolte) }}
                        // onClick={() => handleCertifier(recolte.id)}
                        className="btn btn-sm btn-primary me-2"
                      >
                        Certifier
                      </button>
                    )}
                    {hasRole(roles, 3) && recolte.certifie && (
                      <button
                        onClick={() => {
                          setRecolteSelectionnee(recolte);
                          setShowModal(true);
                        }}
                        className="btn btn-sm btn-success"
                      >
                        Commander
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {recoltesAffichees.length < recoltesFiltres.length && (
        <div className="text-center mt-3">
          <button className="btn btn-outline-success" onClick={() => setVisibleCount(visibleCount + 9)}>
            Charger plus
          </button>
        </div>
      )}

      {/* Modal de commande */}
      {showModal && recolteSelectionnee && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Commander {recolteSelectionnee.nomProduit}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <label>Quantité à commander :</label>
                <input
                  type="number"
                  className="form-control"
                  value={quantiteCommande}
                  onChange={e => setQuantiteCommande(e.target.value)}
                  min={1}
                  max={recolteSelectionnee.quantite}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={() => handleCommander(recolteSelectionnee.id)}>Valider la commande</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERTIFICATION */}
      {showModalCertification && (
        <>
          <div className="modal-backdrop fade show"></div>

          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <form action="" onSubmit={(event) => handleCertifier(event)}>
                <div className="modal-content bg-light">
                  <div className="modal-header">
                    <h5 className="modal-title">Ajout certificat du produit &quot;{recolteSelectionnee.nomProduit}&quot;</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModalCertification(false)}></button>
                  </div>

                  {/* Corps du modal */}
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="certificat" className="form-label text-muted">Certificat</label>
                      <input type="file" id="certificat" className="form-control" placeholder="Username" onChange={e => setCertificat(e.target.files[0])} required />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="numeroCertificat" className="form-label text-muted">Numéro du certificat</label>
                      <input type="text" id="numeroCertificat" className="form-control" ref={numeroCertificat} required />
                    </div>
                    <div className="row mb-3">
                      <div className="col">
                        <label className="form-label text-muted">Date d&apos;emession</label>
                        <input type="date" className="form-control" required ref={dateEmission} />
                      </div>
                      <div className="col">
                        <label className="form-label text-muted">Date d&apos;expiration</label>
                        <input type="date" className="form-control" required ref={dateExpiration} />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted">Date d&apos;inspection</label>
                      <input type="date" className="form-control" required ref={dateInspection} />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="region" className="form-label text-muted">Region</label>
                      <select className="form-select" id="region" ref={region}>
                        <option>Antananarivo</option>
                        <option>Antsiranana</option>
                        <option>Mahajanga</option>
                        <option>Toamasina</option>
                        <option>Fianarantsoa</option>
                        <option>Toliara</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="autorite_certificatrice" className="form-label text-muted">Autorité certificatrice</label>
                      <input type="text" className="form-control" required id="autorite_certificatrice" ref={autoriteCertificatrice} />
                    </div>
                  </div>

                  {/* Pied du modal */}
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModalCertification(false)}>
                      Annuler
                    </button>
                    {btnLoading ? (
                      <button type="button" className="btn btn-primary" disabled>
                        <div className="spinner-border spinner-border-sm text-light" role="status"></div>
                        &nbsp;Certifier
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="btn btn-primary"
                      >
                        Certifier
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ListeRecoltes; 