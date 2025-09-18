import { filterIntrantsForHarvest } from './ipfsUtils';

// Fonction de test pour valider la règle d'association des intrants aux récoltes
// Cette fonction peut être utilisée dans la console du navigateur pour tester

/**
 * Test de la règle d'association des intrants
 * Exemples de scénarios pour vérifier que la règle est bien respectée
 */
export const testRegleAssociationIntrants = () => {
  console.log("🧪 Test de la règle d'association des intrants aux récoltes");
  
  // Scénario 1: Première récolte (pas de récolte précédente)
  const intrants1 = [
    { nom: "Engrais NPK", dateAjout: "2024-01-15" },
    { nom: "Pesticide bio", dateAjout: "2024-02-10" },
    { nom: "Fertilisant", dateAjout: "2024-03-05" }
  ];
  
  console.log("\n📋 Scénario 1: Première récolte (2024-03-01)");
  const test1 = filterIntrantsForHarvest(intrants1, "2024-03-01", null);
  console.log("Intrants valides:", test1.map(i => `${i.nom} (${i.dateAjout})`));
  console.log("✅ Attendu: Engrais NPK et Pesticide bio (avant ou à la date de récolte)");
  
  // Scénario 2: Deuxième récolte avec récolte précédente
  const intrants2 = [
    { nom: "Engrais NPK", dateAjout: "2024-01-15" },
    { nom: "Pesticide bio", dateAjout: "2024-02-10" },
    { nom: "Fertilisant", dateAjout: "2024-03-05" },
    { nom: "Herbicide", dateAjout: "2024-04-20" },
    { nom: "Engrais liquide", dateAjout: "2024-05-15" }
  ];
  
  console.log("\n📋 Scénario 2: Deuxième récolte (2024-06-01), précédente (2024-03-01)");
  const test2 = filterIntrantsForHarvest(intrants2, "2024-06-01", "2024-03-01");
  console.log("Intrants valides:", test2.map(i => `${i.nom} (${i.dateAjout})`));
  console.log("✅ Attendu: Fertilisant, Herbicide et Engrais liquide (entre les deux récoltes)");
  
  // Scénario 3: Intrant ajouté après la récolte (ne doit pas apparaître)
  const intrants3 = [
    { nom: "Engrais de base", dateAjout: "2024-03-05" },
    { nom: "Pesticide", dateAjout: "2024-04-20" },
    { nom: "Engrais tardif", dateAjout: "2024-06-05" } // Après la récolte
  ];
  
  console.log("\n📋 Scénario 3: Récolte (2024-06-01) avec intrant tardif");
  const test3 = filterIntrantsForHarvest(intrants3, "2024-06-01", "2024-03-01");
  console.log("Intrants valides:", test3.map(i => `${i.nom} (${i.dateAjout})`));
  console.log("✅ Attendu: Seulement Pesticide (Engrais tardif exclu car après récolte)");
  
  console.log("\n🎯 Règle testée: Les intrants associés à une récolte sont uniquement ceux appliqués après la récolte précédente et avant/à la récolte actuelle");
};

// Fonction utilitaire pour tester en console
window.testRegleIntrants = testRegleAssociationIntrants;