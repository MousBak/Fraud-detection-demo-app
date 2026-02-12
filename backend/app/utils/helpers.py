# ─────────────────────────────────────────────────────────────
# Utilitaires — Fonctions Helper
# ─────────────────────────────────────────────────────────────

import logging
import numpy as np
from datetime import datetime


def setup_logging(level: str = "INFO"):
    """Configure le logging de l'application."""
    logging.basicConfig(
        level=getattr(logging, level),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def format_percentage(value: float, decimals: int = 1) -> str:
    """Formate un nombre en pourcentage."""
    return f"{value * 100:.{decimals}f}%"


def format_number(value: float, decimals: int = 2) -> str:
    """Formate un nombre avec séparateurs de milliers."""
    if value >= 1_000_000:
        return f"{value / 1_000_000:.{decimals}f}M"
    elif value >= 1_000:
        return f"{value / 1_000:.{decimals}f}K"
    return f"{value:.{decimals}f}"


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Division sûre qui retourne une valeur par défaut si le dénominateur est zéro."""
    if denominator == 0:
        return default
    return numerator / denominator


def timestamp_now() -> str:
    """Retourne l'horodatage actuel au format ISO."""
    return datetime.now().isoformat()


class NumpyEncoder:
    """Convertit les types numpy en types Python natifs pour JSON."""

    @staticmethod
    def convert(obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.bool_):
            return bool(obj)
        return obj
