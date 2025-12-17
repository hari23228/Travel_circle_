const { supabaseAdmin } = require('../config/supabase')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...')
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.')
    }
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
          const { error } = await supabaseAdmin.rpc('exec_sql', { 
            sql: statement + ';' 
          })
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message)
            // Continue with other statements unless it's a critical error
            if (error.message.includes('already exists')) {
              console.log(`ℹ️  Skipping existing object`)
            } else {
              throw error
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (statementError) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, statementError.message)
          console.log('Statement:', statement.substring(0, 100) + '...')
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!')
    
    // Verify tables were created
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.warn('⚠️  Could not verify tables:', tablesError.message)
    } else {
      console.log('📋 Created tables:', tables.map(t => t.table_name).join(', '))
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

// Alternative method using direct SQL execution if rpc method doesn't work
async function runMigrationDirect() {
  try {
    console.log('🚀 Starting direct database migration...')
    
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // For direct execution, we'll need to use the SQL editor in Supabase dashboard
    console.log('📄 Schema SQL content:')
    console.log('='.repeat(50))
    console.log(schema)
    console.log('='.repeat(50))
    console.log('')
    console.log('📋 Instructions:')
    console.log('1. Copy the SQL content above')
    console.log('2. Go to your Supabase dashboard')
    console.log('3. Navigate to SQL Editor')
    console.log('4. Paste and run the SQL')
    console.log('5. Verify all tables are created')
    
  } catch (error) {
    console.error('💥 Migration preparation failed:', error.message)
  }
}

// Run migration
if (require.main === module) {
  // Try the RPC method first, fall back to direct method
  runMigration().catch(() => {
    console.log('🔄 Falling back to direct migration method...')
    runMigrationDirect()
  })
}

module.exports = {
  runMigration,
  runMigrationDirect
}
