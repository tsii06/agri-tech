// Test de la nouvelle logique de saison dynamique
// Exécuter avec: node test_saison_dynamique.js

/**
 * Test de la fonction computeSeasonFromDate avec le nouveau système
 */
function computeSeasonFromDate(dateRecolte, dateRecoltePrecedente = null, intrants = [], idParcelle = null, numeroRecolte = 1) {
  if (!dateRecolte) return null;
  
  const dateFinCulture = new Date(dateRecolte);
  if (Number.isNaN(dateFinCulture.getTime())) return null;
  
  const year = dateFinCulture.getUTCFullYear();
  
  // 1. Déterminer le début de culture
  let dateDebutCulture;
  
  if (dateRecoltePrecedente) {
    // Pour les récoltes suivantes: début = jour après la récolte précédente
    const datePrecedente = new Date(dateRecoltePrecedente);
    dateDebutCulture = new Date(datePrecedente.getTime() + 24 * 60 * 60 * 1000); // +1 jour
  } else {
    // Pour la première récolte: chercher le premier intrant ajouté
    const intrantsAvecDate = intrants.filter(i => i.dateAjout || i.timestamp);
    if (intrantsAvecDate.length > 0) {
      // Trouver le plus ancien intrant
      const datesIntrants = intrantsAvecDate.map(i => {
        return i.dateAjout ? new Date(i.dateAjout).getTime() : Number(i.timestamp);
      }).filter(d => !isNaN(d));
      
      if (datesIntrants.length > 0) {
        const premierIntrant = Math.min(...datesIntrants);
        dateDebutCulture = new Date(premierIntrant);
      } else {
        // Fallback: début d'année si aucun intrant trouvé
        dateDebutCulture = new Date(Date.UTC(year, 0, 1));
      }
    } else {
      // Fallback: début d'année si aucun intrant
      dateDebutCulture = new Date(Date.UTC(year, 0, 1));
    }
  }
  
  // 2. Calculer la durée de culture en jours
  const dureeCultureMs = dateFinCulture.getTime() - dateDebutCulture.getTime();
  const dureeCultureJours = Math.ceil(dureeCultureMs / (24 * 60 * 60 * 1000));
  
  // 3. Créer l'identifiant de saison : Année + Numéro de récolte
  const identifiantSaison = `${year}-R${numeroRecolte}`;
  const nomSaison = idParcelle ? 
    `Culture ${identifiantSaison} (Parcelle ${idParcelle})` : 
    `Culture ${identifiantSaison}`;
  
  return {
    nom: nomSaison,
    identifiant: identifiantSaison,
    annee: year,
    numeroRecolte: numeroRecolte,
    parcelle: idParcelle,
    dateDebut: dateDebutCulture.toISOString().slice(0, 10),
    dateFin: dateFinCulture.toISOString().slice(0, 10),
    dureeCultureJours: dureeCultureJours,
    typeSaison: 'dynamique',
    premierIntrant: dateRecoltePrecedente ? null : dateDebutCulture.toISOString().slice(0, 10)
  };
}

// Tests
console.log("🧪 Tests de la nouvelle logique de saison dynamique\n");

// Test 1: Première récolte avec intrants
console.log("📋 Test 1: Première récolte avec intrants");
const intrants1 = [
  { nom: "Semence", dateAjout: "2024-01-15" },
  { nom: "Engrais", dateAjout: "2024-02-01" },
  { nom: "Pesticide", dateAjout: "2024-03-15" }
];
const saison1 = computeSeasonFromDate("2024-06-15", null, intrants1, 5, 1);
console.log("Résultat:", JSON.stringify(saison1, null, 2));
console.log(`✅ Durée de culture: ${saison1.dureeCultureJours} jours\n`);

// Test 2: Deuxième récolte avec récolte précédente
console.log("📋 Test 2: Deuxième récolte avec récolte précédente");
const saison2 = computeSeasonFromDate("2024-11-20", "2024-06-15", [], 5, 2);
console.log("Résultat:", JSON.stringify(saison2, null, 2));
console.log(`✅ Durée de culture: ${saison2.dureeCultureJours} jours\n`);

// Test 3: Troisième récolte dans l'année suivante
console.log("📋 Test 3: Troisième récolte dans l'année suivante");
const saison3 = computeSeasonFromDate("2025-03-10", "2024-11-20", [], 5, 3);
console.log("Résultat:", JSON.stringify(saison3, null, 2));
console.log(`✅ Durée de culture: ${saison3.dureeCultureJours} jours\n`);

// Test 4: Première récolte sans intrants (fallback)
console.log("📋 Test 4: Première récolte sans intrants (fallback)");
const saison4 = computeSeasonFromDate("2024-08-30", null, [], 10, 1);
console.log("Résultat:", JSON.stringify(saison4, null, 2));
console.log(`✅ Durée de culture: ${saison4.dureeCultureJours} jours\n`);

// Comparaison avec l'ancien système
console.log("📊 Comparaison Ancien vs Nouveau Système");
console.log("═══════════════════════════════════════");

function ancienSysteme(dateRecolte) {
  const d = new Date(dateRecolte);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const periode = month <= 6 ? 1 : 2;
  return {
    nom: `Saison ${year}${periode === 1 ? 'H1' : 'H2'}`,
    periode: periode === 1 ? 'H1' : 'H2'
  };
}

const dateTest = "2024-06-15";
const ancienne = ancienSysteme(dateTest);
const nouvelle = computeSeasonFromDate(dateTest, null, intrants1, 5, 1);

console.log("Ancien système:", ancienne);
console.log("Nouveau système:", {
  nom: nouvelle.nom,
  identifiant: nouvelle.identifiant,
  duree: `${nouvelle.dureeCultureJours} jours`
});

console.log("\n🎯 Avantages du nouveau système:");
console.log("- ✅ Période de culture réelle");
console.log("- ✅ Numérotation séquentielle par parcelle");
console.log("- ✅ Traçabilité précise des intrants");
console.log("- ✅ Flexibilité (1, 2, ou N récoltes par an)");
console.log("- ✅ Durée de culture mesurable");