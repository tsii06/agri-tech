// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";
import "./gestionnaireActeurs.sol";

contract CollecteurExportateur {
    // ------------------------- Attributs --------------------------------------------------------------
    mapping(uint32 => StructLib.Produit) public produits;
    mapping(uint32 => StructLib.LotProduit) public lotProduits;
    mapping(uint32 => StructLib.EnregistrementCondition) public conditions;
    mapping(uint32 => StructLib.Paiement) public paiements;
    // Pour stocker tous les commandes du contrat
    mapping (uint32 => StructLib.CommandeProduit) public commandes;
    uint32 public compteurCommandes;
    uint32 public compteurProduits;
    uint32 public compteurLotProduits;
    uint32 public compteurConditions;
    uint32 public compteurPaiements;
    // limite le nombre d'appel a la fonction initialiser a 1
    bool private initialised;

    GestionnaireActeurs public gestionnaireActeurs;
    // ------------------------- Fin Attributs ----------------------------------------------------------

    event ProduitAjoute(uint32 indexed idProduit, uint32 quantite, uint32 idRecolte);
    event ProduitValide(uint32 indexed idProduit, bool valide);
    event PaiementEffectue(uint32 indexed idProduit, uint32 idPaiement, address payeur, uint32 montant, StructLib.ModePaiement mode);
    event ConditionEnregistree(uint32 indexed idProduit, uint32 idCondition, string temperature, string humidite, uint timestamp);
    event StatutTransportMisAJour(uint32 indexed idProduit, StructLib.StatutTransport statut);
    // Evenement produit lorsqu une commande est passer
    event CommandePasser(address indexed exportateur, uint32 idProduit);
    event AjoutLotProduit(address indexed collecteur, uint32 idLotProduit, uint32 quantite, uint32 prix);
    event StatusCommandeMisAJour(uint32 indexed idCommande, StructLib.StatutProduit status);

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
    function ajouterProduit(uint32 _idRecolte, uint32 _quantite, address _collecteur) public {
        compteurProduits++;

        produits[compteurProduits] = StructLib.Produit(compteurProduits, _idRecolte, _quantite, _collecteur, false);

        emit ProduitAjoute(compteurProduits, _quantite, _idRecolte);
    }

    function ajouterLotProduit(uint32[] memory _idProduits, string memory _cid, uint32 _prix) public seulementCollecteur {
        uint32[] memory _idRecoltes = new uint32[](_idProduits.length);
        uint32 _quantite = 0;
        for(uint32 i=0 ; i<_idProduits.length ; i++) {
            require(_idProduits[i] <= compteurProduits, "Produit non existant.");
            StructLib.Produit memory produit = produits[_idProduits[i]];
            _idRecoltes[i] = produit.idRecolte;
            _quantite += produit.quantite;
            require(produit.collecteur == msg.sender, "Vous n'est pas proprietaire de ce produit.");
            require(!produit.enregistre, "Produit deja enregistre comme lot");
        }
        compteurLotProduits++;
        for(uint32 i=0 ; i<_idProduits.length ; i++) {
            produits[_idProduits[i]].enregistre = true;
        }
        lotProduits[compteurLotProduits] = StructLib.LotProduit(compteurLotProduits, _idRecoltes, _quantite, _prix, msg.sender, _cid, "");

        emit AjoutLotProduit(msg.sender, compteurLotProduits, _quantite, _prix);
    }
    
    function setPriceProduit(uint32 _idLotProduit, uint32 _prix) public seulementCollecteur {
        require(lotProduits[_idLotProduit].collecteur == msg.sender, "Vous n'etes pas proprietaire de ce produit");
        lotProduits[_idLotProduit].prix = _prix;
    }

    // Modifie la fonction qui passe une commande
    function passerCommande(uint32 _idLotProduit, uint32 _quantite) public seulementExportateur {
        // la quantite ne doit pas etre superieur au quantite de produit enregistrer.
        require(_quantite <= lotProduits[_idLotProduit].quantite, "Quantite invalide");

        uint32 _prix = _quantite * lotProduits[_idLotProduit].prix;
        // la quantite de produit doit etre diminuer.
        uint32 temp = lotProduits[_idLotProduit].quantite - _quantite;
        lotProduits[_idLotProduit].quantite = temp;

        compteurCommandes++;
        commandes[compteurCommandes] = StructLib.CommandeProduit(compteurCommandes, _idLotProduit, _quantite, _prix, false, StructLib.StatutTransport.EnCours, lotProduits[_idLotProduit].collecteur, msg.sender, StructLib.StatutProduit.EnAttente);

        emit CommandePasser(msg.sender, _idLotProduit);
    }

    function effectuerPaiement(uint32 _idCommande, uint32 _montant, StructLib.ModePaiement _mode) public payable seulementExportateur {
        StructLib.LotProduit memory _lotProduit = lotProduits[commandes[_idCommande].idLotProduit];
        require(msg.value == commandes[_idCommande].prix, "Montant incorrect");
        require(!commandes[_idCommande].payer, "Commande deja payer");
        require(commandes[_idCommande].statutProduit == StructLib.StatutProduit.Valide, "Commande non valider.");

        // definit la commande comme deja payee
        commandes[_idCommande].payer = true;

        compteurPaiements++;
        paiements[compteurPaiements] = StructLib.Paiement(compteurPaiements, msg.sender, commandes[_idCommande].collecteur, _montant, _mode, block.timestamp);
        emit PaiementEffectue(_lotProduit.id, compteurPaiements, msg.sender, _montant, _mode);

        address payable collecteur = payable(_lotProduit.collecteur);
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

    function mettreAJourStatutCommande(uint32 _idCommande, StructLib.StatutProduit _status) public seulementExportateur {
        require(commandes[_idCommande].statutTransport == StructLib.StatutTransport.Livre, "Commande pas encore livre.");
        commandes[_idCommande].statutProduit = _status;
        emit StatusCommandeMisAJour(_idCommande, _status);
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
    function getLotProduit(uint32 id) public view returns(StructLib.LotProduit memory) {
        return lotProduits[id];
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