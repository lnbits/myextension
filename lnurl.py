# Maybe your extensions needs some LNURL stuff, if so checkout LNURLp/LNURLw extensions/lnurl library in LNbits (to keep things simple the below examples are raw LNURLs)


from http import HTTPStatus
from fastapi import Depends, Query, Request
from . import temp_ext
from .crud import get_temp
from lnbits.core.services import create_invoice


#################################################
########### A very simple LNURLpay ##############
# https://github.com/lnurl/luds/blob/luds/06.md #
#################################################
#################################################

@temp_ext.get(
    "/api/v1/lnurl/pay/{temp_id}", status_code=HTTPStatus.OK
)
async def api_lnurl_pay(
    request: Request,
    temp_id: str,
):
    temp = await get_temp(temp_id)
    if not temp:
        return {"status": "ERROR", "reason": "No temp found"}
    return {
            "callback": str(request.url_for("temp.api_lnurl_pay_callback", temp_id=temp_id)),
            "maxSendable": temp.lnurlpayamount,
            "minSendable": temp.lnurlpayamount,
            "metadata":"[[\"text/plain\", \"" + temp.name + "\"]]",
            "tag": "payRequest"
        }

@temp_ext.get(
    "/api/v1/lnurl/pay/cb/{temp_id}", 
    status_code=HTTPStatus.OK,
    name="temp.api_lnurl_pay_callback",
)
async def api_lnurl_pay_cb(
    request: Request,
    temp_id: str,
    amount: int = Query(...),
):
    temp = await get_temp(temp_id)
    if not temp:
        return {"status": "ERROR", "reason": "No temp found"}
    
    payment_request = await create_invoice(
        wallet_id=temp.wallet,
        amount=int(amount / 1000),
        memo=temp.name,
        unhashed_description="[[\"text/plain\", \"" + temp.name + "\"]]".encode(),
        extra= {
            "tag": "temp",
            "link": temp_id,
            "extra": request.query_params.get("amount"),
        },
    )
    return { "pr": payment_request, "routes": []}

#################################################
######## A very simple LNURLwithdraw ############
# https://github.com/lnurl/luds/blob/luds/03.md #
#################################################
#################################################


@temp_ext.get(
    "/api/v1/lnurl/withdraw/{temp_id}", status_code=HTTPStatus.OK
)
async def api_lnurl_pay(
    request: Request,
    temp_id: str,
):
    temp = await get_temp(temp_id)
    if not temp:
        return {"status": "ERROR", "reason": "No temp found"}
    return {
            "callback": str(request.url_for("temp.api_lnurl_pay_callback", temp_id=temp_id)),
            "maxSendable": temp.lnurlwithdrawamount,
            "minSendable": temp.lnurlwithdrawamount,
            "k1": "",
            "defaultDescription": temp.name,
            "metadata":"[[\"text/plain\", \"" + temp.name + "\"]]",
            "tag": "withdrawRequest"
        }

@temp_ext.get(
    "/api/v1/lnurl/pay/cb/{temp_id}", 
    status_code=HTTPStatus.OK,
    name="temp.api_lnurl_pay_callback",
)
async def api_lnurl_pay_cb(
    request: Request,
    temp_id: str,
    amount: int = Query(...),
):
    temp = await get_temp(temp_id)
    if not temp:
        return {"status": "ERROR", "reason": "No temp found"}
    
    payment_request = await create_invoice(
        wallet_id=temp.wallet,
        amount=int(amount / 1000),
        memo=temp.name,
        unhashed_description="[[\"text/plain\", \"" + temp.name + "\"]]".encode(),
        extra= {
            "tag": "temp",
            "link": temp_id,
            "extra": request.query_params.get("amount"),
        },
    )
    return { "pr": payment_request, "routes": []}