import React from 'react';
import { ShieldCheck, Banknote, BarChart3, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserContext } from '../context/useContextt';
import { getRoleName } from '../components/Layout/Header';

function HomePage({ account, onConnectWallet }) {
  const agrichainGreen = 'rgb(46, 125, 50)';
  const { roles } = useUserContext();

  return (
    <div className="d-flex flex-column">
<div className="container mx-auto px-4 py-8 bg-white shadow-md rounded-lg mt-5 mb-5 p-5">
  <h1 className="text-3xl font-bold mb-6 text-center text-green-700">Bienvenue sur MadTX !</h1>

  {account ? (
    <div className="space-y-4">
      <div className="text-lg">
        <span className="font-semibold text-gray-700">Connecté avec l'adresse :</span> <span className="font-mono text-blue-700">{account}</span>
      </div>

      <div className="text-lg">
        {roles.length > 0 ? (
          <>
            <span className="font-semibold text-gray-700">Votre{roles.length > 1 ? 's rôles' : ' rôle'} :</span>{" "}
            <span className="text-indigo-600 font-semibold">{roles.map(getRoleName).join(', ')}</span>
          </>
        ) : (
          <span className="text-red-500 font-medium">Aucun rôle attribué</span>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-800 bg-gray-100 p-4 rounded-md">
        {roles.includes(0) && <p>🎯 <b>Producteur :</b> Gérer vos parcelles et récoltes.</p>}
        {roles.includes(1) && <p>🧪 <b>Fournisseur :</b> Gérer les intrants.</p>}
        {roles.includes(2) && <p>✅ <b>Certificateur :</b> Valider les récoltes et intrants.</p>}
        {roles.includes(3) && <p>📦 <b>Collecteur :</b> Commander des récoltes.</p>}
        {roles.includes(4) && <p>🔍 <b>Auditeur :</b> Inspecter les parcelles.</p>}
        {roles.includes(5) && <p>🚚 <b>Transporteur :</b> Gérer les transports.</p>}
        {roles.includes(6) && <p>🌍 <b>Exportateur :</b> Commander et exporter les produits.</p>}
        {roles.includes(7) && <p>🛠️ <b>Administrateur :</b> Gérer la plateforme.</p>}
      </div>
    </div>
  ) : (
    <p className="text-center text-gray-600 text-lg mt-6">
      Veuillez connecter votre wallet pour accéder à la plateforme.
    </p>
  )}
</div>


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
            Pourquoi choisir MadTx ?
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
          <h2 className="fw-bold mb-3">Rejoignez l'écosystème MadTx</h2>
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
