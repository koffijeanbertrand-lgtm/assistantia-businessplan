import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENCRYPTION_KEY = 'contact_messages_encryption_key_2025';

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

// Validation function
function validateContactData(data: ContactRequest): { valid: boolean; error?: string } {
  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  if (data.name.length > 100) {
    return { valid: false, error: 'Name must be less than 100 characters' };
  }
  if (/[<>{}]/.test(data.name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }
  if (data.email.length > 255) {
    return { valid: false, error: 'Email must be less than 255 characters' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Validate message
  if (!data.message || data.message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (data.message.length > 1000) {
    return { valid: false, error: 'Message must be less than 1000 characters' };
  }

  return { valid: true };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message }: ContactRequest = await req.json();

    console.log('Received contact form submission');

    // Validate input
    const validation = validateContactData({ name, email, message });
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Encrypt sensitive data using SQL functions
    const { data: encryptedName, error: encryptNameError } = await supabase
      .rpc('encrypt_text', { 
        text_value: name.trim(), 
        secret_key: ENCRYPTION_KEY 
      });

    if (encryptNameError) {
      console.error('Error encrypting name:', encryptNameError);
      throw new Error('Failed to encrypt name');
    }

    const { data: encryptedEmail, error: encryptEmailError } = await supabase
      .rpc('encrypt_text', { 
        text_value: email.trim().toLowerCase(), 
        secret_key: ENCRYPTION_KEY 
      });

    if (encryptEmailError) {
      console.error('Error encrypting email:', encryptEmailError);
      throw new Error('Failed to encrypt email');
    }

    // Insert encrypted contact message
    const { error: insertError } = await supabase
      .from('contact_messages')
      .insert({
        name: encryptedName,
        email: encryptedEmail,
        message: message.trim(),
        read: false,
      });

    if (insertError) {
      console.error('Error inserting contact message:', insertError);
      throw insertError;
    }

    console.log('Contact message saved successfully with encryption');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Your message has been sent successfully. We will get back to you soon!',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in submit-contact:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to submit contact message',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
