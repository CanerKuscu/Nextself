import { Linking } from 'react-native';

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || '';
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || '';

// Base URL for the iyzico checkout - normally handled by your backend (Supabase Edge Function)
const CHECKOUT_BASE_URL = process.env.API_BASE_URL || 'https://api.nextself.app';

export interface DepositCheckoutParams {
    userId: string;
    amount: number;
    description: string;
}

export class IyzicoDepositService {
    private static instance: IyzicoDepositService;

    private constructor() {}

    public static getInstance(): IyzicoDepositService {
        if (!IyzicoDepositService.instance) {
            IyzicoDepositService.instance = new IyzicoDepositService();
        }
        return IyzicoDepositService.instance;
    }

    /**
     * Opens an external browser for iyzico checkout.
     * In production, this URL would point to a Supabase Edge Function
     * that creates an iyzico checkout form and returns the payment page URL.
     * 
     * Flow:
     * 1. App calls backend endpoint with amount + userId
     * 2. Backend creates iyzico checkout form (server-side, using IYZICO_API_KEY + IYZICO_SECRET_KEY)
     * 3. Backend returns a checkout URL
     * 4. App opens that URL in the browser
     * 5. User completes payment on iyzico's secure page
     * 6. iyzico webhook calls backend → backend updates `professional_wallets` balance in Supabase
     */
    public async openCheckout(params: DepositCheckoutParams): Promise<boolean> {
        try {
            const checkoutUrl = `${CHECKOUT_BASE_URL}/api/deposit/checkout?userId=${encodeURIComponent(params.userId)}&amount=${params.amount}&description=${encodeURIComponent(params.description)}`;
            
            const canOpen = await Linking.canOpenURL(checkoutUrl);
            if (canOpen) {
                await Linking.openURL(checkoutUrl);
                return true;
            } else {
                console.warn('Cannot open checkout URL:', checkoutUrl);
                return false;
            }
        } catch (error) {
            console.warn('Failed to open iyzico checkout:', error);
            return false;
        }
    }

    /**
     * Check the wallet balance for a professional user.
     */
    public async getWalletBalance(userId: string): Promise<number> {
        try {
            const { data } = await (await import('@nextself/shared')).SupabaseService.getInstance().getClient()
                .from('professional_wallets')
                .select('balance')
                .eq('user_id', userId)
                .maybeSingle();
            return Number(data?.balance || 0);
        } catch {
            return 0;
        }
    }
}
