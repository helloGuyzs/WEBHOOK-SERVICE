import api from './api';
import { Subscription, SubscriptionCreate } from '../types/subscription';

export const subscriptionService = {
    getAll: async () => {
        const response = await api.get<Subscription[]>('/subscriptions/');
        return response.data;
    },

    create: async (data: SubscriptionCreate) => {
        const response = await api.post<Subscription>('/subscriptions/', data);
        return response.data;
    },

    getDeliveries: async (id: number) => {
        const response = await api.get(`/subscriptions/${id}/recent-deliveries`);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/subscriptions/${id}`);
    },

    getById: async (id: number) => {
        const response = await api.get<Subscription>(`/subscriptions/${id}`);
        return response.data;
    }
};