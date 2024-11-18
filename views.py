# Description: Add your page endpoints here.

from http import HTTPStatus

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from lnbits.core.models import User
from lnbits.decorators import check_user_exists
from lnbits.helpers import template_renderer
from lnbits.settings import settings

from .crud import get_myextension
from .helpers import lnurler

myextension_generic_router = APIRouter()


def myextension_renderer():
    return template_renderer(["myextension/templates"])


#######################################
##### ADD YOUR PAGE ENDPOINTS HERE ####
#######################################


# Backend admin page


@myextension_generic_router.get("/", response_class=HTMLResponse)
async def index(req: Request, user: User = Depends(check_user_exists)):
    return myextension_renderer().TemplateResponse(
        "myextension/index.html", {"request": req, "user": user.json()}
    )


# Frontend shareable page


@myextension_generic_router.get("/{myextension_id}")
async def myextension(req: Request, myextension_id):
    myex = await get_myextension(myextension_id)
    if not myex:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )
    return myextension_renderer().TemplateResponse(
        "myextension/myextension.html",
        {
            "request": req,
            "myextension_id": myextension_id,
            "lnurlpay": lnurler(myex.id, "myextension.api_lnurl_pay", req),
            "web_manifest": f"/myextension/manifest/{myextension_id}.webmanifest",
        },
    )


# Manifest for public page, customise or remove manifest completely


@myextension_generic_router.get("/manifest/{myextension_id}.webmanifest")
async def manifest(myextension_id: str):
    myextension = await get_myextension(myextension_id)
    if not myextension:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="MyExtension does not exist."
        )

    return {
        "short_name": settings.lnbits_site_title,
        "name": myextension.name + " - " + settings.lnbits_site_title,
        "icons": [
            {
                "src": (
                    settings.lnbits_custom_logo
                    if settings.lnbits_custom_logo
                    else "https://cdn.jsdelivr.net/gh/lnbits/lnbits@0.3.0/docs/logos/lnbits.png"
                ),
                "type": "image/png",
                "sizes": "900x900",
            }
        ],
        "start_url": "/myextension/" + myextension_id,
        "background_color": "#1F2234",
        "description": "Minimal extension to build on",
        "display": "standalone",
        "scope": "/myextension/" + myextension_id,
        "theme_color": "#1F2234",
        "shortcuts": [
            {
                "name": myextension.name + " - " + settings.lnbits_site_title,
                "short_name": myextension.name,
                "description": myextension.name + " - " + settings.lnbits_site_title,
                "url": "/myextension/" + myextension_id,
            }
        ],
    }
