from sqlite3 import Row
from typing import Optional, List
from pydantic import BaseModel

from lnbits.lnurl import encode as lnurl_encode

class CreateTempData(BaseModel):
    wallet: Optional[str]
    name: Optional[str]
    total: Optional[int]
    lnurlpayamount: Optional[int]
    lnurlwithdrawamount: Optional[int]

class Temp(BaseModel):
    id: str
    wallet: str
    name: str
    total: Optional[int]
    lnurlpayamount: Optional[int]
    lnurlwithdrawamount: Optional[int]

    @classmethod
    def from_row(cls, row: Row) -> "Temp":
        return cls(**dict(row))

class CreateUpdateItemData(BaseModel):
    items: List[Item]