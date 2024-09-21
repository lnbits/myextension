# Data models for your extension

from typing import Optional
from datetime import datetime

from pydantic import BaseModel


class CreateAllowanceData(BaseModel):
    name: str
    wallet: Optional[str]
    to_wallet: Optional[str]
    amount: int = 0
    start_date: datetime
    frequency_type: str
    next_payment_date: datetime
    memo: str

class Allowance(BaseModel):
    id: str
    wallet: Optional[str] = None
    to_wallet: Optional[str] = None
    amount: int = 0,
    start_date: datetime
    frequency_type: str
    next_payment_date: datetime
    memo: str