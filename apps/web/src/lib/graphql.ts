export async function fetchGraphQL(query: string, variables: Record<string, any> = {}) {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
  
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || "GraphQL Error");
  }
  return json.data;
}
