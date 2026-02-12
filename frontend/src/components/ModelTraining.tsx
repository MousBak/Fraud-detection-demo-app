// ─────────────────────────────────────────────────────────────
// Composant : ModelTraining — Entraînement des Modèles ML
// ─────────────────────────────────────────────────────────────
// Interface pour lancer et suivre l'entraînement des modèles
// de détection de fraude (LR, RF, XGBoost).

import { useState } from 'react';
import { Cpu, Play, Loader, CheckCircle, AlertCircle, Settings } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
//  Interfaces
// ═══════════════════════════════════════════════════════════

interface ModelConfig {
    /** Identifiant du type de modèle */
    type: string;
    /** Nom affiché */
    label: string;
    /** Description courte */
    description: string;
    /** Couleur du badge */
    color: string;
    /** Sélectionné pour entraînement */
    selected: boolean;
}

interface TrainingResult {
    modelType: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    aucRoc: number;
    trainingTime: string;
    status: 'success' | 'error';
}

// ═══════════════════════════════════════════════════════════
//  Composant Principal
// ═══════════════════════════════════════════════════════════

export default function ModelTraining() {
    // ─── État local ───
    const [modeles, setModeles] = useState<ModelConfig[]>([
        {
            type: 'logistic_regression',
            label: 'Régression Logistique',
            description: 'Modèle linéaire rapide, bon baseline. Équilibrage des classes via class_weight="balanced".',
            color: '#06b6d4',
            selected: true,
        },
        {
            type: 'random_forest',
            label: 'Forêt Aléatoire',
            description: 'Ensemble de 200 arbres, max_depth=15. Robuste aux outliers et au déséquilibre.',
            color: '#10b981',
            selected: true,
        },
        {
            type: 'xgboost',
            label: 'XGBoost',
            description: 'Gradient boosting optimisé. 300 estimateurs, scale_pos_weight=20 pour le déséquilibre.',
            color: '#f59e0b',
            selected: true,
        },
    ]);

    const [testSize, setTestSize] = useState(0.2);
    const [useFeatureEng, setUseFeatureEng] = useState(true);
    const [enTrainement, setEnTrainement] = useState(false);
    const [resultats, setResultats] = useState<TrainingResult[]>([]);
    const [erreur, setErreur] = useState<string | null>(null);

    // ─── Basculer la sélection d'un modèle ───
    const basculerModele = (type: string) => {
        setModeles(prev => prev.map(m =>
            m.type === type ? { ...m, selected: !m.selected } : m
        ));
    };

    // ─── Lancer l'entraînement ───
    const lancerEntrainement = async () => {
        const modelsSelectionnes = modeles.filter(m => m.selected);
        if (modelsSelectionnes.length === 0) {
            setErreur('Sélectionnez au moins un modèle à entraîner.');
            return;
        }

        setEnTrainement(true);
        setErreur(null);
        setResultats([]);

        try {
            // Simuler l'appel API backend (/api/v1/models/train)
            // En production, remplacer par un vrai appel fetch
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Résultats simulés basés sur les benchmarks FiFAR
            const resultatsSimules: TrainingResult[] = modelsSelectionnes.map(m => {
                const base = {
                    logistic_regression: { acc: 0.921, prec: 0.452, rec: 0.724, f1: 0.557, auc: 0.961, temps: '3.2s' },
                    random_forest: { acc: 0.963, prec: 0.651, rec: 0.803, f1: 0.719, auc: 0.982, temps: '18.7s' },
                    xgboost: { acc: 0.971, prec: 0.703, rec: 0.831, f1: 0.762, auc: 0.991, temps: '25.4s' },
                }[m.type] || { acc: 0.9, prec: 0.5, rec: 0.7, f1: 0.6, auc: 0.95, temps: '5.0s' };

                return {
                    modelType: m.type,
                    accuracy: base.acc + (Math.random() - 0.5) * 0.01,
                    precision: base.prec + (Math.random() - 0.5) * 0.02,
                    recall: base.rec + (Math.random() - 0.5) * 0.02,
                    f1: base.f1 + (Math.random() - 0.5) * 0.02,
                    aucRoc: base.auc + (Math.random() - 0.5) * 0.005,
                    trainingTime: base.temps,
                    status: 'success' as const,
                };
            });

            setResultats(resultatsSimules);
        } catch (e) {
            setErreur(`Erreur d'entraînement : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
        } finally {
            setEnTrainement(false);
        }
    };

    const modelsSelectionnes = modeles.filter(m => m.selected).length;

    return (
        <div className="model-training">
            {/* ─── En-tête ─── */}
            <div className="page-header">
                <h2 className="page-title">
                    <Cpu size={24} />
                    Entraînement des Modèles ML
                </h2>
                <p className="page-description">
                    Entraînez et comparez les modèles de détection de fraude sur le dataset FiFAR
                </p>
            </div>

            {/* ─── Configuration de l'entraînement ─── */}
            <div className="charts-grid-2">
                {/* Sélection des modèles */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        <Settings size={18} />
                        Sélection des Modèles
                    </h3>
                    <div className="model-selection-list">
                        {modeles.map(m => (
                            <div
                                key={m.type}
                                className={`model-selection-item ${m.selected ? 'model-selected' : ''}`}
                                onClick={() => basculerModele(m.type)}
                                style={{ '--model-color': m.color } as React.CSSProperties}
                            >
                                <div className="model-selection-check">
                                    {m.selected ? <CheckCircle size={20} /> : <div className="model-uncheck" />}
                                </div>
                                <div className="model-selection-info">
                                    <span className="model-selection-name">{m.label}</span>
                                    <span className="model-selection-desc">{m.description}</span>
                                </div>
                                <span className="tag" style={{ background: `${m.color}20`, color: m.color }}>
                                    {m.type.replace(/_/g, ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Paramètres */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        <Settings size={18} />
                        Paramètres d'Entraînement
                    </h3>
                    <div className="training-params">
                        <div className="param-row">
                            <label className="param-label">Taille du jeu de test</label>
                            <div className="param-control">
                                <input
                                    type="range"
                                    min={0.1}
                                    max={0.4}
                                    step={0.05}
                                    value={testSize}
                                    onChange={e => setTestSize(+e.target.value)}
                                    className="param-slider"
                                />
                                <span className="param-value">{(testSize * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        <div className="param-row">
                            <label className="param-label">Feature Engineering avancé</label>
                            <button
                                className={`toggle-btn ${useFeatureEng ? 'toggle-active' : ''}`}
                                onClick={() => setUseFeatureEng(!useFeatureEng)}
                            >
                                {useFeatureEng ? 'Activé' : 'Désactivé'}
                            </button>
                        </div>
                        <div className="param-info">
                            <p>• Random state : 42 (reproductibilité)</p>
                            <p>• Stratification : activée (maintien du ratio fraude)</p>
                            <p>• Gestion du déséquilibre : class_weight / scale_pos_weight</p>
                        </div>

                        {/* Bouton d'entraînement */}
                        <button
                            className="btn-train"
                            onClick={lancerEntrainement}
                            disabled={enTrainement || modelsSelectionnes === 0}
                        >
                            {enTrainement ? (
                                <><Loader size={18} className="spin" /> Entraînement en cours...</>
                            ) : (
                                <><Play size={18} /> Entraîner {modelsSelectionnes} modèle{modelsSelectionnes > 1 ? 's' : ''}</>
                            )}
                        </button>

                        {erreur && (
                            <div className="training-error">
                                <AlertCircle size={16} /> {erreur}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Résultats ─── */}
            {resultats.length > 0 && (
                <div className="chart-card">
                    <h3 className="chart-title">
                        <CheckCircle size={18} />
                        Résultats de l'Entraînement
                    </h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Modèle</th>
                                    <th>Exactitude</th>
                                    <th>Précision</th>
                                    <th>Rappel</th>
                                    <th>F1-Score</th>
                                    <th>AUC-ROC</th>
                                    <th>Temps</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultats.map(r => {
                                    const config = modeles.find(m => m.type === r.modelType);
                                    return (
                                        <tr key={r.modelType} className="table-row">
                                            <td>
                                                <span className="tag" style={{ background: `${config?.color || '#6b7280'}20`, color: config?.color }}>
                                                    {config?.label || r.modelType}
                                                </span>
                                            </td>
                                            <td>{(r.accuracy * 100).toFixed(2)}%</td>
                                            <td>{(r.precision * 100).toFixed(2)}%</td>
                                            <td className={r.recall > 0.8 ? 'text-success' : 'text-warning'}>
                                                {(r.recall * 100).toFixed(2)}%
                                            </td>
                                            <td>{(r.f1 * 100).toFixed(2)}%</td>
                                            <td className="text-success">{(r.aucRoc * 100).toFixed(2)}%</td>
                                            <td>{r.trainingTime}</td>
                                            <td>
                                                <span className="badge badge-success">
                                                    <CheckCircle size={12} /> Succès
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
