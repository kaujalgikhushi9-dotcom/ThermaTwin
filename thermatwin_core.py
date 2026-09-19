# backend/thermatwin_core.py

import math
import json

from thermal_indices import compute_wbgt, compute_utci


# ============================================================
# 1. INPUT VALIDATION HELPERS
# ============================================================

def clamp(value, minimum, maximum):
    """Keep a numeric value inside a specified range."""
    return max(minimum, min(value, maximum))


def validate_weather_inputs(
    temp_c,
    humidity,
    wind_speed,
    solar_radiation
):
    """Validate basic weather inputs."""

    if not isinstance(temp_c, (int, float)):
        raise TypeError("Temperature must be numeric.")

    if not isinstance(humidity, (int, float)):
        raise TypeError("Humidity must be numeric.")

    if not isinstance(wind_speed, (int, float)):
        raise TypeError("Wind speed must be numeric.")

    if not isinstance(solar_radiation, (int, float)):
        raise TypeError("Solar radiation must be numeric.")

    if humidity < 0 or humidity > 100:
        raise ValueError(
            "Humidity must be between 0 and 100 percent."
        )

    if wind_speed < 0:
        raise ValueError(
            "Wind speed cannot be negative."
        )

    if solar_radiation < 0:
        raise ValueError(
            "Solar radiation cannot be negative."
        )


def validate_population_inputs(
    population,
    elderly_percent,
    outdoor_worker_percent
):
    """Validate population and vulnerability inputs."""

    if population < 0:
        raise ValueError(
            "Population cannot be negative."
        )

    if elderly_percent < 0 or elderly_percent > 100:
        raise ValueError(
            "Elderly percentage must be between 0 and 100."
        )

    if outdoor_worker_percent < 0 or outdoor_worker_percent > 100:
        raise ValueError(
            "Outdoor worker percentage must be between 0 and 100."
        )


# ============================================================
# 2. HEAT INDEX
# ============================================================

def calculate_heat_index(temp_c, humidity):
    """
    Calculate Heat Index in Celsius.

    Uses the Fahrenheit-based Heat Index regression
    and converts the result back to Celsius.
    """

    humidity = clamp(humidity, 0, 100)

    # Celsius → Fahrenheit
    temp_f = (temp_c * 9 / 5) + 32

    # Simple approximation for lower temperature range
    simple_hi = 0.5 * (
        temp_f
        + 61
        + ((temp_f - 68) * 1.2)
        + (humidity * 0.094)
    )

    simple_hi = (simple_hi + temp_f) / 2

    if simple_hi < 80:
        return round(
            (simple_hi - 32) * 5 / 9,
            2
        )

    # Rothfusz regression
    heat_index_f = (
        -42.379
        + 2.04901523 * temp_f
        + 10.14333127 * humidity
        - 0.22475541 * temp_f * humidity
        - 0.00683783 * temp_f ** 2
        - 0.05481717 * humidity ** 2
        + 0.00122874 * temp_f ** 2 * humidity
        + 0.00085282 * temp_f * humidity ** 2
        - 0.00000199 * temp_f ** 2 * humidity ** 2
    )

    # Low-humidity adjustment
    if 80 <= temp_f <= 112 and humidity < 13:

        adjustment = (
            ((13 - humidity) / 4)
            * math.sqrt(
                (17 - abs(temp_f - 95)) / 17
            )
        )

        heat_index_f -= adjustment

    # High-humidity adjustment
    elif 80 <= temp_f <= 87 and humidity > 85:

        adjustment = (
            ((humidity - 85) / 10)
            * ((87 - temp_f) / 5)
        )

        heat_index_f += adjustment

    return round(
        (heat_index_f - 32) * 5 / 9,
        2
    )


# ============================================================
# 3. WET-BULB TEMPERATURE
# ============================================================

def estimate_wet_bulb_temperature(
    temp_c,
    humidity
):
    """
    Estimate wet-bulb temperature.

    This is an approximation and should not be treated
    as an instrument-measured wet-bulb temperature.
    """

    humidity = clamp(humidity, 0, 100)

    wet_bulb = (
        temp_c
        * math.atan(
            0.151977
            * math.sqrt(humidity + 8.313659)
        )
        + math.atan(temp_c + humidity)
        - math.atan(humidity - 1.676331)
        + 0.00391838
        * humidity ** 1.5
        * math.atan(0.023101 * humidity)
        - 4.686035
    )

    return round(wet_bulb, 2)


# ============================================================
# 4. GLOBE TEMPERATURE
# ============================================================

def estimate_globe_temperature(
    temp_c,
    solar_radiation,
    wind_speed
):
    """
    Prototype estimate of globe temperature.

    This is not a measured globe temperature.
    """

    solar_radiation = max(
        solar_radiation,
        0
    )

    wind_speed = max(
        wind_speed,
        0
    )

    solar_effect = (
        0.018
        * math.sqrt(solar_radiation)
    )

    wind_effect = (
        0.20
        * math.sqrt(wind_speed)
    )

    globe_temperature = (
        temp_c
        + solar_effect
        - wind_effect
    )

    return round(
        globe_temperature,
        2
    )


# ============================================================
# 5. ESTIMATED WBGT
# ============================================================

def calculate_estimated_wbgt(
    temp_c,
    humidity,
    solar_radiation,
    wind_speed
):
    """
    Calculate estimated outdoor WBGT.

    Wet-bulb, globe temperature and dry-bulb
    temperature are combined using:

        WBGT = 0.7 Twb + 0.2 Tg + 0.1 Tdb
    """

    wet_bulb = estimate_wet_bulb_temperature(
        temp_c,
        humidity
    )

    globe_temperature = estimate_globe_temperature(
        temp_c,
        solar_radiation,
        wind_speed
    )

    wbgt = (
        0.7 * wet_bulb
        + 0.2 * globe_temperature
        + 0.1 * temp_c
    )

    return round(
        wbgt,
        2
    )


# ============================================================
# 6. THERMAL SCORE
# ============================================================

def calculate_thermal_score(
    heat_index,
    wbgt
):
    """
    Create a 0–100 prototype thermal stress indicator.

    Heat Index contribution = 60%
    WBGT contribution      = 40%
    """

    heat_index_score = (
        (heat_index - 27)
        / 25
        * 100
    )

    heat_index_score = clamp(
        heat_index_score,
        0,
        100
    )

    wbgt_score = (
        (wbgt - 18)
        / 20
        * 100
    )

    wbgt_score = clamp(
        wbgt_score,
        0,
        100
    )

    thermal_score = (
        0.60 * heat_index_score
        + 0.40 * wbgt_score
    )

    return round(
        thermal_score,
        2
    )


# ============================================================
# 7. THERMAL RISK CATEGORY
# ============================================================

def classify_thermal_risk(
    thermal_score
):
    """Convert thermal score into a risk category."""

    if thermal_score >= 80:
        return "Red"

    elif thermal_score >= 60:
        return "Orange"

    elif thermal_score >= 35:
        return "Yellow"

    else:
        return "Green"


# ============================================================
# 8. EXPOSED POPULATION
# ============================================================

def calculate_exposed_population(
    population,
    elderly_percent,
    outdoor_worker_percent
):
    """
    Estimate vulnerability-weighted exposed population.

    Current prototype assumes equal weighting of:
        - elderly population
        - outdoor worker population

    NOTE:
    These groups may overlap in reality.
    """

    validate_population_inputs(
        population,
        elderly_percent,
        outdoor_worker_percent
    )

    vulnerability_percent = (
        0.5 * elderly_percent
        + 0.5 * outdoor_worker_percent
    )

    exposed_population = (
        population
        * vulnerability_percent
        / 100
    )

    return round(
        exposed_population
    )


# ============================================================
# 9. COOLING GAP
# ============================================================

def calculate_cooling_gap(
    exposed_population,
    cooling_capacity
):
    """
    Calculate the difference between estimated exposed
    population and available cooling capacity.
    """

    if exposed_population < 0:
        raise ValueError(
            "Exposed population cannot be negative."
        )

    if cooling_capacity < 0:
        raise ValueError(
            "Cooling capacity cannot be negative."
        )

    gap = (
        exposed_population
        - cooling_capacity
    )

    return max(
        round(gap),
        0
    )


# ============================================================
# 10. WARD PRIORITY SCORE
# ============================================================

def calculate_ward_priority(
    thermal_score,
    exposed_population,
    cooling_gap,
    population
):
    """
    Calculate a 0–100 ward priority score.

    Components:
        Thermal stress       = 60%
        Population exposure  = 25%
        Response gap         = 15%
    """

    if population <= 0:
        return 0.0

    exposure_ratio = (
        exposed_population
        / population
        * 100
    )

    if exposed_population > 0:

        cooling_gap_ratio = (
            cooling_gap
            / exposed_population
            * 100
        )

    else:
        cooling_gap_ratio = 0

    exposure_score = min(
        exposure_ratio * 2,
        100
    )

    response_gap_score = min(
        cooling_gap_ratio,
        100
    )

    ward_priority = (
        0.60 * thermal_score
        + 0.25 * exposure_score
        + 0.15 * response_gap_score
    )

    return round(
        min(ward_priority, 100),
        2
    )


# ============================================================
# 11. COMPLETE WARD ANALYSIS (WITH UTCI & WBGT)
# ============================================================

def analyze_ward(
    ward_id,
    temp_c,
    humidity,
    wind_speed,
    solar_radiation,
    population,
    elderly_percent,
    outdoor_worker_percent,
    cooling_capacity
):
    """
    Run the complete ThermaTwin analysis for one ward.
    Now includes UTCI and an additional WBGT metric.
    """

    # --------------------------------------------------------
    # Validate inputs
    # --------------------------------------------------------

    validate_weather_inputs(
        temp_c,
        humidity,
        wind_speed,
        solar_radiation
    )

    validate_population_inputs(
        population,
        elderly_percent,
        outdoor_worker_percent
    )

    # --------------------------------------------------------
    # Thermal calculations
    # --------------------------------------------------------

    heat_index = calculate_heat_index(
        temp_c,
        humidity
    )

    estimated_wbgt = calculate_estimated_wbgt(
        temp_c,
        humidity,
        solar_radiation,
        wind_speed
    )

    # New: UTCI and alternative WBGT from thermal_indices
    wind_ms = wind_speed / 3.6  # km/h → m/s
    utci = compute_utci(temp_c, humidity, wind_ms=wind_ms)
    wbgt_simple = compute_wbgt(temp_c, humidity, wind_ms=wind_ms)

    thermal_score = calculate_thermal_score(
        heat_index,
        estimated_wbgt
    )

    thermal_risk = classify_thermal_risk(
        thermal_score
    )

    # --------------------------------------------------------
    # Population calculations
    # --------------------------------------------------------

    exposed_population = (
        calculate_exposed_population(
            population,
            elderly_percent,
            outdoor_worker_percent
        )
    )

    cooling_gap = calculate_cooling_gap(
        exposed_population,
        cooling_capacity
    )

    # --------------------------------------------------------
    # Ward priority
    # --------------------------------------------------------

    ward_priority = calculate_ward_priority(
        thermal_score,
        exposed_population,
        cooling_gap,
        population
    )

    # --------------------------------------------------------
    # Final structured result
    # --------------------------------------------------------

    return {

        "ward_id": ward_id,

        "weather": {
            "temperature_c": temp_c,
            "humidity_percent": humidity,
            "wind_speed_kmh": wind_speed,
            "solar_radiation_wm2": solar_radiation
        },

        "thermal": {
            "heat_index_c": heat_index,
            "estimated_wet_bulb_c":
                estimate_wet_bulb_temperature(
                    temp_c,
                    humidity
                ),
            "estimated_globe_temperature_c":
                estimate_globe_temperature(
                    temp_c,
                    solar_radiation,
                    wind_speed
                ),
            "estimated_wbgt_c": estimated_wbgt,
            "utci": utci,
            "wbgt": wbgt_simple,
            "thermal_score": thermal_score,
            "thermal_risk": thermal_risk
        },

        "population": {
            "total_population": population,
            "elderly_percent": elderly_percent,
            "outdoor_worker_percent":
                outdoor_worker_percent,
            "estimated_exposed_population":
                exposed_population,
            "cooling_capacity":
                cooling_capacity,
            "cooling_gap":
                cooling_gap
        },

        "priority": {
            "ward_priority_score":
                ward_priority
        },

        "methodology": {
            "heat_index": "Rothfusz regression",
            "wet_bulb": "Estimated",
            "globe_temperature": "Estimated prototype",
            "wbgt": "Estimated outdoor WBGT",
            "utci": "Approximate UTCI",
            "thermal_score": "Prototype 0-100 score",
            "population_exposure":
                "Vulnerability-weighted estimate"
        }
    }


# ============================================================
# 12. SINGLE-WARD TEST
# ============================================================

if __name__ == "__main__":

    result = analyze_ward(

        ward_id="PUNE_001",

        temp_c=40,
        humidity=60,
        wind_speed=10,
        solar_radiation=800,

        population=100000,

        elderly_percent=12,
        outdoor_worker_percent=18,

        cooling_capacity=5000
    )

    print(
        json.dumps(
            result,
            indent=4
        )
    )