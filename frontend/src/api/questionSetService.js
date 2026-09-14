// questionSetService.js - API service for user's question sets
import { http } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'questionSetService');

/**
 * Get all question sets for the current user
 */
export async function fetchQuestionSets() {
    try {
        const response = await http.get('/v1/question-sets');
        return response.data?.data || [];
    } catch (error) {
        console.error('Error fetching question sets:', error);
        throw error;
    }
}

/**
 * Get a specific question set with all its questions
 */
export async function fetchQuestionSet(id) {
    try {
        const response = await http.get(`/v1/question-sets/${id}`);
        return response.data?.data || null;
    } catch (error) {
        console.error(`Error fetching question set ${id}:`, error);
        throw error;
    }
}

/**
 * Create a new question set
 */
export async function createQuestionSet(data) {
    try {
        const response = await http.post('/v1/question-sets', {
            name: data.name,
            description: data.description || null,
        });
        return response.data?.data || null;
    } catch (error) {
        console.error('Error creating question set:', error);
        throw error;
    }
}

/**
 * Update an existing question set
 */
export async function updateQuestionSet(id, data) {
    try {
        const response = await http.put(`/v1/question-sets/${id}`, {
            name: data.name,
            description: data.description,
        });
        return response.data?.data || null;
    } catch (error) {
        console.error(`Error updating question set ${id}:`, error);
        throw error;
    }
}

/**
 * Delete a question set
 */
export async function deleteQuestionSet(id) {
    try {
        const response = await http.delete(`/v1/question-sets/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting question set ${id}:`, error);
        throw error;
    }
}

/**
 * Add a question to a set
 */
export async function addQuestionToSet(setId, questionId) {
    try {
        const response = await http.post(`/v1/question-sets/${setId}/questions`, {
            question_id: questionId,
        });
        return response.data;
    } catch (error) {
        // Check if it's a duplicate error
        if (error.response?.status === 409) {
            throw new Error('این سوال قبلاً به این مجموعه اضافه شده است');
        }
        console.error(`Error adding question ${questionId} to set ${setId}:`, error);
        throw error;
    }
}

/**
 * Remove a question from a set
 */
export async function removeQuestionFromSet(setId, questionId) {
    try {
        const response = await http.delete(`/v1/question-sets/${setId}/questions/${questionId}`);
        return response.data;
    } catch (error) {
        console.error(`Error removing question ${questionId} from set ${setId}:`, error);
        throw error;
    }
}

/**
 * Reorder questions in a set
 */
export async function reorderQuestionsInSet(setId, questionIds) {
    try {
        const response = await http.post(`/v1/question-sets/${setId}/reorder`, {
            question_ids: questionIds,
        });
        return response.data;
    } catch (error) {
        console.error(`Error reordering questions in set ${setId}:`, error);
        throw error;
    }
}
