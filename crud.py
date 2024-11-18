# Description: This file contains the CRUD operations for talking to the database.

from typing import List, Optional, Union

from lnbits.db import Database
from loguru import logger

from .models import MyExtension

db = Database("ext_myextension")


async def create_myextension(data: MyExtension) -> MyExtension:
    await db.insert("myextension.maintable", data)
    return data


async def get_myextension(myextension_id: str) -> Optional[MyExtension]:
    return await db.fetchone(
        "SELECT * FROM myextension.maintable WHERE id = :id",
        {"id": myextension_id},
        MyExtension,
    )


async def get_myextensions(wallet_ids: Union[str, List[str]]) -> List[MyExtension]:
    if isinstance(wallet_ids, str):
        wallet_ids = [wallet_ids]
    q = ",".join([f"'{w}'" for w in wallet_ids])
    logger.debug(q)
    return await db.fetchall(
        f"SELECT * FROM myextension.maintable WHERE wallet IN ({q}) ORDER BY id",
        model=MyExtension,
    )


async def update_myextension(data: MyExtension) -> MyExtension:
    await db.update("myextension.maintable", data)
    return data


async def delete_myextension(myextension_id: str) -> None:
    await db.execute(
        "DELETE FROM myextension.maintable WHERE id = :id", {"id": myextension_id}
    )
