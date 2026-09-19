# backend/thermal_indices.py

import math

def compute_wbgt(temp_c: float, rh_percent: float, wind_ms: float = 0.1, solar: bool = True) -> float:
    """
    Approximate WBGT (Wet Bulb Globe Temperature) in °C.
    
    Simplified formula (no direct solar radiation input):
      WBGT ≈ 0.567 * T + 0.393 * e + 3.94
    where e is vapor pressure in hPa.
    
    This is a common approximation used in heat-stress work.
    """
    # Saturation vapor pressure (hPa) using Tetens formula
    es = 6.112 * math.exp((17.67 * temp_c) / (temp_c + 243.5))
    # Actual vapor pressure
    e = es * (rh_percent / 100.0)
    
    wbgt = 0.567 * temp_c + 0.393 * e + 3.94
    return wbgt


def compute_utci(temp_c: float, rh_percent: float, wind_ms: float, pressure_hpa: float = 1013.25) -> float:
    """
    Approximate UTCI (Universal Thermal Climate Index) in °C.
    
    This implementation uses a simplified but empirically tuned formula
    that captures the main effects of temperature, humidity, and wind.
    It is designed to give reasonable UTCI-like values for typical
    urban heat-stress scenarios (10–45 °C).
    
    For research-grade accuracy, use the full Fiala thermoregulation model.
    """
    # Clamp wind to [0.5, 10] m/s as per UTCI standard
    v = max(0.5, min(10.0, wind_ms))
    
    # Vapor pressure in hPa
    es = 6.112 * math.exp((17.67 * temp_c) / (temp_c + 243.5))
    e = es * (rh_percent / 100.0)
    
    # Base: start from air temperature
    utci = temp_c
    
    # Humidity effect: higher humidity increases UTCI at high temperatures
    if temp_c > 20:
        humidity_effect = 0.15 * (e - 12.0)  # reference e ~ 12 hPa at ~20 °C
        utci += humidity_effect
    
    # Wind effect: cooling at low temps, slight warming/neutral at high temps
    if temp_c < 25:
        # Wind chill-like effect
        wind_effect = -0.5 * (v - 1.0)
        utci += wind_effect
    else:
        # At high temps, wind slightly reduces perceived heat
        wind_effect = -0.1 * (v - 1.0)
        utci += wind_effect
    
    # Small pressure correction (usually minor)
    pressure_effect = 0.001 * (pressure_hpa - 1013.25)
    utci += pressure_effect
    
    return utci