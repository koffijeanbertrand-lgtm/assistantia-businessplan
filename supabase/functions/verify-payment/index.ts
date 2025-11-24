import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PACK_CREDITS = {
  mini: 2,
  starter: 6,
  pro: 15,
};

const PACK_AMOUNTS = {
  mini: 2000,
  starter: 5000,
  pro: 10000,
};

interface VerifyPaymentRequest {
  reference: string;
  pack: 'mini' | 'starter' | 'pro';
  email: string;
  userId?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference, pack, email, userId }: VerifyPaymentRequest = await req.json();

    console.log('Verifying payment:', { reference, pack, email });

    // Verify payment with Paystack
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log('Paystack verification response:', verifyData);

    if (!verifyData.status || verifyData.data.status !== 'success') {
      throw new Error('Payment verification failed');
    }

    // Verify amount matches pack
    const expectedAmount = PACK_AMOUNTS[pack] * 100; // in kobo
    if (verifyData.data.amount !== expectedAmount) {
      throw new Error('Payment amount mismatch');
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const creditsToAdd = PACK_CREDITS[pack];

    // Check if payment already processed
    const { data: existingPayment } = await supabase
      .from('payment_history')
      .select('*')
      .eq('reference', reference)
      .single();

    if (existingPayment) {
      console.log('Payment already processed');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment already processed',
          credits: creditsToAdd,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Add credits to user
    if (!userId) {
      throw new Error('User ID is required for payment processing');
    }

    const { data: existingCredits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingCredits) {
      // Update existing credits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ 
          credits: existingCredits.credits + creditsToAdd,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating credits:', updateError);
        throw updateError;
      }
    } else {
      // Create new credits record
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          credits: creditsToAdd,
        });

      if (insertError) {
        console.error('Error inserting credits:', insertError);
        throw insertError;
      }
    }

    // Encrypt email before storing
    const { data: encryptedEmail, error: encryptError } = await supabase
      .rpc('encrypt_text', {
        text_value: email,
        secret_key: 'ENCRYPTION_KEY',
      });

    if (encryptError) {
      console.error('Error encrypting email:', encryptError);
      throw new Error('Failed to encrypt email');
    }

    // Record payment in history with encrypted email
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: userId || null,
        email: encryptedEmail,
        reference,
        amount: verifyData.data.amount,
        currency: verifyData.data.currency,
        pack_type: pack,
        credits_added: creditsToAdd,
        status: 'success',
      });

    if (historyError) {
      console.error('Error recording payment history:', historyError);
      throw historyError;
    }

    console.log('Payment verified and credits added successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified and credits added',
        credits: creditsToAdd,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in verify-payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Payment verification failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
