import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const { siteUrl, email, token, projectKey, title, description } = body as {
    siteUrl?: string; email?: string; token?: string;
    projectKey?: string; title?: string; description?: string;
  };

  if (!siteUrl || !email || !token || !projectKey || !title) {
    return NextResponse.json(
      { error: 'siteUrl, email, token, projectKey, and title are required' },
      { status: 400 }
    );
  }

  const base64Auth = Buffer.from(`${email}:${token}`).toString('base64');
  const host = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Jira REST API v3 uses Atlassian Document Format for description
  const adfDescription = {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: description ?? '' }],
      },
    ],
  };

  const res = await fetch(`https://${host}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        summary: title,
        description: adfDescription,
        issuetype: { name: 'Bug' },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { errorMessages?: string[]; errors?: Record<string, string> };
    const msg = err.errorMessages?.[0] ?? Object.values(err.errors ?? {})[0] ?? `Jira API error ${res.status}`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const data = await res.json() as { id: string; key: string; self: string };
  const url = `https://${host}/browse/${data.key}`;

  return NextResponse.json({ url, key: data.key });
}
