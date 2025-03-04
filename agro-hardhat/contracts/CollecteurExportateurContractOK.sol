// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CollecteurExportateurContrat {
    enum Role { Collecteur, Exportateur, Transporteur }
    enum StatutProduit { EnAttente, Valide, Rejete }
    enum StatutTransport { EnCours, Livre }
    enum ModePaiement { VirementBancaire, Cash, MobileMoney }

    struct Acteur {
        address addr;
        Role role;
    }

    struct Produit {
        uint id;
        string nom;
        uint quantite;
        uint prix;
        StatutProduit statut;
        uint idParcelle;
        string dateRecolte;
        string certificatPhytosanitaire;
        address collecteur;
    }

    // pour stocker une commande
    struct Commande {
        uint id;
        uint idProduit;
        uint quantite;
        uint prix;
        StatutTransport statutTransport;
        Acteur exportateur;
    }

    struct EnregistrementCondition {
        uint id;
        string temperature;
        string humidite;
        uint timestamp;
    }

    struct Paiement {
        uint id;
        address payeur;
        uint montant;
        ModePaiement mode;
        uint timestamp;
    }

    mapping(address => Acteur) public acteurs;
    mapping(uint => Produit) public produits;
    mapping(uint => EnregistrementCondition) public conditions;
    mapping(uint => Paiement) public paiements;
    // Pour stocker tous les commandes du contrat
    mapping (uint => Commande) public commandes;
    uint public compteurCommandes;
    uint public compteurProduits;
    uint public compteurConditions;
    uint public compteurPaiements;

    address public producteurEnPhaseCultureAddress;

    event ActeurEnregistre(address indexed acteur, Role role);
    event ProduitAjoute(uint indexed idProduit, string nom, uint quantite, uint prix, uint idParcelle, string dateRecolte, string certificatPhytosanitaire);
    event ProduitValide(uint indexed idProduit, bool valide);
    event PaiementEffectue(uint indexed idProduit, uint idPaiement, address payeur, uint montant, ModePaiement mode);
    event ConditionEnregistree(uint indexed idProduit, uint idCondition, string temperature, string humidite, uint timestamp);
    event StatutTransportMisAJour(uint indexed idProduit, StatutTransport statut);
    // Evenement produit lorsqu une commande est passer
    event CommandePasser(address indexed exportateur, uint idProduit);

    modifier seulementCollecteur() {
        require(acteurs[msg.sender].role == Role.Collecteur, "Non autorise: seulement Collecteur");
        _;
    }

    modifier seulementExportateur() {
        require(acteurs[msg.sender].role == Role.Exportateur, "Non autorise: seulement Exportateur");
        _;
    }

    modifier seulementTransporteur() {
        require(acteurs[msg.sender].role == Role.Transporteur, "Non autorise: seulement Transporteur");
        _;
    }

    constructor(address _producteurEnPhaseCultureAddress) {
        producteurEnPhaseCultureAddress = _producteurEnPhaseCultureAddress;
    }

    function enregistrerActeur(address _acteur, Role _role) public {
        acteurs[_acteur] = Acteur(_acteur, _role);
        emit ActeurEnregistre(_acteur, _role);
    }
    function getActeur(address _acteur) public view returns (Acteur memory) {
        return acteurs[_acteur];
    }

    // Modifie la fonction qui passe une commande
    function passerCommande(uint idProduit, uint _quantite) public seulementExportateur {
        // la quantite ne doit pas etre superieur au quantite de produit enregistrer.
        require(_quantite <= produits[idProduit].quantite, "Quantite invalide");

        uint _prix = _quantite * produits[idProduit].prix;
        Acteur memory _exportateur = acteurs[msg.sender];
        // la quantite de produit doit etre diminuer.
        uint temp = produits[idProduit].quantite - _quantite;
        produits[idProduit].quantite = temp;

        compteurCommandes++;
        commandes[compteurCommandes] = Commande(compteurCommandes, idProduit, _quantite, _prix, StatutTransport.EnCours, _exportateur);

        emit CommandePasser(_exportateur.addr, idProduit);
    }

    function ajouterProduit(uint _idParcelle, uint _quantite, uint _prix) public seulementCollecteur {
        // les valeurs inutiles seront ignorees.
        (, , , , string memory _nom, string memory _dateRecolte, string memory _certificatPhytosanitaire) = ProducteurEnPhaseCulture(producteurEnPhaseCultureAddress).obtenirInformationsParcelle(_idParcelle);

        compteurProduits++;
        produits[compteurProduits] = Produit(compteurProduits, _nom, _quantite, _prix, StatutProduit.EnAttente, _idParcelle, _dateRecolte, _certificatPhytosanitaire, msg.sender);
        emit ProduitAjoute(compteurProduits, _nom, _quantite, _prix, _idParcelle, _dateRecolte, _certificatPhytosanitaire);
    }

    function validerProduit(uint _idProduit, bool _valide) public seulementExportateur {
        require(produits[_idProduit].statut == StatutProduit.EnAttente, "Produit deja traite");
        if (_valide) {
            produits[_idProduit].statut = StatutProduit.Valide;
        } else {
            produits[_idProduit].statut = StatutProduit.Rejete;
        }
        emit ProduitValide(_idProduit, _valide);
    }

    function effectuerPaiement(uint _idCommande, uint _montant, ModePaiement _mode) public payable seulementExportateur {
        Produit memory _produit = produits[commandes[_idCommande].idProduit];
        require(_produit.statut == StatutProduit.Valide, "Produit non valide");
        require(msg.value == _produit.prix * commandes[_idCommande].quantite, "Montant incorrect");

        compteurPaiements++;
        paiements[compteurPaiements] = Paiement(compteurPaiements, msg.sender, _montant, _mode, block.timestamp);
        emit PaiementEffectue(_produit.id, compteurPaiements, msg.sender, _montant, _mode);

        address payable collecteur = payable(_produit.collecteur);
        collecteur.transfer(msg.value);
    }

    function enregistrerCondition(uint _idProduit, string memory _temperature, string memory _humidite) public seulementTransporteur {
        compteurConditions++;
        conditions[_idProduit] = EnregistrementCondition(compteurConditions, _temperature, _humidite, block.timestamp);
        emit ConditionEnregistree(_idProduit, compteurConditions, _temperature, _humidite, block.timestamp);
    }

    function mettreAJourStatutTransport(uint _idCommande, StatutTransport _statut) public seulementTransporteur {
        commandes[_idCommande].statutTransport = _statut;
        emit StatutTransportMisAJour(_idCommande, _statut);
    }

    // Pour enlever les erreurs eth_call
    fallback() external payable {}
    receive() external payable {}
}

interface ProducteurEnPhaseCulture {
    function obtenirInformationsParcelle(uint _idParcelle) external view returns (
        string memory qualiteSemence,
        string memory methodeCulture,
        string memory latitude,
        string memory longitude,
        string memory produit,
        string memory dateRecolte,
        string memory certificatPhytosanitaire
    );
}