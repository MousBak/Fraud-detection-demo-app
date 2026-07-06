// ─────────────────────────────────────────────────────────────
// Composant : PanneauPipeline — Infrastructure Kafka & Pipeline
// ─────────────────────────────────────────────────────────────
// Monitore l'infrastructure de streaming : topics Kafka, débit,
// latence, et état des services.

import { Database, Server, Activity, Gauge } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import type { KafkaTopic, PipelineMetrics, SystemHealth } from '../types';

interface PanneauPipelineProps {
    topicsKafka: KafkaTopic[];
    metriquesPipeline: PipelineMetrics[];
    santeSysteme: SystemHealth;
}

export default function PanneauPipeline({ topicsKafka, metriquesPipeline, santeSysteme }: PanneauPipelineProps) {
    // Données de latence pour le graphique
    const donneesLatence = metriquesPipeline.slice(-30).map(m => ({
        time: new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        moyenne: m.avgLatencyMs, p99: m.p99LatencyMs, seuil: 100,
    }));

    // Données de débit
    const donneesDebit = metriquesPipeline.slice(-30).map(m => ({
        time: new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        tps: m.transactionsPerSecond, erreurs: +(m.errorRate * 10000).toFixed(0),
    }));

    const services = Object.values(santeSysteme);
    const statutIcon = (s: string) => s === 'healthy' ? '🟢' : s === 'degraded' ? '🟡' : '🔴';

    return (
        <div className="panneau-pipeline">
            <div className="page-header">
                <h2 className="page-title"><Database size={24} /> Pipeline de Données & Infrastructure</h2>
                <p className="page-description">Monitoring des topics Kafka, latence, débit et état des services en temps réel</p>
            </div>

            {/* Avertissement Architecture Cible */}
            <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: 'system-ui'
            }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                    <h4 style={{ margin: 0, fontWeight: 'bold', color: '#f87171' }}>Architecture cible — Non implémentée dans cette démo</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>
                        Cette page représente l'infrastructure de production cible (Kafka stream, Feast Feature Store, Elasticsearch).
                        Dans cet environnement local, les calculs sont effectués en direct par le backend FastAPI connecté au dataset réel.
                    </p>
                </div>
            </div>

            {/* Topics Kafka */}
            <div className="chart-card">
                <h3 className="chart-title"><Server size={18} /> Topics Kafka</h3>
                <div className="kafka-topics-grid">
                    {topicsKafka.map(topic => (
                        <div key={topic.name} className={`kafka-topic topic-${topic.status}`}>
                            <div className="topic-header">
                                <span className="topic-name">{topic.name}</span>
                                <span className={`topic-status status-${topic.status}`}>{statutIcon(topic.status)} {topic.status}</span>
                            </div>
                            <div className="topic-metrics">
                                <div className="topic-metric">
                                    <span className="tm-label">Messages/s</span>
                                    <span className="tm-value">{topic.messagesPerSecond.toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="topic-metric">
                                    <span className="tm-label">Partitions</span>
                                    <span className="tm-value">{topic.partitions}</span>
                                </div>
                                <div className="topic-metric">
                                    <span className="tm-label">Réplication</span>
                                    <span className="tm-value">×{topic.replicationFactor}</span>
                                </div>
                                <div className="topic-metric">
                                    <span className="tm-label">Retard consommateur</span>
                                    <span className={`tm-value ${topic.consumerLag > 50 ? 'text-danger' : ''}`}>
                                        {topic.consumerLag}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Graphiques */}
            <div className="charts-grid-2">
                <div className="chart-card">
                    <h3 className="chart-title"><Gauge size={18} /> Latence du Pipeline</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={donneesLatence}>
                            <defs>
                                <linearGradient id="gLat" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                            <Legend />
                            <Area type="monotone" dataKey="moyenne" stroke="#8b5cf6" fill="url(#gLat)" name="Latence moyenne (ms)" />
                            <Area type="monotone" dataKey="p99" stroke="#ef4444" fill="none" name="P99 (ms)" strokeDasharray="5 5" />
                            <Area type="monotone" dataKey="seuil" stroke="#f59e0b" fill="none" name="Seuil 100ms" strokeDasharray="3 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h3 className="chart-title"><Activity size={18} /> Débit des Transactions</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={donneesDebit}>
                            <defs>
                                <linearGradient id="gTps" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                            <Legend />
                            <Area type="monotone" dataKey="tps" stroke="#06b6d4" fill="url(#gTps)" name="Transactions/s" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Services */}
            <div className="chart-card">
                <h3 className="chart-title"><Server size={18} /> État des Services</h3>
                <div className="services-grid">
                    {services.map(s => (
                        <div key={s.name} className={`service-card service-${s.status}`}>
                            <div className="service-header">
                                <span className={`service-dot service-dot-${s.status}`} />
                                <span className="service-name">{s.name}</span>
                            </div>
                            <div className="service-metrics">
                                <div className="service-metric"><span className="metric-label">Disponibilité</span><span className="metric-value">{s.uptime}%</span></div>
                                <div className="service-metric"><span className="metric-label">Latence</span><span className="metric-value">{s.latencyMs}ms</span></div>
                                <div className="service-metric"><span className="metric-label">CPU</span><span className="metric-value">{s.cpu}%</span></div>
                                <div className="service-metric"><span className="metric-label">RAM</span><span className="metric-value">{s.memory}%</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
