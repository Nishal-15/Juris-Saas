const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Delete all direct consultations/appointments
    const apptDeleteResult = await db.collection('appointments').deleteMany({});
    console.log(`Deleted ${apptDeleteResult.deletedCount} consultations/appointments.`);
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
