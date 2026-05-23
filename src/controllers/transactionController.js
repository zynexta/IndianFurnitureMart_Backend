const Transaction = require('../models/Transaction');

exports.addTransaction = async (req, res, next) => {
    const { userId, productName, quantity, price, type, note, date } = req.body;
    try {
        if (!userId || !productName || !quantity || !price || !type || !note) {
            res.status(400);
            throw new Error('Please fill all required fields: User, Product, Qty, Price, Type, and Note');
        }

        if (Number(quantity) <= 0 || Number(price) <= 0) {
            res.status(400);
            throw new Error('Quantity and Price must be greater than 0');
        }

        const amount = Number(quantity) * Number(price);
        const transaction = new Transaction({
            userId,
            productName,
            quantity,
            price,
            amount,
            type,
            note,
            date: date || Date.now()
        });
        const createdTransaction = await transaction.save();
        res.status(201).json(createdTransaction);
    } catch (error) {
        next(error);
    }
};

exports.updateTransaction = async (req, res, next) => {
    const { productName, quantity, price, type, note, date } = req.body;
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (transaction) {
            transaction.productName = productName || transaction.productName;
            transaction.quantity = quantity !== undefined ? Number(quantity) : transaction.quantity;
            transaction.price = price !== undefined ? Number(price) : transaction.price;
            
            if (transaction.quantity <= 0 || transaction.price <= 0) {
                res.status(400);
                throw new Error('Quantity and Price must be greater than 0');
            }

            transaction.amount = transaction.quantity * transaction.price;
            transaction.type = type || transaction.type;
            transaction.note = note || transaction.note;
            transaction.date = date || transaction.date;

            const updatedTransaction = await transaction.save();
            res.json(updatedTransaction);
        } else {
            res.status(404);
            throw new Error('Transaction not found');
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteTransaction = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (transaction) {
            await transaction.deleteOne();
            res.json({ message: 'Transaction removed' });
        } else {
            res.status(404);
            throw new Error('Transaction not found');
        }
    } catch (error) {
        next(error);
    }
};

exports.getGlobalStats = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const Product = require('../models/Product');
        const Enquiry = require('../models/Enquiry');

        const { period = 'weekly' } = req.query;

        // Date ranges for trends
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Helper for growth calculation
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        // Current & Previous Month Counts for Trends
        const [currUsers, prevUsers, currProducts, prevProducts, currEnquiries, prevEnquiries, allEnquiries] = await Promise.all([
            User.countDocuments({ role: 'user', createdAt: { $gte: startOfCurrentMonth } }),
            User.countDocuments({ role: 'user', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            Product.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
            Product.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            Enquiry.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }),
            Enquiry.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            Enquiry.find({})
        ]);

        const currConfirmed = allEnquiries
            .filter(e => ['confirmed', 'completed'].includes(e.status) && e.createdAt >= startOfCurrentMonth).length;
        const prevConfirmed = allEnquiries
            .filter(e => ['confirmed', 'completed'].includes(e.status) && e.createdAt >= startOfLastMonth && e.createdAt <= endOfLastMonth).length;

        const trends = {
            users: calculateGrowth(currUsers, prevUsers),
            products: calculateGrowth(currProducts, prevProducts),
            enquiries: calculateGrowth(currEnquiries, prevEnquiries),
            revenue: calculateGrowth(currConfirmed, prevConfirmed)
        };

        // Main Stats
        const users = await User.find({ role: 'user' });
        const totalUsers = users.length;
        let totalPreviousBalance = 0;
        users.forEach(u => totalPreviousBalance += (u.previousBalance || 0));

        const totalProducts = await Product.countDocuments({});
        const totalEnquiries = allEnquiries.length;
        const pendingEnquiries = allEnquiries.filter(e => e.status === 'pending').length;
        const completedEnquiries = allEnquiries.filter(e => e.status === 'completed').length;
        const totalConfirmed = allEnquiries.filter(e => ['confirmed', 'completed'].includes(e.status)).length;

        let totalDebit = 0;
        let totalCredit = 0;
        
        // Revenue Stats
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnquiries = allEnquiries.filter(e => e.createdAt >= startOfToday).length;
        const todayRevenue = todayEnquiries;
        const monthlyRevenue = allEnquiries.filter(e => e.createdAt >= startOfCurrentMonth).length;

        // Recent Enquiries
        const recentEnquiries = await Enquiry.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name preferences shopName avatar');

        // Recent Activities (Aggregated)
        const [latestUsers, latestProducts, latestEnquiries] = await Promise.all([
            User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(3),
            Product.find({}).sort({ updatedAt: -1 }).limit(3),
            Enquiry.find({}).sort({ updatedAt: -1 }).limit(3).populate('userId', 'name')
        ]);

        const activities = [
            ...latestUsers.map(u => ({ type: 'user', action: 'New user registered', target: u.name, date: u.createdAt })),
            ...latestProducts.map(p => ({ type: 'product', action: 'Product updated', target: p.name, date: p.updatedAt })),
            ...latestEnquiries.map(e => ({ type: 'enquiry', action: 'Enquiry status: ' + e.status, target: e.userId?.name || 'Customer', date: e.updatedAt }))
        ].sort((a, b) => b.date - a.date).slice(0, 10);

        // Chart Data (Dynamic based on period)
        const daysToFetch = period === 'monthly' ? 30 : 7;
        const lastNDays = [...Array(daysToFetch)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        const chartData = lastNDays.map(dateStr => {
            const dayEnquiries = allEnquiries.filter(e => e.createdAt.toISOString().split('T')[0] === dateStr);
            const total = dayEnquiries.length;
            const confirmed = dayEnquiries.filter(e => ['confirmed', 'completed'].includes(e.status)).length;
            
            return {
                name: period === 'monthly' 
                    ? new Date(dateStr).getDate() 
                    : new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                total,
                confirmed
            };
        });

        res.json({
            totalUsers,
            totalProducts,
            totalEnquiries,
            pendingEnquiries,
            completedEnquiries,
            totalDebit,
            totalCredit,
            totalPreviousBalance,
            todayRevenue,
            monthlyRevenue,
            trends,
            recentEnquiries,
            activities,
            chartData,
            totalConfirmed
        });
    } catch (error) {
        console.error('Global stats error:', error);
        if (typeof next === 'function') next(error);
        else res.status(500).json({ message: error.message });
    }
};
