const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    await db.collection('lawyers').updateMany({}, { $set: { isBlocked: false } });
    console.log('Unblocked all lawyers in the DB to sync with Users DB');
    process.exit(0);
});
