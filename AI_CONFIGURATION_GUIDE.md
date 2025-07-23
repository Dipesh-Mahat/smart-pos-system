# AI Business Intelligence Configuration Guide

## Overview
The Smart POS system includes comprehensive AI-powered business intelligence using **Google Gemini API** - perfect for college projects with generous free tier limits and excellent performance for Nepal-focused business analytics.

## Google Gemini API Configuration

### Free Tier Benefits (Perfect for College Projects)
- **Gemini 2.0 Flash**: 15 RPM, 1,000,000 TPM (Tokens Per Minute)
- **Gemini 2.5 Flash**: 10 RPM, 250,000 TPM
- **No billing required** for free tier
- **No credit card needed** for getting started
- Great rate limits for development and testing

### Getting Started with Gemini
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your backend `.env` file

### Environment Configuration
```bash
# Backend environment variables (.env file)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7
```

### Why Gemini for College Projects?
- **Completely FREE** for development and testing
- **High rate limits** - perfect for small business POS systems
- **Latest AI technology** from Google
- **Easy integration** with simple REST API
- **Nepal-friendly** - works well with local business context
- **No billing setup required** unlike OpenAI

## Environment Setup

### Complete .env Configuration
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/smart_pos

# JWT Security
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
GEMINI_MAX_TOKENS=1000
GEMINI_TEMPERATURE=0.7

# AI Settings
AI_ENABLED=true
AI_CACHE_DURATION=3600
AI_MAX_RETRIES=3
AI_TIMEOUT=30000

# Rate Limiting for AI endpoints (generous for free tier)
AI_RATE_LIMIT_REQUESTS=50
AI_RATE_LIMIT_WINDOW_MS=900000

# File Upload
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Fallback Configuration (No AI Key Required)
When no Gemini API key is provided, the system automatically uses intelligent rule-based fallback recommendations:
- Smart inventory insights based on sales patterns
- Trend analysis using historical data
- Nepal-specific business recommendations
- Festival-aware suggestions

## AI Features Overview

### 1. Sales Prediction
- **Purpose**: Forecast future sales trends
- **Data Used**: Historical orders, seasonal patterns, festival calendar
- **Output**: Revenue predictions, peak sales periods, growth insights
- **Business Value**: Better cash flow planning, staff scheduling

### 2. Inventory Optimization
- **Purpose**: Optimize stock levels and reduce waste
- **Data Used**: Current inventory, sales velocity, supplier data
- **Output**: Reorder recommendations, slow-moving item alerts
- **Business Value**: Reduced carrying costs, prevented stockouts

### 3. Product Performance Analysis
- **Purpose**: Identify bestsellers and underperformers
- **Data Used**: Sales data, profit margins, customer preferences
- **Output**: Product rankings, pricing recommendations
- **Business Value**: Focus on profitable items, optimize product mix

### 4. Customer Behavior Analysis
- **Purpose**: Understand customer purchasing patterns
- **Data Used**: Transaction history, order frequencies, basket analysis
- **Output**: Customer segments, loyalty insights, upselling opportunities
- **Business Value**: Improved customer service, targeted marketing

### 5. Festival Preparation Intelligence
- **Purpose**: Prepare for Nepali festivals and cultural events
- **Data Used**: Nepali calendar, historical festival sales, cultural trends
- **Output**: Festival-specific inventory recommendations, timing insights
- **Business Value**: Maximize festival revenue, cultural market advantage

### 6. Pricing Strategy Optimization
- **Purpose**: Optimize pricing for maximum profitability
- **Data Used**: Cost data, competitor analysis, demand patterns
- **Output**: Dynamic pricing recommendations, margin optimization
- **Business Value**: Increased profits, competitive positioning

### 7. Business Insights & Recommendations
- **Purpose**: Comprehensive business intelligence
- **Data Used**: All available business data, market trends
- **Output**: Strategic recommendations, growth opportunities
- **Business Value**: Data-driven decision making, business growth

## Testing the AI System

### 1. Run Comprehensive Tests
```bash
# Navigate to backend directory
cd backend

# Install dependencies if not already done
npm install

# Run AI intelligence tests (without database requirement)
node tests/aiServiceValidation.js

# Run full database tests (requires MongoDB)
node tests/aiBusinessIntelligenceTest.js
```

### 2. Test Gemini API Integration
```bash
# Test Gemini API availability
node -e "
const service = require('./services/aiBusinessIntelligenceService');
console.log('Gemini Available:', service.isGeminiAvailable());
"

# Test data collection
node -e "
const service = require('./services/aiBusinessIntelligenceService');
service.collectBusinessData('your_shop_id').then(console.log);
"
```

### 3. Frontend AI Integration

**API Endpoints:**
```javascript
// Get AI dashboard
GET /api/ai-intelligence/dashboard

// Get specific analysis
GET /api/ai-intelligence/analysis/sales_prediction
GET /api/ai-intelligence/analysis/inventory_optimization

// Get product recommendations
GET /api/ai-intelligence/recommendations/products

// Get sales forecasting
GET /api/ai-intelligence/forecasting/sales

// Get business insights
GET /api/ai-intelligence/insights/inventory
GET /api/ai-intelligence/insights/customers

// Get pricing recommendations
GET /api/ai-intelligence/recommendations/pricing

// Generate business reports
POST /api/ai-intelligence/reports/business
```

**Frontend Usage Example:**
```javascript
// Fetch AI dashboard data
async function getAIDashboard() {
  try {
    const response = await fetch('/api/ai-intelligence/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const aiData = await response.json();
    console.log('AI Insights:', aiData);
    
    if (aiData.success && aiData.aiProvider === 'Gemini') {
      displayGeminiInsights(aiData.insights);
    } else if (aiData.fallbackRecommendations) {
      displayFallbackRecommendations(aiData.fallbackRecommendations);
    }
  } catch (error) {
    console.error('AI Dashboard Error:', error);
  }
}
```

## Performance Optimization

### 1. Gemini API Response Caching
The system automatically caches Gemini responses for 1 hour to optimize the free tier usage and improve performance.

### 2. Data Quality Monitoring
- Continuously monitors data quality
- Provides recommendations for data improvement
- Ensures AI accuracy through quality scoring

### 3. Free Tier Management
- Request limits: 15 requests per minute (Gemini 2.0 Flash)
- Intelligent prompt optimization to maximize token efficiency
- Automatic caching to reduce API calls
- Smart fallback when rate limits are reached

## Troubleshooting

### Common Issues

**1. Gemini API Not Available**
```bash
# Check API key
node -e "console.log('Gemini Key:', process.env.GEMINI_API_KEY ? 'Set' : 'Missing');"

# Test API connectivity
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

**2. Rate Limiting (Free Tier)**
- Gemini 2.0 Flash: 15 requests per minute
- Wait 1 minute between heavy AI usage sessions
- System automatically caches responses to reduce API calls
- Fallback recommendations work without API calls

**3. Low Data Quality**
- Ensure sufficient historical data (minimum 7 days of orders)
- Add more product details and categories
- Complete customer transaction records

### Monitoring Gemini Performance

**1. Check AI Service Health**
```bash
# Test AI service
curl -X GET "http://localhost:5000/api/ai-intelligence/dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**2. Monitor Data Quality**
```javascript
// Frontend data quality check
async function checkDataQuality() {
  const response = await fetch('/api/ai-intelligence/dashboard');
  const data = await response.json();
  console.log('Data Quality:', data.dataQuality);
  console.log('AI Provider:', data.aiProvider); // Should show 'Gemini'
}
```

## Production Deployment

### 1. Environment Variables
Ensure your Gemini API key is set in your production environment:
```bash
# Production environment
GEMINI_API_KEY=your_production_gemini_key
GEMINI_MODEL=gemini-2.0-flash
NODE_ENV=production
```

### 2. API Key Security
- Never commit API keys to version control
- Use environment variables or secure vault systems
- Gemini API keys are free but should still be protected
- Consider using different keys for development and production

### 3. Monitoring
- Monitor Gemini API usage (free tier has generous limits)
- Track data quality scores
- Monitor response times and cache hit rates
- Set up alerts for API failures

## College Project Benefits

### Why Gemini is Perfect for Your College Project:

**✅ Cost-Effective**
- Completely FREE for development and testing
- No billing setup or credit card required
- Generous rate limits for small business simulation

**✅ Easy to Get Started**
- Simple Google account signup
- Instant API key generation
- Clear documentation and examples

**✅ Powerful AI Capabilities**
- Latest Google AI technology
- Excellent performance for business analytics
- Great understanding of Nepal context

**✅ Educational Value**
- Learn modern AI integration techniques
- Understand prompt engineering
- Experience with enterprise-grade APIs

**✅ Project Scalability**
- Free tier supports multiple users
- Can handle realistic business data volumes
- Easy to upgrade if project grows

## Nepal-Specific AI Intelligence

The Gemini AI system is specifically optimized for Nepali small businesses:

### Cultural Intelligence
- Nepali festival calendar integration
- Local market understanding
- Cultural business practices awareness
- Festival shopping pattern analysis

### Local Market Adaptation
- NPR currency formatting
- Local product categories (cosmetics, food, electronics)
- Regional business patterns
- Seasonal demand forecasting

### Language Support
- English language AI responses optimized for Nepal context
- Nepal-specific business terminology
- Cultural context in recommendations
- Local festival and season awareness

## Support and Updates

For questions about Gemini AI configuration or issues:
1. Check the troubleshooting section above
2. Review the test results from `aiServiceValidation.js`
3. Verify Gemini API key is properly set
4. Test with simple API calls first
5. Use fallback mode for development when needed

**College Project Resources:**
- [Google AI Studio](https://aistudio.google.com/) - Get your free API key
- [Gemini API Documentation](https://ai.google.dev/docs) - Complete API reference
- [Rate Limits Guide](https://ai.google.dev/gemini-api/docs/rate-limits) - Understanding free tier limits

The Gemini-powered AI system provides sophisticated business intelligence while remaining completely free for your college project, making it perfect for demonstrating modern POS capabilities with AI-driven insights for Nepal's small business market.
