import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en stratégie d'entreprise et en business plan.
Génère un Business Plan complet, structuré et professionnel en français.

Le Business Plan doit être organisé en 10 sections claires :

1. **Executive Summary** - Résumé captivant du projet
2. **Vision** - Vision à long terme et ambition
3. **Problème** - Problème identifié sur le marché
4. **Solution** - Solution proposée et innovation
5. **Public cible** - Clients visés et segments
6. **Analyse de marché** - Taille du marché, tendances, concurrence
7. **Modèle économique** - Comment l'entreprise va générer des revenus
8. **Stratégie marketing** - Plan d'acquisition et de fidélisation
9. **Plan opérationnel** - Ressources, équipe, organisation
10. **Prévisions financières** - Projections simplifiées (3 ans)

Le style doit être professionnel, clair, motivant et actionnable.
Utilise UNIQUEMENT les informations fournies par l'utilisateur.
Formate le texte avec des titres en **gras** et des sections bien séparées.`;

    const userPrompt = `Génère un Business Plan complet basé sur ces informations :

**Nom du projet :** ${businessData.projectName}
**Secteur d'activité :** ${businessData.sector}
**Problème à résoudre :** ${businessData.problem}
**Solution proposée :** ${businessData.solution}
**Public cible :** ${businessData.targetAudience}
**Modèle économique :** ${businessData.businessModel}
**Ressources nécessaires :** ${businessData.resources}
**Stratégie marketing :** ${businessData.marketingStrategy}
**Vision & objectifs :** ${businessData.vision}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 3000,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes. Veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédit insuffisant. Veuillez ajouter des crédits à votre workspace Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du business plan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedPlan = data.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ businessPlan: generatedPlan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-business-plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});