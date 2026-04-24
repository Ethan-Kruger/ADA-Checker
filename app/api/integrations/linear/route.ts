import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { apiKey, teamId, title, description } = body as {
    apiKey?: string; teamId?: string; title?: string; description?: string;
  };

  if (!apiKey || !teamId || !title) {
    return NextResponse.json({ error: 'apiKey, teamId, and title are required' }, { status: 400 });
  }

  const query = `
    mutation CreateIssue($teamId: String!, $title: String!, $description: String) {
      issueCreate(input: { teamId: $teamId, title: $title, description: $description, labelIds: [] }) {
        success
        issue { id identifier url title }
      }
    }
  `;

  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { teamId, title, description: description ?? '' } }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Linear API error', status: res.status }, { status: 502 });
  }

  const data = await res.json() as {
    data?: { issueCreate?: { success: boolean; issue?: { identifier: string; url: string } } };
    errors?: { message: string }[];
  };

  if (data.errors?.length) {
    return NextResponse.json({ error: data.errors[0].message }, { status: 400 });
  }

  const issue = data.data?.issueCreate?.issue;
  if (!issue) {
    return NextResponse.json({ error: 'Issue creation failed' }, { status: 502 });
  }

  return NextResponse.json({ url: issue.url, identifier: issue.identifier });
}
