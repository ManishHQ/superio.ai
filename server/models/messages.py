"""
Message models for agent-to-agent communication
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime


# ============= DeFi Agent Messages =============

class CoinRequest(BaseModel):
    """Request coin information from CoinGecko"""
    coin_id: str = Field(..., description="Coin ID (e.g., 'bitcoin', 'ethereum')")


class CoinResponse(BaseModel):
    """Response with coin information"""
    coin_id: str
    name: str
    symbol: str
    current_price: float
    market_cap: float
    total_volume: float
    price_change_24h: float
    price_change_percentage_24h: float
    market_cap_rank: Optional[int] = None
    last_updated: str


class FGIRequest(BaseModel):
    """Request Fear and Greed Index data"""
    limit: Optional[int] = Field(1, description="Number of results to return")


class FGIResponse(BaseModel):
    """Response with Fear and Greed Index data"""
    value: str
    value_classification: str
    timestamp: str
    time_until_update: Optional[str] = None


class DeFiAnalysisRequest(BaseModel):
    """Request DeFi analysis from DeFi Agent"""
    coin_id: str
    query: str = Field(..., description="Analysis query or question")
    include_fgi: bool = Field(True, description="Include Fear & Greed Index analysis")


class DeFiAnalysisResponse(BaseModel):
    """Response with DeFi analysis"""
    coin_id: str
    analysis: str
    recommendation: Optional[str] = None  # SELL, HOLD, BUY
    coin_data: Optional[CoinResponse] = None
    fgi_data: Optional[FGIResponse] = None
    timestamp: str


# ============= Medical Agent Messages =============

class MedicalRequest(BaseModel):
    """Request medical consultation"""
    query: str = Field(..., description="Medical query or symptoms")
    patient_info: Optional[Dict[str, Any]] = Field(None, description="Patient context")


class MedicalResponse(BaseModel):
    """Response with medical information"""
    response: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    sources: List[str] = Field(default_factory=list)
    disclaimer: str = "This is AI-generated information. Consult a healthcare professional."
    timestamp: str


class SymptomAnalysisRequest(BaseModel):
    """Request symptom analysis"""
    symptoms: List[str]
    duration: Optional[str] = None
    severity: Optional[str] = None


class SymptomAnalysisResponse(BaseModel):
    """Response with symptom analysis"""
    possible_conditions: List[Dict[str, Any]]
    recommendations: List[str]
    urgency_level: str  # LOW, MEDIUM, HIGH, EMERGENCY
    timestamp: str


# ============= Coordinator Messages =============

class CoordinatorRequest(BaseModel):
    """Request routing from coordinator"""
    query: str
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class CoordinatorResponse(BaseModel):
    """Response from coordinator with routed result"""
    query: str
    intent: str  # DEFI, MEDICAL, GENERAL
    agent_used: str
    response: str
    confidence: float
    metadata: Optional[Dict[str, Any]] = None
    timestamp: str


class AgentHealthRequest(BaseModel):
    """Request health status from agent"""
    pass


class AgentHealthResponse(BaseModel):
    """Response with agent health status"""
    agent_name: str
    status: str  # HEALTHY, DEGRADED, DOWN
    uptime: float
    requests_processed: int
    last_request_timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


# ============= General Messages =============

class ErrorMessage(BaseModel):
    """Error message for failed requests"""
    error: str
    error_type: str
    details: Optional[str] = None
    timestamp: str


class AckMessage(BaseModel):
    """Acknowledgment message"""
    request_id: str
    status: str
    message: Optional[str] = None


def create_timestamp() -> str:
    """Create ISO format timestamp"""
    return datetime.utcnow().isoformat() + "Z"
