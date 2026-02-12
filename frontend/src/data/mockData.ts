// ─────────────────────────────────────────────────────────────
// Générateur de Données Simulées — Basé sur le Dataset FiFAR
// ─────────────────────────────────────────────────────────────
// Ce module génère des données réalistes pour simuler le système
// de détection de fraude en temps réel avec 50 experts synthétiques.
// Les distributions sont basées sur les caractéristiques réelles du FiFAR.

import type {
    Transaction,
    FraudExpert,
    MLModel,
    L2DDecision,
    PipelineMetrics,
    KafkaTopic,
    Alert,
    ModelMetrics,
    FairnessMetrics,
    SystemHealth,
    ExpertPrediction,
    ChartDataPoint,
} from '../types';

// ═══════════════════════════════════════════════════════════
//  Utilitaires de Génération Aléatoire
// ═══════════════════════════════════════════════════════════

/** Génère un nombre aléatoire entre min et max */
const rand = (min: number, max: number): number =>
    Math.random() * (max - min) + min;

/** Génère un entier aléatoire entre min et max (inclus) */
const randInt = (min: number, max: number): number =>
    Math.floor(rand(min, max + 1));

/** Choisit un élément aléatoire dans un tableau */
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Génère un identifiant unique simplifié */
const genId = (): string =>
    `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

/** Arrondi à N décimales */
const round = (n: number, d = 2): number => +n.toFixed(d);

// ═══════════════════════════════════════════════════════════
//  Constantes de Simulation
//  Basées sur les caractéristiques du dataset FiFAR
// ═══════════════════════════════════════════════════════════

// Noms de commerçants simulés
const MARCHANDS = [
    'Amazon', 'Carrefour', 'Netflix', 'Uber', 'SNCF', 'Total Energies',
    'Leclerc', 'Fnac', 'Apple Store', 'Google Play', 'Spotify', 'Auchan',
    'Booking.com', 'AirBnB', 'Zalando', 'Deliveroo', 'Bolt', 'CDiscount',
    'Lidl', 'Intermarché', 'Decathlon', 'Leroy Merlin', 'IKEA', 'Sephora',
];

// Catégories de commerçants
const CATEGORIES_MARCHANDS = [
    'E-commerce', 'Alimentation', 'Divertissement', 'Transport',
    'Énergie', 'Électronique', 'Voyage', 'Mode', 'Restauration',
    'Sport', 'Maison', 'Beauté',
];

// Pays (pondérés selon le risque)
const PAYS = [
    'France', 'Allemagne', 'Espagne', 'Italie', 'Belgique',
    'Royaume-Uni', 'Pays-Bas', 'Portugal', 'Suisse', 'USA',
    'Brésil', 'Chine', 'Nigeria', 'Russie', 'Indonésie',
];

// Villes françaises
const VILLES = [
    'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice',
    'Nantes', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes',
    'Montpellier', 'Grenoble', 'Rouen', 'Toulon', 'Dijon',
];

// Noms pour les clients
const PRENOMS = [
    'Jean', 'Marie', 'Pierre', 'Sophie', 'Laurent',
    'Isabelle', 'François', 'Nathalie', 'Philippe', 'Catherine',
    'Thomas', 'Camille', 'Nicolas', 'Émilie', 'Alexandre',
    'Julie', 'Sébastien', 'Lucie', 'Mathieu', 'Clara',
];

const NOMS = [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert',
    'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
    'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia',
    'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
];

// Spécialisations des experts de fraude
const SPECIALISATIONS = [
    'Fraude en ligne',
    'Fraude par carte',
    'Blanchiment d\'argent',
    'Usurpation d\'identité',
    'Fraude aux paiements mobiles',
    'Fraude internationale',
    'Fraude récurrente',
    'Fraude en point de vente',
    'Phishing et ingénierie sociale',
    'Fraude aux cryptomonnaies',
];

// ═══════════════════════════════════════════════════════════
//  Génération des Transactions
// ═══════════════════════════════════════════════════════════

/**
 * Génère une transaction simulée réaliste.
 * Les fraudes représentent environ 1.2% des transactions (réaliste FiFAR).
 * Les montants frauduleux sont en moyenne plus élevés.
 */
export function genererTransaction(forceStatus?: Transaction['status']): Transaction {
    // Les fraudes sont rares : environ 1.2% des transactions (comme dans FiFAR)
    const estFraude = Math.random() < 0.012;

    // Les montants frauduleux sont en moyenne plus élevés
    const montant = estFraude
        ? round(rand(200, 15000))   // Fraude : montants plus élevés
        : round(rand(1, 3000));     // Normal : montants variés

    // Score du modèle ML — corrélé avec la fraude mais imparfait
    const scoreModele = estFraude
        ? round(rand(0.55, 0.99))   // Le modèle détecte souvent les fraudes (score élevé)
        : round(rand(0.01, 0.45));  // Mais pas toujours parfait

    // Déterminer le niveau de risque à partir du score
    const niveauRisque: Transaction['riskLevel'] =
        scoreModele > 0.85 ? 'critical' :
            scoreModele > 0.65 ? 'high' :
                scoreModele > 0.4 ? 'medium' : 'low';

    // Statut de la transaction
    const statut = forceStatus || (
        scoreModele > 0.85 ? 'blocked' :
            scoreModele > 0.6 ? 'review' :
                scoreModele > 0.4 ? 'deferred' : 'approved'
    );

    // Générer un horodatage dans les dernières 24h
    const maintenant = Date.now();
    const horodatage = new Date(maintenant - randInt(0, 86400000));

    return {
        id: `TXN-${genId()}`,
        timestamp: horodatage.toISOString(),
        amount: montant,
        currency: 'EUR',
        merchant: pick(MARCHANDS),
        merchantCategory: pick(CATEGORIES_MARCHANDS),
        customerId: `CLI-${randInt(10000, 99999)}`,
        customerName: `${pick(PRENOMS)} ${pick(NOMS)}`,
        cardType: pick(['credit', 'debit']),
        country: pick(PAYS),
        city: pick(VILLES),
        channel: pick(['online', 'pos', 'atm', 'mobile']),
        isRecurring: Math.random() < 0.15, // 15% de paiements récurrents
        deviceId: `DEV-${randInt(1000, 9999)}`,
        ipAddress: `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
        month: randInt(1, 12),
        fraudBool: estFraude,
        modelScore: scoreModele,
        riskLevel: niveauRisque,
        status: statut,
        expertConsensus: estFraude
            ? round(rand(0.6, 0.95))    // Experts tendent à confirmer les fraudes
            : round(rand(0.05, 0.4)),   // Experts tendent à confirmer les légitimes
    };
}

/** Génère un lot de transactions simulées */
export function genererTransactions(nombre: number): Transaction[] {
    return Array.from({ length: nombre }, () => genererTransaction());
}

// ═══════════════════════════════════════════════════════════
//  Génération des 50 Experts Synthétiques
//  Basée sur les profils d'experts du dataset FiFAR
// ═══════════════════════════════════════════════════════════

/**
 * Génère les 50 experts synthétiques du FiFAR.
 * Chaque expert a des caractéristiques uniques :
 * - Performance variable (certains sont meilleurs que d'autres)
 * - Biais différents (dépendance à certaines features)
 * - Spécialisations variées
 * - Capacités de travail différentes
 */
export function genererExperts(): FraudExpert[] {
    const experts: FraudExpert[] = [];

    for (let i = 0; i < 50; i++) {
        // Chaque expert a une précision différente (entre 0.65 et 0.95)
        // Distribué de façon réaliste — la plupart sont corrects
        const precision = round(rand(0.65, 0.96));

        // Le taux de faux positifs varie inversement avec la précision
        const tauxFP = round(rand(0.02, 0.15));
        const tauxFN = round(rand(0.03, 0.20));

        // Temps de réponse moyen (en secondes) — varie selon l'expert
        const tempsReponse = round(rand(30, 300));

        // Capacité de travail (nombre de cas par jour)
        const capaciteMax = randInt(20, 80);
        const casEnCours = randInt(0, capaciteMax);
        const chargeActuelle = round(casEnCours / capaciteMax);

        // Générer un historique de performance sur 30 jours
        const historique = Array.from({ length: 30 }, (_, j) => ({
            date: new Date(Date.now() - (29 - j) * 86400000).toISOString().split('T')[0],
            casesReviewed: randInt(15, capaciteMax),
            accuracy: round(precision + rand(-0.05, 0.05)),
            avgResponseTime: round(tempsReponse + rand(-30, 30)),
            falsePositives: randInt(0, 5),
            falseNegatives: randInt(0, 3),
            truePositives: randInt(5, 20),
            trueNegatives: randInt(10, 50),
        }));

        // Profil de biais — certains experts sont plus biaisés que d'autres
        const profilBiais = {
            featureDependence: {
                montant: round(rand(0, 1)),
                pays: round(rand(0, 1)),
                canal: round(rand(0, 1)),
                heure: round(rand(0, 1)),
                categorie_marchand: round(rand(0, 1)),
            },
            overallBias: round(rand(0, 0.3)),
            categoryBias: {
                'E-commerce': round(rand(-0.1, 0.2)),
                'Transport': round(rand(-0.1, 0.2)),
                'Voyage': round(rand(-0.1, 0.3)),
                'Divertissement': round(rand(-0.05, 0.1)),
            },
        };

        const statuts: FraudExpert['status'][] = ['available', 'busy', 'offline', 'break'];
        const poidStatut = [0.5, 0.3, 0.1, 0.1]; // 50% disponible, 30% occupé, etc.
        let randStatut = Math.random();
        let statutChoisi: FraudExpert['status'] = 'available';
        for (let s = 0; s < statuts.length; s++) {
            randStatut -= poidStatut[s];
            if (randStatut <= 0) { statutChoisi = statuts[s]; break; }
        }

        experts.push({
            id: `EXP-${String(i + 1).padStart(3, '0')}`,
            name: `${pick(PRENOMS)} ${pick(NOMS)}`,
            specialization: pick(SPECIALISATIONS),
            accuracy: precision,
            falsePositiveRate: tauxFP,
            falseNegativeRate: tauxFN,
            avgResponseTime: tempsReponse,
            currentLoad: chargeActuelle,
            maxCapacity: capaciteMax,
            currentCases: casEnCours,
            isAvailable: statutChoisi === 'available',
            performanceHistory: historique,
            biasProfile: profilBiais,
            status: statutChoisi,
        });
    }

    return experts;
}

// ═══════════════════════════════════════════════════════════
//  Génération des Modèles ML
// ═══════════════════════════════════════════════════════════

/**
 * Génère les modèles ML déployés dans le système.
 * Inclut les modèles mentionnés dans le FiFAR :
 * - XGBoost (modèle principal)
 * - LightGBM (modèle alternatif)
 * - Random Forest (baseline)
 * - Réseau de neurones (deep learning)
 * - Isolation Forest (détection d'anomalies)
 * - Ensemble (combinaison de modèles)
 */
export function genererModeles(): MLModel[] {
    return [
        {
            id: 'MDL-001',
            name: 'XGBoost Fraud Detector v3',
            type: 'xgboost',
            version: '3.2.1',
            accuracy: 0.967,
            precision: 0.924,
            recall: 0.958,
            f1Score: 0.941,
            f2Score: 0.951,
            falsePositiveRate: 0.008,
            auc: 0.983,
            avgLatencyMs: 12,
            status: 'active',            // Modèle principal en production
            lastTrained: '2026-02-10T14:30:00Z',
            trainingDataSize: 850000,    // 850K transactions d'entraînement
            featureImportance: {
                montant: 0.18,
                pays_risque: 0.15,
                velocite_5min: 0.14,
                canal: 0.12,
                heure_journee: 0.10,
                nouveau_marchand: 0.09,
                distance_domicile: 0.08,
                score_appareil: 0.07,
                categorie_marchand: 0.04,
                recurrence: 0.03,
            },
        },
        {
            id: 'MDL-002',
            name: 'LightGBM Detector v2',
            type: 'lightgbm',
            version: '2.8.0',
            accuracy: 0.961,
            precision: 0.918,
            recall: 0.952,
            f1Score: 0.935,
            f2Score: 0.945,
            falsePositiveRate: 0.009,
            auc: 0.979,
            avgLatencyMs: 8,             // Plus rapide que XGBoost
            status: 'canary',            // En test canary (déployé sur un petit % du trafic)
            lastTrained: '2026-02-11T09:15:00Z',
            trainingDataSize: 850000,
            featureImportance: {
                montant: 0.20,
                velocite_5min: 0.16,
                pays_risque: 0.13,
                canal: 0.11,
                heure_journee: 0.09,
                nouveau_marchand: 0.10,
                distance_domicile: 0.07,
                score_appareil: 0.06,
                categorie_marchand: 0.05,
                recurrence: 0.03,
            },
        },
        {
            id: 'MDL-003',
            name: 'Random Forest Baseline',
            type: 'random_forest',
            version: '1.5.0',
            accuracy: 0.943,
            precision: 0.895,
            recall: 0.931,
            f1Score: 0.913,
            f2Score: 0.923,
            falsePositiveRate: 0.012,
            auc: 0.968,
            avgLatencyMs: 25,
            status: 'shadow',            // En mode shadow (exécuté en parallèle sans impact)
            lastTrained: '2026-02-05T11:00:00Z',
            trainingDataSize: 850000,
            featureImportance: {
                montant: 0.16,
                pays_risque: 0.14,
                velocite_5min: 0.13,
                canal: 0.12,
                heure_journee: 0.11,
                nouveau_marchand: 0.08,
                distance_domicile: 0.09,
                score_appareil: 0.08,
                categorie_marchand: 0.06,
                recurrence: 0.03,
            },
        },
        {
            id: 'MDL-004',
            name: 'Deep Neural Network v1',
            type: 'neural_network',
            version: '1.2.0',
            accuracy: 0.972,
            precision: 0.931,
            recall: 0.965,
            f1Score: 0.948,
            f2Score: 0.958,
            falsePositiveRate: 0.007,
            auc: 0.988,
            avgLatencyMs: 35,            // Plus lent mais plus précis
            status: 'shadow',
            lastTrained: '2026-02-08T16:45:00Z',
            trainingDataSize: 850000,
            featureImportance: {
                montant: 0.15,
                pays_risque: 0.13,
                velocite_5min: 0.15,
                canal: 0.10,
                heure_journee: 0.12,
                nouveau_marchand: 0.11,
                distance_domicile: 0.08,
                score_appareil: 0.09,
                categorie_marchand: 0.04,
                recurrence: 0.03,
            },
        },
        {
            id: 'MDL-005',
            name: 'Isolation Forest (Anomalies)',
            type: 'isolation_forest',
            version: '2.0.0',
            accuracy: 0.912,
            precision: 0.856,
            recall: 0.978,              // Très bon rappel — détecte presque tout mais plus de faux positifs
            f1Score: 0.913,
            f2Score: 0.950,
            falsePositiveRate: 0.045,   // Taux de faux positifs plus élevé (normal pour anomalie)
            auc: 0.951,
            avgLatencyMs: 5,            // Très rapide
            status: 'active',
            lastTrained: '2026-02-09T08:00:00Z',
            trainingDataSize: 950000,   // Entraîné sur plus de données (non supervisé)
            featureImportance: {
                montant: 0.22,
                velocite_5min: 0.18,
                distance_domicile: 0.15,
                heure_journee: 0.12,
                pays_risque: 0.10,
                nouveau_marchand: 0.08,
                canal: 0.07,
                score_appareil: 0.05,
                categorie_marchand: 0.02,
                recurrence: 0.01,
            },
        },
        {
            id: 'MDL-006',
            name: 'Ensemble Hybride (ML + Experts)',
            type: 'ensemble',
            version: '1.0.0',
            accuracy: 0.979,             // Le meilleur : combine ML et experts
            precision: 0.945,
            recall: 0.971,
            f1Score: 0.958,
            f2Score: 0.966,
            falsePositiveRate: 0.005,    // Très peu de faux positifs
            auc: 0.992,
            avgLatencyMs: 45,            // Plus lent car attend parfois les experts
            status: 'canary',
            lastTrained: '2026-02-11T20:30:00Z',
            trainingDataSize: 850000,
            featureImportance: {
                consensus_experts: 0.20,   // Le consensus des experts est la feature #1
                score_xgboost: 0.18,
                montant: 0.12,
                velocite_5min: 0.10,
                desaccord_expert_ml: 0.09,
                pays_risque: 0.08,
                score_anomalie: 0.07,
                canal: 0.06,
                heure_journee: 0.05,
                confiance_modele: 0.05,
            },
        },
    ];
}

// ═══════════════════════════════════════════════════════════
//  Génération des Décisions L2D (Learning to Defer)
// ═══════════════════════════════════════════════════════════

/**
 * Simule une décision L2D pour une transaction.
 * Le système décide si :
 * 1. Le modèle peut décider seul (auto_approve ou auto_block)
 * 2. Il faut déléguer à un expert humain (defer_to_expert)
 *
 * Basé sur les algorithmes du paper FiFAR : OvA, DeCCaF, Rejection Learning
 */
export function genererDecisionL2D(
    transaction: Transaction,
    experts: FraudExpert[]
): L2DDecision {
    const seuilConfiance = 0.7; // Seuil au-dessus duquel le modèle décide seul
    const confiance = Math.abs(transaction.modelScore - 0.5) * 2; // Transforme en confiance (0 = incertain, 1 = certain)

    let decision: L2DDecision['decision'];
    let expertAssigne: string | undefined;
    let raisonDeference: string | undefined;

    if (confiance >= seuilConfiance) {
        // Le modèle est suffisamment confiant — décision automatique
        decision = transaction.modelScore > 0.5 ? 'auto_block' : 'auto_approve';
    } else {
        // Le modèle n'est pas confiant — déléguer à un expert
        decision = 'defer_to_expert';

        // Trouver le meilleur expert disponible
        const expertsDisponibles = experts.filter(e => e.isAvailable && e.currentLoad < 0.9);

        if (expertsDisponibles.length > 0) {
            // Choisir l'expert avec la meilleure précision ET de la capacité
            const meilleurExpert = expertsDisponibles.reduce((best, e) =>
                (e.accuracy * (1 - e.currentLoad)) > (best.accuracy * (1 - best.currentLoad)) ? e : best
            );
            expertAssigne = meilleurExpert.id;
        }

        // Raison de la déférence
        if (confiance < 0.3) {
            raisonDeference = 'Score de confiance très bas — zone d\'incertitude maximale';
        } else if (transaction.amount > 5000) {
            raisonDeference = 'Transaction de montant élevé nécessitant validation humaine';
        } else {
            raisonDeference = 'Confiance insuffisante du modèle ML pour une auto-décision';
        }
    }

    return {
        transactionId: transaction.id,
        modelScore: transaction.modelScore,
        modelConfidence: round(confiance),
        decision,
        assignedExpertId: expertAssigne,
        deferReason: raisonDeference,
        confidenceThreshold: seuilConfiance,
        estimatedExpertAccuracy: expertAssigne ? round(rand(0.85, 0.95)) : undefined,
        capacityAware: true,
        finalDecision: decision === 'defer_to_expert' ? undefined :
            (decision === 'auto_block' ? 'fraud' : 'legitimate'),
        finalDecisionSource: decision === 'defer_to_expert' ? undefined : 'model',
        processingTimeMs: round(rand(5, 95)),
    };
}

// ═══════════════════════════════════════════════════════════
//  Génération des Prédictions d'Experts
// ═══════════════════════════════════════════════════════════

/**
 * Simule les prédictions de tous les experts pour une transaction.
 * Chaque expert a sa propre probabilité de se tromper,
 * ce qui crée des désaccords réalistes comme dans le FiFAR.
 */
export function genererPredictionsExperts(
    transaction: Transaction,
    experts: FraudExpert[]
): ExpertPrediction[] {
    return experts.map(expert => {
        // La prédiction de l'expert est basée sur sa précision
        // mais aussi influencée par ses biais
        let probabiliteCorrection = expert.accuracy;

        // Ajuster selon les biais de l'expert
        const biais = expert.biasProfile;
        if (transaction.amount > 5000 && biais.featureDependence['montant'] > 0.7) {
            probabiliteCorrection += 0.05; // Plus attentif aux gros montants
        }

        // L'expert prédit correctement avec sa probabilité de correction
        const estCorrect = Math.random() < probabiliteCorrection;
        const prediction = estCorrect ? transaction.fraudBool : !transaction.fraudBool;

        return {
            expertId: expert.id,
            transactionId: transaction.id,
            prediction,
            confidence: round(rand(0.5, 0.99)),
            responseTime: round(expert.avgResponseTime + rand(-20, 40)),
        };
    });
}

// ═══════════════════════════════════════════════════════════
//  Génération des Topics Kafka
// ═══════════════════════════════════════════════════════════

/** Génère l'état actuel des topics Kafka du pipeline */
export function genererTopicsKafka(): KafkaTopic[] {
    return [
        {
            name: 'fifar-transactions-raw',
            partitions: 12,
            replicationFactor: 3,
            messagesPerSecond: round(rand(8000, 12000)),
            avgMessageSize: 512,
            consumerLag: randInt(0, 50),
            status: 'healthy',
        },
        {
            name: 'fifar-ml-predictions',
            partitions: 12,
            replicationFactor: 3,
            messagesPerSecond: round(rand(7500, 11500)),
            avgMessageSize: 256,
            consumerLag: randInt(0, 30),
            status: 'healthy',
        },
        {
            name: 'fifar-expert-predictions',
            partitions: 6,
            replicationFactor: 3,
            messagesPerSecond: round(rand(100, 500)),
            avgMessageSize: 384,
            consumerLag: randInt(0, 100),
            status: Math.random() > 0.1 ? 'healthy' : 'warning',
        },
        {
            name: 'fifar-fraud-alerts',
            partitions: 6,
            replicationFactor: 3,
            messagesPerSecond: round(rand(50, 200)),
            avgMessageSize: 640,
            consumerLag: randInt(0, 10),
            status: 'healthy',
        },
        {
            name: 'fifar-expert-assignments',
            partitions: 6,
            replicationFactor: 3,
            messagesPerSecond: round(rand(100, 400)),
            avgMessageSize: 192,
            consumerLag: randInt(0, 20),
            status: 'healthy',
        },
        {
            name: 'fifar-feedback',
            partitions: 3,
            replicationFactor: 3,
            messagesPerSecond: round(rand(50, 150)),
            avgMessageSize: 448,
            consumerLag: randInt(0, 5),
            status: 'healthy',
        },
        {
            name: 'fifar-capacity-status',
            partitions: 3,
            replicationFactor: 3,
            messagesPerSecond: round(rand(10, 50)),
            avgMessageSize: 128,
            consumerLag: 0,
            status: 'healthy',
        },
    ];
}

// ═══════════════════════════════════════════════════════════
//  Génération des Métriques du Pipeline
// ═══════════════════════════════════════════════════════════

/** Génère des métriques de performance du pipeline sur une période */
export function genererMetriquesPipeline(nbPoints: number): PipelineMetrics[] {
    const maintenant = Date.now();
    return Array.from({ length: nbPoints }, (_, i) => {
        const horodatage = new Date(maintenant - (nbPoints - 1 - i) * 60000); // 1 point par minute
        const tps = round(rand(8000, 12000));   // Transactions par seconde

        return {
            timestamp: horodatage.toISOString(),
            transactionsProcessed: randInt(400000, 600000),
            transactionsPerSecond: tps,
            avgLatencyMs: round(rand(15, 45)),
            p99LatencyMs: round(rand(60, 95)),
            kafkaLag: randInt(0, 100),
            errorRate: round(rand(0, 0.005), 4),
            fraudsDetected: randInt(50, 150),
            falsePositives: randInt(5, 25),
            deferredToExpert: randInt(100, 400),
            autoDecisions: randInt(7000, 11000),
            expertUtilization: round(rand(0.5, 0.85)),
        };
    });
}

// ═══════════════════════════════════════════════════════════
//  Génération des Métriques de Modèle
// ═══════════════════════════════════════════════════════════

/** Génère l'historique des métriques d'un modèle ML */
export function genererMetriquesModele(nbPoints: number): ModelMetrics[] {
    const maintenant = Date.now();
    return Array.from({ length: nbPoints }, (_, i) => {
        const horodatage = new Date(maintenant - (nbPoints - 1 - i) * 3600000); // 1 point par heure
        // Simuler une légère dérive du modèle au fil du temps
        const derive = Math.sin(i / 20) * 0.02; // Oscillation naturelle

        return {
            timestamp: horodatage.toISOString(),
            accuracy: round(0.967 + derive + rand(-0.005, 0.005)),
            precision: round(0.924 + derive + rand(-0.008, 0.008)),
            recall: round(0.958 + derive * 0.5 + rand(-0.005, 0.005)),
            f1Score: round(0.941 + derive * 0.7 + rand(-0.006, 0.006)),
            f2Score: round(0.951 + derive * 0.6 + rand(-0.005, 0.005)),
            falsePositiveRate: round(0.008 - derive * 0.3 + rand(-0.002, 0.002), 4),
            truePositiveRate: round(0.958 + derive * 0.5 + rand(-0.005, 0.005)),
            auc: round(0.983 + derive * 0.3 + rand(-0.003, 0.003)),
            avgLatencyMs: round(12 + rand(-3, 5)),
            throughput: round(rand(9000, 11000)),
            totalPredictions: randInt(800000, 1200000),
            driftScore: round(Math.abs(derive) * 10 + rand(0, 0.5)),
        };
    });
}

// ═══════════════════════════════════════════════════════════
//  Génération des Alertes
// ═══════════════════════════════════════════════════════════

/** Génère des alertes système réalistes */
export function genererAlertes(): Alert[] {
    const maintenant = Date.now();
    return [
        {
            id: 'ALR-001',
            type: 'fraud_detected',
            severity: 'critical',
            title: 'Pic de fraudes détecté',
            message: 'Le taux de fraude a augmenté de 300% dans les 15 dernières minutes. 23 transactions suspectes identifiées sur le canal en ligne.',
            timestamp: new Date(maintenant - 120000).toISOString(),
            acknowledged: false,
            relatedTransactionId: 'TXN-groupe-23',
            metadata: { fraudCount: 23, normalRate: 0.012, currentRate: 0.048 },
        },
        {
            id: 'ALR-002',
            type: 'model_drift',
            severity: 'warning',
            title: 'Dérive du modèle détectée',
            message: 'Le score de dérive du modèle XGBoost a dépassé le seuil de 0.3. La précision a baissé de 2.1% sur les dernières 6 heures. Ré-entraînement recommandé.',
            timestamp: new Date(maintenant - 900000).toISOString(),
            acknowledged: false,
            relatedModelId: 'MDL-001',
            metadata: { driftScore: 0.34, precisionDrop: 0.021 },
        },
        {
            id: 'ALR-003',
            type: 'capacity_warning',
            severity: 'warning',
            title: 'Capacité des experts à 85%',
            message: '42 experts sur 50 sont actuellement occupés. La file d\'attente des cas en attente contient 156 transactions. Risque de saturation dans 30 minutes.',
            timestamp: new Date(maintenant - 600000).toISOString(),
            acknowledged: true,
            metadata: { expertsBusy: 42, queueSize: 156, estimatedSaturationMinutes: 30 },
        },
        {
            id: 'ALR-004',
            type: 'latency_spike',
            severity: 'error',
            title: 'Pic de latence - API de prédiction',
            message: 'La latence P99 de l\'API de prédiction a atteint 142ms (seuil : 100ms). Cause probable : surcharge du service de Feature Store.',
            timestamp: new Date(maintenant - 1800000).toISOString(),
            acknowledged: true,
            metadata: { p99LatencyMs: 142, threshold: 100, cause: 'feature_store_overload' },
        },
        {
            id: 'ALR-005',
            type: 'fairness_violation',
            severity: 'warning',
            title: 'Disparité de taux de faux positifs',
            message: 'Le taux de faux positifs pour le groupe d\'âge 18-25 ans est 2.3x plus élevé que pour le groupe 35-50 ans. Violation de la contrainte d\'équité.',
            timestamp: new Date(maintenant - 3600000).toISOString(),
            acknowledged: false,
            metadata: { attribute: 'age', groupA: '18-25', groupB: '35-50', ratio: 2.3 },
        },
        {
            id: 'ALR-006',
            type: 'system_error',
            severity: 'info',
            title: 'Reconnexion Kafka réussie',
            message: 'Le consumer group "fraud-detection" s\'est reconnecté avec succès après un rebalancement des partitions. Aucune perte de message détectée.',
            timestamp: new Date(maintenant - 7200000).toISOString(),
            acknowledged: true,
            metadata: { consumerGroup: 'fraud-detection', rebalanceTime: '2.3s' },
        },
        {
            id: 'ALR-007',
            type: 'fraud_detected',
            severity: 'critical',
            title: 'Fraude internationale de haut montant',
            message: 'Transaction de 12 450€ détectée depuis le Nigeria avec une carte française. Score ML : 0.97. Déférée à l\'expert EXP-003 (spécialiste fraude internationale).',
            timestamp: new Date(maintenant - 300000).toISOString(),
            acknowledged: false,
            relatedTransactionId: 'TXN-int-12450',
            relatedExpertId: 'EXP-003',
            metadata: { amount: 12450, country: 'Nigeria', expertScore: 0.97 },
        },
    ];
}

// ═══════════════════════════════════════════════════════════
//  Génération des Métriques d'Équité (Fairness)
// ═══════════════════════════════════════════════════════════

/** Génère les métriques d'équité pour différents attributs protégés */
export function genererMetriquesEquite(): FairnessMetrics[] {
    return [
        {
            attribute: 'Tranche d\'âge',
            groups: [
                { name: '18-25 ans', size: 185000, falsePositiveRate: 0.024, falseNegativeRate: 0.035, approvalRate: 0.921, deferralRate: 0.15 },
                { name: '26-35 ans', size: 280000, falsePositiveRate: 0.012, falseNegativeRate: 0.028, approvalRate: 0.952, deferralRate: 0.10 },
                { name: '36-50 ans', size: 310000, falsePositiveRate: 0.008, falseNegativeRate: 0.032, approvalRate: 0.968, deferralRate: 0.08 },
                { name: '51-65 ans', size: 160000, falsePositiveRate: 0.010, falseNegativeRate: 0.041, approvalRate: 0.961, deferralRate: 0.09 },
                { name: '65+ ans', size: 65000, falsePositiveRate: 0.015, falseNegativeRate: 0.052, approvalRate: 0.945, deferralRate: 0.12 },
            ],
            disparityScore: 0.18,
            equalizedOddsGap: 0.12,
            demographicParityGap: 0.047,
        },
        {
            attribute: 'Type de compte',
            groups: [
                { name: 'Compte courant', size: 520000, falsePositiveRate: 0.009, falseNegativeRate: 0.030, approvalRate: 0.958, deferralRate: 0.09 },
                { name: 'Compte épargne', size: 280000, falsePositiveRate: 0.007, falseNegativeRate: 0.035, approvalRate: 0.965, deferralRate: 0.07 },
                { name: 'Compte jeune', size: 120000, falsePositiveRate: 0.022, falseNegativeRate: 0.028, approvalRate: 0.930, deferralRate: 0.14 },
                { name: 'Compte professionnel', size: 80000, falsePositiveRate: 0.011, falseNegativeRate: 0.025, approvalRate: 0.955, deferralRate: 0.10 },
            ],
            disparityScore: 0.12,
            equalizedOddsGap: 0.09,
            demographicParityGap: 0.035,
        },
        {
            attribute: 'Région géographique',
            groups: [
                { name: 'Île-de-France', size: 310000, falsePositiveRate: 0.011, falseNegativeRate: 0.029, approvalRate: 0.953, deferralRate: 0.10 },
                { name: 'Auvergne-Rhône-Alpes', size: 150000, falsePositiveRate: 0.008, falseNegativeRate: 0.033, approvalRate: 0.964, deferralRate: 0.08 },
                { name: 'PACA', size: 130000, falsePositiveRate: 0.013, falseNegativeRate: 0.031, approvalRate: 0.948, deferralRate: 0.11 },
                { name: 'Occitanie', size: 110000, falsePositiveRate: 0.009, falseNegativeRate: 0.036, approvalRate: 0.960, deferralRate: 0.09 },
                { name: 'Autres régions', size: 300000, falsePositiveRate: 0.010, falseNegativeRate: 0.034, approvalRate: 0.957, deferralRate: 0.09 },
            ],
            disparityScore: 0.08,
            equalizedOddsGap: 0.06,
            demographicParityGap: 0.016,
        },
    ];
}

// ═══════════════════════════════════════════════════════════
//  Génération de l'État de Santé du Système
// ═══════════════════════════════════════════════════════════

/** Génère l'état de santé de tous les services du système */
export function genererSanteSysteme(): SystemHealth {
    return {
        kafka: {
            name: 'Apache Kafka',
            status: 'healthy',
            uptime: 99.98,
            latencyMs: round(rand(1, 5)),
            errorRate: round(rand(0, 0.001), 4),
            cpu: round(rand(25, 45)),
            memory: round(rand(55, 70)),
            lastCheck: new Date().toISOString(),
        },
        mlService: {
            name: 'Service ML (FastAPI)',
            status: 'healthy',
            uptime: 99.95,
            latencyMs: round(rand(8, 20)),
            errorRate: round(rand(0, 0.002), 4),
            cpu: round(rand(55, 75)),
            memory: round(rand(65, 80)),
            lastCheck: new Date().toISOString(),
        },
        featureStore: {
            name: 'Feature Store (Feast)',
            status: Math.random() > 0.1 ? 'healthy' : 'degraded',
            uptime: 99.90,
            latencyMs: round(rand(3, 12)),
            errorRate: round(rand(0, 0.003), 4),
            cpu: round(rand(30, 50)),
            memory: round(rand(50, 65)),
            lastCheck: new Date().toISOString(),
        },
        redis: {
            name: 'Redis (Cache)',
            status: 'healthy',
            uptime: 99.99,
            latencyMs: round(rand(0.5, 2)),
            errorRate: 0,
            cpu: round(rand(10, 25)),
            memory: round(rand(40, 60)),
            lastCheck: new Date().toISOString(),
        },
        postgres: {
            name: 'PostgreSQL / TimescaleDB',
            status: 'healthy',
            uptime: 99.97,
            latencyMs: round(rand(2, 8)),
            errorRate: round(rand(0, 0.001), 4),
            cpu: round(rand(35, 55)),
            memory: round(rand(60, 75)),
            lastCheck: new Date().toISOString(),
        },
        elasticsearch: {
            name: 'Elasticsearch',
            status: 'healthy',
            uptime: 99.92,
            latencyMs: round(rand(5, 15)),
            errorRate: round(rand(0, 0.002), 4),
            cpu: round(rand(40, 60)),
            memory: round(rand(65, 80)),
            lastCheck: new Date().toISOString(),
        },
        apiGateway: {
            name: 'API Gateway',
            status: 'healthy',
            uptime: 99.99,
            latencyMs: round(rand(1, 4)),
            errorRate: round(rand(0, 0.001), 4),
            cpu: round(rand(15, 35)),
            memory: round(rand(30, 45)),
            lastCheck: new Date().toISOString(),
        },
    };
}

// ═══════════════════════════════════════════════════════════
//  Données pour les Graphiques
// ═══════════════════════════════════════════════════════════

/** Distribution des décisions L2D (pour graphique en camembert) */
export function genererDistributionL2D(): ChartDataPoint[] {
    return [
        { name: 'Auto-approbation', value: 72, color: '#10b981' },
        { name: 'Auto-blocage', value: 8, color: '#ef4444' },
        { name: 'Déféré aux experts', value: 20, color: '#f59e0b' },
    ];
}

/** Distribution des types de fraude détectés */
export function genererTypesFraude(): ChartDataPoint[] {
    return [
        { name: 'Prise de contrôle de compte', value: 28, color: '#8b5cf6' },
        { name: 'Fraude par carte à distance', value: 24, color: '#ec4899' },
        { name: 'Usurpation d\'identité', value: 18, color: '#f59e0b' },
        { name: 'Phishing', value: 14, color: '#ef4444' },
        { name: 'Fraude au paiement mobile', value: 9, color: '#06b6d4' },
        { name: 'Autres', value: 7, color: '#6b7280' },
    ];
}

/** Comparaison de performance : ML seul vs Expert seul vs Hybride L2D */
export function genererComparaisonPerformance(): ChartDataPoint[] {
    return [
        { name: 'Précision', value: 0.924, value2: 0.945, color: '#8b5cf6' },
        { name: 'Rappel', value: 0.958, value2: 0.971, color: '#06b6d4' },
        { name: 'F1-Score', value: 0.941, value2: 0.958, color: '#10b981' },
        { name: 'AUC', value: 0.983, value2: 0.992, color: '#f59e0b' },
    ];
}

// ═══════════════════════════════════════════════════════════
//  Données Initiales (pré-générées au démarrage)
// ═══════════════════════════════════════════════════════════

/** Données initiales chargées au démarrage de l'application */
export const DONNEES_INITIALES = {
    transactions: genererTransactions(100),   // 100 transactions de départ
    experts: genererExperts(),                // 50 experts synthétiques
    modeles: genererModeles(),                // 6 modèles ML
    metriques: genererMetriquesPipeline(60),  // 60 minutes de métriques
    metriquesModele: genererMetriquesModele(72), // 72 heures de métriques
    topicsKafka: genererTopicsKafka(),        // État des topics
    alertes: genererAlertes(),                // Alertes actives
    equite: genererMetriquesEquite(),         // Métriques d'équité
    santeSysteme: genererSanteSysteme(),      // État de santé
    distributionL2D: genererDistributionL2D(),
    typesFraude: genererTypesFraude(),
    comparaisonPerformance: genererComparaisonPerformance(),
};
