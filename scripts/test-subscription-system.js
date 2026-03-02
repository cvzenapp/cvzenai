/**
 * Test script for subscription management system
 * Run with: node scripts/test-subscription-system.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testSubscriptionSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Subscription Management System\n');

    // Test 1: Check if tables exist
    console.log('Test 1: Verifying database tables...');
    const tables = [
      'subscription_plans',
      'company_subscriptions',
      'payment_history',
      'invoices'
    ];

    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      console.log(`  ${result.rows[0].exists ? '✅' : '❌'} ${table}`);
    }

    // Test 2: Check subscription plans
    console.log('\nTest 2: Checking subscription plans...');
    const plansResult = await client.query(
      `SELECT name, display_name, user_type, price_monthly 
       FROM subscription_plans 
       WHERE user_type = 'recruiter' 
       ORDER BY price_monthly`
    );
    
    console.log(`  Found ${plansResult.rows.length} recruiter plans:`);
    plansResult.rows.forEach(plan => {
      const price = (plan.price_monthly / 100).toFixed(2);
      console.log(`  ✅ ${plan.display_name} - ₹${price}/month`);
    });

    // Test 3: Check if functions exist
    console.log('\nTest 3: Verifying database functions...');
    const functions = [
      'is_subscription_active',
      'get_current_usage',
      'generate_invoice_number'
    ];

    for (const func of functions) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM pg_proc 
          WHERE proname = $1
        )`,
        [func]
      );
      console.log(`  ${result.rows[0].exists ? '✅' : '❌'} ${func}()`);
    }

    // Test 4: Test invoice number generation
    console.log('\nTest 4: Testing invoice number generation...');
    try {
      const invoiceNumResult = await client.query('SELECT generate_invoice_number() as invoice_num');
      console.log(`  ✅ Generated invoice number: ${invoiceNumResult.rows[0].invoice_num}`);
    } catch (error) {
      console.log(`  ❌ Failed to generate invoice number: ${error.message}`);
    }

    // Test 5: Check indexes
    console.log('\nTest 5: Verifying indexes...');
    const indexResult = await client.query(
      `SELECT indexname 
       FROM pg_indexes 
       WHERE tablename IN ('company_subscriptions', 'payment_history', 'invoices')
       ORDER BY indexname`
    );
    
    console.log(`  Found ${indexResult.rows.length} indexes:`);
    indexResult.rows.forEach(idx => {
      console.log(`  ✅ ${idx.indexname}`);
    });

    // Test 6: Sample company subscription query
    console.log('\nTest 6: Testing subscription query structure...');
    try {
      const queryResult = await client.query(
        `SELECT cs.id, cs.status, sp.name as plan_name, sp.display_name
         FROM company_subscriptions cs
         JOIN subscription_plans sp ON cs.plan_id = sp.id
         LIMIT 1`
      );
      console.log(`  ✅ Subscription query structure is valid`);
      if (queryResult.rows.length > 0) {
        console.log(`  📊 Sample: ${queryResult.rows[0].display_name} (${queryResult.rows[0].status})`);
      }
    } catch (error) {
      console.log(`  ❌ Query failed: ${error.message}`);
    }

    // Test 7: Payment history query
    console.log('\nTest 7: Testing payment history query structure...');
    try {
      const paymentResult = await client.query(
        `SELECT id, subscription_type, payment_status, amount, currency
         FROM payment_history
         LIMIT 1`
      );
      console.log(`  ✅ Payment history query structure is valid`);
    } catch (error) {
      console.log(`  ❌ Query failed: ${error.message}`);
    }

    // Test 8: Invoice query
    console.log('\nTest 8: Testing invoice query structure...');
    try {
      const invoiceResult = await client.query(
        `SELECT id, invoice_number, status, total_amount, currency
         FROM invoices
         LIMIT 1`
      );
      console.log(`  ✅ Invoice query structure is valid`);
    } catch (error) {
      console.log(`  ❌ Query failed: ${error.message}`);
    }

    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run tests
testSubscriptionSystem()
  .then(() => {
    console.log('\n🎉 Testing complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Testing failed:', error);
    process.exit(1);
  });
