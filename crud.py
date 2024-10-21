from typing import Optional, Union

from lnbits.db import Database

from .models import MyExtension

db = Database("ext_myextension")
table_name = "myextension.maintable"


async def create_myextension(data: MyExtension) -> MyExtension:
    await db.insert(table_name, data)
    return data

    # this is how we used to do it

    # myextension_id = urlsafe_short_hash()
    # await db.execute(
    #     """
    #     INSERT INTO myextension.maintable
    #     (id, wallet, name, lnurlpayamount, lnurlwithdrawamount)
    #     VALUES (?, ?, ?, ?, ?)
    #     """,
    #     (
    #         myextension_id,
    #         wallet_id,
    #         data.name,
    #         data.lnurlpayamount,
    #         data.lnurlwithdrawamount,
    #     ),
    # )
    # myextension = await get_myextension(myextension_id)
    # assert myextension, "Newly created table couldn't be retrieved"


async def get_myextension(myextension_id: str) -> Optional[MyExtension]:
    return await db.fetchone(
        f"SELECT * FROM {table_name} WHERE id = :id",
        {"id": myextension_id},
        MyExtension,
    )


async def get_myextensions(wallet_ids: Union[str, list[str]]) -> list[MyExtension]:
    if isinstance(wallet_ids, str):
        wallet_ids = [wallet_ids]
    q = ",".join([f"'{wallet_id}'" for wallet_id in wallet_ids])
    return await db.fetchall(
        f"SELECT * FROM {table_name} WHERE wallet IN ({q})", model=MyExtension
    )


async def update_myextension(data: MyExtension) -> MyExtension:
    await db.update(table_name, data)
    return data

    # this is how we used to do it
    # q = ", ".join([f"{field[0]} = ?" for field in kwargs.items()])
    # await db.execute(
    #     f"UPDATE myextension.maintable SET {q} WHERE id = ?",
    #     (*kwargs.values(), myextension_id),
    # )


async def delete_myextension(myextension_id: str) -> None:
    await db.execute(f"DELETE FROM {table_name} WHERE id = :id", {"id": myextension_id})
