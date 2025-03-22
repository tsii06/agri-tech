import { useState,useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getContract } from "../utils/contract";

function CreerParcelle() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const qualiteSemence = useRef("");
  const methodeCulture = useRef("");
  const latitude = useRef("");
  const longitude = useRef("");
  const nomProduit = useRef("");
  const dateRecolte = useRef("");
  const certificatPhytosanitaire = useRef("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      
      // Valeurs par défaut
      // const qualiteSemence = "Bonne";
      // const methodeCulture = "Traditionnelle";
      // const latitude = "-18.8792";
      // const longitude = "47.5079";
      // const nomProduit = "Riz";
      // const dateRecolte = "2024-12-31";
      // const certificatPhytosanitaire = "CERT-2024-001";

      // Créer la parcelle
      const tx = await contract.creerParcelle(
        qualiteSemence.current.value,
        methodeCulture.current.value,
        latitude.current.value,
        longitude.current.value,
        nomProduit.current.value,
        dateRecolte.current.value,
        certificatPhytosanitaire.current.value
      );

      await tx.wait();

      alert("Parcelle bien creer.");
      
      // Rediriger vers la liste des parcelles
      navigate("/mes-parcelles");
      
    } catch (error) {
      console.error("Erreur lors de la création de la parcelle:", error);
      setError("Impossible de créer la parcelle. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">Créer une nouvelle parcelle</h2>
      
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <svg className="bi flex-shrink-0 me-2" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm0-14.5A6.5 6.5 0 111.5 8 6.508 6.508 0 018 1.5zM6.354 4.646a.5.5 0 00-.708.708L7.293 8l-1.647 1.646a.5.5 0 00.708.708L8 8.707l1.646 1.647a.5.5 0 00.708-.708L8.707 8l1.647-1.646a.5.5 0 00-.708-.708L8 7.293 6.354 4.646z"/>
          </svg>
          <div>{error}</div>
        </div>
      )}
      
      {/*<div className="card shadow-sm p-4">
        <h3 className="h5">Valeurs par défaut qui seront utilisées :</h3>
        <dl className="mt-3">
          <div className="row mb-2">
            <dt className="col-sm-4 fw-semibold">Qualité des semences</dt>
            <dd className="col-sm-8">Bonne</dd>
          </div>
          <div className="row mb-2">
            <dt className="col-sm-4 fw-semibold">Méthode de culture</dt>
            <dd className="col-sm-8">Traditionnelle</dd>
          </div>
          <div className="row mb-2">
            <dt className="col-sm-4 fw-semibold">Localisation</dt>
            <dd className="col-sm-8">-18.8792, 47.5079 (Antananarivo)</dd>
          </div>
          <div className="row mb-2">
            <dt className="col-sm-4 fw-semibold">Produit</dt>
            <dd className="col-sm-8">Riz</dd>
          </div>
          <div className="row mb-2">
            <dt className="col-sm-4 fw-semibold">Date de récolte</dt>
            <dd className="col-sm-8">31/12/2024</dd>
          </div>
          <div className="row mb-2">
            <dt className="col-sm-4 fw-semibold">Certificat phytosanitaire</dt>
            <dd className="col-sm-8">CERT-2024-001</dd>
          </div>
        </dl>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`btn w-100 ${loading ? "btn-secondary disabled" : "btn-primary"}`}
        >
          {loading ? "Création en cours..." : "Créer la parcelle avec ces valeurs"}
        </button>
      </div>*/}


      <form className="card shadow-sm p-4" onSubmit={handleSubmit}>

        <div className="mb-3">
          <label for="qualiteSemence" className="form-label text-muted">Qualite des semences</label>
          <input type="text" className="form-control" id="qualiteSemence" placeholder="" name="qualiteSemence" required ref={qualiteSemence} />
        </div>

        <div className="mb-3">
          <label for="methodeCulture" className="form-label text-muted">Methode de culture</label>
          <input type="text" className="form-control" id="methodeCulture" placeholder="" name="methodeCulture" required ref={methodeCulture} />
        </div>

        <div class="row mb-3">
          <div class="col">
            <label for="latitude" className="form-label text-muted">Latitude</label>
            <input type="text" class="form-control" placeholder="" id="latitude" name="latitude" required ref={latitude} />
          </div>
          <div class="col">
            <label for="longitude" className="form-label text-muted">Longitude</label>
            <input type="text" class="form-control" placeholder="" id="longitude" name="longitude" required ref={longitude} />
          </div>
        </div>

        <div className="mb-3">
          <label for="produit" className="form-label text-muted">Produit</label>
          <input type="text" className="form-control" id="produit" placeholder="" name="produit" required ref={nomProduit} />
        </div>


        <div className="mb-3">
          <label for="dateRecolte" className="form-label text-muted">Date de recolte</label>
          <input type="date" className="form-control" id="dateRecolte" placeholder="" name="dateRecolte" required ref={dateRecolte} />
        </div>

        <div className="mb-3">
          <label for="certificatPhytosanitaire" className="form-label text-muted">Certificat phytosanitaire</label>
          <input type="text" className="form-control" id="certificatPhytosanitaire" placeholder="" name="certificatPhytosanitaire" required ref={certificatPhytosanitaire} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`btn w-100 ${loading ? "btn-secondary disabled" : "btn-primary"}`}
        >
          {loading ? "Création en cours..." : "Créer la parcelle avec ces valeurs"}
        </button>
      </form>


  </div>
  );
}

export default CreerParcelle; 