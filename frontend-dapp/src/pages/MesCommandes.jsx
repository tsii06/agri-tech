import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { getCollecteurContract } from "../utils/contract";
import { getRoleName } from "../components/Header";







function MesCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acteur, setActeur] = useState({});
  const [_,setState] = useState({});

  useEffect(() => {
    const chargerCommandes = async () => {
      try {
        const contract = await getCollecteurContract();
        const provider = contract.runner.provider;
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        console.log("Adresse connectée:", account);

        // Recuperer l'acteur
        const _acteur = await contract.getActeur(account);

        // Obtenir le nombre total de commandes
        const compteurCommandes = await contract.getCompteurCommande();
        console.log("Nombre total de commandes:", compteurCommandes.toString());
        
        // Charger toutes les commandes de l'exportateur
        const commandesTemp = [];
        for (let i = 1; i <= compteurCommandes; i++) {
          // si l'user n'est pas EXPORTATEUR ou TRANSPORTEUR il ne peut pas acceder aux commandes
          if(getRoleName(_acteur.role) !== "EXPORTATEUR" && getRoleName(_acteur.role) !== "TRANSPORTEUR")
            break;

          const commande = await contract.getCommande(i);
          const exportateurAddress = commande.exportateur.toString();

          // Verifie si la commande appartient a l'user
          // si seulement l'user est un exportateur
          // si il est un transporteur, on affiche tous
          if(getRoleName(_acteur.role) === "EXPORTATEUR" && exportateurAddress.toLowerCase() !== account.toLowerCase())
            continue;
          
          console.log(`Commande ${i}:`, {
            exportateur: exportateurAddress,
            account: account,
            match: exportateurAddress.toLowerCase() === account.toLowerCase()
          });

          console.log("exportateurAddress", exportateurAddress);
          console.log("account", account);
          const produit = await contract.produits(commande.idProduit);
          
          commandesTemp.push({
            id: i,
            idProduit: commande.idProduit.toString(),
            quantite: commande.quantite.toString(),
            statutTransport: Number(commande.statutTransport),
            nomProduit: produit.nom,
            prixUnitaire: ethers.formatEther(produit.prix),
            payer: commande.payer,
            exportateur: exportateurAddress
          });
        }
        
        console.log("Commandes trouvées:", commandesTemp);
        setActeur(_acteur);
        // inverser le trie des commandes.
        // pour que les plus recents soient les premiers sur la liste.
        commandesTemp.reverse();
        setCommandes(commandesTemp);
      } catch (error) {
        console.error("Erreur lors du chargement des commandes:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    chargerCommandes();
  }, [_]);

  const getStatutTransport = (statut) => {
    switch(statut) {
      case 0: return "En cours";
      case 1: return "Livré";
      default: return "Inconnu";
    }
  };

  const getStatutTransportColor = (statut) => {
    switch(statut) {
      case 0: return "text-yellow-600";
      case 1: return "text-blue-600";
      case 2: return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const getStatutPayer = (payer) => {
    switch(payer) {
      case false: return "non payer";
      case true: return "payer";
      default: return "Inconnu";
    }
  };

  const mettreAJourStatusTransport = async (e, idCommande) => {
    e.preventDefault();
    const contrat = await getCollecteurContract();
    // commande livree.
    const tx = await contrat.mettreAJourStatutTransport(idCommande, 1);
    await tx.wait();

    setState({});
    alert("Commande livree.");
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-600">
            Erreur lors du chargement des commandes: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card p-4 shadow-sm">
        {/*---------- Titre par rapport a l'acteur -----------------*/}
        {getRoleName(acteur.role) === "TRANSPORTEUR" ? (
          <h2 className="h5 mb-3">Commandes</h2>
          ) : (
          <h2 className="h5 mb-3">Mes Commandes</h2>
        )}
        {/*---------------------------------------------------------*/}
        {isLoading ? (
          <div className="text-center">Chargement...</div>
        ) : commandes.length === 0 ? (
          <div className="text-center text-muted">Vous n'avez pas encore passé de commandes.</div>
        ) : (
          <div className="row g-3">
            {commandes.map((commande) => (
              <div key={commande.id} className="col-md-4">
                <div className="card border shadow-sm p-3">
                  <h5 className="card-title">{commande.nomProduit}</h5>
                  <div className="card-text small">
                    <p><strong>Quantité:</strong> {commande.quantite}</p>
                    <p><strong>Prix unitaire:</strong> {commande.prixUnitaire} ETH</p>
                    <p><strong>Total:</strong> {(Number(commande.quantite) * Number(commande.prixUnitaire)).toFixed(6)} ETH</p>
                    <p className={`fw-semibold ${getStatutTransportColor(commande.statutTransport)}`}>
                      <strong>Statut:</strong> {getStatutTransport(commande.statutTransport)}
                    </p>
                    <p className={`fw-semibold ${
                      commande.payer ? 'text-success' :  'text-warning'
                      }`}>
                      <strong>Paye:</strong> {getStatutPayer(commande.payer)}
                    </p>
                  </div>
                  <div className="mt-3">
                    <BoutonCommande role={acteur.role} commande={commande} mettreAJourStatusTransport={mettreAJourStatusTransport} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


const BoutonCommande = ({ role,commande,mettreAJourStatusTransport }) => {
  if(getRoleName(role) === "EXPORTATEUR")
    return (
      <>
      {!commande.payer && (
        <Link
          to={`/effectuer-paiement/${commande.id}`}
          className="btn btn-sm btn-primary"
        >
          Payer
        </Link>
      )}
      </>
    );
  else if(getRoleName(role) === "TRANSPORTEUR")
    return (
      <>
      {commande.statutTransport === 0 && (
        <a
          href=""
          className="btn btn-sm btn-primary"
          onClick={e => mettreAJourStatusTransport(e, commande.id)}
        >
          Livre
        </a>
      )} 
      </>
    );
}

export default MesCommandes; 