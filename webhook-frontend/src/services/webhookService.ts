import api from './api';
import { WebhookDelivery } from '../types/webhook';

export const webhookService = {
    getAll: async () => {
        const response = await api.get<WebhookDelivery[]>('/webhooks/deliveries');
        return response.data;
    },

    getDeliveryStatus: async (deliveryId: number) => {
        const response = await api.get<WebhookDelivery>(`/webhooks/deliveries/${deliveryId}`);
        return response.data;
    },

    getRecentDeliveries: async (subscriptionId: number) => {
        const response = await api.get<WebhookDelivery[]>(`/subscriptions/${subscriptionId}/recent-deliveries`);
        return response.data;
    },

    retryDelivery: async (deliveryId: number) => {
        const response = await api.post<WebhookDelivery>(`/webhooks/deliveries/${deliveryId}/retry`);
        return response.data;
    }
};