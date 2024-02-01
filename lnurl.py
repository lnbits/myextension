# Maybe your extension needs some LNURL stuff.
# Here is a very simple example of how to do it.
# Feel free to delete this file if you don't need it.

from http import HTTPStatus
from fastapi import Depends, Query, Request
from . import myextension_ext
from .crud import get_myextension
from lnbits.core.services import create_invoice, pay_invoice
from loguru import logger
from typing import Optional
from .crud import update_myextension
from .models import MyExtension
import shortuuid

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
        "callback": str(
            request.url_for(
                "myextension.api_lnurl_pay_callback", myextension_id=myextension_id
            )
        ),
        "maxSendable": myextension.lnurlpayamount * 1000,
        "minSendable": myextension.lnurlpayamount * 1000,
        "metadata": '[["text/plain", "' + myextension.name + '"]]',
        "tag": "payRequest",
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
    logger.debug(myextension)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}

    payment_hash, payment_request = await create_invoice(
        wallet_id=myextension.wallet,
        amount=int(amount / 1000),
        memo=myextension.name,
        unhashed_description=f'[["text/plain", "{myextension.name}"]]'.encode(),
        extra={
            "tag": "MyExtension",
            "myextensionId": myextension_id,
            "extra": request.query_params.get("amount"),
        },
    )
    return {
        "pr": payment_request,
        "routes": [],
        "successAction": {"tag": "message", "message": f"Paid {myextension.name}"},
    }


#################################################
######## A very simple LNURLwithdraw ############
# https://github.com/lnurl/luds/blob/luds/03.md #
#################################################
## withdraws are unique, removing 'tickerhash' ##
## here and crud.py will allow muliple pulls ####
#################################################


@myextension_ext.get(
    "/api/v1/lnurl/withdraw/{myextension_id}/{tickerhash}",
    status_code=HTTPStatus.OK,
    name="myextension.api_lnurl_withdraw",
)
async def api_lnurl_withdraw(
    request: Request,
    myextension_id: str,
    tickerhash: str,
):
    myextension = await get_myextension(myextension_id)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}
    k1 = shortuuid.uuid(name=myextension.id + str(myextension.ticker))
    if k1 != tickerhash:
        return {"status": "ERROR", "reason": "LNURLw already used"}

    return {
        "tag": "withdrawRequest",
        "callback": str(
            request.url_for(
                "myextension.api_lnurl_withdraw_callback", myextension_id=myextension_id
            )
        ),
        "k1": k1,
        "defaultDescription": myextension.name,
        "maxWithdrawable": myextension.lnurlwithdrawamount * 1000,
        "minWithdrawable": myextension.lnurlwithdrawamount * 1000,
    }


@myextension_ext.get(
    "/api/v1/lnurl/withdraw/cb/{myextension_id}",
    status_code=HTTPStatus.OK,
    name="myextension.api_lnurl_withdraw_callback",
)
async def api_lnurl_withdraw_cb(
    request: Request,
    myextension_id: str,
    pr: Optional[str] = None,
    k1: Optional[str] = None,
):

    assert k1, "k1 is required"
    assert pr, "pr is required"
    logger.debug("cunt")
    myextension = await get_myextension(myextension_id)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}

    k1Check = shortuuid.uuid(name=myextension.id + str(myextension.ticker))
    if k1Check != k1:
        return {"status": "ERROR", "reason": "Wrong k1 check provided"}

    await update_myextension(
        myextension_id=myextension_id, ticker=myextension.ticker + 1
    )
    logger.debug(myextension.wallet)
    logger.debug(pr)
    logger.debug(int(myextension.lnurlwithdrawamount * 1000))
    await pay_invoice(
        wallet_id=myextension.wallet,
        payment_request=pr,
        max_sat=int(myextension.lnurlwithdrawamount * 1000),
        extra={
            "tag": "MyExtension",
            "myextensionId": myextension_id,
            "lnurlwithdraw": True,
        },
    )
    return {"status": "OK"}
