# backend/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from thermatwin_core import analyze_ward


# ============================================================
# 1. FASTAPI APP
# ============================================================

app = FastAPI(
    title="ThermaTwin API",
    description="Heat-risk analysis API with UTCI and WBGT",
    version="1.0.0"
)


# ============================================================
# 2. PYDANTIC MODELS (FOR SWAGGER SCHEMAS)
# ============================================================

class WeatherInput(BaseModel):
    temperature_c: float = Field(..., description="Air temperature in °C")
    humidity_percent: float = Field(..., description="Relative humidity in %")
    wind_speed_kmh: float = Field(..., description="Wind speed in km/h")
    solar_radiation_wm2: float = Field(..., description="Solar radiation in W/m²")


class PopulationInput(BaseModel):
    population: int = Field(..., description="Total ward population")
    elderly_percent: float = Field(..., description="Percentage of elderly population")
    outdoor_worker_percent: float = Field(..., description="Percentage of outdoor workers")
    cooling_capacity: int = Field(..., description="Available cooling capacity (people)")


class WardAnalysisRequest(BaseModel):
    ward_id: str = Field(..., description="Ward identifier")
    weather: WeatherInput
    population: PopulationInput


class ThermalResult(BaseModel):
    heat_index_c: float
    estimated_wet_bulb_c: float
    estimated_globe_temperature_c: float
    estimated_wbgt_c: float
    utci: float
    wbgt: float
    thermal_score: float
    thermal_risk: str


class PopulationResult(BaseModel):
    total_population: int
    elderly_percent: float
    outdoor_worker_percent: float
    estimated_exposed_population: int
    cooling_capacity: int
    cooling_gap: int


class PriorityResult(BaseModel):
    ward_priority_score: float


class MethodologyInfo(BaseModel):
    heat_index: str
    wet_bulb: str
    globe_temperature: str
    wbgt: str
    utci: str
    thermal_score: str
    population_exposure: str


class WardAnalysisResponse(BaseModel):
    ward_id: str
    weather: dict
    thermal: ThermalResult
    population: PopulationResult
    priority: PriorityResult
    methodology: MethodologyInfo


class HealthResponse(BaseModel):
    status: str
    message: str


# ============================================================
# 3. ENDPOINTS
# ============================================================

@app.get("/", response_model=HealthResponse, tags=["General"])
def root():
    """
    Root endpoint with basic API info.
    """
    return {
        "status": "ok",
        "message": "ThermaTwin API is running. Visit /docs for Swagger UI."
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "ok",
        "message": "ThermaTwin API is healthy."
    }


@app.post(
    "/analyze-ward",
    response_model=WardAnalysisResponse,
    tags=["Ward Analysis"],
    summary="Analyze a single ward for heat risk",
    description="Runs the full ThermaTwin analysis for one ward, including UTCI and WBGT."
)
def analyze_ward_endpoint(request: WardAnalysisRequest):
    """
    Analyze a single ward for heat risk.

    Returns thermal indices (heat index, WBGT, UTCI), thermal risk,
    population exposure, and priority score.
    """
    try:
        result = analyze_ward(
            ward_id=request.ward_id,
            temp_c=request.weather.temperature_c,
            humidity=request.weather.humidity_percent,
            wind_speed=request.weather.wind_speed_kmh,
            solar_radiation=request.weather.solar_radiation_wm2,
            population=request.population.population,
            elderly_percent=request.population.elderly_percent,
            outdoor_worker_percent=request.population.outdoor_worker_percent,
            cooling_capacity=request.population.cooling_capacity,
        )
        return result

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Optional: simple person-level endpoint (if you still want it)

class PersonRiskRequest(BaseModel):
    city: str = Field(..., description="City name")
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    age_group: str = Field(..., description="Age group (e.g. '18-64', '65+')")
    has_ac: bool = Field(..., description="Whether the person has AC access")
    is_outdoor_worker: bool = Field(..., description="Whether the person is an outdoor worker")


class PersonRiskResponse(BaseModel):
    city: str
    date: str
    risk_level: str
    message: str
    recommendations: list[str]


@app.post(
    "/analyze",
    response_model=PersonRiskResponse,
    tags=["Personal Risk"],
    summary="Personalized heat-risk analysis",
    description="Simple prototype endpoint for individual risk (not using UTCI/WBGT directly)."
)
def analyze_person(request: PersonRiskRequest):
    """
    Simple prototype endpoint for individual risk.
    """
    # Simple placeholder logic
    risk_level = "Yellow"
    message = "Moderate heat risk. Stay hydrated and limit midday sun exposure."
    recommendations = [
        "Drink water regularly.",
        "Avoid strenuous outdoor activity between 11 AM and 4 PM.",
        "Use shade or AC when possible."
    ]

    return {
        "city": request.city,
        "date": request.date,
        "risk_level": risk_level,
        "message": message,
        "recommendations": recommendations
    }