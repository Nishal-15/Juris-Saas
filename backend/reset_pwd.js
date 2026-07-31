const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Update Nishith's password in the lawyers collection
    const result = await db.collection('lawyers').updateOne(
        { name: /Nishith/i },
        { $set: { password: hashedPassword } }
    );
    
    if (result.matchedCount > 0) {
        console.log(`Successfully reset password for Nishith.`);
    } else {
        console.log(`Could not find a lawyer named Nishith.`);
    }
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
