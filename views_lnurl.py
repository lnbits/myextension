# Maybe your extension needs some LNURL stuff.
# Here is a very simple example of how to do it.
# Feel free to delete this file if you don't need it.

from http import HTTPStatus
from typing import Optional

import shortuuid
from fastapi import APIRouter, Query, Request
from lnbits.core.services import create_invoice, pay_invoice
from loguru import logger

from .crud import get_allowance

#################################################
########### A very simple LNURLpay ##############
# https://github.com/lnurl/luds/blob/luds/06.md #
#################################################
#################################################

allowance_lnurl_router = APIRouter()


@allowance_lnurl_router.get(
    "/api/v1/lnurl/pay/{allowance_id}",
    status_code=HTTPStatus.OK,
    name="allowance.api_lnurl_pay",
)
async def api_lnurl_pay(
    request: Request,
    allowance_id: str,
):
    allowance = await get_allowance(allowance_id)
    if not allowance:
        return {"status": "ERROR", "reason": "No allowance found"}
    return {
        "callback": str(
            request.url_for(
                "allowance.api_lnurl_pay_callback", allowance_id=allowance_id
            )
        ),
        "maxSendable": allowance.lnurlpayamount * 1000,
        "minSendable": allowance.lnurlpayamount * 1000,
        "metadata": '[["text/plain", "' + allowance.name + '"]]',
        "tag": "payRequest",
    }


@allowance_lnurl_router.get(
    "/api/v1/lnurl/paycb/{allowance_id}",
    status_code=HTTPStatus.OK,
    name="allowance.api_lnurl_pay_callback",
)
async def api_lnurl_pay_cb(
    request: Request,
    allowance_id: str,
    amount: int = Query(...),
):
    allowance = await get_allowance(allowance_id)
    logger.debug(allowance)
    if not allowance:
        return {"status": "ERROR", "reason": "No allowance found"}

    _, payment_request = await create_invoice(
        wallet_id=allowance.wallet,
        amount=int(amount / 1000),
        memo=allowance.name,
        unhashed_description=f'[["text/plain", "{allowance.name}"]]'.encode(),
        extra={
            "tag": "Allowance",
            "allowanceId": allowance_id,
            "extra": request.query_params.get("amount"),
        },
    )
    return {
        "pr": payment_request,
        "routes": [],
        "successAction": {"tag": "message", "message": f"Paid {allowance.name}"},
    }


#################################################
######## A very simple LNURLwithdraw ############
# https://github.com/lnurl/luds/blob/luds/03.md #
#################################################
## withdraw is unlimited, look at withdraw ext ##
## for more advanced withdraw options          ##
#################################################


@allowance_lnurl_router.get(
    "/api/v1/lnurl/withdraw/{allowance_id}",
    status_code=HTTPStatus.OK,
    name="allowance.api_lnurl_withdraw",
)
async def api_lnurl_withdraw(
    request: Request,
    allowance_id: str,
):
    allowance = await get_allowance(allowance_id)
    if not allowance:
        return {"status": "ERROR", "reason": "No allowance found"}
    k1 = shortuuid.uuid(name=allowance.id)
    return {
        "tag": "withdrawRequest",
        "callback": str(
            request.url_for(
                "allowance.api_lnurl_withdraw_callback", allowance_id=allowance_id
            )
        ),
        "k1": k1,
        "defaultDescription": allowance.name,
        "maxWithdrawable": allowance.lnurlwithdrawamount * 1000,
        "minWithdrawable": allowance.lnurlwithdrawamount * 1000,
    }


@allowance_lnurl_router.get(
    "/api/v1/lnurl/withdrawcb/{allowance_id}",
    status_code=HTTPStatus.OK,
    name="allowance.api_lnurl_withdraw_callback",
)
async def api_lnurl_withdraw_cb(
    allowance_id: str,
    pr: Optional[str] = None,
    k1: Optional[str] = None,
):
    assert k1, "k1 is required"
    assert pr, "pr is required"
    allowance = await get_allowance(allowance_id)
    if not allowance:
        return {"status": "ERROR", "reason": "No allowance found"}

    k1_check = shortuuid.uuid(name=allowance.id)
    if k1_check != k1:
        return {"status": "ERROR", "reason": "Wrong k1 check provided"}

    await pay_invoice(
        wallet_id=allowance.wallet,
        payment_request=pr,
        max_sat=int(allowance.lnurlwithdrawamount * 1000),
        extra={
            "tag": "Allowance",
            "allowanceId": allowance_id,
            "lnurlwithdraw": True,
        },
    )
    return {"status": "OK"}
