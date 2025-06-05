import React from 'react';
import { ShieldCheck, Banknote, BarChart3, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

function HomePage({ account, onConnectWallet }) {
  const agrichainGreen = 'rgb(46, 125, 50)';

  return (
    <div className="d-flex flex-column">
  {/* Hero Section */}
  <section
    className="d-flex align-items-center"
    style={{
      background: "rgb(240 249 232)",
      minHeight: '500px',
    }}
  >
    <div className="container py-5">
      <div className="row justify-content-center text-center text-md-start">
        <div className="col-lg-8">
          <h1 className="display-5 fw-bold mb-4 text-dark">
            Traçabilité blockchain pour l'agriculture à Madagascar
          </h1>
          <p className="lead mb-4 text-secondary">
            Nous connectons producteurs et coopératives pour une traçabilité complète de la récolte à l'exportation.
          </p>

          {!account && (
            <div className="bg-white text-dark p-4 rounded shadow mx-auto mx-md-0" style={{ maxWidth: 450 }}>
              <h5 className="mb-2">Connexion requise</h5>
              <p className="small text-muted mb-3">
                Connectez votre portefeuille pour interagir avec la plateforme.
              </p>
              <button className="btn btn-success d-flex align-items-center gap-2" onClick={onConnectWallet}>
                <Wallet size={18} /> Connecter avec Metamask
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </section>



      {/* Features Section */}
      <section className="py-5 bg-white">
        <div className="container text-center">
          <h2 className="fw-bold mb-3" style={{ color: agrichainGreen }}>
            Pourquoi choisir AgriChain ?
          </h2>
          <p className="text-muted mb-5 mx-auto" style={{ maxWidth: '700px' }}>
            Notre plateforme associe blockchain et agriculture pour un écosystème transparent, équitable et efficace.
          </p>
          <div className="row">
            {[
              {
                icon: <ShieldCheck size={40} style={{ color: agrichainGreen }} />,
                title: "Transparence & Confiance",
                desc: "Traçabilité complète des produits agricoles, de la récolte à l'exportation.",
              },
              {
                icon: <Banknote size={40} style={{ color: agrichainGreen }} />,
                title: "Paiements Sécurisés",
                desc: "Smart contracts automatisés sans intermédiaires.",
              },
              {
                icon: <BarChart3 size={40} style={{ color: agrichainGreen }} />,
                title: "Données & Insights",
                desc: "Suivi et analytique pour valoriser les produits malgaches.",
              }
            ].map((item, idx) => (
              <div key={idx} className="col-md-4 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <div className="mb-3">{item.icon}</div>
                    <h5 className="fw-semibold mb-2">{item.title}</h5>
                    <p className="text-muted small">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 text-white text-center" style={{ backgroundColor: agrichainGreen }}>
        <div className="container">
          <h2 className="fw-bold mb-3">Rejoignez l'écosystème AgriChain</h2>
          <p className="mb-4 mx-auto" style={{ maxWidth: 600 }}>
            Que vous soyez producteur, coopérative ou exportateur, participez à une chaîne plus transparente et équitable.
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <Link to="/" className="btn btn-light fw-semibold">
              Commencer comme producteur
            </Link>
            <Link to="/" className="btn btn-outline-light fw-semibold">
              Commencer comme collecteur
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
