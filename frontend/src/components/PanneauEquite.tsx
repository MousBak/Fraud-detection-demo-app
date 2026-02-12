// ─────────────────────────────────────────────────────────────
// Composant : PanneauEquite — Métriques d'Équité (Fairness)
// ─────────────────────────────────────────────────────────────
// Analyse les biais potentiels du système de détection de fraude
// selon différents attributs protégés (âge, type de compte, région).

import { Scale, AlertTriangle } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Cell,
} from 'recharts';
import type { FairnessMetrics } from '../types';

interface PanneauEquiteProps {
    equite: FairnessMetrics[];
}

// Couleurs pour les groupes
const COULEURS_GROUPES = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

export default function PanneauEquite({ equite }: PanneauEquiteProps) {
    return (
        <div className="panneau-equite">
            <div className="page-header">
                <h2 className="page-title"><Scale size={24} /> Équité et Analyse des Biais</h2>
                <p className="page-description">
                    Analyse de l'équité du système selon les attributs protégés du dataset FiFAR.
                    Objectif : minimiser les disparités de taux de faux positifs entre les groupes.
                </p>
            </div>

            {equite.map((metrique) => {
                // Données pour le graphique de taux de faux positifs par groupe
                const donneesFPR = metrique.groups.map(g => ({
                    name: g.name, fpr: +(g.falsePositiveRate * 100).toFixed(2),
                    fnr: +(g.falseNegativeRate * 100).toFixed(2),
                }));

                // Données pour les taux d'approbation
                const donneesApprobation = metrique.groups.map(g => ({
                    name: g.name, approbation: +(g.approvalRate * 100).toFixed(1),
                    deference: +(g.deferralRate * 100).toFixed(1),
                }));

                const estEquitable = metrique.disparityScore < 0.15;

                return (
                    <div key={metrique.attribute} className="fairness-section">
                        <div className="fairness-header">
                            <h3 className="fairness-title">{metrique.attribute}</h3>
                            <div className="fairness-badges">
                                <span className={`badge ${estEquitable ? 'badge-success' : 'badge-warning'}`}>
                                    {estEquitable ? '✅ Équitable' : '⚠️ Disparité détectée'}
                                </span>
                                <span className="badge badge-outline">Disparité : {metrique.disparityScore.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Métriques de disparité */}
                        <div className="fairness-metrics-row">
                            <div className="fairness-metric">
                                <span className="fm-value">{metrique.disparityScore.toFixed(3)}</span>
                                <span className="fm-label">Score de disparité</span>
                            </div>
                            <div className="fairness-metric">
                                <span className="fm-value">{metrique.equalizedOddsGap.toFixed(3)}</span>
                                <span className="fm-label">Écart Equalized Odds</span>
                            </div>
                            <div className="fairness-metric">
                                <span className="fm-value">{metrique.demographicParityGap.toFixed(3)}</span>
                                <span className="fm-label">Écart Parité Démographique</span>
                            </div>
                        </div>

                        <div className="charts-grid-2">
                            {/* Taux de faux positifs par groupe */}
                            <div className="chart-card chart-card-inner">
                                <h4 className="chart-subtitle">Taux de Faux Positifs par Groupe</h4>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={donneesFPR}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                        <YAxis stroke="#64748b" fontSize={10} />
                                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                                        <Legend />
                                        <Bar dataKey="fpr" name="Taux FP %" radius={[4, 4, 0, 0]}>
                                            {donneesFPR.map((_, i) => <Cell key={i} fill={COULEURS_GROUPES[i % COULEURS_GROUPES.length]} />)}
                                        </Bar>
                                        <Bar dataKey="fnr" name="Taux FN %" fill="#6b7280" radius={[4, 4, 0, 0]} opacity={0.5} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Taux d'approbation et déférence */}
                            <div className="chart-card chart-card-inner">
                                <h4 className="chart-subtitle">Approbation et Déférence par Groupe</h4>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={donneesApprobation}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                        <YAxis stroke="#64748b" fontSize={10} />
                                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                                        <Legend />
                                        <Bar dataKey="approbation" name="Approbation %" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="deference" name="Déférence %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Table détaillée des groupes */}
                        <div className="fairness-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Groupe</th><th>Effectif</th><th>Taux FP</th><th>Taux FN</th>
                                        <th>Taux approbation</th><th>Taux déférence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrique.groups.map((g, i) => (
                                        <tr key={g.name} className="table-row">
                                            <td><span className="group-dot" style={{ background: COULEURS_GROUPES[i % COULEURS_GROUPES.length] }} /> {g.name}</td>
                                            <td>{g.size.toLocaleString('fr-FR')}</td>
                                            <td className={g.falsePositiveRate > 0.02 ? 'text-danger' : ''}>{(g.falsePositiveRate * 100).toFixed(2)}%</td>
                                            <td>{(g.falseNegativeRate * 100).toFixed(2)}%</td>
                                            <td>{(g.approvalRate * 100).toFixed(1)}%</td>
                                            <td>{(g.deferralRate * 100).toFixed(0)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Avertissement si disparité */}
                        {!estEquitable && (
                            <div className="fairness-warning">
                                <AlertTriangle size={16} />
                                <span>
                                    Disparité significative détectée pour l'attribut « {metrique.attribute} ».
                                    Le taux de faux positifs varie de manière disproportionnée entre les groupes.
                                    Action recommandée : recalibrer le modèle avec des contraintes d'équité.
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
