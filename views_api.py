# Description: This file contains the extensions API endpoints.

from http import HTTPStatus

from fastapi import APIRouter, Depends, Query, Request
from lnbits.core.crud import get_user
from lnbits.core.models import WalletTypeInfo
from lnbits.core.services import create_invoice
from lnbits.decorators import require_admin_key, require_invoice_key
from lnbits.helpers import urlsafe_short_hash
from starlette.exceptions import HTTPException

from .crud import (
    create_myextension,
    delete_myextension,
    get_myextension,
    get_myextensions,
    update_myextension,
)
from .helpers import lnurler
from .models import CreateMyExtensionData, MyExtension

myextension_api_router = APIRouter()

# Note: we add the lnurl params to returns so the links
# are generated in the MyExtension model in models.py

## Get all the records belonging to the user


@myextension_api_router.get("/api/v1/myex")
async def api_myextensions(
    req: Request,  # Withoutthe lnurl stuff this wouldnt be needed
    wallet: WalletTypeInfo = Depends(require_invoice_key),
) -> list[MyExtension]:
    wallet_ids = [wallet.wallet.id]
    user = await get_user(wallet.wallet.user)
    wallet_ids = user.wallet_ids if user else []
    myextensions = await get_myextensions(wallet_ids)

    # Populate lnurlpay and lnurlwithdraw for each instance.
    # Without the lnurl stuff this wouldnt be needed.
    for myex in myextensions:
        myex.lnurlpay = lnurler(myex.id, "myextension.api_lnurl_pay", req)
        myex.lnurlwithdraw = lnurler(myex.id, "myextension.api_lnurl_withdraw", req)

    return myextensions


## Get a single record


@myextension_api_router.get(
    "/api/v1/myex/{myextension_id}",
    dependencies=[Depends(require_invoice_key)],
)
async def api_myextension(myextension_id: str, req: Request) -> MyExtension:
    myex = await get_myextension(myextension_id)
    if not myex:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )
    # Populate lnurlpay and lnurlwithdraw.
    # Without the lnurl stuff this wouldnt be needed.
    myex.lnurlpay = lnurler(myex.id, "myextension.api_lnurl_pay", req)
    myex.lnurlwithdraw = lnurler(myex.id, "myextension.api_lnurl_withdraw", req)

    return myex


## update a record


@myextension_api_router.put("/api/v1/myex/{myextension_id}")
async def api_myextension_update(
    req: Request,  # Withoutthe lnurl stuff this wouldnt be needed
    data: MyExtension,
    myextension_id: str,
    wallet: WalletTypeInfo = Depends(require_admin_key),
) -> MyExtension:
    myex = await get_myextension(myextension_id)
    if not myex:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )

    if wallet.wallet.id != myex.wallet:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN, detail="Not your MyExtension."
        )

    for key, value in data.dict().items():
        setattr(myex, key, value)

    myex = await update_myextension(data)

    # Populate lnurlpay and lnurlwithdraw.
    # Without the lnurl stuff this wouldnt be needed.
    myex.lnurlpay = lnurler(myex.id, "myextension.api_lnurl_pay", req)
    myex.lnurlwithdraw = lnurler(myex.id, "myextension.api_lnurl_withdraw", req)

    return myex


## Create a new record


@myextension_api_router.post("/api/v1/myex", status_code=HTTPStatus.CREATED)
async def api_myextension_create(
    req: Request,  # Withoutthe lnurl stuff this wouldnt be needed
    data: CreateMyExtensionData,
    wallet: WalletTypeInfo = Depends(require_admin_key),
) -> MyExtension:
    myex = MyExtension(**data.dict(), wallet=wallet.wallet.id, id=urlsafe_short_hash())
    myex = await create_myextension(myex)

    # Populate lnurlpay and lnurlwithdraw.
    # Withoutthe lnurl stuff this wouldnt be needed.
    myex.lnurlpay = lnurler(myex.id, "myextension.api_lnurl_pay", req)
    myex.lnurlwithdraw = lnurler(myex.id, "myextension.api_lnurl_withdraw", req)

    return myex


## Delete a record


@myextension_api_router.delete("/api/v1/myex/{myextension_id}")
async def api_myextension_delete(
    myextension_id: str, wallet: WalletTypeInfo = Depends(require_admin_key)
):
    myex = await get_myextension(myextension_id)

    if not myex:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )

    if myex.wallet != wallet.wallet.id:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN, detail="Not your MyExtension."
        )

    await delete_myextension(myextension_id)


# ANY OTHER ENDPOINTS YOU NEED

## This endpoint creates a payment


@myextension_api_router.post(
    "/api/v1/myex/payment/{myextension_id}", status_code=HTTPStatus.CREATED
)
async def api_myextension_create_invoice(
    myextension_id: str, amount: int = Query(..., ge=1), memo: str = ""
) -> dict:
    myextension = await get_myextension(myextension_id)

    if not myextension:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )

    # we create a payment and add some tags,
    # so tasks.py can grab the payment once its paid

    payment = await create_invoice(
        wallet_id=myextension.wallet,
        amount=amount,
        memo=f"{memo} to {myextension.name}" if memo else f"{myextension.name}",
        extra={
            "tag": "myextension",
            "amount": amount,
        },
    )

    return {"payment_hash": payment.payment_hash, "payment_request": payment.bolt11}
