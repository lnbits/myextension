from typing import List, Optional, Union

from lnbits.helpers import urlsafe_short_hash
from lnbits.lnurl import encode as lnurl_encode
from . import db
from .models import CreateMyExtensionData, MyExtension
from loguru import logger
from fastapi import Request
from lnurl import encode as lnurl_encode
import shortuuid


async def create_myextension(
    wallet_id: str, data: CreateMyExtensionData, req: Request
) -> MyExtension:
    myextension_id = urlsafe_short_hash()
    await db.execute(
        """
        INSERT INTO myextension.maintable (id, wallet, name, lnurlpayamount, lnurlwithdrawamount)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            myextension_id,
            wallet_id,
            data.name,
            data.lnurlpayamount,
            data.lnurlwithdrawamount,
        ),
    )
    myextension = await get_myextension(myextension_id, req)
    assert myextension, "Newly created table couldn't be retrieved"
    return myextension


async def get_myextension(
    myextension_id: str, req: Optional[Request] = None
) -> Optional[MyExtension]:
    logger.debug(myextension_id)
    row = await db.fetchone(
        "SELECT * FROM myextension.maintable WHERE id = ?", (myextension_id,)
    )
    if not row:
        return None
    rowAmended = MyExtension(**row)
    if req:
        rowAmended.lnurlpay = lnurl_encode(
            req.url_for("myextension.api_lnurl_pay", myextension_id=row.id)._url
        )
        rowAmended.lnurlwithdraw = lnurl_encode(
            req.url_for(
                "myextension.api_lnurl_withdraw",
                myextension_id=row.id,
                tickerhash=shortuuid.uuid(name=rowAmended.id + str(rowAmended.ticker)),
            )._url
        )
    return rowAmended


async def get_myextensions(
    wallet_ids: Union[str, List[str]], req: Optional[Request] = None
) -> List[MyExtension]:
    if isinstance(wallet_ids, str):
        wallet_ids = [wallet_ids]

    q = ",".join(["?"] * len(wallet_ids))
    rows = await db.fetchall(
        f"SELECT * FROM myextension.maintable WHERE wallet IN ({q})", (*wallet_ids,)
    )
    tempRows = [MyExtension(**row) for row in rows]
    if req:
        for row in tempRows:
            row.lnurlpay = lnurl_encode(
                req.url_for("myextension.api_lnurl_pay", myextension_id=row.id)._url
            )
            row.lnurlwithdraw = lnurl_encode(
                req.url_for(
                    "myextension.api_lnurl_withdraw",
                    myextension_id=row.id,
                    tickerhash=shortuuid.uuid(name=row.id + str(row.ticker)),
                )._url
            )
    return tempRows


async def update_myextension(
    myextension_id: str, req: Optional[Request] = None, **kwargs
) -> MyExtension:
    q = ", ".join([f"{field[0]} = ?" for field in kwargs.items()])
    logger.debug(kwargs.items())
    await db.execute(
        f"UPDATE myextension.maintable SET {q} WHERE id = ?",
        (*kwargs.values(), myextension_id),
    )
    myextension = await get_myextension(myextension_id, req)
    assert myextension, "Newly updated myextension couldn't be retrieved"
    return myextension


async def delete_myextension(myextension_id: str) -> None:
    await db.execute(
        "DELETE FROM myextension.maintable WHERE id = ?", (myextension_id,)
    )
