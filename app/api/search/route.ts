import { getSearchSuggestions } from "@/lib/store-data";
import { createStoreSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) {
    return Response.json({ suggestions: [] });
  }

  const client = createStoreSupabaseClient();
  if (!client) {
    return Response.json(
      { message: "The product catalog is not connected." },
      { status: 503 },
    );
  }

  try {
    const suggestions = await getSearchSuggestions(client, query);
    return Response.json({ suggestions });
  } catch (error) {
    console.error("Product search failed.", error);
    return Response.json(
      { message: "Search is temporarily unavailable." },
      { status: 500 },
    );
  }
}
