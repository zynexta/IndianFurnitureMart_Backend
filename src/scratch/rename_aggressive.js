const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '../../../');
const dirsToScan = [
    path.join(rootDir, 'frontend', 'src'),
    path.join(rootDir, 'backend', 'src'),
];

const ignoreFiles = ['test_smtp.js', 'get_admin.js', 'rename.js', 'rename_aggressive.js'];

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
        const files = fs.readdirSync(filePath);
        files.forEach(file => replaceInFile(path.join(filePath, file)));
    } else if (stats.isFile()) {
        if (ignoreFiles.includes(path.basename(filePath))) return;
        if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
        
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        // UI Label Replacements
        newContent = newContent.replace(/Partner Showroom/g, 'Customer Profile');
        newContent = newContent.replace(/Showroom Details/g, 'Customer Details');
        newContent = newContent.replace(/Showroom Name/g, 'Preferred City');
        newContent = newContent.replace(/"Showroom"/g, '"Mart"');
        newContent = newContent.replace(/'Showroom'/g, "'Mart'");
        newContent = newContent.replace(/Showroom Access/g, 'Customer Portal');
        newContent = newContent.replace(/Welcome to the Showroom/g, 'Welcome to Indian Furniture Mart');
        newContent = newContent.replace(/Showroom Partner/g, 'Registered Customer');
        newContent = newContent.replace(/Contact Showroom/g, 'Contact Us');
        newContent = newContent.replace(/Showrooms/g, 'Clients');
        newContent = newContent.replace(/Showroom/g, 'Mart'); // Catch-all for capitalized
        newContent = newContent.replace(/showroom/g, 'mart'); // Catch-all for lowercase

        newContent = newContent.replace(/Shop Name/g, 'Preferred City');
        newContent = newContent.replace(/Business Entity/gi, 'Customer');
        newContent = newContent.replace(/Heritage Pavilion/gi, 'Indian Furniture Mart');
        newContent = newContent.replace(/Dealer/gi, 'Customer');
        newContent = newContent.replace(/Vendor/gi, 'Client');
        newContent = newContent.replace(/Studio Name/gi, 'Interior Preference');

        // Fix potential double-ups or weird phrasing
        newContent = newContent.replace(/Indian Furniture Mart Mart/gi, 'Indian Furniture Mart');
        newContent = newContent.replace(/IndianFurniture/g, 'Indian Furniture Mart');
        newContent = newContent.replace(/Indian Furniture Mart Customer Profile/gi, 'Indian Furniture Mart Customer');

        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Aggressively Updated: ${filePath}`);
        }
    }
}

dirsToScan.forEach(dir => replaceInFile(dir));
console.log('Aggressive rename complete.');
