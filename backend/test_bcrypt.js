const bcrypt = require("bcryptjs");

async function test() {
    const pass = "password123";
    const hashSync = bcrypt.hashSync(pass, 10);
    console.log("HashSync:", hashSync);
    
    const isMatchSync = bcrypt.compareSync(pass, hashSync);
    console.log("MatchSync:", isMatchSync);
    
    const salt = await bcrypt.genSalt(10);
    const hashAsync = await bcrypt.hash(pass, salt);
    console.log("HashAsync:", hashAsync);
    
    const isMatchAsync = await bcrypt.compare(pass, hashAsync);
    console.log("MatchAsync:", isMatchAsync);
    
    const isMatchCross = await bcrypt.compare(pass, hashSync);
    console.log("MatchCross:", isMatchCross);
}

test();
