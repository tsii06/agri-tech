// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



library StructLib {

	enum Role { 
        Producteur, 
        Fournisseur, 
        Certificateur, 
        Collecteur, 
        Auditeur, 
        Transporteur, 
        Exportateur, 
        Administration 
    }
    enum Etape { PreCulture, 
        Culture, 
        Recolte, 
        Transport 
    }
    enum ModePaiement { 
        VirementBancaire, 
        Cash, 
        MobileMoney
    }
    enum StatutTransport { 
        EnCours, 
        Livre 
    }
    enum StatutProduit { 
        EnAttente, 
        Valide, 
        Rejete 
    }



    struct Intrant {
        string nom;
        uint32 quantite;
        bool valide;
        uint32 id;
        string categorie;
        address fournisseur;
        string certificatPhytosanitaire;
    }

    struct Inspection {
        uint32 id;
        address auditeur;
        string rapport;
        uint timestamp;
    }

    struct EnregistrementCondition {
        uint32 id;
        string temperature;
        string humidite;
        uint timestamp;
    }

    struct Parcelle {
        uint32 id;
        address producteur;
        string qualiteSemence;
        string methodeCulture;
        bool certifie;
        Etape etape;
        string latitude;
        string longitude;
        string[] photos;
        Intrant[] intrants;
        Inspection[] inspections;
        EnregistrementCondition[] conditions;
        string dateRecolte;
        string certificatPhytosanitaire;
    }

    struct Paiement {
        uint32 id;
        address payeur;
        address vendeur;
        uint32 montant;
        ModePaiement mode;
        uint timestamp;
    }

    struct Recolte {
        uint32 id;
        uint32 idParcelle;
        uint32 quantite;
        uint32 prixUnit;
        bool certifie;
        string certificatPhytosanitaire;
        string dateRecolte;
        address producteur;
        string nomProduit;
    }

    struct CommandeRecolte {
        uint32 id;
        uint32 idRecolte;
        uint32 quantite;
        uint32 prix;
        bool payer;
        StatutTransport statutTransport;
        address producteur;
        address collecteur;
    }

    struct Produit {
        uint32 id;
        uint32 idRecolte;
        string nom;
        uint32 quantite;
        uint32 prixUnit;
        StatutProduit statut;
        string dateRecolte;
        string certificatPhytosanitaire;
        address collecteur;
    }

    struct CommandeProduit {
        uint32 id;
        uint32 idProduit;
        uint32 quantite;
        uint32 prix;
        bool payer;
        StatutTransport statutTransport;
        address collecteur;
        address exportateur;
    }
    
}