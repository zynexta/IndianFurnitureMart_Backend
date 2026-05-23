const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const getAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://IndianFurnitureMart:IndianFurnitureMart@cluster0.wfgef1k.mongodb.net/indianfurniture?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected to MongoDB');
        
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
            console.log('Admin user found:');
            console.log('Name:', adminUser.name);
            console.log('Email:', adminUser.email);
            console.log('Role:', adminUser.role);
        } else {
            console.log('No admin user found.');
            const someUsers = await User.find().limit(5);
            console.log('Sample users:', someUsers.map(u => ({ name: u.name, email: u.email, role: u.role })));
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

getAdmin();
