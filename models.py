# Data models for your extension

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel


class CreateMyExtensionData(BaseModel):
    name: str
    lnurlpayamount: int
    lnurlwithdrawamount: int
    wallet: Optional[str] = None
    total: int = 0


class MyExtension(BaseModel):
    id: str
    wallet: str
    lnurlpayamount: int
    name: str
    lnurlwithdrawamount: int
    total: int
    lnurlpay: Optional[str]
    lnurlwithdraw: Optional[str]
    created_at: datetime = datetime.now(timezone.utc)
