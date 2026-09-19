from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class AnalysisRequest(BaseModel):
    city: str = Field(..., description="City name, e.g. 'Pune'")
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    age_group: Literal["children", "adult", "elderly"] = Field(
        ..., description="Age group of the person"
    )
    has_ac: bool = Field(..., description="Whether the person has access to AC")
    is_outdoor_worker: bool = Field(
        ..., description="Whether the person is an outdoor worker"
    )

class AnalysisResponse(BaseModel):
    city: str
    date: str
    risk_level: Literal["Green", "Yellow", "Orange", "Red"]
    max_temp_c: float
    min_temp_c: float
    avg_humidity: float
    feels_like_max_c: float
    heat_index_category: str
    message: str
    recommendations: Optional[List[str]] = None