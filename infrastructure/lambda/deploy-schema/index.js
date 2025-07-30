const { Client } = require('pg');
const AWS = require('aws-sdk');
const fs = require('fs').promises;

const secretsManager = new AWS.SecretsManager();

// SQL schema as a string (will be bundled with Lambda)
const SCHEMA_SQL = `
-- Business Ideas Schema for PostgreSQL with JSONB
-- See full schema in infrastructure/database/schemas/business_ideas_schema.sql
`;

exports.handler = async (event) => {
    console.log('Starting database schema deployment...');
    
    let client;
    
    try {
        // Get database credentials from Secrets Manager
        const secretArn = process.env.DB_SECRET_ARN || event.secretArn;
        const secret = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
        const credentials = JSON.parse(secret.SecretString);
        
        // Database connection configuration
        const dbConfig = {
            host: process.env.DB_ENDPOINT || event.dbEndpoint,
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'ai_business_factory',
            user: credentials.username || 'postgres',
            password: credentials.password,
            ssl: { rejectUnauthorized: false }
        };
        
        console.log(`Connecting to database at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        
        // Connect to database
        client = new Client(dbConfig);
        await client.connect();
        
        console.log('Connected to database successfully');
        
        // Test connection
        const versionResult = await client.query('SELECT version()');
        console.log('Database version:', versionResult.rows[0].version);
        
        // Check if schema already exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'business_ideas'
            );
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('Schema already exists, skipping deployment');
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Schema already exists',
                    status: 'skipped'
                })
            };
        }
        
        // Read the actual schema file (bundled with Lambda)
        const schemaContent = await fs.readFile('./business_ideas_schema.sql', 'utf8');
        
        // Deploy schema
        console.log('Deploying business ideas schema...');
        await client.query(schemaContent);
        
        // Verify deployment
        const verifyResult = await client.query(`
            SELECT COUNT(*) as table_count 
            FROM information_schema.tables 
            WHERE table_name IN ('business_ideas', 'users');
        `);
        
        const indexResult = await client.query(`
            SELECT COUNT(*) as index_count 
            FROM pg_indexes 
            WHERE tablename = 'business_ideas';
        `);
        
        console.log(`Deployment complete: ${verifyResult.rows[0].table_count} tables, ${indexResult.rows[0].index_count} indexes`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Schema deployed successfully',
                status: 'success',
                tables: verifyResult.rows[0].table_count,
                indexes: indexResult.rows[0].index_count
            })
        };
        
    } catch (error) {
        console.error('Schema deployment failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Schema deployment failed',
                error: error.message
            })
        };
    } finally {
        if (client) {
            await client.end();
        }
    }
};