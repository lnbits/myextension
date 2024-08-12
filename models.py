# Data models for your extension

from typing import Optional

from pydantic import BaseModel


class CreateMyExtensionData(BaseModel):
    wallet: Optional[str]
    name: str
    lnurlpayamount: int
    lnurlwithdrawamount: int
    total: Optional[int]


class MyExtension(BaseModel):
    id: str
    wallet: str
    lnurlpayamount: int
    name: str
    lnurlwithdrawamount: int
    total: int
    lnurlpay: Optional[str]
    lnurlwithdraw: Optional[str]
