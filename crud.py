from typing import Optional, Union

from lnbits.db import Database
from lnbits.helpers import insert_query, update_query

from .models import Allowance

db = Database("ext_allowance")
table_name = "allowance.maintable"


async def create_allowance(data: Allowance) -> Allowance:
    await db.execute(
        insert_query(table_name, data),
        (*data.dict().values(),),
    )
    return data

    # this is how we used to do it

    # allowance_id = urlsafe_short_hash()
    # await db.execute(
    #     """
    #     INSERT INTO allowance.maintable
    #     (id, wallet, name, lnurlpayamount, lnurlwithdrawamount)
    #     VALUES (?, ?, ?, ?, ?)
    #     """,
    #     (
    #         allowance_id,
    #         wallet_id,
    #         data.name,
    #         data.lnurlpayamount,
    #         data.lnurlwithdrawamount,
    #     ),
    # )
    # allowance = await get_allowance(allowance_id)
    # assert allowance, "Newly created table couldn't be retrieved"


async def get_allowance(allowance_id: str) -> Optional[Allowance]:
    row = await db.fetchone(
        f"SELECT * FROM {table_name} WHERE id = ?", (allowance_id,)
    )
    return Allowance(**row) if row else None


async def get_allowances(wallet_ids: Union[str, list[str]]) -> list[Allowance]:
    if isinstance(wallet_ids, str):
        wallet_ids = [wallet_ids]

    q = ",".join(["?"] * len(wallet_ids))
    rows = await db.fetchall(
        f"SELECT * FROM {table_name} WHERE wallet IN ({q})", (*wallet_ids,)
    )
    return [Allowance(**row) for row in rows]


async def update_allowance(data: Allowance) -> Allowance:
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
    #     f"UPDATE allowance.maintable SET {q} WHERE id = ?",
    #     (*kwargs.values(), allowance_id),
    # )


async def delete_allowance(allowance_id: str) -> None:
    await db.execute(f"DELETE FROM {table_name} WHERE id = ?", (allowance_id,))
