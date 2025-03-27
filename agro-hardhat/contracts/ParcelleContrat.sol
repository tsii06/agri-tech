// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";



contract ParcelleContrat {

	// ================================ variable d'etat ==============================================
    mapping(uint32 => StructLib.Parcelle) public parcelles;
    uint32 public compteurParcelles;
    uint32 public compteurInspections;
	// ===============================================================================================


	function creerParcelle(
        string memory _qualiteSemence,
        string memory _methodeCulture,
        string memory _latitude,
        string memory _longitude,
        string memory _dateRecolte,
        string memory _certificatPhytosanitaire
    ) public {

		compteurParcelles++;
		// Ceci permet de ne pas specifier de valeur pour l'initialisation des tableaux dynamiques de struct et ainsi d'eviter un UnimplementedFeatureError
        parcelles[compteurParcelles].id = compteurParcelles;
        parcelles[compteurParcelles].producteur = msg.sender;
        parcelles[compteurParcelles].qualiteSemence = _qualiteSemence;
        parcelles[compteurParcelles].methodeCulture = _methodeCulture;
        parcelles[compteurParcelles].certifie = false;
        parcelles[compteurParcelles].etape = StructLib.Etape.PreCulture;
        parcelles[compteurParcelles].latitude = _latitude;
        parcelles[compteurParcelles].longitude = _longitude;
        parcelles[compteurParcelles].dateRecolte = _dateRecolte;
        parcelles[compteurParcelles].certificatPhytosanitaire = _certificatPhytosanitaire;
    }
    function appliquerControlePhytosanitaire(uint32 _idParcelle, bool _passe) public {
        require(parcelles[_idParcelle].etape == StructLib.Etape.Culture, "Pas en etape de culture");
        parcelles[_idParcelle].certifie = _passe;
    }
    function validerIntrant(uint32 _idParcelle, string memory _nom, bool _valide) public {
        for (uint32 i = 0; i < parcelles[_idParcelle].intrants.length; i++) {
            if (keccak256(abi.encodePacked(parcelles[_idParcelle].intrants[i].nom)) == keccak256(abi.encodePacked(_nom))) {
                parcelles[_idParcelle].intrants[i].valide = _valide;
                break;
            }
        }
    }



    // Pour recuperer les tableaux dynamiques de parcelle
    function getPhotos(uint32 idParcelle) public view returns (string[] memory) {
        return parcelles[idParcelle].photos;
    }
    function getIntrants(uint32 idParcelle) public view returns (StructLib.Intrant[] memory) {
        return parcelles[idParcelle].intrants;
    }
    function getInspections(uint32 idParcelle) public view returns (StructLib.Inspection[] memory) {
        return parcelles[idParcelle].inspections;
    }
    function getConditions(uint32 idParcelle) public view returns (StructLib.EnregistrementCondition[] memory) {
        return parcelles[idParcelle].conditions;
    }



    function mettreAJourEtape(uint32 _idParcelle, StructLib.Etape _etape) public {
        parcelles[_idParcelle].etape = _etape;
    }
    function ajouterPhoto(uint32 _idParcelle, string memory _urlPhoto) public {

        parcelles[_idParcelle].photos.push(_urlPhoto);
    }
    function ajouterIntrant(uint32 _idParcelle, string memory _nom, uint32 _quantite) public {

        parcelles[_idParcelle].intrants.push(StructLib.Intrant(_nom, _quantite, false));
    }
    function ajouterInspection(uint32 _idParcelle, string memory _rapport) public {

        compteurInspections++;
        parcelles[_idParcelle].inspections.push(StructLib.Inspection(compteurInspections, msg.sender, _rapport, block.timestamp));
    }
    function obtenirInformationsParcelle(uint32 _idParcelle) public view returns (
        string memory qualiteSemence,
        string memory methodeCulture,
        string memory latitude,
        string memory longitude,
        string memory dateRecolte,
        string memory certificatPhytosanitaire
    ) {

        // l'idParcelle doit etre existant
        require(_idParcelle <= compteurParcelles, "Ce parcelle n'existe pas");
        StructLib.Parcelle memory parcelle = parcelles[_idParcelle];
        return (
            parcelle.qualiteSemence,
            parcelle.methodeCulture,
            parcelle.latitude,
            parcelle.longitude,
            parcelle.dateRecolte,
            parcelle.certificatPhytosanitaire
        );
    }



    // ================================= getters ==========================================================
    function getParcelle(uint32 id) public view returns(StructLib.Parcelle memory) {
        return parcelles[id];
    }
    function getCompteurParcelle() public view returns(uint32) {
        return compteurParcelles;
    }
    function getCompteurInspection() public view returns(uint32) {
        return compteurInspections;
    }
}