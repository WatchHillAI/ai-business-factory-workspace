const { Client } = require('pg');
const AWS = require('aws-sdk');

const secretsManager = new AWS.SecretsManager();

// Database connection pool
let dbClient = null;

// Initialize database connection
async function initializeDb() {
    if (dbClient) return dbClient;
    
    try {
        // Get database credentials from Secrets Manager
        const secretArn = process.env.DB_SECRET_ARN;
        const secret = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
        const credentials = JSON.parse(secret.SecretString);
        
        // Database connection configuration
        const dbConfig = {
            host: process.env.DB_ENDPOINT,
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'ai_business_factory',
            user: credentials.username,
            password: credentials.password,
            ssl: { rejectUnauthorized: false },
            // Connection pool settings for Lambda
            max: 1, // Single connection for Lambda
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        };
        
        dbClient = new Client(dbConfig);
        await dbClient.connect();
        
        console.log('Database connection established');
        return dbClient;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}

// CRUD Operations
const operations = {
    // CREATE - Save new business idea
    async createIdea(ideaData) {
        const client = await initializeDb();
        
        // Extract key fields for indexing
        const {
            title,
            description,
            tier = 'ai-generated',
            confidence,
            marketSizing
        } = ideaData;
        
        const confidenceOverall = confidence?.overall || 0;
        const marketSizeTam = marketSizing?.tam?.value || 0;
        
        const query = `
            INSERT INTO business_ideas (
                title, 
                description, 
                tier, 
                confidence_overall, 
                market_size_tam, 
                idea_data,
                search_vector
            ) VALUES ($1, $2, $3, $4, $5, $6, to_tsvector('english', $1 || ' ' || $2))
            RETURNING id, created_at, updated_at
        `;
        
        const values = [
            title,
            description,
            tier,
            confidenceOverall,
            marketSizeTam * (marketSizing?.tam?.unit === 'billion' ? 1000000000 : 1000000),
            JSON.stringify(ideaData)
        ];
        
        const result = await client.query(query, values);
        return {
            id: result.rows[0].id,
            ...ideaData,
            created_at: result.rows[0].created_at,
            updated_at: result.rows[0].updated_at
        };
    },
    
    // READ - Get business idea by ID
    async getIdea(ideaId) {
        const client = await initializeDb();
        
        const query = `
            SELECT 
                id,
                title,
                description,
                tier,
                confidence_overall,
                market_size_tam,
                idea_data,
                created_at,
                updated_at,
                data_freshness
            FROM business_ideas 
            WHERE id = $1
        `;
        
        const result = await client.query(query, [ideaId]);
        
        if (result.rows.length === 0) {
            throw new Error('Idea not found');
        }
        
        const row = result.rows[0];
        return {
            id: row.id,
            ...row.idea_data,
            created_at: row.created_at,
            updated_at: row.updated_at,
            data_freshness: row.data_freshness
        };
    },
    
    // READ - List all business ideas with pagination and filtering
    async listIdeas(options = {}) {
        const client = await initializeDb();
        
        const {
            limit = 20,
            offset = 0,
            tier,
            minConfidence,
            searchQuery,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;
        
        let whereClause = 'WHERE 1=1';
        let queryParams = [];
        let paramCount = 0;
        
        // Add filters
        if (tier) {
            paramCount++;
            whereClause += ` AND tier = $${paramCount}`;
            queryParams.push(tier);
        }
        
        if (minConfidence) {
            paramCount++;
            whereClause += ` AND confidence_overall >= $${paramCount}`;
            queryParams.push(minConfidence);
        }
        
        if (searchQuery) {
            paramCount++;
            whereClause += ` AND search_vector @@ to_tsquery('english', $${paramCount})`;
            queryParams.push(searchQuery.replace(/\s+/g, ' & '));
        }
        
        // Validate sort parameters
        const allowedSortFields = ['created_at', 'updated_at', 'confidence_overall', 'market_size_tam', 'title'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        const query = `
            SELECT 
                id,
                title,
                description,
                tier,
                confidence_overall,
                market_size_tam,
                created_at,
                updated_at,
                -- Extract key metadata for list view
                idea_data->'confidence'->>'overall' as confidence_score,
                idea_data->'marketSizing'->'tam'->>'value' as tam_value,
                idea_data->'tags' as tags,
                idea_data->'industry' as industry
            FROM business_ideas 
            ${whereClause}
            ORDER BY ${sortField} ${sortDirection}
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;
        
        queryParams.push(limit, offset);
        
        const result = await client.query(query, queryParams);
        
        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) FROM business_ideas ${whereClause}`;
        const countResult = await client.query(countQuery, queryParams.slice(0, -2));
        
        return {
            ideas: result.rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description,
                tier: row.tier,
                confidence_overall: row.confidence_overall,
                market_size_tam: row.market_size_tam,
                created_at: row.created_at,
                updated_at: row.updated_at,
                tags: row.tags,
                industry: row.industry
            })),
            pagination: {
                total: parseInt(countResult.rows[0].count),
                limit,
                offset,
                hasMore: parseInt(countResult.rows[0].count) > offset + limit
            }
        };
    },
    
    // UPDATE - Update existing business idea
    async updateIdea(ideaId, updateData) {
        const client = await initializeDb();
        
        // Extract key fields for indexing if they're being updated
        const updates = {};
        const params = [];
        let paramCount = 0;
        
        if (updateData.title) {
            paramCount++;
            updates.title = `title = $${paramCount}`;
            params.push(updateData.title);
        }
        
        if (updateData.description) {
            paramCount++;
            updates.description = `description = $${paramCount}`;
            params.push(updateData.description);
        }
        
        if (updateData.confidence?.overall !== undefined) {
            paramCount++;
            updates.confidence_overall = `confidence_overall = $${paramCount}`;
            params.push(updateData.confidence.overall);
        }
        
        if (updateData.marketSizing?.tam?.value) {
            paramCount++;
            updates.market_size_tam = `market_size_tam = $${paramCount}`;
            const value = updateData.marketSizing.tam.value;
            const multiplier = updateData.marketSizing.tam.unit === 'billion' ? 1000000000 : 1000000;
            params.push(value * multiplier);
        }
        
        // Always update the full idea_data and updated_at
        paramCount++;
        const ideaDataParam = `idea_data = $${paramCount}`;
        params.push(JSON.stringify(updateData));
        
        paramCount++;
        const updatedAtParam = `updated_at = $${paramCount}`;
        params.push(new Date().toISOString());
        
        // Update search vector if title or description changed
        let searchVectorUpdate = '';
        if (updateData.title || updateData.description) {
            paramCount++;
            searchVectorUpdate = `, search_vector = to_tsvector('english', $${paramCount})`;
            const searchText = `${updateData.title || ''} ${updateData.description || ''}`.trim();
            params.push(searchText);
        }
        
        const setClause = Object.values(updates).concat([ideaDataParam, updatedAtParam]).join(', ');
        
        paramCount++;
        params.push(ideaId);
        
        const query = `
            UPDATE business_ideas 
            SET ${setClause}${searchVectorUpdate}
            WHERE id = $${paramCount}
            RETURNING id, updated_at
        `;
        
        const result = await client.query(query, params);
        
        if (result.rows.length === 0) {
            throw new Error('Idea not found');
        }
        
        // Return the updated idea
        return await operations.getIdea(ideaId);
    },
    
    // DELETE - Delete business idea
    async deleteIdea(ideaId) {
        const client = await initializeDb();
        
        const query = `
            DELETE FROM business_ideas 
            WHERE id = $1
            RETURNING id, title
        `;
        
        const result = await client.query(query, [ideaId]);
        
        if (result.rows.length === 0) {
            throw new Error('Idea not found');
        }
        
        return {
            id: result.rows[0].id,
            title: result.rows[0].title,
            deleted: true
        };
    }
};

// Lambda handler
exports.handler = async (event) => {
    console.log('Business Ideas CRUD API called:', JSON.stringify(event, null, 2));
    
    try {
        const { httpMethod, pathParameters, queryStringParameters, body } = event;
        const ideaId = pathParameters?.id;
        
        let response;
        
        switch (httpMethod) {
            case 'POST':
                // Create new idea
                const ideaData = JSON.parse(body);
                response = await operations.createIdea(ideaData);
                return {
                    statusCode: 201,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                    },
                    body: JSON.stringify(response)
                };
                
            case 'GET':
                if (ideaId) {
                    // Get specific idea
                    response = await operations.getIdea(ideaId);
                } else {
                    // List ideas with filters
                    const options = {
                        limit: parseInt(queryStringParameters?.limit) || 20,
                        offset: parseInt(queryStringParameters?.offset) || 0,
                        tier: queryStringParameters?.tier,
                        minConfidence: parseInt(queryStringParameters?.minConfidence),
                        searchQuery: queryStringParameters?.search,
                        sortBy: queryStringParameters?.sortBy,
                        sortOrder: queryStringParameters?.sortOrder
                    };
                    response = await operations.listIdeas(options);
                }
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                    },
                    body: JSON.stringify(response)
                };
                
            case 'PUT':
                // Update existing idea
                if (!ideaId) {
                    throw new Error('Idea ID required for update');
                }
                const updateData = JSON.parse(body);
                response = await operations.updateIdea(ideaId, updateData);
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                    },
                    body: JSON.stringify(response)
                };
                
            case 'DELETE':
                // Delete idea
                if (!ideaId) {
                    throw new Error('Idea ID required for deletion');
                }
                response = await operations.deleteIdea(ideaId);
                
                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                    },
                    body: JSON.stringify(response)
                };
                
            case 'OPTIONS':
                // CORS preflight
                return {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                    },
                    body: ''
                };
                
            default:
                throw new Error(`Unsupported HTTP method: ${httpMethod}`);
        }
        
    } catch (error) {
        console.error('CRUD operation failed:', error);
        
        return {
            statusCode: error.message.includes('not found') ? 404 : 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: error.message,
                type: 'BusinessIdeasCrudError'
            })
        };
    } finally {
        // Lambda will handle connection cleanup
    }
};