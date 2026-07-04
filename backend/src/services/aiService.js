const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
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

async function callAI(endpoint, data) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}${endpoint}`, data, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.warn('AI service unavailable');
      return null;
    }
    throw err;
  }
}

async function getPrediction(type, data) {
  const cacheKey = `ai:${type}:${JSON.stringify(data)}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const result = await callAI('/api/predict', { type, data });
  if (result) {
    await setCache(cacheKey, result);
  }
  return result;
}

async function getDelayPrediction(orderData) {
  return getPrediction('delay', orderData);
}

async function getPerformanceAnalysis(employeeData) {
  const result = await callAI('/api/analyze', { employees: employeeData });
  if (result) await setCache(`ai:performance:${JSON.stringify(employeeData)}`, result);
  return result;
}

async function getFailurePrediction(machineData) {
  return getPrediction('failure', machineData);
}

async function getRecommendations(resourceData) {
  const result = await callAI('/api/recommendations', resourceData);
  if (result) await setCache(`ai:recommendations:${JSON.stringify(resourceData)}`, result);
  return result;
}

async function getDashboardData() {
  const cached = await getCached('ai:dashboard');
  if (cached) return cached;
  const result = await callAI('/api/dashboard', {});
  if (result) await setCache('ai:dashboard', result, 60);
  return result;
}

async function getModelStatus() {
  return callAI('/api/model-status', {});
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
