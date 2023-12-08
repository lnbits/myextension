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

from . import temp_ext
from .crud import (
    create_temp,
    update_temp,
    delete_temp,
    get_temp,
    get_temps
)
from .models import CreateTempData, PayLnurlWData, LNURLCharge, CreateUpdateItemData


#######################################
##### ADD YOUR API ENDPOINTS HERE #####
#######################################


# TYPICAL ENDPOINTS

# get all the records belonging to the user

@temp_ext.get("/api/v1/temps", status_code=HTTPStatus.OK)
async def api_temps(
    all_wallets: bool = Query(False), wallet: WalletTypeInfo = Depends(get_key_type)
):
    wallet_ids = [wallet.wallet.id]
    if all_wallets:
        user = await get_user(wallet.wallet.user)
        wallet_ids = user.wallet_ids if user else []
    return [temp.dict() for temp in await get_temps(wallet_ids)]


# get a specific record belonging to a user

@temp_ext.put("/api/v1/temps/{temp_id}")
async def api_temp_update(
    data: CreateTempData,
    temp_id: str,
    wallet: WalletTypeInfo = Depends(require_admin_key),
):
    if not temp_id:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Temp does not exist."
        )
    temp = await get_temp(temp_id)
    assert temp, "Temp couldn't be retrieved"

    if wallet.wallet.id != temp.wallet:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Not your Temp.")
    temp = await update_temp(temp_id=temp_id, **data.dict())
    return temp.dict()


# Create a new record

@temp_ext.post("/api/v1/temps", status_code=HTTPStatus.CREATED)
async def api_temp_create(
    data: CreateTempData, wallet: WalletTypeInfo = Depends(get_key_type)
):
    temp = await create_temp(wallet_id=wallet.wallet.id, data=data)
    return temp.dict()


# Delete a record

@temp_ext.delete("/api/v1/temps/{temp_id}")
async def api_temp_delete(
    temp_id: str, wallet: WalletTypeInfo = Depends(require_admin_key)
):
    temp = await get_temp(temp_id)

    if not temp:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Temp does not exist."
        )

    if temp.wallet != wallet.wallet.id:
        raise HTTPException(status_code=HTTPStatus.FORBIDDEN, detail="Not your Temp.")

    await delete_temp(temp_id)
    return "", HTTPStatus.NO_CONTENT


# ANY OTHER ENDPOINTS YOU NEED

# This endpoint creates a payment

@tpos_ext.post("/api/v1/temps/payment/{temp_id}", status_code=HTTPStatus.CREATED)
async def api_tpos_create_invoice(
    temp_id: str, amount: int = Query(..., ge=1), memo: str = ""
) -> dict:
    temp = await get_temp(temp_id)

    if not temp:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Temp does not exist."
        )
    
    # we create a payment and add some tags, so tasks.py can grab the payment once its paid

    try:
        payment_hash, payment_request = await create_invoice(
            wallet_id=temp.wallet,
            amount=amount,
            memo=f"{memo} to {temp.name}" if memo else f"{temp.name}",
            extra={
                "tag": "temp",
                "tipAmount": tipAmount,
                "tempId": tempId,
                "amount": amount,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(e))

    return {"payment_hash": payment_hash, "payment_request": payment_request}