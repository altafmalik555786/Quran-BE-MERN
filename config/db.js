const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('NOT CONNECTED TO NETWORK', err);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = connectDB;
