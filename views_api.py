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
from .models import CreateMyExtensionData, MyExtension

myextension_api_router = APIRouter()


#######################################
##### ADD YOUR API ENDPOINTS HERE #####
#######################################

# Note: we add the lnurl params to returns so the links
# are generated in the MyExtension model in models.py

## Get all the records belonging to the user


@myextension_api_router.get("/api/v1/myex")
async def api_myextensions(
    req: Request,
    all_wallets: bool = Query(False),
    wallet: WalletTypeInfo = Depends(require_invoice_key),
) -> list[MyExtension]:
    wallet_ids = [wallet.wallet.id]
    if all_wallets:
        user = await get_user(wallet.wallet.user)
        wallet_ids = user.wallet_ids if user else []
    return await get_myextensions(wallet_ids)


## Get a single record


@myextension_api_router.get(
    "/api/v1/myex/{myextension_id}",
    dependencies=[Depends(require_invoice_key)],
)
async def api_myextension(myextension_id: str, req: Request) -> MyExtension:
    myextension = await get_myextension(myextension_id)
    if not myextension:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )
    return myextension


## update a record


@myextension_api_router.put("/api/v1/myex/{myextension_id}")
async def api_myextension_update(
    data: MyExtension,
    req: Request,
    myextension_id: str,
    wallet: WalletTypeInfo = Depends(require_admin_key),
) -> MyExtension:
    myextension = await get_myextension(myextension_id)
    if not myextension:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )

    if wallet.wallet.id != myextension.wallet:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN, detail="Not your MyExtension."
        )

    for key, value in data.dict().items():
        setattr(myextension, key, value)

    myextension = await update_myextension(data)
    return myextension


## Create a new record


@myextension_api_router.post("/api/v1/myex", status_code=HTTPStatus.CREATED)
async def api_myextension_create(
    data: CreateMyExtensionData,
    req: Request,
    wallet: WalletTypeInfo = Depends(require_admin_key),
) -> MyExtension:
    myextension = MyExtension(
        **data.dict(), wallet=data.wallet or wallet.wallet.id, id=urlsafe_short_hash()
    )
    myextension = await create_myextension(myextension)
    return myextension


## Delete a record


@myextension_api_router.delete("/api/v1/myex/{myextension_id}")
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
