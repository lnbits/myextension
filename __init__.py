import asyncio

from fastapi import APIRouter
from lnbits.tasks import create_permanent_unique_task
from loguru import logger

from .crud import db
from .tasks import wait_for_paid_invoices
from .views import myextension_generic_router
from .views_api import myextension_api_router
from .views_lnurl import myextension_lnurl_router

logger.debug(
    "This logged message is from myextension/__init__.py, you can debug in your "
    "extension using 'import logger from loguru' and 'logger.debug(<thing-to-log>)'."
)


myextension_ext: APIRouter = APIRouter(prefix="/myextension", tags=["MyExtension"])
myextension_ext.include_router(myextension_generic_router)
myextension_ext.include_router(myextension_api_router)
myextension_ext.include_router(myextension_lnurl_router)

myextension_static_files = [
    {
        "path": "/myextension/static",
        "name": "myextension_static",
    }
]

scheduled_tasks: list[asyncio.Task] = []


def myextension_stop():
    for task in scheduled_tasks:
        try:
            task.cancel()
        except Exception as ex:
            logger.warning(ex)


def myextension_start():
    task = create_permanent_unique_task("ext_myextension", wait_for_paid_invoices)
    scheduled_tasks.append(task)


__all__ = [
    "db",
    "myextension_ext",
    "myextension_static_files",
    "myextension_start",
    "myextension_stop",
]
