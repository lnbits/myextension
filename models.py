# Description: Pydantic data models dictate what is passed between frontend and backend.


from pydantic import BaseModel


class CreateMyExtensionData(BaseModel):
    id: str | None = ""
    name: str
    lnurlpayamount: int
    lnurlwithdrawamount: int
    wallet: str
    total: int = 0


class MyExtension(BaseModel):
    id: str
    name: str
    lnurlpayamount: int
    lnurlwithdrawamount: int
    wallet: str
    total: int
    lnurlpay: str | None = ""
    lnurlwithdraw: str | None = ""


class CreatePayment(BaseModel):
    myextension_id: str
    amount: int
    memo: str
