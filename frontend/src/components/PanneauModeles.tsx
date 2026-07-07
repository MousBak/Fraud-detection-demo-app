// ─────────────────────────────────────────────────────────────
// Composant : PanneauModeles — Performance des Modèles ML
// ─────────────────────────────────────────────────────────────

import { Brain, TrendingUp, AlertTriangle, CheckCircle, Gauge, ShieldAlert } from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { MLModel, ModelMetrics } from '../types';

interface PanneauModelesProps {
    modeles: MLModel[];
    metriquesModele: ModelMetrics[];
    calibrationData?: any;
    precisionRecallAtK?: any;
}


const COULEURS: Record<string, string> = {
    xgboost: '#06b6d4', lightgbm: '#10b981', random_forest: '#f59e0b',
    neural_network: '#8b5cf6', isolation_forest: '#ec4899', ensemble: '#3b82f6',
};

const LIBELLE_TYPE: Record<string, string> = {
    xgboost: 'XGBoost', lightgbm: 'LightGBM', random_forest: 'Forêt Aléatoire',
    neural_network: 'Réseau de Neurones', isolation_forest: 'Forêt d\'Isolation', ensemble: 'Ensemble Hybride',
};

const LIBELLE_STATUT: Record<string, string> = {
    active: 'En production', canary: 'Test canary', shadow: 'Mode shadow', retired: 'Retiré',
};

export default function PanneauModeles({ modeles, metriquesModele }: PanneauModelesProps) {
    const donneesRadar = ['accuracy', 'precision', 'recall', 'f1Score', 'auc'].map(m => {
        const labels: Record<string, string> = { accuracy: 'Exactitude', precision: 'Précision', recall: 'Rappel', f1Score: 'F1', auc: 'AUC' };
        const pt: Record<string, string | number> = { metric: labels[m] || m };
        modeles.forEach(mod => { pt[mod.name] = +((mod[m as keyof MLModel] as number) * 100).toFixed(1); });
        return pt;
    });

    const donneesDerive = metriquesModele.slice(-24).map(m => ({
        time: new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        drift: +m.driftScore.toFixed(2), precision: +(m.precision * 100).toFixed(1),
    }));

    return (
        <div className="panneau-modeles">
            <div className="page-header">
                <h2 className="page-title"><Brain size={24} /> Performance des Modèles ML</h2>
                <p className="page-description">Comparaison de tous les modèles déployés avec détection de dérive</p>
            </div>

            {/* Cartes de modèles */}
            <div className="models-grid">
                {modeles.map(m => {
                    const features = Object.entries(m.featureImportance).sort(([, a], [, b]) => b - a).slice(0, 5)
                        .map(([n, v]) => ({ name: n.replace(/_/g, ' '), value: +(v * 100).toFixed(1) }));
                    return (
                        <div key={m.id} className="model-card" style={{ '--model-color': COULEURS[m.type] } as React.CSSProperties}>
                            <div className="model-header">
                                <div className="model-info">
                                    <h3 className="model-name">{m.name}</h3>
                                    <div className="model-tags">
                                        <span className="tag" style={{ background: `${COULEURS[m.type]}20`, color: COULEURS[m.type] }}>{LIBELLE_TYPE[m.type]}</span>
                                        <span className={`tag tag-status-${m.status}`}>
                                            {m.status === 'active' ? <CheckCircle size={12} /> : <Gauge size={12} />} {LIBELLE_STATUT[m.status]}
                                        </span>
                                    </div>
                                </div>
                                <span className="model-version">v{m.version}</span>
                            </div>
                            <div className="model-metrics-grid">
                                {[
                                    ['Exactitude', m.accuracy], ['Précision', m.precision], ['Rappel', m.recall],
                                    ['F1-Score', m.f1Score], ['Taux FP', m.falsePositiveRate], ['Latence', null],
                                ].map(([label, val]) => (
                                    <div key={label as string} className="model-metric">
                                        <span className="model-metric-value">
                                            {label === 'Latence' ? `${m.avgLatencyMs}ms` : `${((val as number) * 100).toFixed(1)}%`}
                                        </span>
                                        <span className="model-metric-label">{label as string}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="model-features">
                                <h4 className="model-section-title">Importance des Features</h4>
                                <div className="feature-bars">
                                    {features.map(f => (
                                        <div key={f.name} className="feature-bar-row">
                                            <span className="feature-name">{f.name}</span>
                                            <div className="feature-bar-container">
                                                <div className="feature-bar-fill" style={{ width: `${f.value * 4}%`, background: COULEURS[m.type] }} />
                                            </div>
                                            <span className="feature-value">{f.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Graphiques */}
            <div className="charts-grid-2">
                <div className="chart-card">
                    <h3 className="chart-title"><TrendingUp size={18} /> Comparaison Radar</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={donneesRadar}>
                            <PolarGrid stroke="#1e293b" /><PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={12} />
                            <PolarRadiusAxis domain={[80, 100]} stroke="#334155" fontSize={10} />
                            {modeles.slice(0, 3).map(m => (
                                <Radar key={m.id} name={m.name.split(' ')[0]} dataKey={m.name} stroke={COULEURS[m.type]} fill={COULEURS[m.type]} fillOpacity={0.08} />
                            ))}
                            <Legend /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3 className="chart-title"><AlertTriangle size={18} /> Dérive du Modèle</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={donneesDerive}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={11} /><YAxis yAxisId="left" stroke="#64748b" fontSize={11} />
                            <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} domain={[85, 100]} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} /><Legend />
                            <Line yAxisId="left" type="monotone" dataKey="drift" stroke="#ef4444" name="Dérive" dot={false} />
                            <Line yAxisId="right" type="monotone" dataKey="precision" stroke="#10b981" name="Précision %" dot={false} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                    <p className="chart-note">⚠️ Seuil de dérive : 0.30 — au-delà, ré-entraînement recommandé</p>
                </div>
            </div>

            {/* Étalonnage et Précision à k */}
            <div className="charts-grid-2" style={{ marginTop: '24px' }}>
                {/* Section Calibration (Étalonnage) */}
                <div className="chart-card">
                    <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={18} color="#06b6d4" /> Recalibration & Fiabilité (XGBoost)
                    </h3>
                    {calibrationData ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: '#090d16', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Brier Score</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171', textDecoration: 'line-through' }}>
                                        {calibrationData.uncalibrated.brier.toFixed(4)}
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                                        {calibrationData.calibrated.brier.toFixed(4)} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>(-10%)</span>
                                    </div>
                                </div>
                                <div style={{ background: '#090d16', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Cas incertains [0.3, 0.7]</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171', textDecoration: 'line-through' }}>
                                        {calibrationData.uncalibrated.uncertainty_count}
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                                        {calibrationData.calibrated.uncertainty_count} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>(-79%)</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ height: '200px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={calibrationData.calibrated.pred_probabilities.map((pred: number, i: number) => ({
                                        pred: +(pred * 100).toFixed(1),
                                        calibrated: +(calibrationData.calibrated.true_probabilities[i] * 100).toFixed(1),
                                        uncalibrated: +(calibrationData.uncalibrated.true_probabilities[i] * 100).toFixed(1),
                                        ideal: +(pred * 100).toFixed(1)
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="pred" name="Probabilité Prédite (%)" stroke="#64748b" fontSize={10} />
                                        <YAxis stroke="#64748b" fontSize={10} />
                                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="uncalibrated" name="Brut (XGBoost)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="calibrated" name="Calibré (Isotonique)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="ideal" name="Idéal" stroke="#64748b" strokeDasharray="3 3" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    ) : (
                        <p style={{ color: '#64748b', fontSize: '13px' }}>Chargement de la calibration...</p>
                    )}
                </div>

                {/* Section Precision@k */}
                <div className="chart-card">
                    <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={18} color="#06b6d4" /> Précision et Rappel à k% (XGBoost)
                    </h3>
                    <div className="table-wrapper" style={{ minHeight: '220px' }}>
                        {precisionRecallAtK && precisionRecallAtK.precision_recall_at_k ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Seuil k%</th>
                                        <th>Effectif (k)</th>
                                        <th>Précision@k</th>
                                        <th>Rappel@k</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {precisionRecallAtK.precision_recall_at_k.map((item: any) => (
                                        <tr key={item.k_pct} className="table-row">
                                            <td style={{ fontWeight: 600, color: '#e2e8f0' }}>Top {item.k_pct}%</td>
                                            <td>{item.count.toLocaleString('fr-FR')} cas</td>
                                            <td className="text-success" style={{ fontWeight: 'bold' }}>
                                                {(item.precision * 100).toFixed(1)}%
                                            </td>
                                            <td style={{ color: '#06b6d4', fontWeight: 'bold' }}>
                                                {(item.recall * 100).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ color: '#64748b', fontSize: '13px' }}>Chargement de Precision@k...</p>
                        )}
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', lineHeight: '1.4' }}>
                        * Le volume d'alertes à réviser est fixé par les capacités opérationnelles (k = 5%, 10%, 20%). 
                        Au top 20% (1 971 cas), on capte 35% de la fraude totale avec 25% de précision.
                    </p>
                </div>
            </div>
        </div>
    );
}
