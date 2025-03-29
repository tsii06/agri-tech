// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";




contract CollecteurProducteur {

    // ================================ variable d'etat ==============================================
    mapping(uint32 => StructLib.Recolte) public recoltes;
    uint32 public compteurRecoltes;
    // pour les commandes
    mapping(uint32 => StructLib.Paiement) public paiements;
    uint32 public compteurPaiements;
    mapping(uint32 => StructLib.CommandeRecolte) public commandes;
    uint32 public compteurCommandes;

    ICollecteurExportateur private moduleCE;
    IProducteur private moduleProducteur;






    // ======================================== modificateur ==================================================
    modifier seulementProducteur() {
        require(moduleProducteur.getActeur(msg.sender).role == StructLib.Role.Producteur, "Non autorise: seulement Producteur");
        _;
    }
    modifier seulementCertificateur() {
        require(moduleProducteur.getActeur(msg.sender).role == StructLib.Role.Certificateur, "Non autorise: seulement Certificateur");
        _;
    }
    modifier seulementCollecteur() {
        require(moduleProducteur.getActeur(msg.sender).role == StructLib.Role.Collecteur, "Non autorise: seulement Collecteur");
        _;
    }






    // ================================== constructor =================================================
    constructor(address _addrCE, address _producteur) {
        moduleCE = ICollecteurExportateur(_addrCE);
        moduleProducteur = IProducteur(_producteur);
    }



    // definie le contrat collecteurExportateur
    function setModuleCE(address _addr) public {

        moduleCE = ICollecteurExportateur(_addr);
    }
    function setModuleProducteur(address _addr) public {

        moduleProducteur = IProducteur(_addr);
    }








    /*
    ici les fonctions pour les recoltes
    */
    function ajoutRecolte(uint32 _idParcelle, uint32 _quantite, uint32 _prix, string memory _dateRecolte, string memory _nomProduit) public seulementProducteur {

        StructLib.Parcelle memory parcelle = moduleProducteur.getParcelle(_idParcelle);
        require(_idParcelle <= moduleProducteur.getCompteurParcelle(), "Parcelle non existant");
        require(parcelle.producteur == msg.sender, "Vous n'etes pas proprietaire de ce parcellle");

        compteurRecoltes++;
        recoltes[compteurRecoltes] = StructLib.Recolte(compteurRecoltes, _idParcelle, _quantite, _prix, false, "", _dateRecolte, msg.sender, _nomProduit);
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
        commandes[compteurCommandes] = StructLib.CommandeRecolte(compteurCommandes, _idRecolte, _quantite, _prix, false, StructLib.StatutTransport.EnCours, recolte.producteur, msg.sender);
    }
    function effectuerPaiementVersProducteur(uint32 _idCommande, uint32 _montant, StructLib.ModePaiement _mode) public payable seulementCollecteur {

        StructLib.CommandeRecolte memory commande = commandes[_idCommande];
        StructLib.Recolte memory recolte = recoltes[commande.idRecolte];

        require(_idCommande <= compteurCommandes, "Commande non existant");
        require(!commande.payer, "Commande deja payer");
        require(_montant == commande.prix, "Prix incorrect");

        // ajout automatique de produit dans le contrat CollecteurExportateur
        moduleCE.ajouterProduit(commande.idRecolte, commande.quantite, recolte.prixUnit, msg.sender, recolte.nomProduit, recolte.dateRecolte, recolte.certificatPhytosanitaire);

        compteurPaiements++;
        paiements[_idCommande] = StructLib.Paiement(compteurPaiements, msg.sender, commande.producteur, _montant, _mode, block.timestamp);
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



    /*
    ici les getters pour les commandes
    */
    }
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
    function getActeur(address _addr) external view returns(StructLib.Acteur memory);
}
