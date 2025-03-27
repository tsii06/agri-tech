// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CollecteurExportateurContrat {
    enum StatutProduit { EnAttente, Valide, Rejete }
    enum StatutTransport { EnCours, Livre }
    enum ModePaiement { VirementBancaire, Cash, MobileMoney }

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
        bool payer;
        StatutTransport statutTransport;
        address exportateur;
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


    // ------------------------- Attributs --------------------------------------------------------------
    mapping(uint => Produit) public produits;
    mapping(uint => EnregistrementCondition) public conditions;
    mapping(uint => Paiement) public paiements;
    // Pour stocker tous les commandes du contrat
    mapping (uint => Commande) public commandes;
    uint public compteurCommandes;
    uint public compteurProduits;
    uint public compteurConditions;
    uint public compteurPaiements;

    ProducteurEnPhaseCulture public producteurEnPhaseCulture;
    // ------------------------- Fin Attributs ----------------------------------------------------------

    event ActeurEnregistre(address indexed acteur, ProducteurEnPhaseCulture.Role role);
    event ProduitAjoute(uint indexed idProduit, string nom, uint quantite, uint prix, uint idParcelle, string dateRecolte, string certificatPhytosanitaire);
    event ProduitValide(uint indexed idProduit, bool valide);
    event PaiementEffectue(uint indexed idProduit, uint idPaiement, address payeur, uint montant, ModePaiement mode);
    event ConditionEnregistree(uint indexed idProduit, uint idCondition, string temperature, string humidite, uint timestamp);
    event StatutTransportMisAJour(uint indexed idProduit, StatutTransport statut);
    // Evenement produit lorsqu une commande est passer
    event CommandePasser(address indexed exportateur, uint idProduit);

    modifier seulementCollecteur() {
        require(producteurEnPhaseCulture.getActeur(msg.sender).role == ProducteurEnPhaseCulture.Role.Collecteur, "Non autorise: seulement Collecteur");
        _;
    }

    modifier seulementExportateur() {
        require(producteurEnPhaseCulture.getActeur(msg.sender).role == ProducteurEnPhaseCulture.Role.Exportateur, "Non autorise: seulement Exportateur");
        _;
    }

    modifier seulementTransporteur() {
        require(producteurEnPhaseCulture.getActeur(msg.sender).role == ProducteurEnPhaseCulture.Role.Transporteur, "Non autorise: seulement Transporteur");
        _;
    }






    constructor(address _producteurEnPhaseCultureAddress) {
        producteurEnPhaseCulture = ProducteurEnPhaseCulture(_producteurEnPhaseCultureAddress);
    }





    // Modifie la fonction qui passe une commande
    function passerCommande(uint idProduit, uint _quantite) public seulementExportateur {
        // la quantite ne doit pas etre superieur au quantite de produit enregistrer.
        require(_quantite <= produits[idProduit].quantite, "Quantite invalide");

        uint _prix = _quantite * produits[idProduit].prix;
        // la quantite de produit doit etre diminuer.
        uint temp = produits[idProduit].quantite - _quantite;
        produits[idProduit].quantite = temp;

        compteurCommandes++;
        commandes[compteurCommandes] = Commande(compteurCommandes, idProduit, _quantite, _prix, false, StatutTransport.EnCours, msg.sender);

        emit CommandePasser(msg.sender, idProduit);
    }

    function ajouterProduit(uint _idParcelle, uint _quantite, uint _prix) public seulementCollecteur {
        // les valeurs inutiles seront ignorees.
        (, , , , string memory _nom, string memory _dateRecolte, string memory _certificatPhytosanitaire) = producteurEnPhaseCulture.obtenirInformationsParcelle(_idParcelle);

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
        require(!commandes[_idCommande].payer, "Commande deja payer");

        // definit la commande comme deja payee
        commandes[_idCommande].payer = true;

        compteurPaiements++;
        paiements[compteurPaiements] = Paiement(compteurPaiements, msg.sender, _montant, _mode, block.timestamp);
        emit PaiementEffectue(_produit.id, compteurPaiements, msg.sender, _montant, _mode);

        address payable collecteur = payable(_produit.collecteur);
        collecteur.transfer(msg.value);
    }

    function enregistrerCondition(uint _idCommande, string memory _temperature, string memory _humidite) public seulementTransporteur {
        // verifie si l'idCommande est valide.
        require(_idCommande <= compteurCommandes, "La commande n'existe pas.");

        compteurConditions++;
        conditions[_idCommande] = EnregistrementCondition(compteurConditions, _temperature, _humidite, block.timestamp);
        emit ConditionEnregistree(_idCommande, compteurConditions, _temperature, _humidite, block.timestamp);
    }

    function mettreAJourStatutTransport(uint _idCommande, StatutTransport _statut) public seulementTransporteur {
        // verifie si l'idCommande est valide.
        require(_idCommande <= compteurCommandes, "La commande n'existe pas.");
        
        commandes[_idCommande].statutTransport = _statut;
        emit StatutTransportMisAJour(_idCommande, _statut);
    }

    // Pour enlever les erreurs eth_call
    fallback() external payable {}
    receive() external payable {}

    // ------------------------------------- Setter ----------------------------------------------------
    function setProducteurEnPhaseCulture(address _addr) public {
        producteurEnPhaseCulture = ProducteurEnPhaseCulture(_addr);
    }
    // ------------------------------------- Fin Setter -------------------------------------------------

    // -------------------------------------- Getter ----------------------------------------------------
    function getActeur(address addr) public view returns(ProducteurEnPhaseCulture.Acteur memory) {
        return producteurEnPhaseCulture.getActeur(addr);
    }
    function getProduit(uint id) public view returns(Produit memory) {
        return produits[id];
    }
    function getCondition(uint id) public view returns(EnregistrementCondition memory) {
        return conditions[id];
    }
    function getPaiement(uint id) public view returns(Paiement memory) {
        return paiements[id];
    }
    function getCommande(uint id) public view returns(Commande memory) {
        return commandes[id];
    }

    function getCompteurCommande() public view returns(uint) {
        return compteurCommandes;
    }
    function getCompteurProduit() public view returns(uint) {
        return compteurProduits;
    }
    function getCompteurPaiement() public view returns(uint) {
        return compteurPaiements;
    }
    function getCompteurCondition() public view returns(uint) {
        return compteurConditions;
    }
    // -------------------------------------- Fin Getter ------------------------------------------------
}

interface ProducteurEnPhaseCulture {
    enum Role { Producteur, Fournisseur, Certificateur, Collecteur, Auditeur, Transporteur, Exportateur }

    struct Acteur {
        address addr;
        Role role;
    }

    function obtenirInformationsParcelle(uint _idParcelle) external view returns (
        string memory qualiteSemence,
        string memory methodeCulture,
        string memory latitude,
        string memory longitude,
        string memory produit,
        string memory dateRecolte,
        string memory certificatPhytosanitaire
    );
    function getActeur(address addr) external view returns(Acteur memory);
}