import asyncio

from loguru import logger

from lnbits.core.models import Payment
from lnbits.core.services import create_invoice, websocketUpdater
from lnbits.helpers import get_current_extension_name
from lnbits.tasks import register_invoice_listener

from .crud import get_myextension, update_myextension


#######################################
########## RUN YOUR TASKS HERE ########
#######################################

# The usual task is to listen to invoices related to this extension


async def wait_for_paid_invoices():
    logger.debug(get_current_extension_name())
    invoice_queue = asyncio.Queue()
    register_invoice_listener(invoice_queue, get_current_extension_name())
    while True:
        payment = await invoice_queue.get()
        await on_invoice_paid(payment)


# Do somethhing when an invoice related top this extension is paid


async def on_invoice_paid(payment: Payment) -> None:
    logger.debug("payment received for myextension extension")
    if payment.extra.get("tag") != "MyExtension":
        return

    myextension_id = payment.extra.get("myextensionId")
    myextension = await get_myextension(myextension_id)

    # update something in the db
    if payment.extra.get("lnurlwithdraw"):
        total = myextension.total - payment.amount
    else:
        total = myextension.total + payment.amount
    data_to_update = {"total": total}

    await update_myextension(myextension_id=myextension_id, **data_to_update)

    # here we could send some data to a websocket on wss://<your-lnbits>/api/v1/ws/<myextension_id>
    # and then listen to it on the frontend, which we do with index.html connectWebocket()

    some_payment_data = {
        "name": myextension.name,
        "amount": payment.amount,
        "fee": payment.fee,
        "checking_id": payment.checking_id,
    }

    await websocketUpdater(myextension_id, str(some_payment_data))
