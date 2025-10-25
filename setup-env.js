#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 NARPit Dashboard Environment Setup');
console.log('=====================================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# TBA API Key - Get from https://www.thebluealliance.com/account
TBA_API_KEY=YOUR_TBA_API_KEY_HERE

# Example event keys for testing:
# 2025galileo (Galileo Division)
# 2025newton (Newton Division)
# 2025einstein (Einstein Field)
# 2025hop (Hopper Division)
# 2025tesla (Tesla Division)
# 2025turing (Turing Division)
# 2025carver (Carver Division)
# 2025roebling (Roebling Division)
# 2025archimedes (Archimedes Division)
# 2025curie (Curie Division)
# 2025daly (Daly Division)
# 2025hopper (Hopper Division)
# 2025johnson (Johnson Division)
# 2025milstein (Milstein Division)
# 2025washington (Washington Division)
# 2025wilson (Wilson Division)

# Popular team numbers for testing:
# 3128 (Aluminum Narwhals)
# 254 (The Cheesy Poofs)
# 118 (Robonauts)
# 1678 (Citrus Circuits)
# 148 (Robowranglers)
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
} else {
  console.log('✅ .env.local file already exists');
}

// Check if data directory exists
const dataPath = path.join(__dirname, 'data');
const dataExists = fs.existsSync(dataPath);

if (!dataExists) {
  console.log('📁 Creating data directory...');
  fs.mkdirSync(dataPath);
  console.log('✅ Created data directory');
} else {
  console.log('✅ Data directory already exists');
}

// Create initial batteries.json if it doesn't exist
const batteriesPath = path.join(dataPath, 'batteries.json');
if (!fs.existsSync(batteriesPath)) {
  console.log('🔋 Creating initial batteries.json...');
  fs.writeFileSync(batteriesPath, '[]');
  console.log('✅ Created batteries.json');
} else {
  console.log('✅ batteries.json already exists');
}

console.log('\n🎯 Next Steps:');
console.log('1. Get your TBA API key from https://www.thebluealliance.com/account');
console.log('2. Update .env.local with your actual API key');
console.log('3. Run: npm run dev');
console.log('4. Navigate to: http://localhost:3000/NARPIT');
console.log('5. Follow the TESTING_GUIDE.md for detailed testing instructions');

console.log('\n📚 Testing Guide:');
console.log('- Read TESTING_GUIDE.md for comprehensive testing instructions');
console.log('- Use event keys like 2025galileo, 2025newton, etc.');
console.log('- Use team numbers like 3128, 254, 118, etc.');

console.log('\n🚀 Ready to test!');
