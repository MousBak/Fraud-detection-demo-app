// ─────────────────────────────────────────────────────────────
// Composant : PanneauAlertes — Alertes et Notifications Système
// ─────────────────────────────────────────────────────────────

import { Bell, AlertTriangle, AlertCircle, Info, ShieldAlert, Check } from 'lucide-react';
import type { Alert } from '../types';

interface PanneauAlertesProps {
    alertes: Alert[];
    onAcquitter: (id: string) => void;  // Callback pour acquitter une alerte
}

const ICONES_TYPE: Record<string, React.ElementType> = {
    fraud_detected: ShieldAlert,
    model_drift: AlertTriangle,
    system_error: AlertCircle,
    capacity_warning: AlertTriangle,
    fairness_violation: AlertTriangle,
    latency_spike: AlertCircle,
};

const LIBELLE_TYPE: Record<string, string> = {
    fraud_detected: 'Fraude détectée',
    model_drift: 'Dérive du modèle',
    system_error: 'Erreur système',
    capacity_warning: 'Alerte capacité',
    fairness_violation: 'Violation d\'équité',
    latency_spike: 'Pic de latence',
};

const COULEUR_SEVERITE: Record<string, string> = {
    critical: '#ef4444', error: '#f97316', warning: '#f59e0b', info: '#3b82f6',
};

const LIBELLE_SEVERITE: Record<string, string> = {
    critical: 'Critique', error: 'Erreur', warning: 'Avertissement', info: 'Information',
};

export default function PanneauAlertes({ alertes, onAcquitter }: PanneauAlertesProps) {
    // Trier : non acquittées d'abord, puis par sévérité
    const severiteOrdre = { critical: 0, error: 1, warning: 2, info: 3 };
    const alertesTriees = [...alertes].sort((a, b) => {
        if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
        return (severiteOrdre[a.severity] || 4) - (severiteOrdre[b.severity] || 4);
    });

    const nonAcquittees = alertes.filter(a => !a.acknowledged).length;
    const critiques = alertes.filter(a => a.severity === 'critical' && !a.acknowledged).length;

    return (
        <div className="panneau-alertes">
            <div className="page-header">
                <h2 className="page-title"><Bell size={24} /> Alertes et Notifications</h2>
                <p className="page-description">
                    {nonAcquittees} alerte{nonAcquittees !== 1 ? 's' : ''} non acquittée{nonAcquittees !== 1 ? 's' : ''}
                    {critiques > 0 && <span className="text-danger"> dont {critiques} critique{critiques !== 1 ? 's' : ''}</span>}
                </p>
            </div>

            {/* Résumé par sévérité */}
            <div className="alertes-summary">
                {['critical', 'error', 'warning', 'info'].map(sev => {
                    const count = alertes.filter(a => a.severity === sev && !a.acknowledged).length;
                    return (
                        <div key={sev} className="alerte-summary-card" style={{ borderColor: COULEUR_SEVERITE[sev] }}>
                            <span className="alerte-summary-count" style={{ color: COULEUR_SEVERITE[sev] }}>{count}</span>
                            <span className="alerte-summary-label">{LIBELLE_SEVERITE[sev]}</span>
                        </div>
                    );
                })}
            </div>

            {/* Liste des alertes */}
            <div className="alertes-list">
                {alertesTriees.map(alerte => {
                    const Icone = ICONES_TYPE[alerte.type] || Info;
                    const couleur = COULEUR_SEVERITE[alerte.severity];
                    const tempsDepuis = getTempsDepuis(alerte.timestamp);

                    return (
                        <div
                            key={alerte.id}
                            className={`alerte-card ${alerte.acknowledged ? 'alerte-acquittee' : ''}`}
                            style={{ '--alerte-color': couleur } as React.CSSProperties}
                        >
                            <div className="alerte-icon" style={{ background: `${couleur}15`, color: couleur }}>
                                <Icone size={20} />
                            </div>
                            <div className="alerte-body">
                                <div className="alerte-header">
                                    <h4 className="alerte-titre">{alerte.title}</h4>
                                    <div className="alerte-meta">
                                        <span className="badge" style={{ background: `${couleur}20`, color: couleur }}>
                                            {LIBELLE_SEVERITE[alerte.severity]}
                                        </span>
                                        <span className="badge badge-outline">{LIBELLE_TYPE[alerte.type]}</span>
                                        <span className="alerte-temps">{tempsDepuis}</span>
                                    </div>
                                </div>
                                <p className="alerte-message">{alerte.message}</p>
                                {alerte.relatedTransactionId && (
                                    <span className="alerte-ref">Transaction : {alerte.relatedTransactionId}</span>
                                )}
                            </div>
                            {!alerte.acknowledged && (
                                <button className="btn-acquitter" onClick={() => onAcquitter(alerte.id)} title="Acquitter cette alerte">
                                    <Check size={16} /> Acquitter
                                </button>
                            )}
                            {alerte.acknowledged && (
                                <span className="alerte-acquittee-label">✓ Acquittée</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** Calcule le temps écoulé depuis un horodatage (en français) */
function getTempsDepuis(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `Il y a ${heures}h`;
    return `Il y a ${Math.floor(heures / 24)}j`;
}
