import { useUserContext } from '../context/useContextt';
import { getRoleName } from '../components/Layout/Header';

function Dashboard() {
  const { roles, account } = useUserContext();
  console.log('Dashboard - account:', account, 'roles:', roles);

  return (
    <div className="d-flex flex-column">
      <div className="container mx-auto px-4 py-8 bg-white shadow-md rounded-lg mt-5 mb-5 p-5">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-700">Bienvenue sur MadTX !</h1>

        {account ? (
          <div className="space-y-4">
            <div className="text-lg">
              <span className="font-semibold text-gray-700">Connecté avec l&apos;adresse :</span> <span className="font-mono text-blue-700">{account}</span>
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

    </div>
  );
}

export default Dashboard;
