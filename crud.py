from typing import List, Optional, Union

from lnbits.helpers import urlsafe_short_hash

from . import db
from .models import CreateMyExtensionData, MyExtension
from loguru import logger
from fastapi import Request
from lnurl import encode as lnurl_encode

async def create_myextension(wallet_id: str, data: CreateMyExtensionData) -> MyExtension:
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
            data.lnurlwithdrawamount
        ),
    )
    myextension = await get_myextension(myextension_id)
    assert myextension, "Newly created table couldn't be retrieved"
    return myextension


async def get_myextension(myextension_id: str) -> Optional[MyExtension]:
    row = await db.fetchone("SELECT * FROM myextension.maintable WHERE id = ?", (myextension_id,))
    return MyExtension(**row) if row else None

async def get_myextensions(wallet_ids: Union[str, List[str]], req: Request) -> List[MyExtension]:
    if isinstance(wallet_ids, str):
        wallet_ids = [wallet_ids]

    q = ",".join(["?"] * len(wallet_ids))
    rows = await db.fetchall(
        f"SELECT * FROM myextension.maintable WHERE wallet IN ({q})", (*wallet_ids,)
    )
    tempRows = [MyExtension(**row) for row in rows]
    logger.debug(req.url_for("myextension.api_lnurl_pay", myextension_id=row.id))
    for row in tempRows:
        row.lnurlpay = req.url_for("myextension.api_lnurl_pay", myextension_id=row.id)
        row.lnurlwithdraw = req.url_for("myextension.api_lnurl_withdraw", myextension_id=row.id)
    return tempRows

async def update_myextension(myextension_id: str, **kwargs) -> MyExtension:
    q = ", ".join([f"{field[0]} = ?" for field in kwargs.items()])
    await db.execute(
        f"UPDATE myextension.maintable SET {q} WHERE id = ?", (*kwargs.values(), myextension_id)
    )
    myextension = await get_myextension(myextension_id)
    assert myextension, "Newly updated myextension couldn't be retrieved"
    return myextension

async def delete_myextension(myextension_id: str) -> None:
    await db.execute("DELETE FROM myextension.maintable WHERE id = ?", (myextension_id,))