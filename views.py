from http import HTTPStatus

from fastapi import APIRouter, Depends, Request
from lnbits.core.models import User
from lnbits.decorators import check_user_exists
from lnbits.helpers import template_renderer
from lnbits.settings import settings
from starlette.exceptions import HTTPException
from starlette.responses import HTMLResponse

from .crud import get_allowance

allowance_generic_router = APIRouter()


def allowance_renderer():
    return template_renderer(["allowance/templates"])


#######################################
##### ADD YOUR PAGE ENDPOINTS HERE ####
#######################################


# Backend admin page


@allowance_generic_router.get("/", response_class=HTMLResponse)
async def index(request: Request, user: User = Depends(check_user_exists)):
    return allowance_renderer().TemplateResponse(
        "allowance/index.html", {"request": request, "user": user.json()}
    )


# Frontend shareable page


@allowance_generic_router.get("/{allowance_id}")
async def allowance(request: Request, allowance_id):
    allowance = await get_allowance(allowance_id)
    if not allowance:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Allowance does not exist."
        )
    return allowance_renderer().TemplateResponse(
        "allowance/allowance.html",
        {
            "request": request,
            "allowance_id": allowance_id,
            "lnurlpay": allowance.lnurlpay,
            "web_manifest": f"/allowance/manifest/{allowance_id}.webmanifest",
        },
    )


# Manifest for public page, customise or remove manifest completely


@allowance_generic_router.get("/manifest/{allowance_id}.webmanifest")
async def manifest(allowance_id: str):
    allowance = await get_allowance(allowance_id)
    if not allowance:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Allowance does not exist."
        )

    return {
        "short_name": settings.lnbits_site_title,
        "name": allowance.name + " - " + settings.lnbits_site_title,
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
        "start_url": "/allowance/" + allowance_id,
        "background_color": "#1F2234",
        "description": "Allowance extension",
        "display": "standalone",
        "scope": "/allowance/" + allowance_id,
        "theme_color": "#1F2234",
        "shortcuts": [
            {
                "name": allowance.name + " - " + settings.lnbits_site_title,
                "short_name": allowance.name,
                "description": allowance.name + " - " + settings.lnbits_site_title,
                "url": "/allowance/" + allowance_id,
            }
        ],
    }
