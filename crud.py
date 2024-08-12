from typing import Optional, Union

from lnbits.db import Database
from lnbits.helpers import insert_query, update_query

from .models import MyExtension

db = Database("ext_myextension")
table_name = "myextension.maintable"


async def create_myextension(data: MyExtension) -> MyExtension:
    await db.execute(
        insert_query(table_name, data),
        (*data.dict().values(),),
    )
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
    row = await db.fetchone(
        f"SELECT * FROM {table_name} WHERE id = ?", (myextension_id,)
    )
    return MyExtension(**row) if row else None


async def get_myextensions(wallet_ids: Union[str, list[str]]) -> list[MyExtension]:
    if isinstance(wallet_ids, str):
        wallet_ids = [wallet_ids]

    q = ",".join(["?"] * len(wallet_ids))
    rows = await db.fetchall(
        f"SELECT * FROM {table_name} WHERE wallet IN ({q})", (*wallet_ids,)
    )
    return [MyExtension(**row) for row in rows]


async def update_myextension(data: MyExtension) -> MyExtension:
    await db.execute(
        update_query(table_name, data),
        (
            *data.dict().values(),
            data.id,
        ),
    )
    return data
    # this is how we used to do it

    # q = ", ".join([f"{field[0]} = ?" for field in kwargs.items()])
    # await db.execute(
    #     f"UPDATE myextension.maintable SET {q} WHERE id = ?",
    #     (*kwargs.values(), myextension_id),
    # )


async def delete_myextension(myextension_id: str) -> None:
    await db.execute(f"DELETE FROM {table_name} WHERE id = ?", (myextension_id,))
