/**
 * MSS PDF Service
 * 
 * Client-side service for generating MSS (Mesafeli Satış Sözleşmesi)
 * contracts as PDF and emailing them to users.
 * 
 * Uses Supabase Edge Function "generate-mss-pdf" for server-side
 * PDF generation and email delivery.
 * 
 * Legal basis: 6502 Sayılı Tüketicinin Korunması Hakkında Kanun
 */

import { Platform } from 'react-native';
import { SupabaseService } from '@nextself/shared';
import { AgreementService } from './agreementService';

export interface MssPdfResult {
    success: boolean;
    contract_number?: string;
    pdf_base64?: string;
    pdf_size_bytes?: number;
    email_sent?: boolean;
    email_error?: string | null;
    error?: string;
}

export class MssPdfService {
    private static instance: MssPdfService;
    private supabase = SupabaseService.getInstance();
    private agreementService = AgreementService.getInstance();

    public static getInstance(): MssPdfService {
        if (!MssPdfService.instance) {
            MssPdfService.instance = new MssPdfService();
        }
        return MssPdfService.instance;
    }

    /**
     * Generate MSS PDF and email it to the buyer.
     * Called after contract creation or on user request.
     * 
     * @param contractId - The ID of the distance_sales_contracts record
     * @returns MssPdfResult with PDF base64 and email status
     */
    public async generateAndSendPdf(contractId: string): Promise<MssPdfResult> {
        try {
            const client = this.supabase.getClient();

            const { data, error } = await client.functions.invoke('generate-mss-pdf', {
                body: { contract_id: contractId },
            });

            if (error) {
                console.error('MSS PDF Edge Function error:', error.message);
                return { success: false, error: error.message };
            }

            if (!data?.success) {
                return { success: false, error: data?.error || 'PDF generation failed' };
            }

            return {
                success: true,
                contract_number: data.contract_number,
                pdf_base64: data.pdf_base64,
                pdf_size_bytes: data.pdf_size_bytes,
                email_sent: data.email_sent,
                email_error: data.email_error,
            };
        } catch (err: any) {
            console.error('MssPdfService.generateAndSendPdf error:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Generate MSS PDF for the user's latest contract.
     * Useful for "Resend contract" button.
     */
    public async generateForLatestContract(userId: string): Promise<MssPdfResult> {
        try {
            const client = this.supabase.getClient();

            const { data, error } = await client.functions.invoke('generate-mss-pdf', {
                body: { user_id: userId },
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return data as MssPdfResult;
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    /**
     * Create MSS contract + generate PDF + send email — all-in-one flow.
     * Called during subscription checkout.
     */
    public async createContractAndSendPdf(
        userId: string,
        buyerName: string,
        buyerEmail: string,
        buyerAddress: string,
        planId: string,
        planName: string,
        billingCycle: 'monthly' | 'yearly',
        price: number,
        currency: string = 'TRY',
        isTurkish: boolean = true
    ): Promise<{ contractResult: any; pdfResult: MssPdfResult }> {
        // Step 1: Create the MSS contract
        const contractResult = await this.agreementService.createDistanceSalesContract(
            userId, buyerName, buyerEmail, buyerAddress,
            planId, planName, billingCycle, price, currency, isTurkish
        );

        if (!contractResult.success || !contractResult.contract) {
            return {
                contractResult,
                pdfResult: { success: false, error: 'Contract creation failed' },
            };
        }

        // Step 2: Generate PDF and send email
        const pdfResult = await this.generateAndSendPdf(contractResult.contract.id);

        return { contractResult, pdfResult };
    }

    /**
     * Get user-friendly alert config about PDF status (TR/EN).
     */
    public getPdfStatusAlertConfig(result: MssPdfResult, isTurkish: boolean): { title: string, message: string, type: 'success' | 'warning' | 'error' } {
        if (result.success && result.email_sent) {
            return {
                title: isTurkish ? 'Sözleşme Gönderildi' : 'Contract Sent',
                message: isTurkish
                    ? `Mesafeli Satış Sözleşmeniz (${result.contract_number}) e-posta adresinize PDF olarak gönderilmiştir.`
                    : `Your Distance Sales Contract (${result.contract_number}) has been sent to your email as a PDF.`,
                type: 'success'
            };
        } else if (result.success && !result.email_sent) {
            return {
                title: isTurkish ? 'PDF Oluşturuldu' : 'PDF Generated',
                message: isTurkish
                    ? `Sözleşme PDF olarak oluşturuldu ancak e-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.`
                    : `Contract PDF was generated but email could not be sent. Please try again later.`,
                type: 'warning'
            };
        } else {
            return {
                title: isTurkish ? 'Hata' : 'Error',
                message: isTurkish
                    ? `Sözleşme PDF oluşturulamadı: ${result.error || 'Bilinmeyen hata'}`
                    : `Could not generate contract PDF: ${result.error || 'Unknown error'}`,
                type: 'error'
            };
        }
    }

    /**
     * Download PDF as a share-able file (uses Share API or filesystem).
     * Returns the base64 PDF data for further handling.
     */
    public async downloadPdf(contractId: string): Promise<string | null> {
        const result = await this.generateAndSendPdf(contractId);

        if (result.success && result.pdf_base64) {
            return result.pdf_base64;
        }

        return null;
    }
}
