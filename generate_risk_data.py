import csv
import json
from pathlib import Path
from datetime import datetime

from thermatwin_core import analyze_ward


# ============================================================
# 1. PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


# ============================================================
# 2. CSV READER
# ============================================================

def read_csv(filename):
    """Read a CSV file from the data directory."""

    file_path = DATA_DIR / filename

    if not file_path.exists():
        raise FileNotFoundError(
            f"Required file not found: {file_path}"
        )

    with open(
        file_path,
        "r",
        newline="",
        encoding="utf-8"
    ) as file:

        return list(
            csv.DictReader(file)
        )


# ============================================================
# 3. INDEX DATA BY KEY
# ============================================================

def index_by(rows, key):
    """
    Convert a list of dictionaries into a dictionary
    indexed by the specified key.
    """

    indexed = {}

    for row in rows:

        if key not in row:
            raise KeyError(
                f"Column '{key}' missing from data."
            )

        indexed[row[key]] = row

    return indexed


# ============================================================
# 4. VALIDATE DATE
# ============================================================

def validate_date(date_string):
    """Validate YYYY-MM-DD date format."""

    try:

        datetime.strptime(
            date_string,
            "%Y-%m-%d"
        )

    except ValueError:

        raise ValueError(
            f"Invalid date format: {date_string}. "
            "Expected YYYY-MM-DD."
        )


# ============================================================
# 5. VALIDATE WARD REFERENCES
# ============================================================

def validate_ward_references(
    weather,
    population,
    resources,
    wards
):
    """Make sure every weather record has matching ward data."""

    ward_ids = set(wards.keys())

    for row in weather:

        ward_id = row["ward_id"]

        if ward_id not in ward_ids:
            raise ValueError(
                f"Weather data references unknown "
                f"ward: {ward_id}"
            )

        if ward_id not in population:
            raise ValueError(
                f"Population data missing for "
                f"ward: {ward_id}"
            )

        if ward_id not in resources:
            raise ValueError(
                f"Resource data missing for "
                f"ward: {ward_id}"
            )


# ============================================================
# 6. GENERATE WARD RISK DATA
# ============================================================

def generate_risk_data():

    print("Starting ThermaTwin risk-data generation...")

    # --------------------------------------------------------
    # Read source datasets
    # --------------------------------------------------------

    wards = read_csv(
        "wards.csv"
    )

    weather = read_csv(
        "weather_forecast.csv"
    )

    population_rows = read_csv(
        "population_exposure.csv"
    )

    resource_rows = read_csv(
        "resources.csv"
    )

    # --------------------------------------------------------
    # Convert supporting datasets into lookup dictionaries
    # --------------------------------------------------------

    population = index_by(
        population_rows,
        "ward_id"
    )

    resources = index_by(
        resource_rows,
        "ward_id"
    )

    ward_names = index_by(
        wards,
        "ward_id"
    )

    # --------------------------------------------------------
    # Validate references
    # --------------------------------------------------------

    validate_ward_references(
        weather,
        population,
        resources,
        ward_names
    )

    # --------------------------------------------------------
    # Generate risk results
    # --------------------------------------------------------

    output = []

    for weather_row in weather:

        ward_id = weather_row["ward_id"]

        # ----------------------------------------------------
        # Validate date
        # ----------------------------------------------------

        date = weather_row["date"]

        validate_date(
            date
        )

        # ----------------------------------------------------
        # Retrieve population/resource information
        # ----------------------------------------------------

        pop = population[ward_id]

        resource = resources[ward_id]

        # ----------------------------------------------------
        # Run thermal + population analysis
        # ----------------------------------------------------

        result = analyze_ward(

            ward_id=ward_id,

            temp_c=float(
                weather_row["temp_c"]
            ),

            humidity=float(
                weather_row["humidity_pct"]
            ),

            wind_speed=float(
                weather_row["wind_speed_kmh"]
            ),

            solar_radiation=float(
                weather_row[
                    "solar_radiation_wm2"
                ]
            ),

            population=int(
                pop["population"]
            ),

            elderly_percent=float(
                pop["elderly_percent"]
            ),

            outdoor_worker_percent=float(
                pop[
                    "outdoor_worker_percent"
                ]
            ),

            cooling_capacity=int(
                resource[
                    "cooling_capacity"
                ]
            )
        )

        # ----------------------------------------------------
        # Add dataset-level information
        # ----------------------------------------------------

        result["date"] = date

        result["ward_name"] = (
            ward_names[ward_id][
                "ward_name"
            ]
        )

        output.append(
            result
        )

    # ========================================================
    # 7. SORT RESULTS
    # ========================================================

    output.sort(
        key=lambda item: (
            item["date"],
            -item["priority"][
                "ward_priority_score"
            ]
        )
    )

    # ========================================================
    # 8. CREATE DAILY CITY SUMMARY
    # ========================================================

    daily_summary = {}

    for result in output:

        date = result["date"]

        if date not in daily_summary:

            daily_summary[date] = {
                "date": date,
                "ward_count": 0,
                "critical_wards": 0,
                "total_exposed_population": 0,
                "total_cooling_capacity": 0,
                "total_cooling_gap": 0,
                "peak_thermal_score": 0,
                "highest_priority_ward": None,
                "highest_priority_score": 0
            }

        summary = daily_summary[date]

        summary["ward_count"] += 1

        summary["total_exposed_population"] += (
            result["population"][
                "estimated_exposed_population"
            ]
        )

        summary["total_cooling_capacity"] += (
            result["population"][
                "cooling_capacity"
            ]
        )

        summary["total_cooling_gap"] += (
            result["population"][
                "cooling_gap"
            ]
        )

        thermal_score = (
            result["thermal"][
                "thermal_score"
            ]
        )

        if thermal_score > summary["peak_thermal_score"]:

            summary["peak_thermal_score"] = (
                thermal_score
            )

        risk = (
            result["thermal"][
                "thermal_risk"
            ]
        )

        if risk in ["Orange", "Red"]:

            summary["critical_wards"] += 1

        priority_score = (
            result["priority"][
                "ward_priority_score"
            ]
        )

        if priority_score > (
            summary["highest_priority_score"]
        ):

            summary["highest_priority_score"] = (
                priority_score
            )

            summary["highest_priority_ward"] = {
                "ward_id":
                    result["ward_id"],
                "ward_name":
                    result["ward_name"],
                "priority_score":
                    priority_score
            }

    # ========================================================
    # 9. DAILY CITY RISK CATEGORY
    # ========================================================

    for date, summary in daily_summary.items():

        score = summary["peak_thermal_score"]

        if score >= 80:
            summary["city_risk"] = "Red"

        elif score >= 60:
            summary["city_risk"] = "Orange"

        elif score >= 35:
            summary["city_risk"] = "Yellow"

        else:
            summary["city_risk"] = "Green"

    # ========================================================
    # 10. FINAL OUTPUT OBJECT
    # ========================================================

    final_output = {

        "metadata": {

            "project":
                "ThermaTwin",

            "pilot_location":
                "Pune",

            "data_type":
                "Demo / simulated pilot data",

            "record_count":
                len(output),

            "methodology_note":
                "Thermal and population risk values "
                "are prototype estimates and should "
                "not be interpreted as official "
                "government warnings."
        },

        "daily_summary":
            list(
                daily_summary.values()
            ),

        "ward_results":
            output
    }

    # ========================================================
    # 11. SAVE JSON
    # ========================================================

    output_path = (
        DATA_DIR /
        "risk_output.json"
    )

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            final_output,
            file,
            indent=4
        )

    # ========================================================
    # 12. TERMINAL SUMMARY
    # ========================================================

    print(
        f"Generated: {output_path}"
    )

    print(
        f"Ward records: {len(output)}"
    )

    print(
        f"Dates processed: "
        f"{len(daily_summary)}"
    )

    print(
        "ThermaTwin risk-data generation complete."
    )


# ============================================================
# 13. PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":

    generate_risk_data()