import { dataRepository } from "@/lib/data";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) {
    return Response.json({ suggestions: [] });
  }

  try {
    const suggestions = await dataRepository.searchProducts(query);
    return Response.json({ suggestions });
  } catch (error) {
    console.error("Product search failed.", error);
    return Response.json(
      { message: "Search is temporarily unavailable." },
      { status: 500 },
    );
  }
}
