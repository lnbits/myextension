# Data models for your extension

from typing import Any, Dict, Optional

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
    name: str
    lnurlpayamount: int
    lnurlwithdrawamount: int
    wallet: str
    total: int

    # Below is only needed if you want to add extra calculated fields to the model,
    # like getting the links for lnurlpay and lnurlwithdraw fields in this case.
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

    def serialize_with_extra_fields(self, req: Request) -> Dict[str, Any]:
        """Serialize the model and add extra fields."""
        base_dict = self.dict()
        base_dict.update(
            {
                "lnurlpay": self.lnurlpay(req),
                "lnurlwithdraw": self.lnurlwithdraw(req),
            }
        )
        return base_dict
