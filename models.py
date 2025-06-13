# Data models for your extension

from typing import Optional
from datetime import datetime

from pydantic import BaseModel, validator


class CreateAllowanceData(BaseModel):
    id: Optional[str] = ""
    name: str
    wallet: Optional[str]
    lightning_address: str  # Lightning address like user@domain.com or LNURL
    amount: int = 0
    currency: str = "sats"
    start_date: datetime
    frequency_type: str
    next_payment_date: datetime
    memo: str
    active: bool = True
    end_date: Optional[datetime] = None
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v

class Allowance(BaseModel):
    id: str
    name: str
    wallet: Optional[str] = None
    lightning_address: str
    amount: int = 0
    currency: str = "sats"
    start_date: datetime
    frequency_type: str
    next_payment_date: datetime
    memo: str
    active: bool = True
    end_date: Optional[datetime] = None
    
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than 0')
        return v