# Data models for your extension

from typing import Optional

from pydantic import BaseModel


class CreateAllowanceData(BaseModel):
    name: str
    lnurlpayamount: int
    lnurlwithdrawamount: int
    wallet: Optional[str] = None
    total: int = 0


class Allowance(BaseModel):
    id: str
    wallet: str
    lnurlpayamount: int
    name: str
    lnurlwithdrawamount: int
    total: int
    lnurlpay: Optional[str]
    lnurlwithdraw: Optional[str]
