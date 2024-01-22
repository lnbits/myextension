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
            lnurlpayamount INTEGER DEFAULT 0,
            lnurlwithdrawamount INTEGER DEFAULT 0,
            lnurlwithdraw TEXT,
            lnurlpay TEXT
        );
    """
    )

# Here we add another field to the database

async def m002_addtip_wallet(db):
    """
    Add total to templates table
    """
    await db.execute(
        """
        ALTER TABLE myextension.maintable ADD ticker INTEGER DEFAULT 1;
    """
    )