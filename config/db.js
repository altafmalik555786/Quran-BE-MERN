const mongoose = require('mongoose');
const Tutor = require('../models/tutorSchema');

const connectDB = async () => {
    // const uri = "mongodb+srv://altafmalik555786:altafmalik555786@cluster0.duqdw.mongodb.net/dysoftech?retryWrites=true&w=majority&appName=Cluster0";
    const uri = "mongodb+srv://altafmalik555786:W2crTtmPoDOJ2YZs@cluster0.duqdw.mongodb.net/";

    try {
        // MongoDB Connection
        mongoose.connect(uri);
        const database = mongoose.connection;
        database.on("error", (error) => {
            console.log(error);
        });
        database.once("connected", () => {
            console.log("Database Connected");
        });

        // Check if a tutor with the specified email already exist
        const existingTutor = await Tutor.findOne({ email: "altafmalik555786@gmail.com" });
        if (!existingTutor) {
            // Only create the tutor if it does not already exist
            const tutorData = {
                name: "Tutor",
                email: "altafmalik555786@gmail.com",
                password: "Test@1",
                role: 'tutor', // Default role 
                tutorGender: "Male",
                phone: "+923013109562",
                country: "Pakistan",
                timeZone: "GMT+5",
                city: "Lahore",
                hourlyRate: "100$",
                subjects: "Quran"
            };

            const initialTutorial = new Tutor(tutorData);
            await initialTutorial.save();

            console.log('Initial tutor created:', initialTutorial);
        }
    } catch (err) {
        console.error('NOT CONNECTED TO NETWORK', err);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = connectDB;
