const mongoose = require('mongoose');
require('dotenv').config();

const checkData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected Successfully!');

        // Dynamic models to avoid errors if schemas aren't loaded
        // 🎯 FIXED: Mongoose uses 'users' collection for all roles
        const User = mongoose.connection.collection('users');
        const Appointment = mongoose.connection.collection('appointments');
        const Message = mongoose.connection.collection('messages');
        const Case = mongoose.connection.collection('cases');

        const appointments = await Appointment.countDocuments();
        const messages = await Message.countDocuments();
        const cases = await Case.countDocuments();
        
        // Count by role
        const citizens = await User.countDocuments({ role: "user" });
        const lawyers = await User.countDocuments({ role: "lawyer" });
        const admins = await User.countDocuments({ role: "admin" });

        console.log('\n--- JURIS DATA HEALTH CHECK ---');
        console.log('Found ' + cases + ' Total Legal Files (Cases)');
        console.log('Found ' + appointments + ' Active Appointments');
        console.log('Found ' + messages + ' Consultation Messages');
        console.log('Found ' + citizens + ' Registered Citizens');
        console.log('Found ' + lawyers + ' Registered Experts');
        console.log('Found ' + admins + ' Platform Administrators');
        console.log('-------------------------------\n');

        const allCases = await Case.find().toArray();
        console.log('--- ALL CASES IN DB ---');
        allCases.forEach(c => {
          console.log(`- Title: ${c.title} | Type: ${c.type} | Assigned: ${c.assignedLawyer ? 'YES' : 'NO'}`);
        });
        console.log('-----------------------\n');

        process.exit(0);
    } catch (err) {
        console.error('ERROR during Health Check:', err.message);
        process.exit(1);
    }
};

checkData();
