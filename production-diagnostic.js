#!/usr/bin/env node

/**
 * Production Diagnostic Tool
 * Run this script to check if your environment is configured correctly
 * Usage: node production-diagnostic.js
 */

console.log('🔍 Memory Capsule Production Diagnostic\n');
console.log('⚠️  If admin is not working, visit these URLs after deployment:');
console.log('   📊 Debug info: https://your-domain.com/api/debug');
console.log('   🏥 Health check: https://your-domain.com/api/health');
console.log('   🔧 Admin check: https://your-domain.com/api/admin-check\n');

// Check Node.js version
console.log(`📍 Node.js Version: ${process.version}`);
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}\n`);

// Critical environment variables
const requiredVars = [
  'DATABASE_URI',
  'PAYLOAD_SECRET',
  'NEXT_PUBLIC_APP_URL'
];

const optionalVars = [
  'STRIPE_SECRET_KEY',
  'RESEND_API_KEY',
  'FROM_EMAIL',
  'MEDIA_DIR'
];

console.log('🔐 Environment Variables Check:');
console.log('================================');

let hasErrors = false;

// Check required variables
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName === 'PAYLOAD_SECRET' ? '[HIDDEN]' : value.substring(0, 20) + '...') : 'NOT SET';
  console.log(`${status} ${varName}: ${display}`);
  
  if (!value) {
    hasErrors = true;
  }
});

console.log('\n📋 Optional Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️ ';
  const display = value ? (varName.includes('SECRET') || varName.includes('KEY') ? '[HIDDEN]' : value.substring(0, 20) + '...') : 'NOT SET';
  console.log(`${status} ${varName}: ${display}`);
});

// Test database connection
console.log('\n🗄️  Database Connection Test:');
console.log('==============================');

if (process.env.DATABASE_URI) {
  try {
    const mongoose = require('mongoose');
    
    console.log('⏳ Testing database connection...');
    
    mongoose.connect(process.env.DATABASE_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).then(() => {
      console.log('✅ Database connection successful!');
      
      // Test basic collection access
      mongoose.connection.db.listCollections().toArray().then(collections => {
        console.log(`✅ Collections found: ${collections.length}`);
        collections.forEach(col => {
          console.log(`   - ${col.name}`);
        });
        mongoose.disconnect();
      }).catch(err => {
        console.log('⚠️  Could not list collections:', err.message);
        mongoose.disconnect();
      });
      
    }).catch(err => {
      console.log('❌ Database connection failed:', err.message);
      hasErrors = true;
    });
    
  } catch (err) {
    console.log('❌ Database test error:', err.message);
    hasErrors = true;
  }
} else {
  console.log('❌ DATABASE_URI not set, skipping connection test');
  hasErrors = true;
}

// Check file system permissions
console.log('\n📁 File System Check:');
console.log('======================');

const fs = require('fs');
const path = require('path');

const mediaDir = process.env.MEDIA_DIR || './media';
console.log(`📍 Media directory: ${mediaDir}`);

try {
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
    console.log('✅ Media directory created');
  } else {
    console.log('✅ Media directory exists');
  }
  
  // Test write permissions
  const testFile = path.join(mediaDir, 'test-write.txt');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✅ File write permissions OK');
  
} catch (err) {
  console.log('❌ File system error:', err.message);
  hasErrors = true;
}

// Summary
console.log('\n📊 Diagnostic Summary:');
console.log('======================');

if (hasErrors) {
  console.log('❌ Configuration issues detected!');
  console.log('\n🔧 Quick fixes:');
  console.log('1. Set all required environment variables');
  console.log('2. Ensure DATABASE_URI points to accessible MongoDB');
  console.log('3. Set PAYLOAD_SECRET to a secure random string');
  console.log('4. Set NEXT_PUBLIC_APP_URL to your domain');
  console.log('5. Ensure file system permissions for media uploads');
} else {
  console.log('✅ All critical checks passed!');
  console.log('Your production environment should be ready.');
}

console.log('\n🚀 If issues persist, check your deployment platform logs.');

// Exit with appropriate code
process.exit(hasErrors ? 1 : 0); 