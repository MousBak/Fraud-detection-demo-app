// ─────────────────────────────────────────────────────────────
// Composant : VueEnsemble (Overview Dashboard)
// ─────────────────────────────────────────────────────────────
// Page principale affichant les KPIs clés, les graphiques
// de performance et l'état général du système de détection.

import {
    ShieldCheck,
    ShieldAlert,
    Zap,
    Clock,
    TrendingUp,
    Users,
    AlertTriangle,
    Activity,
    Target,
    Eye,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import type { PipelineMetrics, ModelMetrics, ChartDataPoint, SystemHealth } from '../types';

// ═══════════════════════════════════════════════════════════
//  Interfaces des Props
// ═══════════════════════════════════════════════════════════

interface VueEnsembleProps {
    stats: {
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
    };
    metriquesPipeline: PipelineMetrics[];
    metriquesModele: ModelMetrics[];
    distributionL2D: ChartDataPoint[];
    santeSysteme: SystemHealth;
}

// ═══════════════════════════════════════════════════════════
//  Composant KPI Card
// ═══════════════════════════════════════════════════════════

/** Carte individuelle affichant un indicateur clé de performance */
function CarteKPI({
    titre,
    valeur,
    unite,
    icone: Icone,
    couleur,
    tendance,
    sousTexte,
}: {
    titre: string;
    valeur: string | number;
    unite?: string;
    icone: React.ElementType;
    couleur: string;
    tendance?: 'up' | 'down' | 'stable';
    sousTexte?: string;
}) {
    return (
        <div className="kpi-card" style={{ '--kpi-color': couleur } as React.CSSProperties}>
            <div className="kpi-header">
                <div className="kpi-icon-wrapper" style={{ background: `${couleur}15`, color: couleur }}>
                    <Icone size={22} />
                </div>
                {tendance && (
                    <span className={`kpi-trend kpi-trend-${tendance}`}>
                        {tendance === 'up' ? '↑' : tendance === 'down' ? '↓' : '→'}
                    </span>
                )}
            </div>
            <div className="kpi-body">
                <span className="kpi-value">
                    {typeof valeur === 'number' ? valeur.toLocaleString('fr-FR') : valeur}
                    {unite && <span className="kpi-unit">{unite}</span>}
                </span>
                <span className="kpi-label">{titre}</span>
                {sousTexte && <span className="kpi-subtext">{sousTexte}</span>}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
//  Composant Principal VueEnsemble
// ═══════════════════════════════════════════════════════════

export default function VueEnsemble({
    stats,
    metriquesPipeline,
    metriquesModele,
    distributionL2D,
    santeSysteme,
}: VueEnsembleProps) {
    // Préparer les données pour le graphique du débit
    const donneesDebit = metriquesPipeline.slice(-30).map((m, i) => ({
        time: new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        tps: m.transactionsPerSecond,
        fraudes: m.fraudsDetected,
        latence: m.avgLatencyMs,
    }));

    // Préparer les données pour la courbe du modèle
    const donneesModele = metriquesModele.slice(-24).map((m) => ({
        time: new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        precision: +(m.precision * 100).toFixed(1),
        rappel: +(m.recall * 100).toFixed(1),
        f1: +(m.f1Score * 100).toFixed(1),
    }));

    // Données radar de comparaison des performances
    const donneesRadar = [
        { metric: 'Précision', mlSeul: 92.4, hybride: 94.5, full: 100 },
        { metric: 'Rappel', mlSeul: 95.8, hybride: 97.1, full: 100 },
        { metric: 'F1-Score', mlSeul: 94.1, hybride: 95.8, full: 100 },
        { metric: 'AUC', mlSeul: 98.3, hybride: 99.2, full: 100 },
        { metric: 'FPR (inv)', mlSeul: 99.2, hybride: 99.5, full: 100 },
    ];

    // État des services (pour l'indicateur de santé)
    const services = Object.values(santeSysteme);

    return (
        <div className="vue-ensemble">
            {/* ─── Titre de la page ─── */}
            <div className="page-header">
                <h2 className="page-title">
                    <Activity size={24} />
                    Vue d'ensemble — Détection de Fraude en Temps Réel
                </h2>
                <p className="page-description">
                    Surveillance globale du système FiFAR avec 50 experts synthétiques et modèles ML hybrides
                </p>
            </div>

            {/* ─── Cartes KPI Principales ─── */}
            <div className="kpi-grid">
                <CarteKPI
                    titre="Transactions/sec"
                    valeur={stats.transactionsParSeconde.toLocaleString('fr-FR')}
                    icone={Zap}
                    couleur="#06b6d4"
                    tendance="up"
                    sousTexte="Objectif : 10 000/s"
                />
                <CarteKPI
                    titre="Fraudes détectées"
                    valeur={stats.fraudesDetectees}
                    icone={ShieldAlert}
                    couleur="#ef4444"
                    tendance="stable"
                    sousTexte={`Taux : ${(stats.tauxFraude * 100).toFixed(2)}%`}
                />
                <CarteKPI
                    titre="Faux positifs"
                    valeur={stats.fauxPositifs}
                    icone={AlertTriangle}
                    couleur="#f59e0b"
                    tendance="down"
                    sousTexte={`Taux FP : ${(stats.tauxFauxPositifs * 100).toFixed(2)}%`}
                />
                <CarteKPI
                    titre="Latence P99"
                    valeur={stats.latenceP99.toFixed(0)}
                    unite="ms"
                    icone={Clock}
                    couleur="#8b5cf6"
                    tendance={stats.latenceP99 < 100 ? 'stable' : 'up'}
                    sousTexte={`Moyenne : ${stats.latenceMoyenne.toFixed(0)}ms`}
                />
                <CarteKPI
                    titre="Précision du modèle"
                    valeur={`${(stats.precisionModele * 100).toFixed(1)}%`}
                    icone={Target}
                    couleur="#10b981"
                    tendance="up"
                    sousTexte={`Rappel : ${(stats.rappelModele * 100).toFixed(1)}%`}
                />
                <CarteKPI
                    titre="Décisions auto"
                    valeur={stats.decisionsAuto.toLocaleString('fr-FR')}
                    icone={ShieldCheck}
                    couleur="#3b82f6"
                    tendance="stable"
                    sousTexte={`Déférées : ${stats.deferreesExpert}`}
                />
                <CarteKPI
                    titre="Experts disponibles"
                    valeur={`${stats.expertsDispo}/50`}
                    icone={Users}
                    couleur="#ec4899"
                    tendance="stable"
                    sousTexte={`Utilisation : ${(stats.utilisationExperts * 100).toFixed(0)}%`}
                />
                <CarteKPI
                    titre="Alertes critiques"
                    valeur={stats.alertesCritiques}
                    icone={AlertTriangle}
                    couleur={stats.alertesCritiques > 0 ? '#ef4444' : '#10b981'}
                    tendance={stats.alertesCritiques > 0 ? 'up' : 'stable'}
                    sousTexte={stats.alertesCritiques > 0 ? 'Action requise' : 'Tout est normal'}
                />
            </div>

            {/* ─── Graphiques Principaux ─── */}
            <div className="charts-grid-2">
                {/* Graphique : Débit des transactions */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        <TrendingUp size={18} />
                        Débit des Transactions (Temps Réel)
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={donneesDebit}>
                            <defs>
                                <linearGradient id="gradientTps" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradientFraude" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area type="monotone" dataKey="tps" stroke="#06b6d4" fill="url(#gradientTps)" name="Transactions/s" />
                            <Area type="monotone" dataKey="fraudes" stroke="#ef4444" fill="url(#gradientFraude)" name="Fraudes" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Graphique : Performance du modèle ML */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        <Eye size={18} />
                        Performance du Modèle ML (24h)
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={donneesModele}>
                            <defs>
                                <linearGradient id="gradientPrecision" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                            <YAxis domain={[85, 100]} stroke="#64748b" fontSize={11} />
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                                formatter={(value: number) => `${value}%`}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="precision" stroke="#10b981" fill="url(#gradientPrecision)" name="Précision %" />
                            <Area type="monotone" dataKey="rappel" stroke="#8b5cf6" fill="none" name="Rappel %" strokeDasharray="5 5" />
                            <Area type="monotone" dataKey="f1" stroke="#f59e0b" fill="none" name="F1-Score %" strokeDasharray="3 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="charts-grid-2">
                {/* Graphique : Distribution des décisions L2D */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        Distribution L2D
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={distributionL2D}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={4}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}%`}
                                labelLine={false}
                            >
                                {distributionL2D.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Graphique Radar : ML seul vs Hybride */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        ML seul vs Hybride (L2D)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={donneesRadar}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                            <PolarRadiusAxis domain={[85, 100]} stroke="#334155" fontSize={10} />
                            <Radar name="ML Seul" dataKey="mlSeul" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                            <Radar name="Hybride L2D" dataKey="hybride" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                            <Legend />
                            <Tooltip
                                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── État des Services ─── */}
            <div className="chart-card">
                <h3 className="chart-title">
                    <Activity size={18} />
                    État de Santé des Services
                </h3>
                <div className="services-grid">
                    {services.map((service) => (
                        <div key={service.name} className={`service-card service-${service.status}`}>
                            <div className="service-header">
                                <span className={`service-dot service-dot-${service.status}`} />
                                <span className="service-name">{service.name}</span>
                            </div>
                            <div className="service-metrics">
                                <div className="service-metric">
                                    <span className="metric-label">Disponibilité</span>
                                    <span className="metric-value">{service.uptime}%</span>
                                </div>
                                <div className="service-metric">
                                    <span className="metric-label">Latence</span>
                                    <span className="metric-value">{service.latencyMs}ms</span>
                                </div>
                                <div className="service-metric">
                                    <span className="metric-label">CPU</span>
                                    <span className="metric-value">{service.cpu}%</span>
                                </div>
                                <div className="service-metric">
                                    <span className="metric-label">Mémoire</span>
                                    <span className="metric-value">{service.memory}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
