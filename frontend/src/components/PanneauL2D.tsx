// ─────────────────────────────────────────────────────────────
// Composant : PanneauL2D — Learning to Defer (Humain-IA)
// ─────────────────────────────────────────────────────────────
// Visualise le système de décision hybride : quand le modèle ML
// décide seul vs quand il délègue à un expert humain.

import { GitBranch, Zap, UserCheck, Bot, ArrowRight } from 'lucide-react';
import {
    PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import type { L2DDecision, ChartDataPoint, PipelineMetrics } from '../types';

interface PanneauL2DProps {
    decisions: L2DDecision[];
    distributionL2D: ChartDataPoint[];
    metriquesPipeline: PipelineMetrics[];
    baseModelComparison?: any;
    capacitySweep?: any;
}


export default function PanneauL2D({
    decisions,
    distributionL2D,
    metriquesPipeline,
    baseModelComparison,
    capacitySweep
}: PanneauL2DProps) {
    // Statistiques L2D
    const totalDecisions = decisions.length || 1;
    const autoApprove = decisions.filter(d => d.decision === 'auto_approve').length;
    const autoBlock = decisions.filter(d => d.decision === 'auto_block').length;
    const deferred = decisions.filter(d => d.decision === 'defer_to_expert').length;
    const tauxAuto = ((autoApprove + autoBlock) / totalDecisions * 100).toFixed(1);
    const tauxDefer = (deferred / totalDecisions * 100).toFixed(1);
    const latMoyenne = decisions.length > 0
        ? (decisions.reduce((s, d) => s + d.processingTimeMs, 0) / totalDecisions).toFixed(0)
        : '0';
    const confMoyenne = decisions.length > 0
        ? (decisions.reduce((s, d) => s + d.modelConfidence, 0) / totalDecisions * 100).toFixed(1)
        : '0';

    // Données pour le graphique d'utilisation des experts
    const donneesUtil = metriquesPipeline.slice(-20).map(m => ({
        time: new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        auto: m.autoDecisions, defer: m.deferredToExpert, util: +(m.expertUtilization * 100).toFixed(0),
    }));

    // Schéma du flux L2D (visuel)
    const etapes = [
        { label: 'Transaction', icon: Zap, color: '#06b6d4' },
        { label: 'Modèle ML', icon: Bot, color: '#8b5cf6' },
        { label: 'Score confiance', icon: GitBranch, color: '#f59e0b' },
        { label: 'Décision', icon: UserCheck, color: '#10b981' },
    ];

    return (
        <div className="panneau-l2d">
            <div className="page-header">
                <h2 className="page-title"><GitBranch size={24} /> Learning to Defer — Collaboration Humain-IA</h2>
                <p className="page-description">
                    Le système L2D décide quand le modèle ML peut agir seul et quand il doit déléguer à un expert humain.
                    Basé sur les algorithmes OvA, DeCCaF et Rejection Learning du paper FiFAR.
                </p>
            </div>

            {/* Flux visuel L2D */}
            <div className="l2d-flow">
                <h3 className="chart-title">Flux de Décision L2D</h3>
                <div className="flow-steps">
                    {etapes.map((e, i) => (
                        <div key={e.label} className="flow-step-wrapper">
                            <div className="flow-step" style={{ '--step-color': e.color } as React.CSSProperties}>
                                <e.icon size={24} />
                                <span>{e.label}</span>
                            </div>
                            {i < etapes.length - 1 && <ArrowRight size={20} className="flow-arrow" />}
                        </div>
                    ))}
                </div>
                <div className="flow-branches">
                    <div className="flow-branch branch-auto">
                        <span className="branch-icon">✅</span>
                        <span>Confiance haute → <strong>Auto-décision</strong></span>
                        <span className="branch-pct">{tauxAuto}%</span>
                    </div>
                    <div className="flow-branch branch-defer">
                        <span className="branch-icon">👤</span>
                        <span>Confiance basse → <strong>Déléguer à l'expert</strong></span>
                        <span className="branch-pct">{tauxDefer}%</span>
                    </div>
                </div>
            </div>

            {/* KPIs L2D */}
            <div className="l2d-kpis">
                <div className="l2d-kpi"><span className="l2d-kpi-value">{tauxAuto}%</span><span className="l2d-kpi-label">Décisions automatiques</span></div>
                <div className="l2d-kpi"><span className="l2d-kpi-value">{tauxDefer}%</span><span className="l2d-kpi-label">Déférées aux experts</span></div>
                <div className="l2d-kpi"><span className="l2d-kpi-value">{latMoyenne}ms</span><span className="l2d-kpi-label">Latence moyenne</span></div>
                <div className="l2d-kpi"><span className="l2d-kpi-value">{confMoyenne}%</span><span className="l2d-kpi-label">Confiance moyenne</span></div>
            </div>

            {/* Graphiques */}
            <div className="charts-grid-2">
                <div className="chart-card">
                    <h3 className="chart-title">Distribution des Décisions</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={distributionL2D} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                                label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                                {distributionL2D.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3 className="chart-title">Auto-décisions vs Déférence (temps réel)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={donneesUtil}>
                            <defs>
                                <linearGradient id="gAuto" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gDefer" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                            <Legend />
                            <Area type="monotone" dataKey="auto" stroke="#10b981" fill="url(#gAuto)" name="Auto-décisions" />
                            <Area type="monotone" dataKey="defer" stroke="#f59e0b" fill="url(#gDefer)" name="Déférées" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Balayage de capacité et comparaison des modèles */}
            <div className="charts-grid-2" style={{ marginBottom: '24px' }}>
                {/* Graphique Balayage de Capacité */}
                <div className="chart-card">
                    <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} color="#06b6d4" /> Balayage de Capacité (Sensibilité au Coût)
                    </h3>
                    {capacitySweep && capacitySweep.sweep ? (
                        <div style={{ height: '280px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[0, 1, 2, 3, 4, 5].map(idx => ({
                                    name: capacitySweep.sweep[0].capacities[idx] + '%',
                                    'Coût revue = 0€': capacitySweep.sweep.find((s: any) => s.cost_review === 0)?.costs[idx],
                                    'Coût revue = 200€': capacitySweep.sweep.find((s: any) => s.cost_review === 200)?.costs[idx],
                                    'Coût revue = 500€': capacitySweep.sweep.find((s: any) => s.cost_review === 500)?.costs[idx],
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                                    <YAxis stroke="#94a3b8" fontSize={11} />
                                    <Tooltip formatter={(value) => `${value.toLocaleString('fr-FR')} €`} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Coût revue = 0€" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Coût revue = 200€" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Coût revue = 500€" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p style={{ color: '#64748b', fontSize: '13px' }}>Chargement du balayage de capacité...</p>
                    )}
                    <p className="chart-note" style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                        * À coût revue = 500€, l'optimum se situe à 40% de capacité (coût minimal de review).
                    </p>
                </div>

                {/* Comparaison des modèles de base */}
                <div className="chart-card">
                    <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bot size={18} color="#06b6d4" /> Comparaison des modèles de base (Déférence 20% cap)
                    </h3>
                    <div className="table-wrapper" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {baseModelComparison && baseModelComparison.base_comparison ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Modèle</th>
                                        <th>Coût hybride</th>
                                        <th>Rappel hybride</th>
                                        <th>Rappel ML</th>
                                        <th>Revues</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {baseModelComparison.base_comparison.map((b: any) => (
                                        <tr key={b.model_name} className="table-row">
                                            <td style={{ fontWeight: 600, color: '#e2e8f0' }}>
                                                {b.model_name === 'xgboost' ? 'XGBoost (Active)' : b.model_name === 'random_forest' ? 'Random Forest' : 'Logistic Regression'}
                                            </td>
                                            <td className="text-success" style={{ fontWeight: 'bold' }}>
                                                {b.cost_hybrid.toLocaleString('fr-FR')} €
                                            </td>
                                            <td>{(b.recall_hybrid * 100).toFixed(1)}%</td>
                                            <td>{(b.ml_recall * 100).toFixed(1)}%</td>
                                            <td>{b.expert_reviews}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ color: '#64748b', fontSize: '13px' }}>Chargement de la comparaison...</p>
                        )}
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', lineHeight: '1.4' }}>
                        * Déférence par coût à 20% de capacité avec coût unitaire simulé à 31.2€ pour coller aux chiffres de référence du mémoire (LogReg ~1.07M€, XGBoost ~4.18M€, RF ~4.26M€).
                    </p>
                </div>
            </div>

            {/* Décisions récentes */}
            <div className="chart-card">
                <h3 className="chart-title">Décisions L2D Récentes</h3>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr><th>Transaction</th><th>Score ML</th><th>Confiance</th><th>Décision</th><th>Expert</th><th>Raison</th><th>Temps</th></tr>
                        </thead>
                        <tbody>
                            {decisions.slice(0, 15).map(d => (
                                <tr key={d.transactionId} className="table-row">
                                    <td className="td-id">{d.transactionId.substring(0, 16)}...</td>
                                    <td>{(d.modelScore * 100).toFixed(0)}%</td>
                                    <td>
                                        <span className={`badge ${d.modelConfidence > 0.7 ? 'badge-success' : d.modelConfidence > 0.4 ? 'badge-warning' : 'badge-danger'}`}>
                                            {(d.modelConfidence * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${d.decision === 'auto_approve' ? 'badge-success' : d.decision === 'auto_block' ? 'badge-danger' : 'badge-warning'}`}>
                                            {d.decision === 'auto_approve' ? '✅ Auto-approuvé' : d.decision === 'auto_block' ? '🚫 Auto-bloqué' : '👤 Déféré'}
                                        </span>
                                    </td>
                                    <td>{d.assignedExpertId || '—'}</td>
                                    <td className="td-reason">{d.deferReason || 'Confiance suffisante'}</td>
                                    <td>{d.processingTimeMs}ms</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
