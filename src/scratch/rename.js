const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '../../../');
const dirsToScan = [
    path.join(rootDir, 'frontend', 'src'),
    path.join(rootDir, 'frontend', 'index.html'),
    path.join(rootDir, 'backend', 'src'),
];

// Specific files to skip
const ignoreFiles = ['test_smtp.js', 'get_admin.js', 'rename.js'];

// Replacements
const replacements = [
    // Brand name
    { search: /IndianFurniture/g, replace: 'Indian Furniture Mart' },
    { search: /Indian Furniture(?!\sMart)/gi, replace: 'Indian Furniture Mart' },
    { search: /Indian Furniture Mart Mart/g, replace: 'Indian Furniture Mart' }, // fix accidental doubles
    { search: /Indian Furniture Mart Heritage Pavilion/gi, replace: 'Indian Furniture Mart' },
    
    // Auth & Identity terms in labels
    { search: /Google Partner Showroom/gi, replace: 'Indian Furniture Mart' },
    
    // SEO & Meta
    { search: /Premium Indian Furniture Mart Collections/gi, replace: 'Indian Furniture Mart — Premium Luxury Furniture & Interior Collections' },
    
    // Other wholesale text cleanup 
    // We should be careful. 'The Showroom' is okay in some contexts but the user said "Remove Showroom, Partner Showroom, Shop Name, Business Entity... Replace with customer-friendly terms"
];

function processPath(targetPath) {
    if (!fs.existsSync(targetPath)) return;
    
    const stats = fs.statSync(targetPath);
    if (stats.isDirectory()) {
        const files = fs.readdirSync(targetPath);
        files.forEach(file => {
            processPath(path.join(targetPath, file));
        });
    } else if (stats.isFile()) {
        // Skip ignored files and non-text files
        if (ignoreFiles.includes(path.basename(targetPath))) return;
        if (!targetPath.endsWith('.js') && !targetPath.endsWith('.jsx') && !targetPath.endsWith('.html') && !targetPath.endsWith('.json')) return;
        
        let content = fs.readFileSync(targetPath, 'utf8');
        let newContent = content;
        
        // Apply generic replacements
        replacements.forEach(({ search, replace }) => {
            newContent = newContent.replace(search, replace);
        });
        
        // Manual specific fixes for UI
        // In UserManagement / UserDetails: 'Shop Name' -> 'Preferred City' or similar
        // We'll replace these carefully
        if (targetPath.endsWith('UserManagement.jsx') || targetPath.endsWith('UserDetails.jsx')) {
            newContent = newContent.replace(/Shop Name/gi, 'Preferred City');
            newContent = newContent.replace(/Showroom Details/gi, 'Customer Details');
            newContent = newContent.replace(/Partner Showroom/gi, 'Customer Profile');
        }
        
        if (targetPath.endsWith('Register.jsx') || targetPath.endsWith('Login.jsx') || targetPath.endsWith('Home.jsx')) {
            newContent = newContent.replace(/The Showroom/g, 'Explore Collection');
            newContent = newContent.replace(/Contact Our Showroom/g, 'Book Consultation');
            newContent = newContent.replace(/Showroom Access/g, 'Customer Portal');
            newContent = newContent.replace(/Global Showrooms/g, 'Global Clients');
            newContent = newContent.replace(/Showroom Partners/g, 'Featured In');
        }
        
        if (newContent !== content) {
            fs.writeFileSync(targetPath, newContent, 'utf8');
            console.log(`Updated: ${targetPath}`);
        }
    }
}

dirsToScan.forEach(dir => processPath(dir));
console.log('Mass replace complete.');
