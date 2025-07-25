// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";
import "./gestionnaireActeurs.sol";

contract CollecteurExportateur {
    // ------------------------- Attributs --------------------------------------------------------------
    mapping(uint32 => StructLib.Produit) public produits;
    mapping(uint32 => StructLib.EnregistrementCondition) public conditions;
    mapping(uint32 => StructLib.Paiement) public paiements;
    // Pour stocker tous les commandes du contrat
    mapping (uint32 => StructLib.CommandeProduit) public commandes;
    uint32 public compteurCommandes;
    uint32 public compteurProduits;
    uint32 public compteurConditions;
    uint32 public compteurPaiements;
    // limite le nombre d'appel a la fonction initialiser a 1
    bool private initialised;

    GestionnaireActeurs public gestionnaireActeurs;
    // ------------------------- Fin Attributs ----------------------------------------------------------

    event ProduitAjoute(uint32 indexed idProduit, string nom, uint32 quantite, uint32 prix, uint32 idRecolte, string dateRecolte, string certificatPhytosanitaire);
    event ProduitValide(uint32 indexed idProduit, bool valide);
    event PaiementEffectue(uint32 indexed idProduit, uint32 idPaiement, address payeur, uint32 montant, StructLib.ModePaiement mode);
    event ConditionEnregistree(uint32 indexed idProduit, uint32 idCondition, string temperature, string humidite, uint timestamp);
    event StatutTransportMisAJour(uint32 indexed idProduit, StructLib.StatutTransport statut);
    // Evenement produit lorsqu une commande est passer
    event CommandePasser(address indexed exportateur, uint32 idProduit);

    modifier seulementCollecteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Collecteur), "Non autorise: seulement Collecteur");
        _;
    }
    modifier seulementExportateur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Exportateur), "Non autorise: seulement Exportateur");
        _;
    }
    modifier seulementTransporteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Transporteur), "Non autorise: seulement Transporteur");
        _;
    }

    function initialiser(address _gestionnaireActeurs) public {
        require(!initialised, "Contrat deja initialiser !");
        gestionnaireActeurs = GestionnaireActeurs(_gestionnaireActeurs);
        initialised = true;
    }

    // ==================================== Produit =========================================================
    function ajouterProduit(uint32 _idRecolte, uint32 _quantite, uint32 _prix, address _collecteur, string memory _nomProduit, string memory _dateRecolte, string memory _certificatPhytosanitaire) public {
        compteurProduits++;

        produits[compteurProduits] = StructLib.Produit(compteurProduits, _idRecolte, _nomProduit, _quantite, _prix, _dateRecolte, _certificatPhytosanitaire, _collecteur);

        emit ProduitAjoute(compteurProduits, _nomProduit, _quantite, _prix, _idRecolte, _dateRecolte, _certificatPhytosanitaire);
    }
    function setPriceProduit(uint32 _idProduit, uint32 _prix) public seulementCollecteur {
        require(produits[_idProduit].collecteur == msg.sender, "Vous n'etes pas proprietaire de ce produit");
        produits[_idProduit].prixUnit = _prix;
    }

    // function validerProduit(uint32 _idProduit, bool _valide) public seulementExportateur {
    //     require(produits[_idProduit].statut == StructLib.StatutProduit.EnAttente, "Produit deja traite");
    //     if (_valide) {
    //         produits[_idProduit].statut = StructLib.StatutProduit.Valide;
    //     } else {
    //         produits[_idProduit].statut = StructLib.StatutProduit.Rejete;
    //     }
    //     emit ProduitValide(_idProduit, _valide);
    // }

    // Modifie la fonction qui passe une commande
    function passerCommande(uint32 idProduit, uint32 _quantite) public seulementExportateur {
        // la quantite ne doit pas etre superieur au quantite de produit enregistrer.
        require(_quantite <= produits[idProduit].quantite, "Quantite invalide");

        uint32 _prix = _quantite * produits[idProduit].prixUnit;
        // la quantite de produit doit etre diminuer.
        uint32 temp = produits[idProduit].quantite - _quantite;
        produits[idProduit].quantite = temp;

        compteurCommandes++;
        commandes[compteurCommandes] = StructLib.CommandeProduit(compteurCommandes, idProduit, _quantite, _prix, false, StructLib.StatutTransport.EnCours, produits[idProduit].collecteur, msg.sender);

        emit CommandePasser(msg.sender, idProduit);
    }

    function effectuerPaiement(uint32 _idCommande, uint32 _montant, StructLib.ModePaiement _mode) public payable seulementExportateur {
        StructLib.Produit memory _produit = produits[commandes[_idCommande].idProduit];
        // require(_produit.statut == StructLib.StatutProduit.Valide, "Produit non valide");
        require(msg.value == commandes[_idCommande].prix, "Montant incorrect");
        require(!commandes[_idCommande].payer, "Commande deja payer");

        // definit la commande comme deja payee
        commandes[_idCommande].payer = true;

        compteurPaiements++;
        paiements[compteurPaiements] = StructLib.Paiement(compteurPaiements, msg.sender, commandes[_idCommande].collecteur, _montant, _mode, block.timestamp);
        emit PaiementEffectue(_produit.id, compteurPaiements, msg.sender, _montant, _mode);

        address payable collecteur = payable(_produit.collecteur);
        collecteur.transfer(msg.value);
    }

    function enregistrerCondition(uint32 _idCommande, string memory _temperature, string memory _humidite) public seulementTransporteur {
        // verifie si l'idCommande est valide.
        require(_idCommande <= compteurCommandes, "La commande n'existe pas.");

        compteurConditions++;
        conditions[_idCommande] = StructLib.EnregistrementCondition(compteurConditions, _temperature, _humidite, block.timestamp);
        emit ConditionEnregistree(_idCommande, compteurConditions, _temperature, _humidite, block.timestamp);
    }

    function mettreAJourStatutTransport(uint32 _idCommande, StructLib.StatutTransport _statut) public seulementTransporteur {
        // verifie si l'idCommande est valide.
        require(_idCommande <= compteurCommandes, "La commande n'existe pas.");
        
        commandes[_idCommande].statutTransport = _statut;
        emit StatutTransportMisAJour(_idCommande, _statut);
    }

    // Pour enlever les erreurs eth_call
    fallback() external payable {}
    receive() external payable {}

    // ------------------------------------- Setter ----------------------------------------------------
    function setGestionnaireActeurs(address _addr) public {
        gestionnaireActeurs = GestionnaireActeurs(_addr);
    }
    // ------------------------------------- Fin Setter -------------------------------------------------

    // -------------------------------------- Getter ----------------------------------------------------

    function getProduit(uint32 id) public view returns(StructLib.Produit memory) {
        return produits[id];
    }
    function getCondition(uint32 id) public view returns(StructLib.EnregistrementCondition memory) {
        return conditions[id];
    }
    function getPaiement(uint32 id) public view returns(StructLib.Paiement memory) {
        return paiements[id];
    }
    function getCommande(uint32 id) public view returns(StructLib.CommandeProduit memory) {
        return commandes[id];
    }

    function getCompteurCommande() public view returns(uint32) {
        return compteurCommandes;
    }
    function getCompteurProduit() public view returns(uint32) {
        return compteurProduits;
    }
    function getCompteurPaiement() public view returns(uint32) {
        return compteurPaiements;
    }
    function getCompteurCondition() public view returns(uint32) {
        return compteurConditions;
    }
    // -------------------------------------- Fin Getter ------------------------------------------------
}