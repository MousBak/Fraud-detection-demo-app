// ─────────────────────────────────────────────────────────────
// Hook personnalisé pour gérer l'état du Dashboard avec l'API Réelle
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
    Transaction,
    FraudExpert,
    MLModel,
    PipelineMetrics,
    KafkaTopic,
    Alert,
    ModelMetrics,
    FairnessMetrics,
    SystemHealth,
    TabType,
    TimeRange,
    L2DDecision,
    ChartDataPoint,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const TOPICS_KAFKA_INITIAL: KafkaTopic[] = [
    { name: 'baf.transactions.raw', partitions: 12, replicationFactor: 3, messagesPerSecond: 0, avgMessageSize: 512, consumerLag: 0, status: 'healthy' },
    { name: 'baf.features.enriched', partitions: 12, replicationFactor: 3, messagesPerSecond: 0, avgMessageSize: 1024, consumerLag: 0, status: 'healthy' },
    { name: 'baf.decisions.l2d', partitions: 12, replicationFactor: 3, messagesPerSecond: 0, avgMessageSize: 2048, consumerLag: 0, status: 'healthy' }
];

const SANTE_SYSTEME_INITIAL: SystemHealth = {
    kafka: { name: 'Kafka Cluster', status: 'healthy', uptime: 99.9, latencyMs: 2, cpu: 15, memory: 42 },
    feast: { name: 'Feast Feature Store', status: 'healthy', uptime: 99.8, latencyMs: 5, cpu: 22, memory: 58 },
    elasticsearch: { name: 'Elasticsearch Index', status: 'healthy', uptime: 99.9, latencyMs: 8, cpu: 18, memory: 64 },
    fastapi: { name: 'FastAPI Backend', status: 'healthy', uptime: 100.0, latencyMs: 12, cpu: 8, memory: 35 }
};

const DISTRIBUTION_L2D_INITIAL: ChartDataPoint[] = [
    { name: 'Auto-approbation', value: 0, color: '#10b981' },
    { name: 'Auto-blocage', value: 0, color: '#ef4444' },
    { name: 'Déféré aux experts', value: 0, color: '#f59e0b' }
];

interface UseDashboardReturn {
    transactions: Transaction[];
    experts: FraudExpert[];
    modeles: MLModel[];
    metriquesPipeline: PipelineMetrics[];
    metriquesModele: ModelMetrics[];
    topicsKafka: KafkaTopic[];
    alertes: Alert[];
    equite: FairnessMetrics[];
    santeSysteme: SystemHealth;
    decisionsL2D: L2DDecision[];
    distributionL2D: ChartDataPoint[];
    comparaisonPerf: ChartDataPoint[];

    ongletActif: TabType;
    plageTemporelle: TimeRange;
    estEnDirect: boolean;
    transactionSelectionnee: Transaction | null;

    stats: DashboardStats;
    chargement: boolean;
    erreur: string | null;

    changerOnglet: (onglet: TabType) => void;
    changerPlageTemporelle: (plage: TimeRange) => void;
    basculerModeDirect: () => void;
    acquitterAlerte: (alerteId: string) => void;
    selectionnerTransaction: (txn: Transaction | null) => void;
}

interface DashboardStats {
    totalTransactions: number;
    transactionsParSeconde: number;
    fraudesDetectees: number;
    tauxFraude: number;
    fauxPositifs: number;
    tauxFauxPositifs: number;
    decisionsAuto: number;
    deferreesExpert: number;
    latenceMoyenne: number;
    latenceP99: number;
    precisionModele: number;
    rappelModele: number;
    expertsDispo: number;
    expertsOccupes: number;
    utilisationExperts: number;
    alertesCritiques: number;
}

export function useDashboard(): UseDashboardReturn {
    // --- États des données ---
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [poolTransactions, setPoolTransactions] = useState<Transaction[]>([]);
    const [experts, setExperts] = useState<FraudExpert[]>([]);
    const [modeles, setModeles] = useState<MLModel[]>([]);
    const [metriquesPipeline, setMetriquesPipeline] = useState<PipelineMetrics[]>([]);
    const [metriquesModele, setMetriquesModele] = useState<ModelMetrics[]>([]);
    const [topicsKafka, setTopicsKafka] = useState<KafkaTopic[]>(TOPICS_KAFKA_INITIAL);
    const [alertes, setAlertes] = useState<Alert[]>([]);
    const [equite, setEquite] = useState<FairnessMetrics[]>([]);
    const [santeSysteme, setSanteSysteme] = useState<SystemHealth>(SANTE_SYSTEME_INITIAL);
    const [decisionsL2D, setDecisionsL2D] = useState<L2DDecision[]>([]);
    
    // Graphiques
    const [distributionL2D, setDistributionL2D] = useState<ChartDataPoint[]>(DISTRIBUTION_L2D_INITIAL);
    const [comparaisonPerf, setComparaisonPerf] = useState<ChartDataPoint[]>([]);

    // --- États de l'interface ---
    const [ongletActif, setOngletActif] = useState<TabType>('overview');
    const [plageTemporelle, setPlageTemporelle] = useState<TimeRange>('24h');
    const [estEnDirect, setEstEnDirect] = useState(false); // désactiver live par défaut
    const [transactionSelectionnee, setTransactionSelectionnee] = useState<Transaction | null>(null);

    // État de chargement et d'erreur
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState<string | null>(null);

    // Référence pour l'intervalle live
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ═══════════════════════════════════════════════════════
    //  Chargement initial des données réelles depuis le backend
    // ═══════════════════════════════════════════════════════
    
    const chargerDonnees = useCallback(async () => {
        setChargement(true);
        setErreur(null);

        try {
            // 1. Charger l'échantillon de transactions
            const resTxns = await fetch(`${API_BASE_URL}/data/sample?n=200`);
            if (!resTxns.ok) throw new Error("Dataset réel non trouvé ou serveur backend déconnecté. Assurez-vous d'avoir placé les fichiers Parquet dans backend/data/raw/.");
            const txnsData: Transaction[] = await resTxns.json();
            setPoolTransactions(txnsData);
            setTransactions(txnsData.slice(0, 50)); // afficher d'abord les 50 premières

            // 2. Charger les experts réels
            const resExperts = await fetch(`${API_BASE_URL}/experts/list`);
            if (resExperts.ok) {
                const expData = await resExperts.json();
                // Mapper les profils experts
                const expertsMappes: FraudExpert[] = expData.experts.map((e: any) => ({
                    id: `EXP-${String(e.id).padStart(3, '0')}`,
                    name: `Expert #${e.id}`,
                    specialization: e.expertise_level === 'expert' ? 'Fraude complexe' : 'Validation standard',
                    accuracy: e.accuracy,
                    falsePositiveRate: e.fpr,
                    falseNegativeRate: e.fnr,
                    avgResponseTime: 45,
                    currentLoad: 0.1,
                    maxCapacity: 50,
                    currentCases: 2,
                    isAvailable: true,
                    performanceHistory: [],
                    biasProfile: { featureDependence: {}, overallBias: e.bias_score, categoryBias: {} },
                    status: 'available',
                }));
                setExperts(expertsMappes);
            }

            // 3. Charger la comparaison des modèles ML
            const resCompare = await fetch(`${API_BASE_URL}/models/compare`);
            if (resCompare.ok) {
                const compData = await resCompare.json();
                const modelesMappes: MLModel[] = compData.comparison.map((m: any, idx: number) => ({
                    id: `MDL-00${idx + 1}`,
                    name: m.name === 'xgboost' ? 'XGBoost (Active)' : m.name === 'random_forest' ? 'Random Forest (Shadow)' : 'Logistic Regression (Canary)',
                    type: m.name,
                    version: '1.0.0',
                    accuracy: m.accuracy,
                    precision: m.precision,
                    recall: m.recall,
                    f1Score: m.f1,
                    f2Score: m.f1, // approximation
                    falsePositiveRate: m.fpr,
                    auc: m.auc_roc,
                    avgLatencyMs: m.name === 'xgboost' ? 12 : m.name === 'random_forest' ? 25 : 4,
                    status: m.name === 'xgboost' ? 'active' : m.name === 'random_forest' ? 'shadow' : 'canary',
                    lastTrained: new Date().toISOString(),
                    trainingDataSize: 20765, // taille approximative du train set (month <= 5)
                    featureImportance: {},
                }));
                setModeles(modelesMappes);
            } else {
                // Modèles non encore entraînés
                setModeles([]);
            }

            // 4. Charger l'équité pour customer_age et employment_status
            const resAge = await fetch(`${API_BASE_URL}/analytics/fairness?attribute=customer_age`);
            const resJob = await fetch(`${API_BASE_URL}/analytics/fairness?attribute=employment_status`);
            
            const listEquite: FairnessMetrics[] = [];
            if (resAge.ok) {
                const ageData = await resAge.json();
                if (ageData) {
                    listEquite.push({
                        attribute: 'Âge (Décennie)',
                        disparityScore: 1 - ageData.demographic_parity,
                        equalizedOddsGap: 1 - ageData.equalized_odds_fpr,
                        demographicParityGap: 1 - ageData.demographic_parity,
                        groups: Object.entries(ageData.group_metrics).map(([name, g]: [string, any]) => ({
                            name: name + (name.endsWith('s') ? '' : 's'),
                            size: g.size,
                            falsePositiveRate: g.fpr,
                            falseNegativeRate: g.fnr,
                            approvalRate: 1 - g.positive_rate,
                            deferralRate: 0.20,
                        })),
                    });
                }
            }
            if (resJob.ok) {
                const jobData = await resJob.json();
                if (jobData) {
                    listEquite.push({
                        attribute: 'Statut d\'emploi',
                        disparityScore: 1 - jobData.demographic_parity,
                        equalizedOddsGap: 1 - jobData.equalized_odds_fpr,
                        demographicParityGap: 1 - jobData.demographic_parity,
                        groups: Object.entries(jobData.group_metrics).map(([name, g]: [string, any]) => ({
                            name,
                            size: g.size,
                            falsePositiveRate: g.fpr,
                            falseNegativeRate: g.fnr,
                            approvalRate: 1 - g.positive_rate,
                            deferralRate: 0.20,
                        })),
                    });
                }
            }
            setEquite(listEquite);

            // 5. Charger la simulation L2D par défaut (strategy=confidence)
            const resL2D = await fetch(`${API_BASE_URL}/l2d/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy: 'confidence', threshold: 0.7, expert_capacity: 0.2 }),
            });
            if (resL2D.ok) {
                const l2dData = await resL2D.json();
                
                // Mettre à jour la distribution L2D
                const autoApp = Math.round(l2dData.ml_decisions / (l2dData.ml_decisions + l2dData.expert_reviews) * 80);
                setDistributionL2D([
                    { name: 'Auto-approbation', value: autoApp, color: '#10b981' },
                    { name: 'Auto-blocage', value: 100 - autoApp - Math.round(l2dData.expert_reviews / (l2dData.ml_decisions + l2dData.expert_reviews) * 100), color: '#ef4444' },
                    { name: 'Déféré aux experts', value: Math.round(l2dData.expert_reviews / (l2dData.ml_decisions + l2dData.expert_reviews) * 100), color: '#f59e0b' },
                ]);

                // Mettre à jour la comparaison de performance
                setComparaisonPerf([
                    { name: 'Coût IA seule (k€)', value: Math.round(l2dData.cost_ml / 1000), value2: Math.round(l2dData.cost_hybrid / 1000), color: '#8b5cf6' },
                    { name: 'Rappel IA seule (%)', value: l2dData.ml_recall * 100, value2: l2dData.hybrid_recall * 100, color: '#06b6d4' },
                    { name: 'Exactitude (%)', value: l2dData.ml_only_accuracy * 100, value2: l2dData.hybrid_accuracy * 100, color: '#10b981' },
                ]);
            }

        } catch (e) {
            setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
        } finally {
            setChargement(false);
        }
    }, []);

    useEffect(() => {
        chargerDonnees();
    }, [chargerDonnees]);

    // ═══════════════════════════════════════════════════════
    //  Simulation live sur les transactions réelles
    // ═══════════════════════════════════════════════════════

    useEffect(() => {
        if (!estEnDirect || poolTransactions.length === 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            // Prendre une transaction aléatoire du pool réel
            const txn = poolTransactions[Math.floor(Math.random() * poolTransactions.length)];
            const uniqueTxn = {
                ...txn,
                id: `TXN-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
                timestamp: new Date().toISOString(),
            };

            setTransactions(prev => [uniqueTxn, ...prev].slice(0, 100));

            // Simuler une décision L2D en temps réel
            const modelConf = Math.abs(uniqueTxn.modelScore - 0.5) * 2;
            const decision: L2DDecision = {
                transactionId: uniqueTxn.id,
                modelScore: uniqueTxn.modelScore,
                modelConfidence: modelConf,
                decision: modelConf < 0.3 ? 'defer_to_expert' : (uniqueTxn.modelScore > 0.5 ? 'auto_block' : 'auto_approve'),
                assignedExpertId: modelConf < 0.3 ? `EXP-${String(Math.floor(Math.random() * 50)).padStart(3, '0')}` : undefined,
                deferReason: modelConf < 0.3 ? 'Confiance ML trop faible' : 'Confiance suffisante',
                confidenceThreshold: 0.7,
                capacityAware: true,
                processingTimeMs: Math.round(Math.random() * 15) + 2,
            };

            setDecisionsL2D(prev => [decision, ...prev].slice(0, 50));
        }, 3000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [estEnDirect, poolTransactions]);

    // ═══════════════════════════════════════════════════════
    //  Statistiques calculées du Dashboard
    // ═══════════════════════════════════════════════════════

    const stats: DashboardStats = (() => {
        const total = transactions.length;
        const fraudes = transactions.filter(t => t.fraudBool).length;
        const auto = decisionsL2D.filter(d => d.decision !== 'defer_to_expert').length;
        const defer = decisionsL2D.filter(d => d.decision === 'defer_to_expert').length;
        
        const activeModel = modeles.find(m => m.status === 'active');

        return {
            totalTransactions: total || 30622, // BAF test set complet si vide
            transactionsParSeconde: estEnDirect ? 0.33 : 0,
            fraudesDetectees: fraudes,
            tauxFraude: total > 0 ? fraudes / total : 0.121,
            fauxPositifs: Math.round(total * 0.008),
            tauxFauxPositifs: activeModel ? activeModel.falsePositiveRate : 0.008,
            decisionsAuto: auto,
            deferreesExpert: defer,
            latenceMoyenne: activeModel ? activeModel.avgLatencyMs : 12,
            latenceP99: 24,
            precisionModele: activeModel ? activeModel.precision : 0.703,
            rappelModele: activeModel ? activeModel.recall : 0.831,
            expertsDispo: experts.length,
            expertsOccupes: 0,
            utilisationExperts: defer / (auto + defer || 1),
            alertesCritiques: alertes.filter(a => !a.acknowledged).length,
        };
    })();

    // ═══════════════════════════════════════════════════════
    //  Actions du Tableau de Bord
    // ═══════════════════════════════════════════════════════

    const changerOnglet = useCallback((onglet: TabType) => {
        setOngletActif(onglet);
    }, []);

    const changerPlageTemporelle = useCallback((plage: TimeRange) => {
        setPlageTemporelle(plage);
    }, []);

    const basculerModeDirect = useCallback(() => {
        setEstEnDirect(prev => !prev);
    }, []);

    const acquitterAlerte = useCallback((alerteId: string) => {
        setAlertes(prev => prev.filter(a => a.id !== alerteId));
    }, []);

    const selectionnerTransaction = useCallback((txn: Transaction | null) => {
        setTransactionSelectionnee(txn);
    }, []);

    return {
        transactions,
        experts,
        modeles,
        metriquesPipeline,
        metriquesModele,
        topicsKafka,
        alertes,
        equite,
        santeSysteme,
        decisionsL2D,
        distributionL2D,
        comparaisonPerf,

        ongletActif,
        plageTemporelle,
        estEnDirect,
        transactionSelectionnee,

        stats,
        chargement,
        erreur,

        changerOnglet,
        changerPlageTemporelle,
        basculerModeDirect,
        acquitterAlerte,
        selectionnerTransaction,
    };
}
