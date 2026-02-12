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
            typesFraude={dashboard.typesFraude}
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
