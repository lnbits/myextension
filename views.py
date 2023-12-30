from http import HTTPStatus

from fastapi import Depends, Request
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException
from starlette.responses import HTMLResponse

from lnbits.core.models import User
from lnbits.decorators import check_user_exists
from lnbits.settings import settings

from . import temp_ext, temp_renderer
from .crud import get_temp

temps = Jinja2Templates(directory="temps")


#######################################
##### ADD YOUR PAGE ENDPOINTS HERE ####
#######################################


# Backend admin page

@temp_ext.get("/", response_class=HTMLResponse)
async def index(request: Request, user: User = Depends(check_user_exists)):
    return temp_renderer().TemplateResponse(
        "temp/index.html", {"request": request, "user": user.dict()}
    )


# Frontend shareable page

@temp_ext.get("/{temp_id}")
async def temp(request: Request, temp_id):
    temp = await get_temp(temp_id)
    if not temp:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Temp does not exist."
        )
    return temp_renderer().TemplateResponse(
        "temp/temp.html",
        {
            "request": request,
            "temp_id": temp_id,
            "lnurlpay": temp.lnurlpayamount,
            "lnurlwithdraw": temp.lnurlwithdrawamount,
            "web_manifest": f"/temp/manifest/{temp_id}.webmanifest",
        },
    )


# Manifest for public page, customise or remove manifest completely

@temp_ext.get("/manifest/{temp_id}.webmanifest")
async def manifest(temp_id: str):
    temp= await get_temp(temp_id)
    if not temp:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Temp does not exist."
        )

    return {
        "short_name": settings.lnbits_site_title,
        "name": temp.name + " - " + settings.lnbits_site_title,
        "icons": [
            {
                "src": settings.lnbits_custom_logo
                if settings.lnbits_custom_logo
                else "https://cdn.jsdelivr.net/gh/lnbits/lnbits@0.3.0/docs/logos/lnbits.png",
                "type": "image/png",
                "sizes": "900x900",
            }
        ],
        "start_url": "/temp/" + temp_id,
        "background_color": "#1F2234",
        "description": "Minimal extension to build on",
        "display": "standalone",
        "scope": "/temp/" + temp_id,
        "theme_color": "#1F2234",
        "shortcuts": [
            {
                "name": temp.name + " - " + settings.lnbits_site_title,
                "short_name": temp.name,
                "description": temp.name + " - " + settings.lnbits_site_title,
                "url": "/temp/" + temp_id,
            }
        ],
    }