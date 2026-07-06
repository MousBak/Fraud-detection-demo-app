// ─────────────────────────────────────────────────────────────
// Application Principale — Système de Détection de Fraude FiFAR
// ─────────────────────────────────────────────────────────────
// Point d'entrée de l'application React.
// Orchestre tous les composants du tableau de bord :
// Dashboard, exploration des données, entraînement des modèles,
// comparaison ML, analyse des experts, simulateur L2D,
// pipeline, alertes et analyse d'équité.

import { useDashboard } from './hooks/useDashboard';
import BarreLaterale from './components/BarreLaterale';
import VueEnsemble from './components/VueEnsemble';
import DataExplorer from './components/DataExplorer';
import ModelTraining from './components/ModelTraining';
import TableTransactions from './components/TableTransactions';
import PanneauModeles from './components/PanneauModeles';
import PanneauExperts from './components/PanneauExperts';
import PanneauL2D from './components/PanneauL2D';
import PanneauPipeline from './components/PanneauPipeline';
import PanneauAlertes from './components/PanneauAlertes';
import PanneauEquite from './components/PanneauEquite';

export default function App() {
  // Utiliser le hook principal pour toute la gestion d'état
  const dashboard = useDashboard();

  // Détermine quel contenu afficher selon l'onglet actif
  const renderContenu = () => {
    switch (dashboard.ongletActif) {
      case 'overview':
        return (
          <VueEnsemble
            stats={dashboard.stats}
            metriquesPipeline={dashboard.metriquesPipeline}
            metriquesModele={dashboard.metriquesModele}
            distributionL2D={dashboard.distributionL2D}
            santeSysteme={dashboard.santeSysteme}
          />
        );
      case 'transactions':
        return (
          <TableTransactions
            transactions={dashboard.transactions}
            onSelectionner={dashboard.selectionnerTransaction}
            transactionSelectionnee={dashboard.transactionSelectionnee}
          />
        );
      case 'data-explorer':
        return (
          <DataExplorer
            transactions={dashboard.transactions}
          />
        );
      case 'training':
        return (
          <ModelTraining />
        );
      case 'models':
        return (
          <PanneauModeles
            modeles={dashboard.modeles}
            metriquesModele={dashboard.metriquesModele}
          />
        );
      case 'experts':
        return (
          <PanneauExperts
            experts={dashboard.experts}
          />
        );
      case 'l2d':
        return (
          <PanneauL2D
            decisions={dashboard.decisionsL2D}
            distributionL2D={dashboard.distributionL2D}
            metriquesPipeline={dashboard.metriquesPipeline}
          />
        );
      case 'pipeline':
        return (
          <PanneauPipeline
            topicsKafka={dashboard.topicsKafka}
            metriquesPipeline={dashboard.metriquesPipeline}
            santeSysteme={dashboard.santeSysteme}
          />
        );
      case 'alerts':
        return (
          <PanneauAlertes
            alertes={dashboard.alertes}
            onAcquitter={dashboard.acquitterAlerte}
          />
        );
      case 'fairness':
        return (
          <PanneauEquite
            equite={dashboard.equite}
          />
        );
      default:
        return null;
    }
  };

  if (dashboard.chargement) {
    return (
      <div className="loading-screen" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#090d16', color: '#e2e8f0', fontFamily: 'system-ui'
      }}>
        <div className="spinner" style={{
          width: '50px', height: '50px', border: '4px solid #1e293b', borderTopColor: '#06b6d4',
          borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <h3>Connexion au backend FiFAR et chargement des données réelles...</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '10px' }}>Chargement d'alerts.parquet et expert_predictions.parquet</p>
      </div>
    );
  }

  if (dashboard.erreur) {
    return (
      <div className="error-screen" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#090d16', color: '#f87171', padding: '20px', fontFamily: 'system-ui',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ color: '#e2e8f0', marginBottom: '15px' }}>Fichiers de données réels du FiFAR manquants</h2>
        <p style={{ color: '#94a3b8', maxWidth: '600px', lineHeight: '1.6', marginBottom: '25px' }}>
          {dashboard.erreur}
        </p>
        <div style={{
          background: '#1e293b', color: '#e2e8f0', padding: '15px 20px', borderRadius: '8px',
          textAlign: 'left', fontSize: '13px', fontFamily: 'monospace', width: '100%', maxWidth: '600px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          <div><strong>Emplacement attendu pour les données :</strong></div>
          <div style={{ color: '#38bdf8', marginTop: '8px' }}>backend/data/raw/alert_data/processed_data/alerts.parquet</div>
          <div style={{ color: '#38bdf8', marginTop: '4px' }}>backend/data/raw/synthetic_experts/expert_predictions.parquet</div>
        </div>
        <button onClick={() => window.location.reload()} style={{
          marginTop: '30px', padding: '10px 20px', background: '#06b6d4', color: '#090d16',
          border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
          transition: 'opacity 0.2s'
        }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
          Réessayer le chargement
        </button>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Barre latérale de navigation */}
      <BarreLaterale
        ongletActif={dashboard.ongletActif}
        onChangerOnglet={dashboard.changerOnglet}
        estEnDirect={dashboard.estEnDirect}
        onBasculerDirect={dashboard.basculerModeDirect}
        alertesCritiques={dashboard.stats.alertesCritiques}
      />

      {/* Contenu principal */}
      <main className="main-content">
        {renderContenu()}
      </main>
    </div>
  );
}
