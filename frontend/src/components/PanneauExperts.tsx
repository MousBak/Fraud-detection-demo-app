// ─────────────────────────────────────────────────────────────
// Composant : PanneauExperts — Gestion des 50 Experts FiFAR
// ─────────────────────────────────────────────────────────────
// Affiche les 50 analystes de fraude synthétiques avec leurs
// performances, disponibilité et profils de biais.

import { Users, Star, Clock, BarChart3, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { FraudExpert } from '../types';

interface PanneauExpertsProps {
    experts: FraudExpert[];
}

export default function PanneauExperts({ experts }: PanneauExpertsProps) {
    // Statistiques globales des experts
    const expertsDispo = experts.filter(e => e.status === 'available').length;
    const expertsOccupes = experts.filter(e => e.status === 'busy').length;
    const expertsHorsLigne = experts.filter(e => e.status === 'offline' || e.status === 'break').length;
    const precisionMoyenne = experts.reduce((sum, e) => sum + e.accuracy, 0) / experts.length;
    const chargeMoyenne = experts.reduce((sum, e) => sum + e.currentLoad, 0) / experts.length;

    // Top 10 experts par précision
    const top10 = [...experts].sort((a, b) => b.accuracy - a.accuracy).slice(0, 10)
        .map(e => ({ name: e.name.split(' ')[0], precision: +(e.accuracy * 100).toFixed(1), fp: +(e.falsePositiveRate * 100).toFixed(1) }));

    // Distribution des charges de travail
    const distCharge = [
        { name: '< 25%', count: experts.filter(e => e.currentLoad < 0.25).length, color: '#10b981' },
        { name: '25-50%', count: experts.filter(e => e.currentLoad >= 0.25 && e.currentLoad < 0.5).length, color: '#06b6d4' },
        { name: '50-75%', count: experts.filter(e => e.currentLoad >= 0.5 && e.currentLoad < 0.75).length, color: '#f59e0b' },
        { name: '75-90%', count: experts.filter(e => e.currentLoad >= 0.75 && e.currentLoad < 0.9).length, color: '#ef4444' },
        { name: '> 90%', count: experts.filter(e => e.currentLoad >= 0.9).length, color: '#dc2626' },
    ];

    const couleurStatut: Record<string, string> = {
        available: '#10b981', busy: '#f59e0b', offline: '#6b7280', break: '#8b5cf6',
    };
    const libelleStatut: Record<string, string> = {
        available: 'Disponible', busy: 'Occupé', offline: 'Hors ligne', break: 'En pause',
    };

    return (
        <div className="panneau-experts">
            <div className="page-header">
                <h2 className="page-title"><Users size={24} /> Experts Analystes de Fraude (FiFAR)</h2>
                <p className="page-description">50 experts synthétiques avec comportements variés, biais et niveaux de performance différents</p>
            </div>

            {/* Résumé des experts */}
            <div className="expert-summary">
                <div className="summary-card summary-available">
                    <span className="summary-number">{expertsDispo}</span>
                    <span className="summary-label">Disponibles</span>
                </div>
                <div className="summary-card summary-busy">
                    <span className="summary-number">{expertsOccupes}</span>
                    <span className="summary-label">Occupés</span>
                </div>
                <div className="summary-card summary-offline">
                    <span className="summary-number">{expertsHorsLigne}</span>
                    <span className="summary-label">Hors ligne</span>
                </div>
                <div className="summary-card summary-accuracy">
                    <span className="summary-number">{(precisionMoyenne * 100).toFixed(1)}%</span>
                    <span className="summary-label">Précision moy.</span>
                </div>
                <div className="summary-card summary-load">
                    <span className="summary-number">{(chargeMoyenne * 100).toFixed(0)}%</span>
                    <span className="summary-label">Charge moy.</span>
                </div>
            </div>

            {/* Graphiques */}
            <div className="charts-grid-2">
                <div className="chart-card">
                    <h3 className="chart-title"><Star size={18} /> Top 10 Experts par Précision</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={top10} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" domain={[60, 100]} stroke="#64748b" fontSize={11} />
                            <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={80} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                            <Bar dataKey="precision" fill="#10b981" radius={[0, 4, 4, 0]} name="Précision %" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3 className="chart-title"><BarChart3 size={18} /> Distribution des Charges de Travail</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={distCharge}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Nombre d'experts">
                                {distCharge.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Liste des experts */}
            <div className="chart-card">
                <h3 className="chart-title"><User size={18} /> Liste Complète des Experts</h3>
                <div className="experts-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th><th>Nom</th><th>Spécialisation</th><th>Précision</th>
                                <th>Taux FP</th><th>Temps rép.</th><th>Charge</th><th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {experts.slice(0, 25).map(e => (
                                <tr key={e.id} className="table-row">
                                    <td className="td-id">{e.id}</td>
                                    <td>{e.name}</td>
                                    <td><span className="badge badge-info">{e.specialization}</span></td>
                                    <td className={e.accuracy > 0.85 ? 'text-success' : e.accuracy > 0.75 ? 'text-warning' : 'text-danger'}>
                                        {(e.accuracy * 100).toFixed(1)}%
                                    </td>
                                    <td>{(e.falsePositiveRate * 100).toFixed(1)}%</td>
                                    <td><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{e.avgResponseTime.toFixed(0)}s</td>
                                    <td>
                                        <div className="charge-bar">
                                            <div className="charge-fill" style={{
                                                width: `${e.currentLoad * 100}%`,
                                                background: e.currentLoad > 0.8 ? '#ef4444' : e.currentLoad > 0.5 ? '#f59e0b' : '#10b981',
                                            }} />
                                            <span className="charge-text">{(e.currentLoad * 100).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: `${couleurStatut[e.status]}20`, color: couleurStatut[e.status] }}>
                                            {libelleStatut[e.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
