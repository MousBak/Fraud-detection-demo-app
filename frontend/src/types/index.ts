// ─────────────────────────────────────────────────────────────
// Système de Détection de Fraude FiFAR — Définitions de Types
// ─────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════
//  Types liés aux Transactions
// ═══════════════════════════════════════════════════════════

/** Représente une transaction bancaire individuelle */
export interface Transaction {
  id: string;
  timestamp: string;                // Horodatage de la transaction
  amount: number;                   // Montant de la transaction
  currency: string;                 // Devise utilisée (EUR, USD, etc.)
  merchant: string;                 // Nom du commerçant
  merchantCategory: string;         // Catégorie du commerçant (alimentation, voyage, etc.)
  customerId: string;               // Identifiant unique du client
  customerName: string;             // Nom du client
  cardType: 'credit' | 'debit';    // Type de carte utilisée
  country: string;                  // Pays de la transaction
  city: string;                     // Ville de la transaction
  channel: 'online' | 'pos' | 'atm' | 'mobile'; // Canal : en ligne, terminal, guichet, mobile
  isRecurring: boolean;             // Est-ce un paiement récurrent ?
  deviceId?: string;                // Identifiant de l'appareil (optionnel)
  ipAddress?: string;               // Adresse IP (optionnel)
  // Champs spécifiques au dataset FiFAR
  month: number;                    // Mois de la transaction (dépendance temporelle)
  fraudBool: boolean;               // Vrai si la transaction est frauduleuse
  modelScore: number;               // Score de prédiction du modèle ML (0 à 1)
  riskLevel: 'low' | 'medium' | 'high' | 'critical'; // Niveau de risque évalué
  status: 'pending' | 'approved' | 'blocked' | 'review' | 'deferred'; // Statut actuel
  expertConsensus: number;           // Consensus des 50 experts FiFAR (0 à 1)
}

/** Features (caractéristiques) calculées pour chaque transaction */
export interface TransactionFeatures {
  transactionId: string;
  // --- Features de vélocité (rapidité des transactions) ---
  txnCountLast5Min: number;         // Nombre de transactions dans les 5 dernières minutes
  txnCountLast1Hour: number;        // Nombre de transactions dans la dernière heure
  txnCountLast24Hour: number;       // Nombre de transactions dans les dernières 24h
  avgAmountLast24Hour: number;      // Montant moyen sur les dernières 24h
  maxAmountLast24Hour: number;      // Montant maximum sur les dernières 24h
  // --- Features comportementales ---
  isNewMerchant: boolean;           // Est-ce un nouveau commerçant pour ce client ?
  isNewCountry: boolean;            // Est-ce un nouveau pays pour ce client ?
  isUnusualTime: boolean;           // Heure inhabituelle pour ce client ?
  distanceFromHome: number;         // Distance par rapport au domicile (en km)
  // --- Features agrégées ---
  merchantRiskScore: number;        // Score de risque du commerçant
  countryRiskScore: number;         // Score de risque du pays
  deviceTrustScore: number;         // Score de confiance de l'appareil
  // --- Features dérivées des experts FiFAR ---
  expertConsensusScore: number;     // Score de consensus entre les 50 experts
  expertDisagreementRate: number;   // Taux de désaccord entre les experts
}

// ═══════════════════════════════════════════════════════════
//  Types liés aux Experts et au Learning to Defer (L2D)
// ═══════════════════════════════════════════════════════════

/** Représente un analyste de fraude (expert synthétique FiFAR) */
export interface FraudExpert {
  id: string;
  name: string;                     // Nom de l'expert
  specialization: string;           // Domaine de spécialisation
  accuracy: number;                 // Précision globale (0 à 1)
  falsePositiveRate: number;        // Taux de faux positifs
  falseNegativeRate: number;        // Taux de faux négatifs
  avgResponseTime: number;          // Temps moyen de réponse (en secondes)
  currentLoad: number;              // Charge de travail actuelle (0 à 1)
  maxCapacity: number;              // Capacité maximale de cas par jour
  currentCases: number;             // Nombre de cas en cours
  isAvailable: boolean;             // Disponibilité actuelle
  performanceHistory: ExpertPerformance[]; // Historique de performance
  biasProfile: ExpertBiasProfile;   // Profil de biais de l'expert
  status: 'available' | 'busy' | 'offline' | 'break'; // Statut actuel
}

/** Performance d'un expert sur une période donnée */
export interface ExpertPerformance {
  date: string;                     // Date de la mesure
  casesReviewed: number;            // Nombre de cas examinés
  accuracy: number;                 // Précision sur cette période
  avgResponseTime: number;          // Temps moyen de réponse
  falsePositives: number;           // Nombre de faux positifs
  falseNegatives: number;           // Nombre de faux négatifs
  truePositives: number;            // Nombre de vrais positifs
  trueNegatives: number;            // Nombre de vrais négatifs
}

/** Profil de biais d'un expert — chaque expert FiFAR a des biais différents */
export interface ExpertBiasProfile {
  featureDependence: Record<string, number>; // Dépendance à chaque feature (0 à 1)
  overallBias: number;              // Biais global de l'expert
  categoryBias: Record<string, number>; // Biais par catégorie de commerçant
}

/** Prédiction individuelle d'un expert pour une transaction */
export interface ExpertPrediction {
  expertId: string;
  transactionId: string;
  prediction: boolean;              // true = fraude détectée
  confidence: number;               // Niveau de confiance (0 à 1)
  responseTime: number;             // Temps de réponse (en secondes)
  reasoning?: string;               // Justification de la décision (optionnel)
}

/**
 * Décision du système Learning to Defer (L2D)
 * Le L2D détermine si le modèle ML peut prendre la décision seul
 * ou s'il faut déléguer à un expert humain.
 */
export interface L2DDecision {
  transactionId: string;
  modelScore: number;               // Score brut du modèle ML
  modelConfidence: number;          // Confiance du modèle dans sa prédiction
  decision: 'auto_approve' | 'auto_block' | 'defer_to_expert'; // Décision prise
  assignedExpertId?: string;        // Expert assigné (si déféré)
  deferReason?: string;             // Raison de la déférence
  confidenceThreshold: number;      // Seuil de confiance utilisé
  estimatedExpertAccuracy?: number; // Précision estimée de l'expert pour ce cas
  capacityAware: boolean;           // La capacité des experts a-t-elle été prise en compte ?
  finalDecision?: 'fraud' | 'legitimate'; // Décision finale
  finalDecisionSource?: 'model' | 'expert'; // Source de la décision finale
  processingTimeMs: number;         // Temps de traitement total (en ms)
}

// ═══════════════════════════════════════════════════════════
//  Types liés aux Modèles de Machine Learning
// ═══════════════════════════════════════════════════════════

/** Représente un modèle ML déployé dans le système */
export interface MLModel {
  id: string;
  name: string;                     // Nom du modèle
  type: 'xgboost' | 'lightgbm' | 'random_forest' | 'neural_network' | 'isolation_forest' | 'ensemble';
  version: string;                  // Version du modèle
  accuracy: number;                 // Précision (accuracy)
  precision: number;                // Précision (precision) — vrais positifs / (vrais positifs + faux positifs)
  recall: number;                   // Rappel — vrais positifs / (vrais positifs + faux négatifs)
  f1Score: number;                  // Score F1 — moyenne harmonique de precision et recall
  f2Score: number;                  // Score F2 — privilégie le recall (important en fraude)
  falsePositiveRate: number;        // Taux de faux positifs
  auc: number;                      // Aire sous la courbe ROC
  avgLatencyMs: number;             // Latence moyenne d'inférence (en ms)
  status: 'active' | 'shadow' | 'canary' | 'retired'; // Statut de déploiement
  lastTrained: string;              // Date du dernier entraînement
  trainingDataSize: number;         // Taille du jeu de données d'entraînement
  featureImportance: Record<string, number>; // Importance de chaque feature
}

/** Prédiction d'un modèle ML pour une transaction */
export interface ModelPrediction {
  transactionId: string;
  modelId: string;
  fraudProbability: number;         // Probabilité de fraude (0 à 1)
  isAnomaly: boolean;               // Détecté comme anomalie ?
  anomalyScore: number;             // Score d'anomalie
  confidence: number;               // Confiance dans la prédiction
  latencyMs: number;                // Latence de l'inférence (en ms)
  features: Record<string, number>; // Features utilisées pour la prédiction
  shapValues?: Record<string, number>; // Valeurs SHAP pour l'explicabilité (optionnel)
  explanation?: string;             // Explication textuelle (optionnel)
}

/** Métriques globales de performance d'un modèle à un instant donné */
export interface ModelMetrics {
  timestamp: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  f2Score: number;
  falsePositiveRate: number;
  truePositiveRate: number;
  auc: number;
  avgLatencyMs: number;             // Latence moyenne
  throughput: number;               // Débit (prédictions/seconde)
  totalPredictions: number;         // Total de prédictions effectuées
  driftScore: number;               // Score de dérive du modèle (concept drift)
}

// ═══════════════════════════════════════════════════════════
//  Types liés au Pipeline et à l'Infrastructure
// ═══════════════════════════════════════════════════════════

/** Représente un topic Kafka dans le pipeline de streaming */
export interface KafkaTopic {
  name: string;                     // Nom du topic
  partitions: number;               // Nombre de partitions
  replicationFactor: number;        // Facteur de réplication
  messagesPerSecond: number;        // Messages par seconde (débit)
  avgMessageSize: number;           // Taille moyenne des messages (en octets)
  consumerLag: number;              // Retard du consommateur (nombre de messages en attente)
  status: 'healthy' | 'warning' | 'critical'; // État de santé
}

/** Métriques du pipeline de traitement en temps réel */
export interface PipelineMetrics {
  timestamp: string;
  transactionsProcessed: number;    // Transactions traitées
  transactionsPerSecond: number;    // Débit actuel
  avgLatencyMs: number;             // Latence moyenne
  p99LatencyMs: number;             // Latence au 99ème percentile
  kafkaLag: number;                 // Retard Kafka
  errorRate: number;                // Taux d'erreur
  fraudsDetected: number;           // Fraudes détectées
  falsePositives: number;           // Faux positifs
  deferredToExpert: number;         // Transactions déférées aux experts
  autoDecisions: number;            // Décisions automatiques
  expertUtilization: number;        // Taux d'utilisation des experts (0 à 1)
}

/** État de santé global du système */
export interface SystemHealth {
  kafka: ServiceHealth;
  mlService: ServiceHealth;
  featureStore: ServiceHealth;
  redis: ServiceHealth;
  postgres: ServiceHealth;
  elasticsearch: ServiceHealth;
  apiGateway: ServiceHealth;
}

/** État de santé d'un service individuel */
export interface ServiceHealth {
  name: string;                     // Nom du service
  status: 'healthy' | 'degraded' | 'down'; // Statut : sain, dégradé, hors service
  uptime: number;                   // Temps de fonctionnement (en %)
  latencyMs: number;                // Latence actuelle
  errorRate: number;                // Taux d'erreur
  cpu: number;                      // Utilisation CPU (en %)
  memory: number;                   // Utilisation mémoire (en %)
  lastCheck: string;                // Dernière vérification
}

// ═══════════════════════════════════════════════════════════
//  Types liés au Tableau de Bord (Dashboard)
// ═══════════════════════════════════════════════════════════

/** État global de l'interface du tableau de bord */
export interface DashboardState {
  activeTab: TabType;               // Onglet actif
  timeRange: TimeRange;             // Plage temporelle sélectionnée
  refreshInterval: number;          // Intervalle de rafraîchissement (en secondes)
  isLive: boolean;                  // Mode temps réel activé ?
  selectedTransaction?: Transaction; // Transaction sélectionnée (optionnel)
  selectedExpert?: FraudExpert;     // Expert sélectionné (optionnel)
  filters: DashboardFilters;        // Filtres appliqués
}

/** Les différents onglets disponibles dans le tableau de bord */
export type TabType =
  | 'overview'       // Vue d'ensemble
  | 'transactions'   // Transactions en temps réel
  | 'data-explorer'  // Exploration des données FiFAR
  | 'training'       // Entraînement des modèles ML
  | 'models'         // Performance des modèles ML
  | 'experts'        // Gestion des experts
  | 'l2d'            // Système Learning to Defer
  | 'pipeline'       // Pipeline de données
  | 'alerts'         // Alertes et notifications
  | 'fairness';      // Équité et biais

/** Plages temporelles disponibles pour les analyses */
export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';

/** Filtres applicables dans le tableau de bord */
export interface DashboardFilters {
  riskLevel?: string[];             // Filtrer par niveau de risque
  status?: string[];                // Filtrer par statut
  channel?: string[];               // Filtrer par canal
  country?: string[];               // Filtrer par pays
  amountMin?: number;               // Montant minimum
  amountMax?: number;               // Montant maximum
  dateFrom?: string;                // Date de début
  dateTo?: string;                  // Date de fin
}

// ═══════════════════════════════════════════════════════════
//  Types liés aux Alertes
// ═══════════════════════════════════════════════════════════

/** Représente une alerte générée par le système */
export interface Alert {
  id: string;
  type: 'fraud_detected' | 'model_drift' | 'system_error' | 'capacity_warning' | 'fairness_violation' | 'latency_spike';
  severity: 'info' | 'warning' | 'error' | 'critical'; // Gravité de l'alerte
  title: string;                    // Titre de l'alerte
  message: string;                  // Message détaillé
  timestamp: string;                // Horodatage
  acknowledged: boolean;            // A été reconnue/acquittée ?
  relatedTransactionId?: string;    // Transaction concernée (optionnel)
  relatedModelId?: string;          // Modèle concerné (optionnel)
  relatedExpertId?: string;         // Expert concerné (optionnel)
  metadata?: Record<string, unknown>; // Données supplémentaires
}

// ═══════════════════════════════════════════════════════════
//  Types liés à l'Équité (Fairness)
// ═══════════════════════════════════════════════════════════

/** Métriques d'équité pour un attribut protégé donné (ex: âge, genre) */
export interface FairnessMetrics {
  attribute: string;                // Attribut protégé analysé
  groups: FairnessGroup[];          // Groupes démographiques
  disparityScore: number;           // Score de disparité global
  equalizedOddsGap: number;         // Écart des odds équalisés
  demographicParityGap: number;     // Écart de parité démographique
}

/** Métriques pour un groupe démographique spécifique */
export interface FairnessGroup {
  name: string;                     // Nom du groupe
  size: number;                     // Taille du groupe (nombre d'individus)
  falsePositiveRate: number;        // Taux de faux positifs pour ce groupe
  falseNegativeRate: number;        // Taux de faux négatifs pour ce groupe
  approvalRate: number;             // Taux d'approbation
  deferralRate: number;             // Taux de déférence aux experts
}

// ═══════════════════════════════════════════════════════════
//  Types pour les Graphiques
// ═══════════════════════════════════════════════════════════

/** Point de données pour une série temporelle */
export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

/** Point de données générique pour les graphiques */
export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;                  // Deuxième valeur (pour les graphiques à 2 axes)
  color?: string;                   // Couleur personnalisée
}
