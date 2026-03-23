// @ts-nocheck
/**
 * Supabase Edge Function: generate-mss-pdf
 * 
 * Generates MSS (Mesafeli Satış Sözleşmesi / Distance Sales Contract) as PDF
 * and emails it to the buyer via Resend or SMTP.
 * 
 * Required env vars:
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 *   - RESEND_API_KEY (for email delivery)
 *   - SENDER_EMAIL (e.g. app.nextself@gmail.com)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── PDF Generation (plain-text based, no external lib needed) ───────────────

/**
 * Generate a minimal PDF from plain text.
 * Uses raw PDF spec to avoid Deno dependency issues.
 * The output is a valid PDF 1.4 document with the contract text.
 */
function generatePdfFromText(text: string): Uint8Array {
    const lines = text.split('\n');
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const margin = 50;
    const fontSize = 10;
    const titleFontSize = 14;
    const lineHeight = 14;
    const maxCharsPerLine = 85;
    const usableHeight = pageHeight - 2 * margin;
    const maxLinesPerPage = Math.floor(usableHeight / lineHeight);

    // Word-wrap and prepare all lines
    const processedLines: { text: string; isTitle: boolean }[] = [];
    for (const rawLine of lines) {
        const trimmed = rawLine.trim();
        if (trimmed === '') {
            processedLines.push({ text: '', isTitle: false });
            continue;
        }

        // Detect title lines (all caps or starts with section markers)
        const isTitle = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith('•');

        // Word wrap
        if (trimmed.length <= maxCharsPerLine) {
            processedLines.push({ text: trimmed, isTitle });
        } else {
            const words = trimmed.split(' ');
            let currentLine = '';
            for (const word of words) {
                if ((currentLine + ' ' + word).trim().length > maxCharsPerLine) {
                    processedLines.push({ text: currentLine.trim(), isTitle: isTitle && processedLines.length === 0 });
                    currentLine = word;
                } else {
                    currentLine = currentLine ? currentLine + ' ' + word : word;
                }
            }
            if (currentLine.trim()) {
                processedLines.push({ text: currentLine.trim(), isTitle: false });
            }
        }
    }

    // Split into pages
    const pages: { text: string; isTitle: boolean }[][] = [];
    for (let i = 0; i < processedLines.length; i += maxLinesPerPage) {
        pages.push(processedLines.slice(i, i + maxLinesPerPage));
    }

    if (pages.length === 0) {
        pages.push([{ text: 'Empty contract', isTitle: false }]);
    }

    // Escape PDF special chars
    const escPdf = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    // Build PDF objects
    const objects: string[] = [];
    let objCount = 0;

    const addObj = (content: string): number => {
        objCount++;
        objects.push(`${objCount} 0 obj\n${content}\nendobj`);
        return objCount;
    };

    // 1. Catalog
    const catalogId = addObj('<< /Type /Catalog /Pages 2 0 R >>');

    // 2. Pages (placeholder — will be replaced)
    const pagesId = addObj('PAGES_PLACEHOLDER');

    // 3. Font (Helvetica — built-in, supports basic Latin)
    const fontId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const fontBoldId = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    // Generate page objects
    const pageObjIds: number[] = [];
    for (const page of pages) {
        // Content stream
        let stream = `BT\n/F1 ${fontSize} Tf\n`;
        let y = pageHeight - margin;

        for (const line of page) {
            if (line.isTitle) {
                stream += `/F2 ${titleFontSize} Tf\n`;
                stream += `${margin} ${y.toFixed(2)} Td\n(${escPdf(line.text)}) Tj\n`;
                stream += `/F1 ${fontSize} Tf\n`;
            } else {
                stream += `${margin} ${y.toFixed(2)} Td\n(${escPdf(line.text)}) Tj\n`;
            }
            // Reset position for next line (absolute positioning)
            stream += `${-margin} ${-y.toFixed(2)} Td\n`;
            y -= lineHeight;
        }
        stream += 'ET';

        const streamId = addObj(
            `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
        );

        const pageId = addObj(
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
            `/Contents ${streamId} 0 R ` +
            `/Resources << /Font << /F1 ${fontId} 0 R /F2 ${fontBoldId} 0 R >> >> >>`
        );
        pageObjIds.push(pageId);
    }

    // Replace pages placeholder
    const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
    objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjIds.length} >>\nendobj`;

    // Build final PDF
    const header = '%PDF-1.4\n%âãÏÓ\n';
    const body = objects.join('\n') + '\n';

    // Cross-reference table
    const offsets: number[] = [];
    let currentOffset = header.length;
    for (const obj of objects) {
        offsets.push(currentOffset);
        currentOffset += obj.length + 1; // +1 for newline
    }

    let xref = `xref\n0 ${objCount + 1}\n`;
    xref += '0000000000 65535 f \n';
    for (const offset of offsets) {
        xref += offset.toString().padStart(10, '0') + ' 00000 n \n';
    }

    const startxref = header.length + body.length;
    const trailer = `trailer\n<< /Size ${objCount + 1} /Root ${catalogId} 0 R >>\nstartxref\n${startxref}\n%%EOF`;

    const pdfString = header + body + xref + trailer;
    return new TextEncoder().encode(pdfString);
}

// ─── Email via Resend ────────────────────────────────────────────────────────

async function sendEmailWithPdf(
    recipientEmail: string,
    recipientName: string,
    contractNumber: string,
    pdfBytes: Uint8Array,
    isTurkish: boolean
): Promise<{ success: boolean; error?: string }> {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'app.nextself@gmail.com';

    if (!RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not set — skipping email, PDF still generated');
        return { success: true }; // PDF generated even without email
    }

    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    const subject = isTurkish
        ? `NextSelf - Mesafeli Satış Sözleşmeniz (${contractNumber})`
        : `NextSelf - Your Distance Sales Contract (${contractNumber})`;

    const htmlBody = isTurkish
        ? `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #58CC02;">NextSelf</h2>
            <p>Sayın ${recipientName},</p>
            <p>Mesafeli Satış Sözleşmeniz (${contractNumber}) ekte PDF olarak sunulmuştur.</p>
            <p>6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca bu sözleşme tarafınıza gönderilmektedir.</p>
            <p><strong>Cayma Hakkı:</strong> Sözleşme tarihinden itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz.</p>
            <br/>
            <p>Saygılarımızla,<br/>NextSelf Ekibi</p>
            <hr/>
            <p style="font-size: 11px; color: #888;">İletişim: ${SENDER_EMAIL}</p>
          </div>`
        : `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #58CC02;">NextSelf</h2>
            <p>Dear ${recipientName},</p>
            <p>Your Distance Sales Contract (${contractNumber}) is attached as a PDF.</p>
            <p>This contract is sent in accordance with the Consumer Protection Law and Distance Contracts Regulation.</p>
            <p><strong>Right of Withdrawal:</strong> You may exercise your right of withdrawal within 14 days from the contract date.</p>
            <br/>
            <p>Best regards,<br/>NextSelf Team</p>
            <hr/>
            <p style="font-size: 11px; color: #888;">Contact: ${SENDER_EMAIL}</p>
          </div>`;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: `NextSelf <${SENDER_EMAIL}>`,
                to: [recipientEmail],
                subject,
                html: htmlBody,
                attachments: [{
                    filename: `MSS_${contractNumber}.pdf`,
                    content: pdfBase64,
                    content_type: 'application/pdf',
                }],
            }),
        });

        if (!response.ok) {
            const errData = await response.json();
            return { success: false, error: errData.message || 'Email send failed' };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase configuration missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
        }

        const authHeader = req.headers.get('Authorization') || '';
        const accessToken = authHeader.replace('Bearer ', '').trim();

        if (!accessToken) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized: missing access token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        // Initialize Supabase admin client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
        if (authError || !authData?.user) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized: invalid or expired token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const userId = authData.user.id;

        const { contract_id } = await req.json();

        let contract: any;

        if (contract_id) {
            // Fetch specific contract owned by the authenticated user
            const { data, error } = await supabase
                .from('distance_sales_contracts')
                .select('*')
                .eq('id', contract_id)
                .eq('user_id', userId)
                .single();

            if (error || !data) {
                return new Response(
                    JSON.stringify({ success: false, error: 'Contract not found or access denied' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
                );
            }
            contract = data;
        } else {
            // Fetch latest contract for authenticated user
            const { data, error } = await supabase
                .from('distance_sales_contracts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                return new Response(
                    JSON.stringify({ success: false, error: 'No contract found for user' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
                );
            }
            contract = data;
        }

        // Generate PDF from contract text
        const contractText = contract.contract_text || 'Contract text not available';
        const pdfBytes = generatePdfFromText(contractText);

        // Fix: Avoid "Maximum call stack size exceeded" with large arrays
        let binary = '';
        const bytes = new Uint8Array(pdfBytes);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const pdfBase64 = btoa(binary);

        // Detect language from contract text
        const isTurkish = contractText.includes('MESAFELİ SATIŞ');

        // Store PDF reference in database
        const { error: updateError } = await supabase
            .from('distance_sales_contracts')
            .update({
                pdf_generated_at: new Date().toISOString(),
                pdf_sent: false,
            })
            .eq('id', contract.id);

        if (updateError) {
            console.warn('Failed to update pdf_generated_at:', updateError.message);
        }

        // Send email with PDF attachment
        const emailResult = await sendEmailWithPdf(
            contract.buyer_email,
            contract.buyer_name,
            contract.contract_number,
            pdfBytes,
            isTurkish
        );

        // Mark as sent if email was successful
        if (emailResult.success) {
            await supabase
                .from('distance_sales_contracts')
                .update({ pdf_sent: true, pdf_sent_at: new Date().toISOString() })
                .eq('id', contract.id);
        }

        return new Response(
            JSON.stringify({
                success: true,
                contract_number: contract.contract_number,
                pdf_base64: pdfBase64,
                pdf_size_bytes: pdfBytes.length,
                email_sent: emailResult.success,
                email_error: emailResult.error || null,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('generate-mss-pdf error:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
