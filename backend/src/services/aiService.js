/**
 * JSDoc: AIService - Communication bridge with Python AI microservice and LLM inference providers
 * @module services/aiService
 */
const axios = require('axios');

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'llama3.1-70b';
const CEREBRAS_BASE_URL = process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1';
const CACHE_TTL = 300;

let redisClient = null;
try {
  const Redis = require('ioredis');
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  redisClient.on('error', () => {
    // Redis is optional (AI cache only). Swallow connection errors gracefully.
  });
} catch (e) {
  console.warn('Redis not available, caching disabled');
}

async function getCached(key) {
  if (!redisClient) return null;
  try {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function setCache(key, data, ttl = CACHE_TTL) {
  if (!redisClient) return;
  try {
    await redisClient.setex(key, ttl, JSON.stringify(data));
  } catch {
  }
}

async function callCerebras(messages, options = {}) {
  if (!CEREBRAS_API_KEY) {
    console.warn('CEREBRAS_API_KEY not set, AI service unavailable');
    return null;
  }

  try {
    const response = await axios.post(
      `${CEREBRAS_BASE_URL}/chat/completions`,
      {
        model: CEREBRAS_MODEL,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2000,
        stream: false,
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
        },
      }
    );
    return response.data.choices?.[0]?.message?.content;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.warn('Cerebras API unreachable');
      return null;
    }
    if (err.response) {
      console.error('Cerebras API error:', err.response.status, err.response.data);
    } else {
      console.error('Cerebras API error:', err.message);
    }
    return null;
  }
}

function buildSystemPrompt(context) {
  return `You are an AI assistant for a garment manufacturing factory management system. 
You have access to real-time production data and provide actionable insights.

Context: ${context}

Provide concise, data-driven recommendations. Focus on:
- Production efficiency optimization
- Quality control improvements  
- Machine maintenance prioritization
- Inventory management
- Workforce scheduling
- Order delivery risk mitigation

Format responses as structured JSON when possible.`;
}

async function getPrediction(type, data) {
  const cacheKey = `ai:${type}:${JSON.stringify(data)}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  // Try local Python ML service first
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/predict`, {
      type,
      data
    }, { timeout: 4000 });

    if (response.data && response.data.success) {
      const resultObj = response.data.result;
      const resultStr = typeof resultObj === 'string' ? resultObj : JSON.stringify(resultObj);
      await setCache(cacheKey, resultStr);
      return resultStr;
    }
  } catch (e) {
    console.warn(`Local AI Service failed/unavailable for prediction type '${type}', falling back to Cloud LLM:`, e.message);
  }

  const context = `Factory data for ${type} prediction: ${JSON.stringify(data)}`;
  const systemPrompt = buildSystemPrompt(context);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analyze this ${type} data and provide a prediction with confidence level and key factors. Return JSON format: { prediction: string, confidence: number, factors: string[], recommendation: string }` },
  ];

  const result = await callCerebras(messages);
  if (result) {
    await setCache(cacheKey, result);
  }
  return result;
}

async function getDelayPrediction(orderData) {
  return getPrediction('delay', orderData);
}

async function getPerformanceAnalysis(employeeData) {
  const cacheKey = `ai:performance:${JSON.stringify(employeeData)}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  // Try local Python ML service first
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/predict`, {
      type: 'performance',
      data: employeeData
    }, { timeout: 4000 });

    if (response.data && response.data.success) {
      const resultObj = response.data.result;
      const resultStr = typeof resultObj === 'string' ? resultObj : JSON.stringify(resultObj);
      await setCache(cacheKey, resultStr);
      return resultStr;
    }
  } catch (e) {
    console.warn('Local AI Service failed/unavailable for performance analysis, falling back to Cloud LLM:', e.message);
  }

  const context = `Employee performance data: ${JSON.stringify(employeeData)}`;
  const systemPrompt = buildSystemPrompt(context);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Analyze employee performance metrics and provide insights on productivity, quality, attendance, and improvement areas. Return JSON format.' },
  ];

  const result = await callCerebras(messages);
  if (result) await setCache(cacheKey, result);
  return result;
}

async function getFailurePrediction(machineData) {
  return getPrediction('failure', machineData);
}

async function getRecommendations(resourceData) {
  const cacheKey = `ai:recommendations:${JSON.stringify(resourceData)}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  // Try local Python ML service first
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/recommendations`, resourceData, { timeout: 4000 });
    if (response.data && response.data.success) {
      const resultObj = response.data.result;
      const resultStr = typeof resultObj === 'string' ? resultObj : JSON.stringify(resultObj);
      await setCache(cacheKey, resultStr);
      return resultStr;
    }
  } catch (e) {
    console.warn('Local AI Service failed/unavailable for recommendations, falling back to Cloud LLM:', e.message);
  }

  const context = `Factory resource snapshot: ${JSON.stringify(resourceData)}`;
  const systemPrompt = buildSystemPrompt(context);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Based on current factory state, provide 3-5 prioritized actionable recommendations. Each should have: category, severity (critical/warning/info), title, description, action, link. Return as JSON array.' },
  ];

  const result = await callCerebras(messages);
  if (result) await setCache(cacheKey, result);
  return result;
}

async function getDashboardData() {
  const cached = await getCached('ai:dashboard');
  if (cached) return cached;

  // Try local Python ML service first
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/dashboard`, { timeout: 4000 });
    if (response.data && response.data.success) {
      const resultObj = response.data.result;
      const resultStr = typeof resultObj === 'string' ? resultObj : JSON.stringify(resultObj);
      await setCache('ai:dashboard', resultStr, 60);
      return resultStr;
    }
  } catch (e) {
    console.warn('Local AI Service failed/unavailable for dashboard summary, falling back to Cloud LLM:', e.message);
  }

  const systemPrompt = buildSystemPrompt('Factory dashboard summary request');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Provide an executive summary of factory health including key metrics, risks, and top 3 priorities. Return JSON format: { summary: string, healthScore: number, topRisks: string[], priorities: string[] }' },
  ];

  const result = await callCerebras(messages);
  if (result) await setCache('ai:dashboard', result, 60);
  return result;
}

async function getModelStatus() {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/model-status`, { timeout: 2000 });
    if (response.data && response.data.success) {
      return {
        ...response.data.result,
        provider: 'local-ml-service',
        lastUpdated: new Date().toISOString(),
      };
    }
  } catch (e) {
    // Ignore error and fall back to default Cloud LLM status
  }

  return {
    status: 'active',
    model: CEREBRAS_MODEL,
    provider: 'cerebras',
    lastUpdated: new Date().toISOString(),
  };
}

module.exports = {
  getPrediction,
  getDelayPrediction,
  getPerformanceAnalysis,
  getFailurePrediction,
  getRecommendations,
  getDashboardData,
  getModelStatus,
};