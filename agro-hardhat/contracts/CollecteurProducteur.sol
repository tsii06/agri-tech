// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";
import "./gestionnaireActeurs.sol";
import "./ProducteurEnPhaseCulture.sol";

contract CollecteurProducteur {
    // ================================ variable d'etat ==============================================
    mapping(uint32 => StructLib.Recolte) public recoltes;
    mapping(uint32 => StructLib.CommandeRecolte) public commandes;
    mapping(uint32 => StructLib.Paiement) public paiements;
    mapping(uint32 => StructLib.EnregistrementCondition) public conditions;
    uint32 public compteurRecoltes;
    uint32 public compteurCommandes;
    uint32 public compteurPaiements;
    uint32 public compteurConditions;

    ICollecteurExportateur private moduleCE;
    GestionnaireActeurs public gestionnaireActeurs;
    ProducteurEnPhaseCulture public producteurEnPhaseCulture;

    // limite le nombre d'appel a la fonction initialiser a 1
    bool private initialised;

    // ======================================== modificateur ==================================================
    modifier seulementProducteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Producteur), "Non autorise: seulement Producteur");
        _;
    }
    modifier seulementCertificateur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Certificateur), "Non autorise: seulement Certificateur");
        _;
    }
    modifier seulementCollecteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Collecteur), "Non autorise: seulement Collecteur");
        _;
    }
    modifier seulementTransporteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Transporteur), "Non autorise: seulement Transporteur");
        _;
    }


    
    // ================================== evenements =================================================
    event StatutTransportMisAJour(uint32 indexed idCommande, StructLib.StatutTransport statut, address transporteur);
    event ConditionEnregistree(uint32 indexed idProduit, uint32 idCondition, string temperature, string humidite, uint timestamp, address transporteur);
    event ValidationCommandeRecolte(uint32 indexed idCommande, bool status);


    // ================================== initialiser =================================================
    function initialiser(address _addrCE, address _gestionnaireActeurs, address _producteurEnPhaseCulture) public {
        require(!initialised, "Contrat deja initialiser !");
        moduleCE = ICollecteurExportateur(_addrCE);
        gestionnaireActeurs = GestionnaireActeurs(_gestionnaireActeurs);
        producteurEnPhaseCulture = ProducteurEnPhaseCulture(payable(_producteurEnPhaseCulture));
        initialised = true;
    }

    // definie le contrat collecteurExportateur
    function setModuleCE(address _addr) public {
        moduleCE = ICollecteurExportateur(_addr);
    }

    function setGestionnaireActeurs(address _addr) public {
        gestionnaireActeurs = GestionnaireActeurs(_addr);
    }

    function setProducteurEnPhaseCulture(address _addr) public {
        producteurEnPhaseCulture = ProducteurEnPhaseCulture(payable(_addr));
    }

    /*
    ici les fonctions pour les recoltes
    */
    function ajoutRecolte(uint32[] memory _idParcelles, uint32 _quantite, uint32 _prix) public seulementProducteur {
        for(uint32 i=0 ; i<_idParcelles.length ; i++) {
            require(_idParcelles[i] <= producteurEnPhaseCulture.getCompteurParcelle(), "Parcelle non existant.");
            StructLib.Parcelle memory parcelle = producteurEnPhaseCulture.getParcelle(_idParcelles[i]);
            require(parcelle.producteur == msg.sender, "Vous n'est pas proprietaire du parcelle.");
        }

        compteurRecoltes++;
        recoltes[compteurRecoltes] = StructLib.Recolte(compteurRecoltes, _idParcelles, _quantite, _prix, false, "", msg.sender, "");
    }

    function ajoutHashMerkleRecolte(uint32 _idRecolte, string memory _hash) public {
        require(_idRecolte <= compteurRecoltes, "Recolte non existant.");
        recoltes[_idRecolte].hashMerkle = _hash;
    }    
    
    function certifieRecolte(uint32 _idRecolte, string memory _certificat) public seulementCertificateur {
        require(_idRecolte <= compteurRecoltes, "Recolte non existant");
        require(bytes(_certificat).length != 0, "Certificat vide");

        recoltes[_idRecolte].certifie = true;
        recoltes[_idRecolte].certificatPhytosanitaire = _certificat;
    }

    /*
    ici les fonctions pour les commandes
    */
    function passerCommandeVersProducteur(uint32 _idRecolte, uint32 _quantite) public seulementCollecteur {
        StructLib.Recolte memory recolte = recoltes[_idRecolte];
        require(recolte.certifie, "Recolte non certifie");
        require(_idRecolte <= compteurRecoltes, "Recolte non existant");
        require(_quantite <= recolte.quantite, "Quantite trop grand par rapport au quantite disponible");

        // diminuer la quantite disponible dans la recolte.
        recoltes[_idRecolte].quantite -= _quantite;

        compteurCommandes++;
        uint32 _prix = recolte.prixUnit * _quantite;
        commandes[compteurCommandes] = StructLib.CommandeRecolte(compteurCommandes, _idRecolte, _quantite, _prix, false, StructLib.StatutTransport.EnCours, recolte.producteur, msg.sender, StructLib.StatutProduit.EnAttente);
    }
    function validerCommandeRecolte(uint32 _idCommande, bool _valide) public seulementCollecteur {
        require(commandes[_idCommande].statutTransport == StructLib.StatutTransport.Livre, "Commande pas encore arriver");
        require(commandes[_idCommande].statutRecolte == StructLib.StatutProduit.EnAttente, "Commande deja traiter.");

        if(_valide)
            commandes[_idCommande].statutRecolte = StructLib.StatutProduit.Valide;
        else
            commandes[_idCommande].statutRecolte = StructLib.StatutProduit.Rejete;

        emit ValidationCommandeRecolte(_idCommande, _valide);
    }
    function effectuerPaiementVersProducteur(uint32 _idCommande, uint32 _montant, StructLib.ModePaiement _mode) public payable seulementCollecteur {
        StructLib.CommandeRecolte memory commande = commandes[_idCommande];
        StructLib.Recolte memory recolte = recoltes[commande.idRecolte];

        require(_idCommande <= compteurCommandes, "Commande non existant");
        require(!commande.payer, "Commande deja payer");
        require(_montant == commande.prix, "Prix incorrect");
        require(commande.statutRecolte == StructLib.StatutProduit.Valide, "Produit rejeter");

        // A REVOIR
        // ajout automatique de produit dans le contrat CollecteurExportateur
        // moduleCE.ajouterProduit(commande.idRecolte, commande.quantite, recolte.prixUnit, msg.sender, recolte.nomProduit, recolte.dateRecolte, recolte.certificatPhytosanitaire);

        // definie la commande comme deja payer
        commandes[_idCommande].payer = true;

        compteurPaiements++;
        paiements[_idCommande] = StructLib.Paiement(compteurPaiements, msg.sender, commande.producteur, _montant, _mode, block.timestamp);
    }

    function mettreAJourStatutTransport(uint32 _idCommande, StructLib.StatutTransport _statut) public seulementTransporteur {
        // verifie si l'idCommande est valide.
        require(_idCommande <= compteurCommandes, "La commande n'existe pas.");
        
        commandes[_idCommande].statutTransport = _statut;
        emit StatutTransportMisAJour(_idCommande, _statut, msg.sender);
    }

    function enregistrerCondition(uint32 _idCommande, string memory _temperature, string memory _humidite) public seulementTransporteur {
        // verifie si l'idCommande est valide.
        require(_idCommande <= compteurCommandes, "La commande n'existe pas.");

        compteurConditions++;
        conditions[_idCommande] = StructLib.EnregistrementCondition(compteurConditions, _temperature, _humidite, block.timestamp);
        emit ConditionEnregistree(_idCommande, compteurConditions, _temperature, _humidite, block.timestamp, msg.sender);
    }

    // ====================================== getter et setter =============================================
    /*
    ici les getters pour les recoltes
    */
    function getRecolte(uint32 _idRecolte) public view returns (StructLib.Recolte memory) {
        return recoltes[_idRecolte];
    }
    function getCompteurRecoltes() public view returns (uint32) {
        return compteurRecoltes;
    }

    /*
    ici les getters pour les commandes
    */
    function getCommande(uint32 _id) public view returns (StructLib.CommandeRecolte memory) {
        return commandes[_id];
    }
    function getCompteurCommandes() public view returns (uint32) {
        return compteurCommandes;
    }

    /*
    ici les getters pour les paiements
    */
    function getPaiement(uint32 _id) public view returns (StructLib.Paiement memory) {
        return paiements[_id];
    }
    function getCompteurPaiments() public view returns (uint32) {
        return compteurPaiements;
    }
}

interface ICollecteurExportateur {
    function ajouterProduit(uint32 _idRecolte, uint32 _quantite, uint32 _prix, address _collecteur, string memory _nomProduit, string memory _dateRecolte, string memory _certificatPhytosanitaire) external;
}

interface IProducteur {
    function getParcelle(uint32 id) external view returns(StructLib.Parcelle memory);
    function getCompteurParcelle() external view returns(uint32);

}
