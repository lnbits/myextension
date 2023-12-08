# The migration file is like a blockchain, never edit only add!

async def m001_initial(db):
    """
    Initial templates table.
    """
    await db.execute(
        """
        CREATE TABLE temp.temp (
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
        ALTER TABLE temp.temp ADD lnurlwithdrawamount INTEGER DEFAULT 0;
    """
    )