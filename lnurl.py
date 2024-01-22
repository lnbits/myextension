# Maybe your extensions needs some LNURL stuff.
# Here is a very simple example of how to do it.
# Feel free to delete this file if you don't need it.

from http import HTTPStatus
from fastapi import Depends, Query, Request
from . import myextension_ext
from .crud import get_myextension
from lnbits.core.services import create_invoice
from loguru import logger
from uuid import UUID

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
            "maxSendable": myextension.lnurlpayamount * 1000,
            "minSendable": myextension.lnurlpayamount * 1000,
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
    logger.debug(myextension)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}
    
    payment_hash, payment_request = await create_invoice(
        wallet_id=myextension.wallet,
        amount=int(amount / 1000),
        memo=myextension.name,
        unhashed_description=f"[[\"text/plain\", \"{myextension.name}\"]]".encode(),
        extra= {
            "tag": "MyExtension",
            "myextensionId": myextension_id,
            "extra": request.query_params.get("amount"),
        },
    )
    return {
        "pr": payment_request, 
        "routes": [],
        "successAction": {
            "tag": "message",
            "message": f"Paid {myextension.name}"
        }
    }

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
    k1 = UUID(myextension_id + str(myextension.ticker), version=4)
    data_to_update = {
        "ticker": myextension.ticker + 1
    }
    
    await update_myextension(myextension_id=myextension_id, **data_to_update)

    return {
            "callback": str(request.url_for("myextension.api_lnurl_withdraw_callback", myextension_id=myextension_id)),
            "maxSendable": myextension.lnurlwithdrawamount,
            "minSendable": myextension.lnurlwithdrawamount,
            "k1": k1,
            "defaultDescription": myextension.name,
            "metadata":f"[[\"text/plain\", \"{myextension.name}\"]]",
            "tag": "withdrawRequest"
        }

@myextension_ext.get(
    "/api/v1/lnurl/pay/cb/{myextension_id}", 
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

    myextension = await get_myextension(myextension_id)
    if not myextension:
        return {"status": "ERROR", "reason": "No myextension found"}
    
    k1Check = UUID(myextension_id + str(myextension.ticker - 1), version=4)
    if k1Check != k1:
        return {"status": "ERROR", "reason": "Already spent"}
    try:
        await pay_invoice(
            wallet_id=tpos.wallet,
            payment_request=pr,
            max_sat=myextension.lnurlwithdrawamount * 1000,
            extra={"tag": "MyExtension", "myextensionId": myextension_id,}
        )
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST, detail=f"withdraw not working. {str(e)}"
        )
    return {"status": "OK"}
