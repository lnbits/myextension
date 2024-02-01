from http import HTTPStatus
import json

import httpx
from fastapi import Depends, Query, Request
from lnurl import decode as decode_lnurl
from loguru import logger
from starlette.exceptions import HTTPException

from lnbits.core.crud import get_user
from lnbits.core.models import Payment
from lnbits.core.services import create_invoice
from lnbits.core.views.api import api_payment
from lnbits.decorators import (
    WalletTypeInfo,
    check_admin,
    get_key_type,
    require_admin_key,
    require_invoice_key,
)

from . import myextension_ext
from .crud import (
    create_myextension,
    update_myextension,
    delete_myextension,
    get_myextension,
    get_myextensions,
)
from .models import CreateMyExtensionData


#######################################
##### ADD YOUR API ENDPOINTS HERE #####
#######################################

## Get all the records belonging to the user


@myextension_ext.get("/api/v1/temps", status_code=HTTPStatus.OK)
async def api_myextensions(
    req: Request,
    all_wallets: bool = Query(False),
    wallet: WalletTypeInfo = Depends(get_key_type),
):
    wallet_ids = [wallet.wallet.id]
    if all_wallets:
        user = await get_user(wallet.wallet.user)
        wallet_ids = user.wallet_ids if user else []
    return [
        myextension.dict() for myextension in await get_myextensions(wallet_ids, req)
    ]


## Get a single record


@myextension_ext.get("/api/v1/temps/{myextension_id}", status_code=HTTPStatus.OK)
async def api_myextension(
    req: Request, myextension_id: str, WalletTypeInfo=Depends(get_key_type)
):
    myextension = await get_myextension(myextension_id, req)
    if not myextension:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )
    return myextension.dict()


## update a record


@myextension_ext.put("/api/v1/temps/{myextension_id}")
async def api_myextension_update(
    req: Request,
    data: CreateMyExtensionData,
    myextension_id: str,
    wallet: WalletTypeInfo = Depends(get_key_type),
):
    if not myextension_id:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )
    myextension = await get_myextension(myextension_id, req)
    assert myextension, "MyExtension couldn't be retrieved"

    if wallet.wallet.id != myextension.wallet:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN, detail="Not your MyExtension."
        )
    myextension = await update_myextension(
        myextension_id=myextension_id, **data.dict(), req=req
    )
    return myextension.dict()


## Create a new record


@myextension_ext.post("/api/v1/temps", status_code=HTTPStatus.CREATED)
async def api_myextension_create(
    req: Request,
    data: CreateMyExtensionData,
    wallet: WalletTypeInfo = Depends(require_admin_key),
):
    myextension = await create_myextension(
        wallet_id=wallet.wallet.id, data=data, req=req
    )
    return myextension.dict()


## Delete a record


@myextension_ext.delete("/api/v1/temps/{myextension_id}")
async def api_myextension_delete(
    myextension_id: str, wallet: WalletTypeInfo = Depends(require_admin_key)
):
    myextension = await get_myextension(myextension_id)

    if not myextension:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )

    if myextension.wallet != wallet.wallet.id:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN, detail="Not your MyExtension."
        )

    await delete_myextension(myextension_id)
    return "", HTTPStatus.NO_CONTENT


# ANY OTHER ENDPOINTS YOU NEED

## This endpoint creates a payment


@myextension_ext.post(
    "/api/v1/temps/payment/{myextension_id}", status_code=HTTPStatus.CREATED
)
async def api_tpos_create_invoice(
    myextension_id: str, amount: int = Query(..., ge=1), memo: str = ""
) -> dict:
    myextension = await get_myextension(myextension_id)

    if not myextension:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )

    # we create a payment and add some tags, so tasks.py can grab the payment once its paid

    try:
        payment_hash, payment_request = await create_invoice(
            wallet_id=myextension.wallet,
            amount=amount,
            memo=f"{memo} to {myextension.name}" if memo else f"{myextension.name}",
            extra={
                "tag": "myextension",
                "tipAmount": tipAmount,
                "tempId": tempId,
                "amount": amount,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(e))

    return {"payment_hash": payment_hash, "payment_request": payment_request}
