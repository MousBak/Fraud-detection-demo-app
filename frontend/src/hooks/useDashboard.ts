// ─────────────────────────────────────────────────────────────
// Hook personnalisé pour gérer l'état global du Dashboard
// ─────────────────────────────────────────────────────────────
// Ce hook centralise toute la logique de gestion d'état
// et simule le comportement temps réel du système.

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
import {
    DONNEES_INITIALES,
    genererTransaction,
    genererDecisionL2D,
    genererMetriquesPipeline,
    genererTopicsKafka,
    genererSanteSysteme,
} from '../data/mockData';

// ═══════════════════════════════════════════════════════════
//  Interface de retour du Hook
// ═══════════════════════════════════════════════════════════

interface UseDashboardReturn {
    // --- Données ---
    transactions: Transaction[];          // Liste des transactions
    experts: FraudExpert[];               // Liste des 50 experts
    modeles: MLModel[];                   // Liste des modèles ML
    metriquesPipeline: PipelineMetrics[]; // Métriques du pipeline
    metriquesModele: ModelMetrics[];      // Métriques des modèles
    topicsKafka: KafkaTopic[];           // État des topics Kafka
    alertes: Alert[];                     // Alertes actives
    equite: FairnessMetrics[];           // Métriques d'équité
    santeSysteme: SystemHealth;           // Santé du système
    decisionsL2D: L2DDecision[];         // Décisions L2D récentes
    distributionL2D: ChartDataPoint[];   // Distribution des décisions
    typesFraude: ChartDataPoint[];       // Types de fraude
    comparaisonPerf: ChartDataPoint[];   // Comparaison ML vs Hybride

    // --- État de l'interface ---
    ongletActif: TabType;                // Onglet actuellement affiché
    plageTemporelle: TimeRange;          // Plage de temps sélectionnée
    estEnDirect: boolean;                // Mode temps réel activé ?
    transactionSelectionnee: Transaction | null;

    // --- Statistiques calculées ---
    stats: DashboardStats;

    // --- Actions ---
    changerOnglet: (onglet: TabType) => void;
    changerPlageTemporelle: (plage: TimeRange) => void;
    basculerModeDirect: () => void;
    acquitterAlerte: (alerteId: string) => void;
    selectionnerTransaction: (txn: Transaction | null) => void;
}

/** Statistiques résumées affichées sur le tableau de bord */
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

// ═══════════════════════════════════════════════════════════
//  Hook useDashboard
// ═══════════════════════════════════════════════════════════

export function useDashboard(): UseDashboardReturn {
    // --- États des données ---
    const [transactions, setTransactions] = useState<Transaction[]>(DONNEES_INITIALES.transactions);
    const [experts] = useState<FraudExpert[]>(DONNEES_INITIALES.experts);
    const [modeles] = useState<MLModel[]>(DONNEES_INITIALES.modeles);
    const [metriquesPipeline, setMetriquesPipeline] = useState<PipelineMetrics[]>(DONNEES_INITIALES.metriques);
    const [metriquesModele] = useState<ModelMetrics[]>(DONNEES_INITIALES.metriquesModele);
    const [topicsKafka, setTopicsKafka] = useState<KafkaTopic[]>(DONNEES_INITIALES.topicsKafka);
    const [alertes, setAlertes] = useState<Alert[]>(DONNEES_INITIALES.alertes);
    const [equite] = useState<FairnessMetrics[]>(DONNEES_INITIALES.equite);
    const [santeSysteme, setSanteSysteme] = useState<SystemHealth>(DONNEES_INITIALES.santeSysteme);
    const [decisionsL2D, setDecisionsL2D] = useState<L2DDecision[]>([]);

    // --- États de l'interface ---
    const [ongletActif, setOngletActif] = useState<TabType>('overview');
    const [plageTemporelle, setPlageTemporelle] = useState<TimeRange>('24h');
    const [estEnDirect, setEstEnDirect] = useState(true);
    const [transactionSelectionnee, setTransactionSelectionnee] = useState<Transaction | null>(null);

    // Référence pour l'intervalle de mise à jour temps réel
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ═══════════════════════════════════════════════════════
    //  Simulation temps réel
    //  Ajoute de nouvelles transactions toutes les 2 secondes
    // ═══════════════════════════════════════════════════════

    useEffect(() => {
        if (!estEnDirect) {
            // Mode hors ligne — arrêter les mises à jour
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        // Mettre à jour les données toutes les 2 secondes
        intervalRef.current = setInterval(() => {
            // 1. Ajouter 1 à 3 nouvelles transactions
            const nbNouvelles = Math.floor(Math.random() * 3) + 1;
            const nouvellesTransactions: Transaction[] = [];
            const nouvellesDecisions: L2DDecision[] = [];

            for (let i = 0; i < nbNouvelles; i++) {
                const txn = genererTransaction();
                nouvellesTransactions.push(txn);

                // Générer la décision L2D pour chaque transaction
                const decision = genererDecisionL2D(txn, experts);
                nouvellesDecisions.push(decision);
            }

            // Mettre à jour les transactions (garder les 200 dernières)
            setTransactions(prev => [...nouvellesTransactions, ...prev].slice(0, 200));

            // Mettre à jour les décisions L2D (garder les 100 dernières)
            setDecisionsL2D(prev => [...nouvellesDecisions, ...prev].slice(0, 100));

            // 2. Mettre à jour les métriques du pipeline
            setMetriquesPipeline(prev => {
                const nouvelles = genererMetriquesPipeline(1);
                return [...prev.slice(1), ...nouvelles];
            });

            // 3. Mettre à jour les topics Kafka (toutes les 10 secondes)
            if (Math.random() < 0.2) {
                setTopicsKafka(genererTopicsKafka());
            }

            // 4. Mettre à jour la santé du système (toutes les 15 secondes)
            if (Math.random() < 0.13) {
                setSanteSysteme(genererSanteSysteme());
            }
        }, 2000);

        // Nettoyage à la destruction du composant
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [estEnDirect, experts]);

    // ═══════════════════════════════════════════════════════
    //  Calcul des Statistiques
    // ═══════════════════════════════════════════════════════

    const stats: DashboardStats = (() => {
        const derniereMetrique = metriquesPipeline[metriquesPipeline.length - 1];
        const transactionsFrauduleuses = transactions.filter(t => t.fraudBool);
        const expertsDispo = experts.filter(e => e.status === 'available');
        const expertsOccupes = experts.filter(e => e.status === 'busy');
        const alertesCritiques = alertes.filter(a => a.severity === 'critical' && !a.acknowledged);
        const modeleActif = modeles.find(m => m.status === 'active' && m.type !== 'isolation_forest');

        return {
            totalTransactions: derniereMetrique?.transactionsProcessed ?? 0,
            transactionsParSeconde: derniereMetrique?.transactionsPerSecond ?? 0,
            fraudesDetectees: derniereMetrique?.fraudsDetected ?? 0,
            tauxFraude: transactions.length > 0
                ? transactionsFrauduleuses.length / transactions.length
                : 0,
            fauxPositifs: derniereMetrique?.falsePositives ?? 0,
            tauxFauxPositifs: modeleActif?.falsePositiveRate ?? 0,
            decisionsAuto: derniereMetrique?.autoDecisions ?? 0,
            deferreesExpert: derniereMetrique?.deferredToExpert ?? 0,
            latenceMoyenne: derniereMetrique?.avgLatencyMs ?? 0,
            latenceP99: derniereMetrique?.p99LatencyMs ?? 0,
            precisionModele: modeleActif?.precision ?? 0,
            rappelModele: modeleActif?.recall ?? 0,
            expertsDispo: expertsDispo.length,
            expertsOccupes: expertsOccupes.length,
            utilisationExperts: derniereMetrique?.expertUtilization ?? 0,
            alertesCritiques: alertesCritiques.length,
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
        setAlertes(prev =>
            prev.map(a => a.id === alerteId ? { ...a, acknowledged: true } : a)
        );
    }, []);

    const selectionnerTransaction = useCallback((txn: Transaction | null) => {
        setTransactionSelectionnee(txn);
    }, []);

    // ═══════════════════════════════════════════════════════
    //  Retour du Hook
    // ═══════════════════════════════════════════════════════

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
        distributionL2D: DONNEES_INITIALES.distributionL2D,
        typesFraude: DONNEES_INITIALES.typesFraude,
        comparaisonPerf: DONNEES_INITIALES.comparaisonPerformance,

        ongletActif,
        plageTemporelle,
        estEnDirect,
        transactionSelectionnee,

        stats,

        changerOnglet,
        changerPlageTemporelle,
        basculerModeDirect,
        acquitterAlerte,
        selectionnerTransaction,
    };
}
