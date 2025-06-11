from typing import List, Optional, Union

from lnbits.db import Database
from lnbits.helpers import urlsafe_short_hash

from .models import CreateAllowanceData, Allowance

db = Database("ext_allowance")


async def create_allowance(data: CreateAllowanceData) -> Allowance:
    data.id = urlsafe_short_hash()
    await db.insert("allowance.maintable", data)
    return Allowance(**data.dict())

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
    return await db.fetchone(
        "SELECT * FROM allowance.maintable WHERE id = :id",
        {"id": allowance_id},
        Allowance,
    )


async def get_allowances(wallet_ids: Union[str, List[str]]) -> List[Allowance]:
    if isinstance(wallet_ids, str):
        wallet_ids = [wallet_ids]
    q = ",".join([f"'{w}'" for w in wallet_ids])
    return await db.fetchall(
        f"SELECT * FROM allowance.maintable WHERE wallet IN ({q}) ORDER BY id",
        model=Allowance,
    )


async def update_allowance(data: CreateAllowanceData) -> Allowance:
    await db.update("allowance.maintable", data)
    return Allowance(**data.dict())
    # this is how we used to do it

    # q = ", ".join([f"{field[0]} = ?" for field in kwargs.items()])
    # await db.execute(
    #     f"UPDATE allowance.maintable SET {q} WHERE id = ?",
    #     (*kwargs.values(), allowance_id),
    # )


async def delete_allowance(allowance_id: str) -> None:
    await db.execute(
        "DELETE FROM allowance.maintable WHERE id = :id", {"id": allowance_id}
    )
