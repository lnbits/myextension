`The README.md typically serves as a guide for using the extension.`

# MyExtension - An [LNbits](https://github.com/lnbits/lnbits) Extension

## A Starter Template for Your Own Extension

Ready to start hacking? Once you've forked this extension, you can incorporate functions from other extensions as needed.

### How to Use This Template

> [!IMPORTANT] the sequence of steps is very important so as not to run into issues!

> [!NOTE] You may want to modify your models.py/migration.py before installing the extension on your lnbits server (between steps

> This guide assumes you're using this extension as a base for a new one, and have installed LNbits using <https://github.com/lnbits/lnbits/blob/main/docs/guide/installation.md#option-1-recommended-poetry>.

1. Fork this extension to your Github repo with the name you want, e.g., `yourextensionname` -> <https://github.com/yourgithubusername/yourextensionname> (do not include hyphens as they can cause issues!)

1. Clone the Repository to your local computer. `git clone git@github.com/yourgithubuersname/yourextensionname`

1. `cd` into the folder `yourextensionname` and delete the `.git` folder with `rm -rf .git`

1. run `./updateExtensionName.sh myextension:<yourextensionname> myExtension:<yourExtensionName> MyExtension:<YourExtensionName>` (to replace all variations)

1. edit `./manifest.json` and replace the organization `lnbits` with `<yourgithubusernaame>`

1. (Optional) Modify your models.py/migration.py file to create your own database tables, or just play with the already existing ones

1. Re-initialize a git repo with `git init && git add . && git commit -m "initial commit"`

1. Push to your github repo

1. [!IMPORTANT] **you must create a release** *in your github repo* in order for it to show up in your lnbits extensions!

1. Start up your lnbits server and go to the Settings -> EXTENSIONS and add your manifest to the extension sources. It should be `https://raw.githubusercontent.com/<yourgithubusernaame>/<yourextensionname>/main/manifest.json` (going to  this link should show your updated manifest) and **save**. ![Extension Sources](https://i.imgur.com/MUGwAU3.png)
1. Great! Now if you go to the **Extensions** and go to the **ALL** tab, you should see your extension available for installing! (note that Github has an API rate limit, and you may want to include an API key generated from your github account in the `.env` file)

1. Remove the installed extension from `lnbits/lnbits/extensions`.

1. Create a symbolic link using `ln -s /home/ben/Projects/<name of your extension> /home/ben/Projects/lnbits/lnbits/extensions`.

1. Restart your LNbits installation. You can now modify your extension and the changes will appear on your LNbits instance (stop & restart your lnbits for full initialization of all files if needed, e.g., for migration to take effect). You can also `git push` changes to your new repo and create a release *in your github repo* if you want to install it from a fresh lnbits!

1. IMPORTANT: If you want your extension to be added to the official LNbits manifest, please follow the guidelines here: <https://github.com/lnbits/lnbits-extensions#important>
