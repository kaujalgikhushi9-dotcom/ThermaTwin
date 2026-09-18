# indices.py
import numpy as np
import pandas as pd


def wbgt_simple(temp_c: float, rh_pct: float, wind_ms: float = 0.5, solar_w_m2: float = 0.0) -> float:
    """
    Simple outdoor WBGT approximation (no direct radiation sensor).
    Uses: WBGT ≈ 0.7 * Tw + 0.2 * Tg + 0.1 * Ta
    We approximate Tw and Tg from T, RH, wind, and solar.
    This is a pragmatic formula for urban heat stress, not a metrology-grade WBGT.
    """
    Ta = temp_c

    # Approximate wet-bulb temperature (Tw) using a simple Magnus-based approach
    # This is not exact but reasonable for relative risk.
    # Using a simplified approximation: Tw ≈ T * atan(0.151977 * sqrt(RH + 8.313659)) + ...
    # For simplicity, use a rough linear correction:
    Tw = Ta * 0.85 + (rh_pct / 100.0) * Ta * 0.15 - (1.0 - rh_pct / 100.0) * 2.0

    # Approximate globe temperature (Tg) with solar and wind effect
    # Higher solar -> higher Tg; higher wind -> lower Tg
    delta_tg = (solar_w_m2 / 100.0) * 2.0 - wind_ms * 0.5
    Tg = Ta + delta_tg

    wbgt = 0.7 * Tw + 0.2 * Tg + 0.1 * Ta
    return float(wbgt)


def utcI_basic(temp_c: float, rh_pct: float, wind_ms: float, pressure_hpa: float = 1013.25) -> float:
    """
    Very simplified UTCI-like index.
    Real UTCI requires a full thermo-physiological model; here we use a proxy:
    UTCI_proxy ≈ Ta + f(wind, RH) with some non-linearity.
    This is for demonstration / relative comparison only.
    """
    Ta = temp_c
    rh = np.clip(rh_pct, 5, 95) / 100.0
    v = max(0.1, wind_ms)  # avoid zero wind

    # Humidity effect
    humid_effect = (rh - 0.5) * 5.0

    # Wind chill / convective effect (simplified)
    wind_effect = -2.0 * np.log10(v + 0.1)

    utci = Ta + humid_effect + wind_effect
    return float(utci)


def compute_indices_row(row: pd.Series) -> pd.Series:
    """
    Given a row with: temp, humidity, wind_speed, solar_radiation, pressure_hpa (optional)
    return WBGT and UTCI.
    """
    temp = row["temp"]
    rh = row["humidity"]
    wind = row["wind_speed"]
    solar = row.get("solar_radiation", 0.0)
    pressure = row.get("pressure_hpa", 1013.25)

    wbgt = wbgt_simple(temp, rh, wind, solar)
    utci = utcI_basic(temp, rh, wind, pressure)

    return pd.Series({"wbgt": wbgt, "utci": utci})