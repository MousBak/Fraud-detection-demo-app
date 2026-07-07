// ─────────────────────────────────────────────────────────────
// Composant : PanneauValidation — Validation Temporelle (Fenêtre Glissante)
// ─────────────────────────────────────────────────────────────

import { Calendar, TrendingUp, ShieldAlert } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface PanneauValidationProps {
    rollingValidation: any;
}

export default function PanneauValidation({ rollingValidation }: PanneauValidationProps) {
    if (!rollingValidation || !rollingValidation.rolling_validation) {
        return (
            <div className="loading-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <Calendar size={48} style={{ marginBottom: '16px', color: '#06b6d4', opacity: 0.6 }} />
                <h3>Chargement de la validation temporelle...</h3>
                <p>Calcul des performances par fenêtre glissante sur le dataset FiFAR...</p>
            </div>
        );
    }

    const data = rollingValidation.rolling_validation;

    return (
        <div className="panneau-validation" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="page-header">
                <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '24px', fontWeight: 600 }}>
                    <Calendar size={24} color="#06b6d4" /> Validation Temporelle (Fenêtre Glissante)
                </h2>
                <p className="page-description" style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
                    Évaluation robuste de la dérive conceptuelle temporelle sur les mois 5 à 7 (mémoire v7).
                </p>
            </div>

            {/* Cartes récapitulatives */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {data.map((fold: any, index: number) => (
                    <div key={index} style={{
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        borderLeft: `4px solid ${index === 0 ? '#06b6d4' : index === 1 ? '#10b981' : '#f59e0b'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>{fold.fold}</h3>
                            <span style={{ fontSize: '12px', color: '#64748b', background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>
                                Train: {fold.train_size} | Test: {fold.test_size}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#06b6d4' }}>{(fold.recall * 100).toFixed(1)}%</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Rappel</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{(fold.auc_pr * 100).toFixed(1)}%</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>AUC-PR</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{(fold.auc_roc * 100).toFixed(1)}%</div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>AUC-ROC</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Graphique de comparaison */}
            <div style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} color="#06b6d4" /> Évolution temporelle des performances
                </h3>
                <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.map((f: any) => ({
                            name: f.fold.split(' → ')[0],
                            'Rappel (%)': +(f.recall * 100).toFixed(1),
                            'AUC-PR (%)': +(f.auc_pr * 100).toFixed(1),
                            'AUC-ROC (%)': +(f.auc_roc * 100).toFixed(1),
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" domain={[0, 100]} />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                            <Legend />
                            <Bar dataKey="Rappel (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="AUC-PR (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="AUC-ROC (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Note méthodologique */}
            <div style={{
                background: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start'
            }}>
                <ShieldAlert size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Analyse de dérive conceptuelle temporelle</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
                        Le dataset BAF présente un déséquilibre de classe important et une dérive temporelle marquée. 
                        L'évaluation par fenêtre glissante montre que le modèle XGBoost maintient des performances robustes 
                        avec un AUC-PR oscillant entre 24 % et 29 %. Cette approche de validation est celle documentée dans le 
                        mémoire de recherche v7 pour s'assurer que le modèle reste résilient aux changements de comportement 
                        des fraudeurs au fil des mois.
                    </p>
                </div>
            </div>
        </div>
    );
}
