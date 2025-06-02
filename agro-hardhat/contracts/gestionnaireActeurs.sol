// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";


/**
 * @title GestionnaireActeurs
 * @dev Smart contract pour centraliser la gestion des acteurs de la supply chain
 */
contract GestionnaireActeurs {
    // Définition des rôles dans l'écosystème
    // enum Role {
    //     Producteur,
    //     Collecteur,
    //     Exportateur,
    //     Certificateur,
    //     Auditeur,
    //     Transporteur,
    //     Administration
    // }
    
    // Type d'entité (soit undividuel soit morale pour une société)
    enum TypeEntite {
        Individu,
        Organisation
    }

    // Structure pour stocker les informations d'un acteur
    struct Acteur {
        address adresse;
        string idBlockchain; // Identifiant unique généré par la blockchain
        StructLib.Role role;
        bool actif;
        TypeEntite typeEntite; // Type d'entité: individu ou organisation
        uint256 dateEnregistrement;
        address[] contratsDelegues; // Contrats auxquels l'acteur a accès
        string offChainDetailsHash;
    }

    // Mappings pour stocker et accéder aux acteurs
    mapping(address => Acteur) public acteurs;
    mapping(string => address) public idBlockchainToAddress; // Mapping d'ID blockchain vers adresse
    mapping(StructLib.Role => address[]) public acteursByRole;
    
    // Mapping pour les administrateurs qui peuvent gérer les acteurs
    mapping(address => bool) public administrateurs;
    
    // Compteur d'acteurs par rôle
    mapping(StructLib.Role => uint256) public compteurActeurs;
    
    // Compteur pour générer des IDs uniques
    uint256 private compteurIds;

    // Évènements
    event ActeurEnregistre(address indexed adresse, string idBlockchain, StructLib.Role role, string offChainDetailsHash, uint256 timestamp);
    event ActeurModifie(address indexed adresse, string idBlockchain, StructLib.Role role, string newOffChainDetailsHash, uint256 timestamp);
    event ActeurDesactive(address indexed adresse, string idBlockchain, uint256 timestamp);
    event ActeurActive(address indexed adresse, string idBlockchain, uint256 timestamp);
    event ContratDelegueAjoute(address indexed acteur, address indexed contrat, uint256 timestamp);
    event ContratDelegueRetire(address indexed acteur, address indexed contrat, uint256 timestamp);
    event AdministrateurAjoute(address indexed admin, uint256 timestamp);
    event AdministrateurRetire(address indexed admin, uint256 timestamp);

    // Variables pour le proxy
    address public proxyAddress;
    address public implementation;

    /**
     * @dev Constructeur du contrat
     * @param _administrateurInitial Adresse du premier administrateur
     * @param _proxyAddress Adresse du contrat proxy
     */
    constructor(address _administrateurInitial, address _proxyAddress) {
        require(_administrateurInitial != address(0), "Adresse administrateur invalide");
        administrateurs[_administrateurInitial] = true;
        proxyAddress = _proxyAddress;
        compteurIds = 1; // Commencer à 1
        emit AdministrateurAjoute(_administrateurInitial, block.timestamp);
    }

    // Modificateurs pour contrôler l'accès aux fonctions
    modifier seulementAdministrateur() {
        require(administrateurs[msg.sender], "Non autorise: seulement Administrateur");
        _;
    }

    modifier acteurExiste(address _adresse) {
        require(acteurs[_adresse].adresse != address(0), "Acteur inexistant");
        _;
    }

    modifier acteurActif(address _adresse) {
        require(acteurs[_adresse].actif, "Acteur inactif");
        _;
    }
    
    modifier idBlockchainUnique(string memory _idBlockchain) {
        require(idBlockchainToAddress[_idBlockchain] == address(0), "ID Blockchain deja utilise");
        _;
    }

    /**
     * @dev Générer un identifiant blockchain unique
     * @return Identifiant unique sous forme de chaîne
     */
    function genererIdBlockchain() internal returns (string memory) {
        string memory prefix;
        
        // Préfixe selon le compteur
        if (compteurIds < 10) {
            prefix = "000";
        } else if (compteurIds < 100) {
            prefix = "00";
        } else if (compteurIds < 1000) {
            prefix = "0";
        } else {
            prefix = "";
        }
        
        // Convertir le compteur en string
        string memory compteurString = uint2str(compteurIds);
        
        // Incrémenter le compteur pour la prochaine utilisation
        compteurIds++;
        
        // Générer un ID de format "MG-XXXX-YYYY" où XXXX est le timestamp tronqué et YYYY le compteur
        string memory timestamp = uint2str(uint256(block.timestamp) % 10000);
        
        return string(abi.encodePacked("MG-", timestamp, "-", prefix, compteurString));
    }

    /**
     * @dev Convertir uint en string
     * @param _i Nombre à convertir
     * @return Le nombre converti en string
     */
    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }
        uint256 temp = _i;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_i != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Ajoute un nouvel administrateur
     * @param _nouvelAdmin Adresse du nouvel administrateur
     */
    function ajouterAdministrateur(address _nouvelAdmin) external seulementAdministrateur {
        require(_nouvelAdmin != address(0), "Adresse invalide");
        require(!administrateurs[_nouvelAdmin], "Deja administrateur");
        administrateurs[_nouvelAdmin] = true;
        emit AdministrateurAjoute(_nouvelAdmin, block.timestamp);
    }

    /**
     * @dev Retire un administrateur
     * @param _admin Adresse de l'administrateur à retirer
     */
    function retirerAdministrateur(address _admin) external seulementAdministrateur {
        require(administrateurs[_admin], "Pas un administrateur");
        require(_admin != msg.sender, "Impossible de se retirer soi-meme");
        administrateurs[_admin] = false;
        emit AdministrateurRetire(_admin, block.timestamp);
    }

    /**
     * @dev Enregistre un nouvel acteur dans le système
     * @param _adresse Adresse de l'acteur
     * @param _role Rôle de l'acteur
     * @param _typeEntite Type d'entité (Individu ou Organisation)
     * @param _offChainDetailsHash Hash des détails stockés hors chaîne
     */
    function enregistrerActeur(
        address _adresse,
        StructLib.Role _role,
        TypeEntite _typeEntite,
        string memory _offChainDetailsHash
    ) external seulementAdministrateur {
        require(_adresse != address(0), "Adresse invalide");
        require(acteurs[_adresse].adresse == address(0), "Acteur deja enregistre");
        
        // Générer un ID blockchain unique
        string memory idBlockchain = genererIdBlockchain();
        
        // Création du nouvel acteur
        address[] memory contratsDeleguesVide = new address[](0);
        Acteur memory nouvelActeur = Acteur({
            adresse: _adresse,
            idBlockchain: idBlockchain,
            role: _role,
            actif: true,
            typeEntite: _typeEntite,
            dateEnregistrement: block.timestamp,
            contratsDelegues: contratsDeleguesVide,
            offChainDetailsHash: _offChainDetailsHash
        });
        
        // Enregistrement de l'acteur
        acteurs[_adresse] = nouvelActeur;
        idBlockchainToAddress[idBlockchain] = _adresse;
        acteursByRole[_role].push(_adresse);
        compteurActeurs[_role]++;
        
        emit ActeurEnregistre(_adresse, idBlockchain, _role, _offChainDetailsHash, block.timestamp);
    }

    /**
     * @dev Modifie les informations d'un acteur existant
     * @param _adresse Adresse de l'acteur à modifier
     * @param _newOffChainDetailsHash Nouveau hash des détails stockés hors chaîne
     */
    function modifierActeur(
        address _adresse,
        string memory _newOffChainDetailsHash
    ) external seulementAdministrateur acteurExiste(_adresse) {
        Acteur storage acteur = acteurs[_adresse];
        acteur.offChainDetailsHash = _newOffChainDetailsHash;
        
        emit ActeurModifie(_adresse, acteur.idBlockchain, acteur.role, _newOffChainDetailsHash, block.timestamp);
    }

    /**
     * @dev Désactive un acteur
     * @param _adresse Adresse de l'acteur à désactiver
     */
    function desactiverActeur(address _adresse) external seulementAdministrateur acteurExiste(_adresse) acteurActif(_adresse) {
        Acteur storage acteur = acteurs[_adresse];
        acteur.actif = false;
        emit ActeurDesactive(_adresse, acteur.idBlockchain, block.timestamp);
    }

    /**
     * @dev Réactive un acteur désactivé
     * @param _adresse Adresse de l'acteur à réactiver
     */
    function activerActeur(address _adresse) external seulementAdministrateur acteurExiste(_adresse) {
        require(!acteurs[_adresse].actif, "Acteur deja actif");
        Acteur storage acteur = acteurs[_adresse];
        acteur.actif = true;
        emit ActeurActive(_adresse, acteur.idBlockchain, block.timestamp);
    }

    /**
     * @dev Ajoute un contrat délégué à un acteur
     * @param _acteur Adresse de l'acteur
     * @param _contratDelegue Adresse du contrat à déléguer
     */
    function ajouterContratDelegue(address _acteur, address _contratDelegue) external seulementAdministrateur acteurExiste(_acteur) acteurActif(_acteur) {
        require(_contratDelegue != address(0), "Adresse de contrat invalide");
        
        Acteur storage acteur = acteurs[_acteur];
        
        // Vérifier si le contrat est déjà délégué
        for (uint i = 0; i < acteur.contratsDelegues.length; i++) {
            require(acteur.contratsDelegues[i] != _contratDelegue, "Contrat deja delegue");
        }
        
        acteur.contratsDelegues.push(_contratDelegue);
        emit ContratDelegueAjoute(_acteur, _contratDelegue, block.timestamp);
    }

    /**
     * @dev Retire un contrat délégué d'un acteur
     * @param _acteur Adresse de l'acteur
     * @param _contratDelegue Adresse du contrat à retirer
     */
    function retirerContratDelegue(address _acteur, address _contratDelegue) external seulementAdministrateur acteurExiste(_acteur) {
        Acteur storage acteur = acteurs[_acteur];
        bool trouve = false;
        uint indexASupprimer;
        
        for (uint i = 0; i < acteur.contratsDelegues.length; i++) {
            if (acteur.contratsDelegues[i] == _contratDelegue) {
                indexASupprimer = i;
                trouve = true;
                break;
            }
        }
        
        require(trouve, "Contrat non trouve");
        
        // Move the last element to the spot of the one to delete
        acteur.contratsDelegues[indexASupprimer] = acteur.contratsDelegues[acteur.contratsDelegues.length - 1];
        // Remove the last element from the array
        acteur.contratsDelegues.pop();
        
        emit ContratDelegueRetire(_acteur, _contratDelegue, block.timestamp);
    }

    /**
     * @dev Vérifie si une adresse est un acteur avec un rôle spécifique et actif
     * @param _adresse Adresse à vérifier
     * @param _role Rôle à vérifier
     * @return true si l'adresse correspond à un acteur actif avec le rôle spécifié
     */
    function estActeurAvecRole(address _adresse, StructLib.Role _role) external view returns (bool) {
        return acteurs[_adresse].adresse != address(0) && 
               acteurs[_adresse].role == _role && 
               acteurs[_adresse].actif;
    }

    /**
     * @dev Récupère la liste des adresses pour un rôle spécifique
     * @param _role Rôle à filtrer
     * @return Liste des adresses correspondant au rôle
     */
    function getActeursByRole(StructLib.Role _role) external view returns (address[] memory) {
        return acteursByRole[_role];
    }

    /**
     * @dev Récupère une page d'adresses d'acteurs pour un rôle spécifique
     * @param _role Rôle à filtrer
     * @param _startIndex Index de début pour la pagination (0-based)
     * @param _pageSize Nombre d'éléments par page
     * @return page La page d'adresses d'acteurs
     * @return totalCount Le nombre total d'acteurs pour ce rôle
     */
    function getActeursByRolePaginated(
        StructLib.Role _role,
        uint256 _startIndex,
        uint256 _pageSize
    ) external view returns (address[] memory page, uint256 totalCount) {
        address[] storage acteursList = acteursByRole[_role];
        totalCount = acteursList.length;

        require(_pageSize > 0, "Page size must be positive");
        // Adjusted condition to allow _startIndex == 0 when totalCount == 0
        require(_startIndex < totalCount || (_startIndex == 0 && totalCount == 0), "Start index out of bounds");

        uint256 actualEndIndex = _startIndex + _pageSize;
        if (actualEndIndex > totalCount) {
            actualEndIndex = totalCount;
        }

        // If startIndex is beyond the array or effective page size is zero
        if (_startIndex >= actualEndIndex) {
            return (new address[](0), totalCount);
        }

        page = new address[](actualEndIndex - _startIndex);
        for (uint256 i = 0; i < page.length; i++) {
            page[i] = acteursList[_startIndex + i];
        }

        return (page, totalCount);
    }

    /**
     * @dev Récupère l'adresse d'un acteur à partir de son ID blockchain
     * @param _idBlockchain ID blockchain de l'acteur
     * @return Adresse associée à cet ID blockchain
     */
    function getAdresseParIdBlockchain(string memory _idBlockchain) external view returns (address) {
        address adresse = idBlockchainToAddress[_idBlockchain];
        require(adresse != address(0), "ID Blockchain inexistant");
        return adresse;
    }

    /**
     * @dev Récupère les détails d'un acteur
     * @param _adresse Adresse de l'acteur
     * @return idBlockchain ID blockchain unique
     * @return role Rôle de l'acteur
     * @return actif Statut de l'acteur
     * @return typeEntite Type d'entité (Individu ou Organisation)
     * @return dateEnregistrement Date d'enregistrement
     * @return contratsDelegues Liste des contrats délégués
     * @return offChainDetailsHash Hash des détails stockés hors chaîne
     */
    function getDetailsActeur(address _adresse) external view acteurExiste(_adresse) returns (
        string memory idBlockchain,
        StructLib.Role role,
        bool actif,
        TypeEntite typeEntite,
        uint256 dateEnregistrement,
        address[] memory contratsDelegues,
        string memory offChainDetailsHash
    ) {
        Acteur memory acteur = acteurs[_adresse];
        return (
            acteur.idBlockchain,
            acteur.role,
            acteur.actif,
            acteur.typeEntite,
            acteur.dateEnregistrement,
            acteur.contratsDelegues,
            acteur.offChainDetailsHash
        );
    }

    /**
     * @dev Met à jour l'implémentation du contrat via proxy
     * @param _nouvelleImplementation Nouvelle adresse d'implémentation
     */
    function mettreAJourImplementation(address _nouvelleImplementation) public seulementAdministrateur {
        require(_nouvelleImplementation != address(0), "Adresse d'implementation invalide");
        
        (bool success, ) = proxyAddress.call(
            abi.encodeWithSignature("updateImplementation(address)", _nouvelleImplementation)
        );
        require(success, "Echec de la mise a jour de l'implementation");
        
        implementation = _nouvelleImplementation;
    }
}
