// src/data/mockUsers.js
// Helper to create a date for subscription expiry (future or past)
const createExpiryDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

export const MOCK_USERS = {
    // 1. Guest User (Not logged in)
    guest: {
        role: 'guest',
    },

    // 2. Student without a subscription
    student_free: {
        role: 'student',
        name: 'دانش‌آموز',
        avatar: 'https://i.pravatar.cc/40?u=student_free',
        hasSubscription: false,
        tokenCount: 50, // Has a limited number of free tokens
        subscribedItems: [],
    },

    // 3. Student with an active subscription
    student_paid: {
        role: 'student',
        name: 'دانش‌آموز ویژه',
        avatar: 'https://i.pravatar.cc/40?u=student_paid',
        hasSubscription: true,
        subscriptionExpiry: createExpiryDate(25), // Subscription expires in 25 days
        tokenCount: 1500,
        subscribedItems: ['g7c2', 'g8c1', 'g8c3'], // Example of purchased items
    },
    
    // 3.1 Student with subscription expiring soon (badge use-case)
    student_expiring_soon: {
        role: 'student',
        name: 'دانش‌آموز (روبه پایان)',
        avatar: 'https://i.pravatar.cc/40?u=student_expiring',
        hasSubscription: true,
        subscriptionExpiry: createExpiryDate(3), // Expires in 3 days
        tokenCount: 120,
        subscribedItems: ['g7c1'],
    },

    // 3.2 Student with expired subscription (renewal flow)
    student_expired: {
        role: 'student',
        name: 'دانش‌آموز (منقضی شده)',
        avatar: 'https://i.pravatar.cc/40?u=student_expired',
        hasSubscription: false,
        subscriptionExpiry: createExpiryDate(-2), // Expired 2 days ago
        tokenCount: 0,
        subscribedItems: [],
    },
    
    // 4. Teacher User
    teacher: {
        role: 'teacher',
        name: 'استاد رضایی',
        avatar: 'https://i.pravatar.cc/40?u=teacher_rezaei',
        hasSubscription: true, // Teachers likely have full access
        subscriptionExpiry: createExpiryDate(365), // A long-term subscription
        tokenCount: 9999, // Teachers might have unlimited or high token counts
        subscribedItems: ['all'], // A special key indicating full access
    },
    
    // 5. Admin User
    admin: {
        role: 'admin',
        name: 'مدیر سیستم',
        avatar: 'https://i.pravatar.cc/40?u=admin',
        hasSubscription: true,
        subscriptionExpiry: createExpiryDate(180),
        tokenCount: 5000,
        subscribedItems: ['all'],
    },

    // 6. Parent User
    parent: {
        role: 'parent',
        name: 'والد محمدی',
        avatar: 'https://i.pravatar.cc/40?u=parent',
        hasSubscription: false,
        tokenCount: 20,
        subscribedItems: [],
    },

    // 7. Moderator
    moderator: {
        role: 'moderator',
        name: 'ناظر محتوا',
        avatar: 'https://i.pravatar.cc/40?u=moderator',
        hasSubscription: true,
        subscriptionExpiry: createExpiryDate(45),
        tokenCount: 200,
        subscribedItems: ['all'],
    },
};

// Helper to clone a user scenario by key
export const getMockUser = (key = 'guest') => {
    const u = MOCK_USERS[key] || MOCK_USERS.guest;
    return JSON.parse(JSON.stringify(u)); // deep clone to avoid shared refs
};

/*
Usage examples:
import { useUser } from '../context/UserContext';
import { getMockUser } from '../data/mockUsers';

const { setUser } = useUser();
setUser(getMockUser('student_paid'));
setUser(getMockUser('student_expiring_soon'));
setUser(getMockUser('student_expired'));
setUser(getMockUser('teacher'));
setUser(getMockUser('admin'));
*/