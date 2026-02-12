// ─────────────────────────────────────────────────────────────
// Composant : DataExplorer — Exploration des Données FiFAR
// ─────────────────────────────────────────────────────────────
// Permet d'explorer le dataset BAF (Bank Account Fraud),
// de visualiser les distributions des features et de filtrer
// les données par attributs protégés.

import { useState, useMemo } from 'react';
import { Database, Search, BarChart3, Filter, PieChart as PieChartIcon, Download } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import type { Transaction } from '../types';

// ═══════════════════════════════════════════════════════════
//  Interface des Props
// ═══════════════════════════════════════════════════════════

interface DataExplorerProps {
    /** Liste des transactions disponibles */
    transactions: Transaction[];
}

// ═══════════════════════════════════════════════════════════
//  Couleurs pour les graphiques
// ═══════════════════════════════════════════════════════════

const COULEURS_CANAL = {
    online: '#06b6d4',
    pos: '#10b981',
    atm: '#f59e0b',
    mobile: '#8b5cf6',
};

const COULEURS_RISQUE = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
};

// ═══════════════════════════════════════════════════════════
//  Composant Principal
// ═══════════════════════════════════════════════════════════

export default function DataExplorer({ transactions }: DataExplorerProps) {
    const [filtreRecherche, setFiltreRecherche] = useState('');
    const [featureSelectionnee, setFeatureSelectionnee] = useState('amount');

    // ─── Statistiques globales du dataset ───
    const stats = useMemo(() => {
        const total = transactions.length;
        const fraudes = transactions.filter(t => t.fraudBool).length;
        const montantTotal = transactions.reduce((s, t) => s + t.amount, 0);
        const montantMoyen = total > 0 ? montantTotal / total : 0;
        const paysUniques = new Set(transactions.map(t => t.country)).size;
        const canauxUniques = new Set(transactions.map(t => t.channel)).size;

        return {
            total,
            fraudes,
            tauxFraude: total > 0 ? fraudes / total : 0,
            montantTotal,
            montantMoyen,
            paysUniques,
            canauxUniques,
        };
    }, [transactions]);

    // ─── Distribution par canal ───
    const distributionCanal = useMemo(() => {
        const compteurs: Record<string, number> = {};
        transactions.forEach(t => {
            compteurs[t.channel] = (compteurs[t.channel] || 0) + 1;
        });
        return Object.entries(compteurs).map(([canal, count]) => ({
            name: canal === 'online' ? 'En ligne' : canal === 'pos' ? 'Terminal' : canal === 'atm' ? 'Distributeur' : 'Mobile',
            value: count,
            color: COULEURS_CANAL[canal as keyof typeof COULEURS_CANAL] || '#6b7280',
        }));
    }, [transactions]);

    // ─── Distribution par niveau de risque ───
    const distributionRisque = useMemo(() => {
        const compteurs: Record<string, number> = {};
        transactions.forEach(t => {
            compteurs[t.riskLevel] = (compteurs[t.riskLevel] || 0) + 1;
        });
        return Object.entries(compteurs).map(([risque, count]) => ({
            name: risque === 'low' ? 'Faible' : risque === 'medium' ? 'Moyen' : risque === 'high' ? 'Élevé' : 'Critique',
            value: count,
            color: COULEURS_RISQUE[risque as keyof typeof COULEURS_RISQUE] || '#6b7280',
        }));
    }, [transactions]);

    // ─── Distribution des montants (histogramme) ───
    const histogrammeMontants = useMemo(() => {
        const bornes = [0, 50, 100, 200, 500, 1000, 2000, 5000, Infinity];
        const labels = ['0-50', '50-100', '100-200', '200-500', '500-1K', '1K-2K', '2K-5K', '5K+'];

        return labels.map((label, i) => {
            const count = transactions.filter(t => t.amount >= bornes[i] && t.amount < bornes[i + 1]).length;
            const fraudCount = transactions.filter(t => t.amount >= bornes[i] && t.amount < bornes[i + 1] && t.fraudBool).length;
            return {
                name: label,
                total: count,
                fraudes: fraudCount,
                tauxFraude: count > 0 ? +(fraudCount / count * 100).toFixed(1) : 0,
            };
        });
    }, [transactions]);

    // ─── Scatter plot montant vs score ML ───
    const scatterData = useMemo(() => {
        return transactions.slice(0, 200).map(t => ({
            montant: t.amount,
            scoreML: +(t.modelScore * 100).toFixed(1),
            fraude: t.fraudBool ? 1 : 0,
            taille: t.fraudBool ? 80 : 30,
        }));
    }, [transactions]);

    // ─── Features disponibles pour l'exploration ───
    const features = [
        { id: 'amount', label: 'Montant (€)' },
        { id: 'modelScore', label: 'Score ML' },
        { id: 'channel', label: 'Canal' },
        { id: 'riskLevel', label: 'Niveau de risque' },
        { id: 'country', label: 'Pays' },
    ];

    return (
        <div className="data-explorer">
            {/* ─── En-tête ─── */}
            <div className="page-header">
                <h2 className="page-title">
                    <Database size={24} />
                    Exploration des Données FiFAR
                </h2>
                <p className="page-description">
                    Exploration interactive du dataset Bank Account Fraud — {stats.total.toLocaleString('fr-FR')} transactions analysées
                </p>
            </div>

            {/* ─── Cartes statistiques ─── */}
            <div className="kpi-grid">
                <div className="kpi-card" style={{ '--kpi-color': '#06b6d4' } as React.CSSProperties}>
                    <div className="kpi-body">
                        <span className="kpi-value">{stats.total.toLocaleString('fr-FR')}</span>
                        <span className="kpi-label">Transactions totales</span>
                    </div>
                </div>
                <div className="kpi-card" style={{ '--kpi-color': '#ef4444' } as React.CSSProperties}>
                    <div className="kpi-body">
                        <span className="kpi-value">{stats.fraudes.toLocaleString('fr-FR')}</span>
                        <span className="kpi-label">Fraudes ({(stats.tauxFraude * 100).toFixed(2)}%)</span>
                    </div>
                </div>
                <div className="kpi-card" style={{ '--kpi-color': '#10b981' } as React.CSSProperties}>
                    <div className="kpi-body">
                        <span className="kpi-value">{stats.montantMoyen.toFixed(0)}€</span>
                        <span className="kpi-label">Montant moyen</span>
                    </div>
                </div>
                <div className="kpi-card" style={{ '--kpi-color': '#8b5cf6' } as React.CSSProperties}>
                    <div className="kpi-body">
                        <span className="kpi-value">{stats.paysUniques}</span>
                        <span className="kpi-label">Pays distincts</span>
                    </div>
                </div>
            </div>

            {/* ─── Sélecteur de feature ─── */}
            <div className="explorer-controls">
                <div className="feature-selector">
                    <Filter size={16} />
                    <span>Feature à explorer :</span>
                    {features.map(f => (
                        <button
                            key={f.id}
                            className={`feature-btn ${featureSelectionnee === f.id ? 'feature-btn-active' : ''}`}
                            onClick={() => setFeatureSelectionnee(f.id)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Graphiques principaux ─── */}
            <div className="charts-grid-2">
                {/* Distribution des montants avec taux de fraude */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        <BarChart3 size={18} />
                        Distribution des Montants vs Taux de Fraude
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={histogrammeMontants}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                            <YAxis yAxisId="left" stroke="#64748b" fontSize={11} />
                            <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} />
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                            <Bar yAxisId="left" dataKey="total" fill="#06b6d4" name="Total" radius={[4, 4, 0, 0]} opacity={0.7} />
                            <Bar yAxisId="left" dataKey="fraudes" fill="#ef4444" name="Fraudes" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Scatter plot : Montant vs Score ML */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        <PieChartIcon size={18} />
                        Montant vs Score ML (Échantillon)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="montant" name="Montant (€)" stroke="#64748b" fontSize={11} />
                            <YAxis dataKey="scoreML" name="Score ML (%)" stroke="#64748b" fontSize={11} />
                            <ZAxis dataKey="taille" range={[20, 80]} />
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                            <Scatter
                                data={scatterData.filter(d => !d.fraude)}
                                fill="#06b6d4"
                                name="Légitime"
                                opacity={0.6}
                            />
                            <Scatter
                                data={scatterData.filter(d => d.fraude)}
                                fill="#ef4444"
                                name="Fraude"
                                opacity={0.8}
                            />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="charts-grid-2">
                {/* Distribution par canal */}
                <div className="chart-card">
                    <h3 className="chart-title">Distribution par Canal</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={distributionCanal}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                                labelLine={false}
                            >
                                {distributionCanal.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Distribution par niveau de risque */}
                <div className="chart-card">
                    <h3 className="chart-title">Distribution par Niveau de Risque</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={distributionRisque}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                            <Bar dataKey="value" name="Nombre" radius={[4, 4, 0, 0]}>
                                {distributionRisque.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
