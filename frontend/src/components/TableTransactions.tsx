// ─────────────────────────────────────────────────────────────
// Composant : TableTransactions
// ─────────────────────────────────────────────────────────────
// Affiche le flux de transactions en temps réel sous forme de table.
// Permet de filtrer, trier et sélectionner des transactions.

import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Transaction } from '../types';

interface TableTransactionsProps {
    transactions: Transaction[];      // Liste des transactions à afficher
    onSelectionner: (txn: Transaction | null) => void; // Callback au clic sur une transaction
    transactionSelectionnee: Transaction | null;
}

export default function TableTransactions({
    transactions,
    onSelectionner,
    transactionSelectionnee,
}: TableTransactionsProps) {
    // --- État local pour les filtres et le tri ---
    const [recherche, setRecherche] = useState('');
    const [filtreRisque, setFiltreRisque] = useState<string>('tous');
    const [filtreStatut, setFiltreStatut] = useState<string>('tous');
    const [triColonne, setTriColonne] = useState<string>('timestamp');
    const [triDesc, setTriDesc] = useState(true);

    // --- Filtrer et trier les transactions ---
    const transactionsFiltrees = useMemo(() => {
        let resultat = [...transactions];

        // Filtre par recherche textuelle
        if (recherche) {
            const termeRecherche = recherche.toLowerCase();
            resultat = resultat.filter(t =>
                t.id.toLowerCase().includes(termeRecherche) ||
                t.customerName.toLowerCase().includes(termeRecherche) ||
                t.merchant.toLowerCase().includes(termeRecherche) ||
                t.country.toLowerCase().includes(termeRecherche)
            );
        }

        // Filtre par niveau de risque
        if (filtreRisque !== 'tous') {
            resultat = resultat.filter(t => t.riskLevel === filtreRisque);
        }

        // Filtre par statut
        if (filtreStatut !== 'tous') {
            resultat = resultat.filter(t => t.status === filtreStatut);
        }

        // Tri
        resultat.sort((a, b) => {
            let comparaison = 0;
            switch (triColonne) {
                case 'timestamp':
                    comparaison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                    break;
                case 'amount':
                    comparaison = a.amount - b.amount;
                    break;
                case 'modelScore':
                    comparaison = a.modelScore - b.modelScore;
                    break;
                default:
                    comparaison = 0;
            }
            return triDesc ? -comparaison : comparaison;
        });

        return resultat;
    }, [transactions, recherche, filtreRisque, filtreStatut, triColonne, triDesc]);

    // --- Fonctions utilitaires d'affichage ---

    /** Retourne la classe CSS pour le badge de risque */
    const classRisque = (risque: string) => {
        const classes: Record<string, string> = {
            low: 'badge-success',
            medium: 'badge-warning',
            high: 'badge-danger',
            critical: 'badge-critical',
        };
        return classes[risque] || '';
    };

    /** Retourne le libellé français du risque */
    const libelleRisque = (risque: string) => {
        const libelles: Record<string, string> = {
            low: 'Bas',
            medium: 'Moyen',
            high: 'Élevé',
            critical: 'Critique',
        };
        return libelles[risque] || risque;
    };

    /** Retourne la classe CSS pour le badge de statut */
    const classStatut = (statut: string) => {
        const classes: Record<string, string> = {
            approved: 'badge-success',
            pending: 'badge-info',
            blocked: 'badge-danger',
            review: 'badge-warning',
            deferred: 'badge-purple',
        };
        return classes[statut] || '';
    };

    /** Retourne le libellé français du statut */
    const libelleStatut = (statut: string) => {
        const libelles: Record<string, string> = {
            approved: 'Approuvée',
            pending: 'En attente',
            blocked: 'Bloquée',
            review: 'En examen',
            deferred: 'Déférée',
        };
        return libelles[statut] || statut;
    };

    /** Bascule le tri sur une colonne */
    const basculerTri = (colonne: string) => {
        if (triColonne === colonne) {
            setTriDesc(!triDesc);
        } else {
            setTriColonne(colonne);
            setTriDesc(true);
        }
    };

    return (
        <div className="table-transactions">
            {/* ─── En-tête avec titre ─── */}
            <div className="page-header">
                <h2 className="page-title">
                    <ArrowUpDown size={24} />
                    Transactions en Temps Réel
                </h2>
                <p className="page-description">
                    Flux continu des transactions avec scores ML et décisions L2D
                </p>
            </div>

            {/* ─── Barre de filtres ─── */}
            <div className="filters-bar">
                {/* Recherche */}
                <div className="search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher par ID, client, marchand..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="search-input"
                    />
                </div>

                {/* Filtre par risque */}
                <div className="filter-group">
                    <Filter size={14} />
                    <select value={filtreRisque} onChange={(e) => setFiltreRisque(e.target.value)} className="filter-select">
                        <option value="tous">Tous les risques</option>
                        <option value="low">Bas</option>
                        <option value="medium">Moyen</option>
                        <option value="high">Élevé</option>
                        <option value="critical">Critique</option>
                    </select>
                </div>

                {/* Filtre par statut */}
                <div className="filter-group">
                    <Filter size={14} />
                    <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="filter-select">
                        <option value="tous">Tous les statuts</option>
                        <option value="approved">Approuvée</option>
                        <option value="blocked">Bloquée</option>
                        <option value="review">En examen</option>
                        <option value="deferred">Déférée</option>
                        <option value="pending">En attente</option>
                    </select>
                </div>

                {/* Compteur */}
                <span className="filter-count">
                    {transactionsFiltrees.length} transaction{transactionsFiltrees.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* ─── Table ─── */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th onClick={() => basculerTri('timestamp')} className="th-sortable">
                                Heure {triColonne === 'timestamp' && (triDesc ? '↓' : '↑')}
                            </th>
                            <th>ID Transaction</th>
                            <th>Client</th>
                            <th>Marchand</th>
                            <th onClick={() => basculerTri('amount')} className="th-sortable">
                                Montant {triColonne === 'amount' && (triDesc ? '↓' : '↑')}
                            </th>
                            <th>Canal</th>
                            <th>Pays</th>
                            <th onClick={() => basculerTri('modelScore')} className="th-sortable">
                                Score ML {triColonne === 'modelScore' && (triDesc ? '↓' : '↑')}
                            </th>
                            <th>Risque</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactionsFiltrees.slice(0, 50).map((txn) => (
                            <tr
                                key={txn.id}
                                className={`table-row ${txn.fraudBool ? 'row-fraud' : ''} ${transactionSelectionnee?.id === txn.id ? 'row-selected' : ''}`}
                                onClick={() => onSelectionner(txn.id === transactionSelectionnee?.id ? null : txn)}
                            >
                                <td className="td-time">
                                    {new Date(txn.timestamp).toLocaleTimeString('fr-FR')}
                                </td>
                                <td className="td-id">{txn.id.substring(0, 16)}...</td>
                                <td>{txn.customerName}</td>
                                <td>{txn.merchant}</td>
                                <td className="td-amount">
                                    {txn.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </td>
                                <td>
                                    <span className="badge-channel">{txn.channel}</span>
                                </td>
                                <td>{txn.country}</td>
                                <td>
                                    <div className="score-bar">
                                        <div
                                            className="score-fill"
                                            style={{
                                                width: `${txn.modelScore * 100}%`,
                                                background: txn.modelScore > 0.7 ? '#ef4444' :
                                                    txn.modelScore > 0.4 ? '#f59e0b' : '#10b981',
                                            }}
                                        />
                                        <span className="score-text">{(txn.modelScore * 100).toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${classRisque(txn.riskLevel)}`}>
                                        {libelleRisque(txn.riskLevel)}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${classStatut(txn.status)}`}>
                                        {libelleStatut(txn.status)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ─── Détail d'une transaction sélectionnée ─── */}
            {transactionSelectionnee && (
                <div className="transaction-detail">
                    <div className="detail-header">
                        <h3>Détail de la Transaction</h3>
                        <button className="btn-close" onClick={() => onSelectionner(null)}>✕</button>
                    </div>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">ID</span>
                            <span className="detail-value">{transactionSelectionnee.id}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Client</span>
                            <span className="detail-value">{transactionSelectionnee.customerName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Montant</span>
                            <span className="detail-value">
                                {transactionSelectionnee.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Marchand</span>
                            <span className="detail-value">{transactionSelectionnee.merchant}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Score ML</span>
                            <span className="detail-value">{(transactionSelectionnee.modelScore * 100).toFixed(1)}%</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Fraude réelle</span>
                            <span className={`detail-value ${transactionSelectionnee.fraudBool ? 'text-danger' : 'text-success'}`}>
                                {transactionSelectionnee.fraudBool ? 'Oui — Fraude confirmée' : 'Non — Transaction légitime'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Canal</span>
                            <span className="detail-value">{transactionSelectionnee.channel}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Pays / Ville</span>
                            <span className="detail-value">{transactionSelectionnee.country} — {transactionSelectionnee.city}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">IP</span>
                            <span className="detail-value">{transactionSelectionnee.ipAddress}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Appareil</span>
                            <span className="detail-value">{transactionSelectionnee.deviceId}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
