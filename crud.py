from typing import List, Optional, Union

from lnbits.helpers import urlsafe_short_hash

from . import db
from .models import CreateTempData, Temp, TempClean, LNURLCharge
from loguru import logger


async def create_temp(wallet_id: str, data: CreateTempData) -> Temp:
    temp_id = urlsafe_short_hash()
    await db.execute(
        """
        INSERT INTO temp.temp (id, wallet, name, total)
        VALUES (?, ?, ?, ?)
        """,
        (
            temp_id,
            wallet_id,
            data.name,
            data.total,
            data.lnurlpayamount,
            data.lnurlwithdrawamount
        ),
    )
    temp = await get_temp(temp_id)
    assert temp, "Newly created temp couldn't be retrieved"
    return temp


async def get_temp(temp_id: str) -> Optional[Temp]:
    row = await db.fetchone("SELECT * FROM temp.temp WHERE id = ?", (temp_id,))
    return Temp(**row) if row else None

async def get_temps(wallet_ids: Union[str, List[str]]) -> List[Temp]:
    if isinstance(wallet_ids, str):
        wallet_ids = [wallet_ids]

    q = ",".join(["?"] * len(wallet_ids))
    rows = await db.fetchall(
        f"SELECT * FROM temp.temp WHERE wallet IN ({q})", (*wallet_ids,)
    )
    return [Temp(**row) for row in rows]

async def update_temp(temp_id: str, **kwargs) -> Temp:
    q = ", ".join([f"{field[0]} = ?" for field in kwargs.items()])
    await db.execute(
        f"UPDATE temp.temp SET {q} WHERE id = ?", (*kwargs.values(), temp_id)
    )
    temp = await get_temp(temp_id)
    assert temp, "Newly updated temp couldn't be retrieved"
    return temp

async def delete_temp(temp_id: str) -> None:
    await db.execute("DELETE FROM temp.temp WHERE id = ?", (temp_id,))