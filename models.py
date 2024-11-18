# Data models for your extension

from datetime import datetime, timezone
from typing import Optional

from fastapi import Request
from lnurl.core import encode as lnurl_encode
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

    def lnurlpay(self, req: Request) -> str:
        url = req.url_for("myextension.api_lnurl_pay", myextension_id=self.id)
        url_str = str(url)
        if url.netloc.endswith(".onion"):
            url_str = url_str.replace("https://", "http://")

        return lnurl_encode(url_str)

    def lnurlwithdraw(self, req: Request) -> str:
        url = req.url_for("myextension.api_lnurl_withdraw", myextension_id=self.id)
        url_str = str(url)
        if url.netloc.endswith(".onion"):
            url_str = url_str.replace("https://", "http://")

        return lnurl_encode(url_str)
