`The README.md typically serves as a guide for using the extension.`

# Temp - An [LNbits](https://github.com/lnbits/lnbits) Extension

For more information about LNBits extensions, refer to [this tutorial](https://github.com/lnbits/lnbits/wiki/LNbits-Extensions).

## A Starter Template for Your Own Extension

Ready to start hacking? Once you've forked this extension, you can incorporate functions from other extensions as needed. 

### How to Use This Template
> This guide assumes you're using this extension as a base for a new one.

1. Install and enable the extension either through the official LNbits manifest or by adding https://raw.githubusercontent.com/lnbits/temp/main/manifest.json to `"Server"/"Server"/"Extension Sources"`. ![Extension Sources](https://i.imgur.com/MUGwAU3.png)
2. Shut down your LNbits installation.
3. Download the extension files from https://github.com/lnbits/temp to a folder outside of `/lnbits`, and initialize the folder with `git`. Alternatively, create a repo, copy the temp extension files into it, then `git clone` the extension to a location outside of `/lnbits`. 
4. Remove the installed extension from `lnbits/lnbits/extensions`.
5. Create a symbolic link using `ln -s /home/ben/Projects/<name of your extension> /home/ben/Projects/lnbits/lnbits/extensions`.
6. Restart your LNbits installation. You can now modify your extension and `git push` changes to a repo.
7. When you're ready to share your manifest so others can install it, edit `/lnbits/temp/manifest.json` to include the git credentials of your extension.
8. IMPORTANT: If you want your extension to be added to the official LNbits manifest, please follow the guidelines here: https://github.com/lnbits/lnbits-extensions#important