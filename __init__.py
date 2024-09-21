import asyncio

from fastapi import APIRouter
from loguru import logger

from .crud import db
from .tasks import wait_for_paid_invoices
from .views import allowance_generic_router
from .views_api import allowance_api_router
from .views_lnurl import allowance_lnurl_router

logger.debug(
    "This logged message is from allowance/__init__.py, you can debug in your "
    "extension using 'import logger from loguru' and 'logger.debug(<thing-to-log>)'."
)


allowance_ext: APIRouter = APIRouter(prefix="/allowance", tags=["Allowance"])
allowance_ext.include_router(allowance_generic_router)
allowance_ext.include_router(allowance_api_router)
allowance_ext.include_router(allowance_lnurl_router)

allowance_static_files = [
    {
        "path": "/allowance/static",
        "name": "allowance_static",
    }
]

scheduled_tasks: list[asyncio.Task] = []


def allowance_stop():
    for task in scheduled_tasks:
        try:
            task.cancel()
        except Exception as ex:
            logger.warning(ex)


def allowance_start():
    from lnbits.tasks import create_permanent_unique_task

    task = create_permanent_unique_task("ext_allowance", wait_for_paid_invoices)
    scheduled_tasks.append(task)


__all__ = [
    "db",
    "allowance_ext",
    "allowance_static_files",
    "allowance_start",
    "allowance_stop",
]
