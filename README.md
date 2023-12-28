# Temp - <small>[LNbits](https://github.com/lnbits/lnbits) extension</small>

<small>For more about LNBits extension check [this tutorial](https://github.com/lnbits/lnbits/wiki/LNbits-Extensions)</small>

## A template extension you can fork and use as a base for a template

Let the hacking begin! After you have forked this extension you can copy functions from other extensions that you might need. 

The extension README is usually used as a guide of how to use the extension.

### Usage
> We are assumng you want to use this extension as a base for a new extension

1. Install then enable the extension either through the official LNbits manifest of by adding https://raw.githubusercontent.com/lnbits/temp/main/manifest.json to `"Server"/"Server"/"Extension Sources"`. <img src="https://i.imgur.com/MUGwAU3.png">
2. Shutdown your LNbits install.
3. Download the extension files from https://github.com/lnbits/temp to a folder outside of `/lnbits`, and initialise the folder with `git`. Or create a repo, copy the temp extension files into it, then `git clone` the extension to a location outside of `/lnbits`. 
4. Delete the installed extension from `lnbits/lnbits/extenions`.
5. Create a symbolic link `ln -s /home/ben/Projects/temp /home/ben/Projects/lnbits/lnbits/extensions`.
6. Start your LNbits install (Now you can edit your extension).
7. Once you are ready to share your manifest so others can install edit `/lnbits/temp/manifest.json` to the git credentials of your extension.
8. IMPORTANT: If you intend the extension to be added to the offial LNbits manifest, please follow the guidlines here https://github.com/lnbits/lnbits-extensions#important