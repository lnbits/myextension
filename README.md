# Allowance - An [LNbits](https://github.com/lnbits/lnbits) Extension

## Introduction

This is an LNBits extension that allows you to setup recurring transfers between wallets.

### Installation

Install and enable the "Allowance" extension either through the official LNbits manifest (**not yet vetted**) or by adding https://raw.githubusercontent.com/bengweeks/allowance/main/manifest.json to `Server`/ `Server` / `Extension Sources`.

### Development

> This guide assumes you're using this extension as a base for a new one, and have installed LNbits using https://github.com/lnbits/lnbits/blob/main/docs/guide/installation.md#option-1-recommended-poetry.

1. `Ctrl c` shut down your LNbits installation.
2. Download the extension files from https://github.com/bengweek/allowance to a folder outside of `/lnbits`, and initialize the folder with `git`. Alternatively, create a repo, copy the allowance extension files into it, then `git clone` the extension to a location outside of `/lnbits`.
3. Remove the installed extension from `lnbits/lnbits/extensions`.
4. Create a symbolic link using `ln -s /home/ben/Projects/<name of your extension> /home/ben/Projects/lnbits/lnbits/extensions`.
5. Restart your LNbits installation. You can now modify your extension and `git push` changes to a repo.
6. When you're ready to share your manifest so others can install it, edit `/lnbits/allowance/manifest.json` to include the git credentials of your extension.
7. IMPORTANT: If you want your extension to be added to the official LNbits manifest, please follow the guidelines here: https://github.com/lnbits/lnbits-extensions#important
