# Models for retrieving data from the database
# Includes some classmethods where we can add some logic to the data

from sqlite3 import Row
from typing import Optional, List
from pydantic import BaseModel
from fastapi import Request

from lnbits.lnurl import encode as lnurl_encode
from urllib.parse import urlparse

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
    lnurlpay: str
    lnurlwithdraw: str

    @classmethod
    def from_row(cls, row: Row) -> "Temp":
        return cls(**dict(row))

class CreateUpdateTempData(BaseModel):
    items: List[Temp]