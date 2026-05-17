from pydantic import BaseModel
from typing import Literal

RiskLevel = Literal["safe", "low", "medium", "high", "critical"]
Severity = Literal["low", "medium", "high", "critical"]

class ScoreSignal(BaseModel):
    name: str
    weight: int
    severity: Severity
    reason: str

class Rule(BaseModel):
    id: str
    description: str
    severity: Severity
    weight: int
