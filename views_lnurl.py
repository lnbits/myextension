# Maybe your extension needs some LNURL stuff.
# Here is a very simple example of how to do it.
# Feel free to delete this file if you don't need it.

from http import HTTPStatus
from typing import Optional

import shortuuid
from fastapi import APIRouter, Query, Request
from lnbits.core.services import create_invoice, pay_invoice
from loguru import logger

from .crud import get_myextension

#################################################
########### A very simple LNURLpay ##############
# https://github.com/lnurl/luds/blob/luds/06.md #
#################################################
#################################################

myextension_lnurl_router = APIRouter()


@myextension_lnurl_router.get(
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


@myextension_lnurl_router.get(
    "/api/v1/lnurl/paycb/{myextension_id}",
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

    _, payment_request = await create_invoice(
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
## withdraw is unlimited, look at withdraw ext ##
## for more advanced withdraw options          ##
#################################################


@myextension_lnurl_router.get(
    "/api/v1/lnurl/withdraw/{myextension_id}",
    status_code=HTTPStatus.OK,
    name="myextension.api_lnurl_withdraw",
)
async def api_lnurl_withdraw(
    request: Request,
    myextension_id: str,
):
    myextension = await get_myextension(myextension_id)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}
    k1 = shortuuid.uuid(name=myextension.id)
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


@myextension_lnurl_router.get(
    "/api/v1/lnurl/withdrawcb/{myextension_id}",
    status_code=HTTPStatus.OK,
    name="myextension.api_lnurl_withdraw_callback",
)
async def api_lnurl_withdraw_cb(
    myextension_id: str,
    pr: Optional[str] = None,
    k1: Optional[str] = None,
):
    assert k1, "k1 is required"
    assert pr, "pr is required"
    myextension = await get_myextension(myextension_id)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}

    k1_check = shortuuid.uuid(name=myextension.id)
    if k1_check != k1:
        return {"status": "ERROR", "reason": "Wrong k1 check provided"}

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
