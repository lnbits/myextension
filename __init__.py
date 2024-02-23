import asyncio

from fastapi import APIRouter

from lnbits.db import Database
from lnbits.helpers import template_renderer
from lnbits.tasks import catch_everything_and_restart


db = Database("ext_myextension")

myextension_ext: APIRouter = APIRouter(
    prefix="/myextension", tags=["MyExtension"]
)

myextension_static_files = [
    {
        "path": "/myextension/static",
        "name": "myextension_static",
    }
]


def myextension_renderer():
    return template_renderer(["myextension/templates"])


from .lnurl import *
from .tasks import wait_for_paid_invoices
from .views import *
from .views_api import *


def myextension_start():
    loop = asyncio.get_event_loop()
    loop.create_task(catch_everything_and_restart(wait_for_paid_invoices))
