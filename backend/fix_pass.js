const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://nishal4998_db_user:Nishal%4015@ac-956mws6-shard-00-00.zaywfr0.mongodb.net:27017,ac-956mws6-shard-00-01.zaywfr0.mongodb.net:27017,ac-956mws6-shard-00-02.zaywfr0.mongodb.net:27017/jurisbot-SaaS?ssl=true&replicaSet=atlas-71sbu5-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('nishal@1507', salt);
    await User.updateOne({ email: 'nishalnishith@gmail.com' }, { $set: { password: hash } });
    console.log('Password reset to nishal@1507 for nishalnishith@gmail.com');
    mongoose.disconnect();
})
.catch(err => console.error(err));
