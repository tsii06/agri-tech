import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getContract } from "../../utils/contract";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import myPinataSDK, { uploadFile } from "../../utils/pinata";
import { useUserContext } from "../../context/useContextt";



const defaultCenter = {
  lat: -18.8792,
  lng: 47.5079
};

function LocationMarker({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation(e.latlng);
    },
  });

  return null;
}

function CreerParcelle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(defaultCenter);
  const qualiteSemence = useRef("");
  const methodeCulture = useRef("");
  const dateRecolte = useRef("");
  // pour le certificat
  const [certificat, setCertificat] = useState(null);
  const dateEmission = useRef(null);
  const dateExpiration = useRef(null);
  const region = useRef(null);
  const autoriteCertificatrice = useRef(null);
  const numero_certificat = useRef(null);
  // adresse de l'user
  const { account } = useUserContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let hashCertificat = ""; // hash du certificat sur ipfs
    let idCertificat = ""; // pour supprimer le certificat de ipfs si il y erreur lors de la creation de parcelle.

    try {
      const contract = await getContract();
      const idNewParcelle = await contract.getCompteurParcelle();

      // UPLOADE CERTIFICAT PHYTOSANITAIRE
      if (!certificat) {
        throw new Error("Certificat phytosanitaire manquant");
      } else {
        // uploader d'abord le certificate
        const metadata = {
          dateEmission: dateEmission.current.value,
          dateExpiration: dateExpiration.current.value,
          region: region.current.value,
          autoriteCertificatrice: autoriteCertificatrice.current.value,
          adresseProducteur: account,
          idParcelle: Number(idNewParcelle).toString(),
          numeroCertificat: numero_certificat.current.value
        };
        const upload = await uploadFile(certificat, metadata);
        if (!upload)
          return;
        else {
          hashCertificat = upload.cid;
          idCertificat = upload.id;
        }
      }

      // CREATION PARCELLE
      const tx = await contract.creerParcelle(
        qualiteSemence.current.value,
        methodeCulture.current.value,
        location.lat.toString(),
        location.lng.toString(),
        dateRecolte.current.value,
        hashCertificat,
      );

      await tx.wait();
      navigate("/mes-parcelles");

    } catch (error) {
      console.error("Erreur lors de la création de la parcelle:", error);
      setError("Impossible de créer la parcelle. Veuillez réessayer plus tard.");
      // supprimer le certificat uploader sur ipfs.
      await myPinataSDK.files.public.delete([idCertificat]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">Créer une nouvelle parcelle</h2>

      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <div>{error}</div>
        </div>
      )}

      <form className="card shadow-sm p-4" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label text-muted">Qualité des semences</label>
          <input type="text" className="form-control" required ref={qualiteSemence} />
        </div>

        <div className="mb-3">
          <label className="form-label text-muted">Méthode de culture</label>
          <input type="text" className="form-control" required ref={methodeCulture} />
        </div>


        <div className="mb-3">
          <label className="form-label text-muted">Date de récolte prévisionelle</label>
          <input type="date" className="form-control" required ref={dateRecolte} />
        </div>

        <MapContainer center={location} zoom={12} style={{ height: '400px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={location} />
          <LocationMarker setLocation={setLocation} />
        </MapContainer>

        <div className="mt-3 text-muted">
          Position sélectionnée : {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>

        {/* CERTIFICAT PHYTOSANITAIRE */}
        <fieldset className="mt-5">
          <legend>Certificat phytosanitaire</legend>

          <div className="mb-3">
            <input type="file" className="form-control" required onChange={e => setCertificat(e.target.files[0])} />
          </div>

          <div className="mb-3">
            <label htmlFor="numero_certificat" className="form-label text-muted">Numero du certificat</label>
            <input type="text" className="form-control" required id="numero_certificat" ref={numero_certificat} />
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
            <label htmlFor="autoriteCertificatrice" className="form-label text-muted">Autorité certificatrice</label>
            <input type="text" className="form-control" required id="autoriteCertificatrice" ref={autoriteCertificatrice} />
          </div>
        </fieldset>

        <button
          disabled={loading}
          className={`btn w-100 mt-3 ${loading ? "btn-secondary disabled" : "btn-primary"}`}
        >
          {loading ? "Création en cours..." : "Créer la parcelle"}
        </button>
      </form>
    </div>
  );
}

export default CreerParcelle;
