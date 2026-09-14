// Subscription & token service (mock-first). When USE_MOCK=false it will hit real API endpoints.
import { http, USE_MOCK } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'subscriptionService');
// Provides: getSubscriptionPlans, getUserSubscription, initiatePurchaseSession
// Also: getTokenPacks, initiateTokenPurchase

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

let mockUserSubscription = null; // { planId, scope: { grade?, chapter? }, expiry }

// Temporarily force mock mode for subscriptions/tokens until backend routes are ready
const FORCE_MOCK = true;

export async function getSubscriptionPlans() {
  // Try real API first
  try {
    const response = await http.get('/v1/subscription-plans');
    const plans = response.data?.data || response.data || [];
    
    // Transform backend data to match frontend expected format
    return plans.map(plan => ({
      id: plan.id,
      title: plan.name,
      slug: plan.slug,
      price: parseFloat(plan.price),
      description: plan.description || '',
      billingPeriod: 'annual', // Default for now
      tokenBenefit: `+${plan.token_quota} توکن`,
      features: [
        `${plan.token_quota} توکن`,
        `دسترسی ${plan.duration_days} روزه`,
        plan.description || '',
      ].filter(Boolean),
      cta: 'خرید و ادامه',
      isFeatured: plan.slug === 'golden',
      popular: plan.slug === 'golden',
    }));
  } catch (error) {
    console.error('Failed to fetch subscription plans from API:', error);
  }
  
  // Fall back to mock if API fails
  if (USE_MOCK || FORCE_MOCK) {
    await delay(400);
    // Return mock data
    return [
      {
        id: 'grade',
        title: 'اشتراک پایه',
        price: 150000,
        billingPeriod: 'annual',
        description: 'دسترسی کامل به محتوای یک پایه',
        features: ['بانک سوالات کامل پایه', 'جزوات و فیلم‌های آموزشی', 'نمونه سوالات امتحانی'],
        cta: 'انتخاب پایه',
        isFeatured: false,
        tokenBenefit: '+۲۰۰ توکن هدیه',
        originalPrice: 190000,
        savingsPercent: 21,
        tagline: 'شروع مسیر موفقیت با یک پایه',
        badgeLabel: 'مناسب شروع',
        highlightColor: '#0d6efd20',
        valueScore: 70,
      },
      {
        id: 'golden',
        title: 'اشتراک طلایی',
        price: 350000,
        billingPeriod: 'annual',
        description: 'دسترسی کامل به تمام محتوای سایت',
        features: ['تمام ویژگی‌های اشتراک پایه', 'دسترسی به محتوای هر سه پایه', 'پشتیبانی ویژه و اولویت‌دار'],
        cta: 'خرید و ادامه',
        isFeatured: true,
        tokenBenefit: '+۱۰۰۰ توکن هدیه',
        originalPrice: 480000,
        savingsPercent: 27,
        tagline: 'بیشترین محتوا + بیشترین توکن هدیه',
        badgeLabel: 'محبوب ترین',
        highlightColor: '#ffc10733',
        valueScore: 95,
        popular: true,
      },
      {
        id: 'chapter',
        title: 'اشتراک فصلی',
        price: 50000,
        billingPeriod: 'scoped',
        description: 'دسترسی کامل به محتوای یک فصل',
        features: ['بانک سوالات فصل انتخابی', 'جزوات و فیلم‌های آموزشی فصل', 'نمونه سوالات مرتبط با فصل'],
        cta: 'انتخاب فصل',
        isFeatured: false,
        tokenBenefit: '+۵۰ توکن هدیه',
        originalPrice: 65000,
        savingsPercent: 23,
        tagline: 'بهینه برای مرور سریع یا آزمون نزدیک',
        badgeLabel: 'متمرکز',
        highlightColor: '#20c99722',
        valueScore: 50,
      },
    ];
  }
}

export async function getUserSubscription() {
  if (!USE_MOCK && !FORCE_MOCK) {
    const { data } = await http.get('/subscriptions/me');
    return data; // expect null or subscription object
  }
  await delay(250);
  return mockUserSubscription; // can be null
}

/**
 * Get all active subscriptions for the current user
 * @returns {Promise<Array>} - Array of active subscriptions
 */
export async function getMySubscriptions() {
  if (!USE_MOCK && !FORCE_MOCK) {
    try {
      const response = await http.get('/v1/me/subscriptions');
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      return [];
    }
  }
  await delay(350);
  // Mock data for development - return array of subscriptions
  return mockUserSubscription ? [mockUserSubscription] : [];
}

export async function initiatePurchaseSession({ planId, scope }) {
  if (!USE_MOCK && !FORCE_MOCK) {
    const { data } = await http.post('/subscriptions/checkout', { planId, scope });
    return data; // expect { sessionId, redirectUrl }
  }
  await delay(500);
  const sessionId = 'sess_' + Math.random().toString(36).slice(2, 10);
  return { sessionId, redirectUrl: `/checkout?plan=${planId}` + (scope?.grade ? `&grade=${scope.grade}` : '') + (scope?.chapter ? `&chapter=${scope.chapter}` : '') };
}

// --- Token Packs ---
export async function getTokenPacks() {
  // Always try real API first for token packages
  try {
    const response = await http.get('/v1/token-packages');
    const packages = response.data?.data || response.data || [];
    
    // Transform backend data to match frontend expected format
    return packages.map(pkg => ({
      id: pkg.id.toString(),
      tokens: pkg.tokens,
      price: pkg.price,
      title: pkg.title,
      bonus: pkg.bonus || 0,
      popular: pkg.popular || false,
      bestValue: pkg.best_value || false,
    }));
  } catch (error) {
    console.error('Failed to fetch token packs from API:', error);
    
    // Fall back to mock data if API fails
    if (USE_MOCK || FORCE_MOCK) {
      await delay(300);
      // id: machine id, tokens: count, price: in tomans, bonus: extra tokens
      return [
        { id: 'tp100', tokens: 100, price: 30000, bonus: 0, popular: false, badgeLabel: 'شروع' },
        { id: 'tp250', tokens: 250, price: 65000, bonus: 25, popular: false },
        { id: 'tp500', tokens: 500, price: 120000, bonus: 80, popular: true },
        { id: 'tp1000', tokens: 1000, price: 220000, bonus: 220, popular: false, bestValue: true },
      ];
    }
    throw error;
  }
}

export async function initiateTokenPurchase(packId) {
  if (!USE_MOCK && !FORCE_MOCK) {
    const { data } = await http.post('/tokens/checkout', { packId });
    return data; // expect { sessionId, redirectUrl }
  }
  await delay(400);
  const sessionId = 'sess_' + Math.random().toString(36).slice(2, 10);
  return { sessionId, redirectUrl: `/checkout?tokenPack=${packId}` };
}

// For tests or demo we allow setting a mock subscription after returning from checkout.
export function __setMockSubscription(sub) {
  mockUserSubscription = sub;
}

/**
 * Create order and complete free checkout (no payment gateway)
 * @param {number|string} planId - Subscription plan ID
 * @param {string} [couponCode] - Optional discount code
 * @returns {Promise<Object>} - Order details
 */
export async function createFreeCheckout(planId, couponCode = null) {
  try {
    const payload = {
      plan_id: planId,
      qty: 1,
    };
    
    if (couponCode) {
      payload.coupon_code = couponCode;
    }
    
    const response = await http.post('/v1/checkout/free', payload);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Free checkout failed:', error);
    throw error;
  }
}
