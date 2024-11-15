import asyncio

from lnbits.core.models import Payment
from lnbits.core.services import websocket_updater
from lnbits.tasks import register_invoice_listener

from .crud import get_myextension, update_myextension

#######################################
########## RUN YOUR TASKS HERE ########
#######################################

# The usual task is to listen to invoices related to this extension


async def wait_for_paid_invoices():
    invoice_queue = asyncio.Queue()
    register_invoice_listener(invoice_queue, "ext_myextension")
    while True:
        payment = await invoice_queue.get()
        await on_invoice_paid(payment)


# Do somethhing when an invoice related top this extension is paid


async def on_invoice_paid(payment: Payment) -> None:
    if payment.extra.get("tag") != "MyExtension":
        return

    myextension_id = payment.extra.get("myextensionId")
    assert myextension_id, "myextensionId not set in invoice"
    myextension = await get_myextension(myextension_id)
    assert myextension, "MyExtension does not exist"

    # update something in the db
    if payment.extra.get("lnurlwithdraw"):
        total = myextension.total - payment.amount
    else:
        total = myextension.total + payment.amount

    myextension.total = total
    await update_myextension(myextension)

    # here we could send some data to a websocket on
    # wss://<your-lnbits>/api/v1/ws/<myextension_id> and then listen to it on
    # the frontend, which we do with index.html connectWebocket()

    some_payment_data = {
        "name": myextension.name,
        "amount": payment.amount,
        "fee": payment.fee,
        "checking_id": payment.checking_id,
    }

    await websocket_updater(myextension_id, str(some_payment_data))
