# Models for retrieving data from the database
# Includes some classmethods where we can add some logic to the data

from sqlite3 import Row
from typing import Optional, List
from pydantic import BaseModel
from fastapi import Request

from lnbits.lnurl import encode as lnurl_encode
from urllib.parse import urlparse

class CreateMyExtensionData(BaseModel):
    wallet: Optional[str]
    name: Optional[str]
    total: Optional[int]
    lnurlpayamount: Optional[int]
    lnurlwithdrawamount: Optional[int]
    ticker: Optional[int]

class MyExtension(BaseModel):
    id: str
    wallet: Optional[str]
    name: Optional[str]
    total: Optional[int]
    lnurlpayamount: Optional[int]
    lnurlwithdrawamount: Optional[int]
    lnurlpay: Optional[str]
    lnurlwithdraw: Optional[str]
    ticker: Optional[int]

    @classmethod
    def from_row(cls, row: Row) -> "MyExtension":
        return cls(**dict(row))