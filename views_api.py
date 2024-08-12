from http import HTTPStatus

from fastapi import APIRouter, Depends, Query, Request
from lnbits.core.crud import get_user
from lnbits.core.models import WalletTypeInfo
from lnbits.core.services import create_invoice
from lnbits.decorators import (
    get_key_type,
    require_admin_key,
    require_invoice_key,
)
from lnbits.helpers import urlsafe_short_hash
from lnurl import encode as lnurl_encode
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

## Get all the records belonging to the user


@myextension_api_router.get("/api/v1/myex", status_code=HTTPStatus.OK)
async def api_myextensions(
    all_wallets: bool = Query(False),
    wallet: WalletTypeInfo = Depends(get_key_type),
):
    wallet_ids = [wallet.wallet.id]
    if all_wallets:
        user = await get_user(wallet.wallet.user)
        wallet_ids = user.wallet_ids if user else []
    return [myextension.dict() for myextension in await get_myextensions(wallet_ids)]


## Get a single record


@myextension_api_router.get(
    "/api/v1/myex/{myextension_id}",
    status_code=HTTPStatus.OK,
    dependencies=[Depends(require_invoice_key)],
)
async def api_myextension(myextension_id: str):
    myextension = await get_myextension(myextension_id)
    if not myextension:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )
    return myextension.dict()


## update a record


@myextension_api_router.put("/api/v1/myex/{myextension_id}")
async def api_myextension_update(
    data: CreateMyExtensionData,
    myextension_id: str,
    wallet: WalletTypeInfo = Depends(get_key_type),
) -> MyExtension:
    if not myextension_id:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )
    myextension = await get_myextension(myextension_id)
    assert myextension, "MyExtension couldn't be retrieved"

    if wallet.wallet.id != myextension.wallet:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN, detail="Not your MyExtension."
        )

    for key, value in data.dict().items():
        setattr(myextension, key, value)

    return await update_myextension(myextension)


## Create a new record


@myextension_api_router.post("/api/v1/myex", status_code=HTTPStatus.CREATED)
async def api_myextension_create(
    request: Request,
    data: CreateMyExtensionData,
    key_type: WalletTypeInfo = Depends(require_admin_key),
) -> MyExtension:
    myextension_id = urlsafe_short_hash()
    lnurlpay = lnurl_encode(
        str(request.url_for("myextension.api_lnurl_pay", myextension_id=myextension_id))
    )
    lnurlwithdraw = lnurl_encode(
        str(
            request.url_for(
                "myextension.api_lnurl_withdraw", myextension_id=myextension_id
            )
        )
    )
    data.wallet = data.wallet or key_type.wallet.id
    myext = MyExtension(
        id=myextension_id,
        lnurlpay=lnurlpay,
        lnurlwithdraw=lnurlwithdraw,
        **data.dict(),
    )
    return await create_myextension(myext)


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
    return "", HTTPStatus.NO_CONTENT


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

    try:
        payment_hash, payment_request = await create_invoice(
            wallet_id=myextension.wallet,
            amount=amount,
            memo=f"{memo} to {myextension.name}" if memo else f"{myextension.name}",
            extra={
                "tag": "myextension",
                "amount": amount,
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(exc)
        ) from exc

    return {"payment_hash": payment_hash, "payment_request": payment_request}
