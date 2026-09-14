// Centralized router with per-route loaders
import React from 'react';
import { createBrowserRouter, defer } from 'react-router-dom';
import { http } from '../api/httpClient';

import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import LoginPage from '../pages/LoginPage';
import BlogPage from '../pages/BlogPage';
import BlogListPage from '../pages/BlogListPage';
import QuestionBankPage from '../pages/QuestionBankPage';
import { fetchQuestions as fetchQuestionsMock, fetchQuestion as fetchQuestionMock } from '../api/questionService';
import SampleQuestionsPage from '../pages/SampleQuestionsPage';
import SubscriptionPageV2 from '../pages/SubscriptionPageV2';
import VideosPage from '../pages/VideosPage';
import HandoutsPage from '../pages/HandoutsPage';
import AdminPage from '../pages/AdminPage';
import AdminGate from './AdminGate';
import SignUpPage from '../pages/SignUpPage';
import CheckoutPage from '../pages/CheckoutPage';
import FaqPage from '../pages/FaqPage';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import ContactPage from '../pages/ContactPage';
import SupportPage from '../pages/SupportPage';
import GuestPage from '../pages/GuestPage';

const parseQuery = (request) => new URL(request.url).searchParams;

const safeFetchJson = async (url, opts) => {
  try {
    // Use axios http client which handles base URL from environment variables
    const response = await http.get(url, opts);
    return response.data;
  } catch (e) {
    // Transform axios error to router-compatible error
    if (e.response) {
      throw new Response(
        JSON.stringify({ 
          message: e.response.data?.message || `Request failed with status ${e.response.status}`,
          preview: JSON.stringify(e.response.data).slice(0, 500)
        }),
        { status: e.response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }
    throw e;
  }
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/home',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignUpPage />,
  },
  {
    path: '/blogs',
    element: <BlogListPage />,
  },
  {
    path: '/blogs/:postId',
    element: <BlogPage />,
  },
  {
    path: '/questions/:questionId?',
    element: <QuestionBankPage />,
    loader: async ({ params, request }) => {
      // Use mock-backed service locally; replace with API when backend is ready
      const q = parseQuery(request);
      const grade = q.get('grade') || '';
      const subject = q.get('subject') || '';
      const { questionId } = params;
      if (questionId) return fetchQuestionMock(questionId);
      const res = await fetchQuestionsMock({ page: 1, pageSize: 25, grade, subject });
      return res;
    },
  },
  {
    path: '/sample-questions',
    element: <SampleQuestionsPage />,
  },
  {
    path: '/subscription',
    element: <SubscriptionPageV2 />,
  },
  // /var/www/app/frontend/src/routes/index.jsx (videos loader)

  {
    path: '/videos/:videoId?',
    element: <VideosPage />,
    loader: async ({ params, request }) => {
      const q = parseQuery(request);

      const gradeId = q.get('grade_id') || q.get('grade') || ''; 

      const videoTypeSlug = 'video';

      const { videoId } = params;

      if (videoId) return safeFetchJson(`/v1/contents/${videoId}`);

      const queryParams = {
        type: videoTypeSlug
      };

      if (gradeId) {
        queryParams.grade_id = gradeId;
      }

      const promise = safeFetchJson(`/v1/contents?${new URLSearchParams(queryParams)}`);

      return defer({ data: promise });
    },
  },
  {
    path: '/handouts/:handoutId?',
    element: <HandoutsPage />,
  },
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/faq',
    element: <FaqPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/guest',
    element: <GuestPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    path: '/support',
    element: <SupportPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/admin',
    element: <AdminGate />,
    children: [
      {
        index: true,
        element: <AdminPage />,
      },
      {
        path: ':tab',
        element: <AdminPage />,
      },
    ],
  },
  {
    path: '*',
    element: <div>یافت نشد</div>,
  },
], {
  future: {
    v7_startTransition: true,
  },
});
