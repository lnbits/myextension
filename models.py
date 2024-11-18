# Description: Pydantic data models dictate what is passed between frontend and backend.

from pydantic import BaseModel


class CreateMyExtensionData(BaseModel):
    name: str
    lnurlpayamount: int
    lnurlwithdrawamount: int
    total: int = 0


class MyExtension(BaseModel):
    id: str
    name: str
    lnurlpayamount: int
    lnurlwithdrawamount: int
    wallet: str
    total: int
    lnurlpay: str = ""
    lnurlwithdraw: str = ""

class CreatePayment(BaseModel):
    myextension_id: str
    amount: int
    memo: str

