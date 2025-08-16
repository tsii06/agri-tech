# Modifications des Structs et Contrats - Agri-Tech

## Résumé des Modifications

Ce document décrit les modifications apportées aux structs dans `StructLib.sol` et aux contrats existants pour adapter le système à l'utilisation d'arbres de Merkle et d'IPFS.

## 1. Modifications de StructLib.sol

### Structs modifiés avec ajout de `hashMerkle` :

#### ✅ **Intrant**
- Ajouté : `string cid` - CID IPFS pour les détails complets
- Ajouté : `string hashMerkle` - Hash Merkle pour la traçabilité

#### ✅ **Inspection**
- Modifié : `string rapport` → `string cid` - CID IPFS pour le rapport complet
- Ajouté : `string hashMerkle` - Hash Merkle pour la traçabilité

#### ✅ **EnregistrementCondition**
- Modifié : `string temperature` et `string humidite` → `string cid` - CID IPFS pour toutes les conditions
- Ajouté : `string hashMerkle` - Hash Merkle pour la traçabilité

#### ✅ **Parcelle**
- Supprimé : `string[] photos` - Maintenant en IPFS via `cid`
- Supprimé : `Intrant[] intrants` - Maintenant en IPFS via `cid`
- Supprimé : `Inspection[] inspections` - Maintenant en IPFS via `cid`
- Conservé : `string cid` et `string hashMerkle`

#### ✅ **Paiement**
- Ajouté : `string hashMerkle` - Hash Merkle pour la traçabilité

#### ✅ **CommandeRecolte**
- Ajouté : `string hashMerkle` - Hash Merkle pour la traçabilité

#### ✅ **Produit**
- Ajouté : `string hashMerkle` - Hash Merkle pour la traçabilité

#### ✅ **CommandeProduit**
- Ajouté : `string hashMerkle` - Hash Merkle pour la traçabilité

### Structs déjà optimisés (aucune modification) :
- **Recolte** - Déjà avait `hashMerkle` et `cid`
- **LotProduit** - Déjà avait `hashMerkle` et `cid`

## 2. Modifications des Contrats

### ProducteurEnPhaseCulture.sol

#### Fonctions supprimées :
- `ajouterPhoto()` - Remplacée par `mettreAJourPhotosParcelle()`
- `ajouterIntrant()` - Remplacée par `mettreAJourIntrantsParcelle()`
- `validerIntrant()` - Supprimée (gestion via IPFS)
- `ajouterInspection()` - Remplacée par `mettreAJourInspectionsParcelle()`

#### Nouvelles fonctions :
- `mettreAJourPhotosParcelle(uint32 _idParcelle, string memory _cidPhotos)`
- `mettreAJourIntrantsParcelle(uint32 _idParcelle, string memory _cidIntrants)`
- `mettreAJourInspectionsParcelle(uint32 _idParcelle, string memory _cidInspections)`

### CollecteurProducteur.sol

#### Modifications des constructeurs de structs :
- `CommandeRecolte` : Ajout du paramètre `hashMerkle` (chaîne vide par défaut)
- `Paiement` : Ajout du paramètre `hashMerkle` (chaîne vide par défaut)
- `EnregistrementCondition` : Remplacement des paramètres `temperature` et `humidite` par `cid`

#### Fonction modifiée :
- `enregistrerCondition()` : Paramètre `_cid` au lieu de `_temperature` et `_humidite`

#### Événement modifié :
- `ConditionEnregistree` : Paramètres `temperature` et `humidite` remplacés par `cid`

### CollecteurExportateur.sol

#### Modifications des constructeurs de structs :
- `Produit` : Ajout du paramètre `hashMerkle` (chaîne vide par défaut)
- `CommandeProduit` : Ajout du paramètre `hashMerkle` (chaîne vide par défaut)
- `Paiement` : Ajout du paramètre `hashMerkle` (chaîne vide par défaut)
- `EnregistrementCondition` : Remplacement des paramètres `temperature` et `humidite` par `cid`

#### Fonction modifiée :
- `enregistrerCondition()` : Paramètre `_cid` au lieu de `_temperature` et `_humidite`

#### Événement modifié :
- `ConditionEnregistree` : Paramètres `temperature` et `humidite` remplacés par `cid`

### Contrats non modifiés :
- **gestionnaireActeurs.sol** - N'utilise que l'enum `Role`
- **contratProxy.sol** - N'utilise aucun struct

## 3. Avantages des Modifications

### 🔒 **Tracabilité Complète**
- Tous les structs ont maintenant `hashMerkle` pour créer des arbres de Merkle
- Permet de vérifier l'intégrité de toute la chaîne de traçabilité

### ⚡ **Optimisation Blockchain**
- Suppression des arrays lourds (photos, intrants, inspections)
- Remplacement par des CID IPFS pour les données volumineuses
- Réduction significative du gas et amélioration des performances

### 🌐 **Intégration IPFS**
- Stockage décentralisé des données lourdes
- Référencement via CID pour maintenir la traçabilité
- Scalabilité améliorée du système

### 🔄 **Compatibilité**
- Tous les contrats existants sont maintenant compatibles
- Les fonctions de création de structs incluent les nouveaux attributs
- Maintien de la fonctionnalité existante

## 4. Utilisation des Nouveaux Attributs

### Hash Merkle
- Initialisé comme chaîne vide lors de la création
- Doit être mis à jour manuellement via des fonctions dédiées
- Utilisé pour créer l'arbre de Merkle de traçabilité

### CID IPFS
- Stocke les références vers les données détaillées
- Permet de récupérer les informations complètes depuis IPFS
- Maintient la traçabilité tout en optimisant la blockchain

## 5. Prochaines Étapes

1. **Déploiement** : Redéployer tous les contrats modifiés
2. **Migration** : Adapter le frontend pour utiliser les nouvelles structures
3. **IPFS** : Implémenter le stockage et la récupération des données via IPFS
4. **Merkle** : Développer les fonctions de calcul et vérification des arbres de Merkle
5. **Tests** : Vérifier que toutes les fonctionnalités fonctionnent correctement

## 6. Notes Importantes

- **Compatibilité** : Les contrats existants ne sont plus compatibles avec les anciennes versions
- **Migration** : Nécessite une migration complète des données existantes
- **IPFS** : Assurez-vous que les données IPFS sont accessibles et persistantes
- **Hash Merkle** : Les hash Merkle doivent être calculés et mis à jour régulièrement
