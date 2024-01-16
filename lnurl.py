# Maybe your extensions needs some LNURL stuff, if so checkout LNURLp/LNURLw extensions/lnurl library in LNbits (to keep things simple the below examples are raw LNURLs)


from http import HTTPStatus
from fastapi import Depends, Query, Request
from . import myextension_ext
from .crud import get_myextension
from lnbits.core.services import create_invoice


#################################################
########### A very simple LNURLpay ##############
# https://github.com/lnurl/luds/blob/luds/06.md #
#################################################
#################################################

@myextension_ext.get(
    "/api/v1/lnurl/pay/{myextension_id}", 
    status_code=HTTPStatus.OK,
    name="myextension.api_lnurl_pay",
)
async def api_lnurl_pay(
    request: Request,
    myextension_id: str,
):
    myextension = await get_myextension(myextension_id)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}
    return {
            "callback": str(request.url_for("myextension.api_lnurl_pay_callback", myextension_id=myextension_id)),
            "maxSendable": myextension.lnurlpayamount,
            "minSendable": myextension.lnurlpayamount,
            "metadata":"[[\"text/plain\", \"" + myextension.name + "\"]]",
            "tag": "payRequest"
        }

@myextension_ext.get(
    "/api/v1/lnurl/pay/cb/{myextension_id}", 
    status_code=HTTPStatus.OK,
    name="myextension.api_lnurl_pay_callback",
)
async def api_lnurl_pay_cb(
    request: Request,
    myextension_id: str,
    amount: int = Query(...),
):
    myextension = await get_myextension(myextension_id)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}
    
    payment_request = await create_invoice(
        wallet_id=myextension.wallet,
        amount=int(amount / 1000),
        memo=myextension.name,
        unhashed_description="[[\"text/plain\", \"" + myextension.name + "\"]]".encode(),
        extra= {
            "tag": "myextension",
            "link": myextension_id,
            "extra": request.query_params.get("amount"),
        },
    )
    return { "pr": payment_request, "routes": []}

#################################################
######## A very simple LNURLwithdraw ############
# https://github.com/lnurl/luds/blob/luds/03.md #
#################################################
#################################################


@myextension_ext.get(
    "/api/v1/lnurl/withdraw/{myextension_id}",
    status_code=HTTPStatus.OK,
    name="myextension.api_lnurl_withdraw",
)
async def api_lnurl_pay(
    request: Request,
    myextension_id: str,
):
    myextension = await get_myextension(myextension_id)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}
    return {
            "callback": str(request.url_for("myextension.api_lnurl_withdraw_callback", myextension_id=myextension_id)),
            "maxSendable": myextension.lnurlwithdrawamount,
            "minSendable": myextension.lnurlwithdrawamount,
            "k1": "",
            "defaultDescription": myextension.name,
            "metadata":"[[\"text/plain\", \"" + myextension.name + "\"]]",
            "tag": "withdrawRequest"
        }

@myextension_ext.get(
    "/api/v1/lnurl/pay/cb/{myextension_id}", 
    status_code=HTTPStatus.OK,
    name="myextension.api_lnurl_withdraw_callback",
)
async def api_lnurl_pay_cb(
    request: Request,
    myextension_id: str,
    amount: int = Query(...),
):
    myextension = await get_myextension(myextension_id)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}
    
    payment_request = await create_invoice(
        wallet_id=myextension.wallet,
        amount=int(amount / 1000),
        memo=myextension.name,
        unhashed_description="[[\"text/plain\", \"" + myextension.name + "\"]]".encode(),
        extra= {
            "tag": "myextension",
            "link": myextension_id,
            "extra": request.query_params.get("amount"),
        },
    )
    return { "pr": payment_request, "routes": []}