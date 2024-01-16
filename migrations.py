# The migration file is like a blockchain, never edit only add!

async def m001_initial(db):
    """
    Initial templates table.
    """
    await db.execute(
        """
        CREATE TABLE myextension.maintable (
            id TEXT PRIMARY KEY,
            wallet TEXT NOT NULL,
            name TEXT NOT NULL,
            total INTEGER DEFAULT 0,
            lnurlpayamount INTEGER DEFAULT 0
        );
    """
    )

# Here we are adding an extra field to the database

async def m002_addtip_wallet(db):
    """
    Add total to templates table
    """
    await db.execute(
        """
        ALTER TABLE myextension.maintable ADD lnurlwithdrawamount INTEGER DEFAULT 0;
    """
    )

# Here we add another field to the database, always add never edit!

async def m004_addtip_wallet(db):
    """
    Add total to templates table
    """
    await db.execute(
        """
        ALTER TABLE myextension.maintable ADD lnurlwithdraw TEXT;
    """
    )

# Here we add another field to the database

async def m005_addtip_wallet(db):
    """
    Add total to templates table
    """
    await db.execute(
        """
        ALTER TABLE myextension.maintable ADD lnurlpay TEXT;
    """
    )