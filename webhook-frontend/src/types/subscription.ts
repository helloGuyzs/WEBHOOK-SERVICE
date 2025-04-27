export interface Subscription {
    id: number;
    target_url: string;
    event_types: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

export interface SubscriptionCreate {
    target_url: string;
    secret_key: string;
    event_types: string[];
}

