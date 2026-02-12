// ─────────────────────────────────────────────────────────────
// Composant : BarreLatérale (Sidebar Navigation)
// ─────────────────────────────────────────────────────────────
// Navigation latérale du tableau de bord avec les différents onglets.
// Design inspiré des dashboards professionnels modernes.

import {
    LayoutDashboard,   // Icône vue d'ensemble
    ArrowLeftRight,    // Icône transactions
    Search,            // Icône exploration des données
    Cpu,               // Icône entraînement
    Brain,             // Icône modèles ML
    Users,             // Icône experts
    GitBranch,         // Icône L2D
    Database,          // Icône pipeline
    Bell,              // Icône alertes
    Scale,             // Icône équité
    Shield,            // Icône bouclier (logo)
    Activity,          // Icône indicateur temps réel
} from 'lucide-react';
import type { TabType } from '../types';

// Définition des éléments de navigation avec libellés en français
const ELEMENTS_NAV: { id: TabType; label: string; icone: React.ElementType; description: string }[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icone: LayoutDashboard, description: 'Métriques globales et KPIs' },
    { id: 'transactions', label: 'Transactions', icone: ArrowLeftRight, description: 'Flux en temps réel' },
    { id: 'data-explorer', label: 'Exploration', icone: Search, description: 'Explorer le dataset FiFAR' },
    { id: 'training', label: 'Entraînement', icone: Cpu, description: 'Entraîner les modèles ML' },
    { id: 'models', label: 'Modèles ML', icone: Brain, description: 'Performance et dérive' },
    { id: 'experts', label: 'Experts', icone: Users, description: 'Analystes de fraude' },
    { id: 'l2d', label: 'Learning to Defer', icone: GitBranch, description: 'Décisions hybrides' },
    { id: 'pipeline', label: 'Pipeline', icone: Database, description: 'Infrastructure Kafka' },
    { id: 'alerts', label: 'Alertes', icone: Bell, description: 'Notifications système' },
    { id: 'fairness', label: 'Équité', icone: Scale, description: 'Biais et fairness' },
];

interface BarreLateraleProps {
    ongletActif: TabType;             // Onglet actuellement sélectionné
    onChangerOnglet: (onglet: TabType) => void; // Callback au changement d'onglet
    estEnDirect: boolean;             // Mode temps réel activé ?
    onBasculerDirect: () => void;     // Callback pour basculer le mode direct
    alertesCritiques: number;         // Nombre d'alertes critiques non acquittées
}

export default function BarreLaterale({
    ongletActif,
    onChangerOnglet,
    estEnDirect,
    onBasculerDirect,
    alertesCritiques,
}: BarreLateraleProps) {
    return (
        <aside className="sidebar">
            {/* ─── Logo et Titre ─── */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Shield size={28} />
                    <div>
                        <h1 className="sidebar-title">FiFAR</h1>
                        <p className="sidebar-subtitle">Détection de Fraude</p>
                    </div>
                </div>
            </div>

            {/* ─── Indicateur temps réel ─── */}
            <button
                className={`live-toggle ${estEnDirect ? 'live-active' : 'live-inactive'}`}
                onClick={onBasculerDirect}
                title={estEnDirect ? 'Désactiver le mode temps réel' : 'Activer le mode temps réel'}
            >
                <Activity size={16} className={estEnDirect ? 'pulse-icon' : ''} />
                <span>{estEnDirect ? 'EN DIRECT' : 'HORS LIGNE'}</span>
                <span className={`live-dot ${estEnDirect ? 'dot-active' : 'dot-inactive'}`} />
            </button>

            {/* ─── Navigation ─── */}
            <nav className="sidebar-nav">
                {ELEMENTS_NAV.map((element) => {
                    const Icone = element.icone;
                    const estActif = ongletActif === element.id;

                    return (
                        <button
                            key={element.id}
                            className={`nav-item ${estActif ? 'nav-item-active' : ''}`}
                            onClick={() => onChangerOnglet(element.id)}
                            title={element.description}
                        >
                            <Icone size={20} />
                            <span className="nav-label">{element.label}</span>
                            {/* Badge d'alertes critiques sur l'onglet Alertes */}
                            {element.id === 'alerts' && alertesCritiques > 0 && (
                                <span className="badge-alerte">{alertesCritiques}</span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* ─── Pied de la barre latérale ─── */}
            <div className="sidebar-footer">
                <div className="sidebar-version">
                    <span>v3.2.1</span>
                    <span className="separator">•</span>
                    <span>Dataset FiFAR</span>
                </div>
                <p className="sidebar-credit">Basé sur le dataset Feedzai</p>
            </div>
        </aside>
    );
}
