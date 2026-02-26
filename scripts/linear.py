#!/usr/bin/env python3
"""Linear GraphQL client for lean issue queries.

Replaces MCP read operations with direct GraphQL to reduce token bloat.
Write operations (update_issue, create_comment) stay on MCP.

Usage:
    python3 scripts/linear.py list-todo
    python3 scripts/linear.py get-issue MFC-21
    python3 scripts/linear.py get-issue-id MFC-21
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

TEAM_ID = "e01bf64d-2660-4ae4-b550-53f80779400c"
PROJECT_ID = "c00d49da-8bb6-442e-a77d-d3f28d1e8184"
ENDPOINT = "https://api.linear.app/graphql"
PRIORITY = {0: "None", 1: "Urgent", 2: "High", 3: "Medium", 4: "Low"}


def load_api_key():
    """Load LINEAR_API_KEY from .env file or environment."""
    key = os.environ.get("LINEAR_API_KEY")
    if key:
        return key

    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line.startswith("LINEAR_API_KEY=") and not line.startswith("#"):
                return line.split("=", 1)[1].strip().strip('"').strip("'")

    print("Error: LINEAR_API_KEY not found in .env or environment", file=sys.stderr)
    sys.exit(1)


API_KEY = None  # Loaded lazily


def get_key():
    global API_KEY
    if API_KEY is None:
        API_KEY = load_api_key()
    return API_KEY


def graphql_request(query, variables=None):
    """Execute a GraphQL request against the Linear API."""
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": get_key(),
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ""
        print(f"Error: HTTP {e.code} from Linear API: {error_body}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Error: Could not reach Linear API: {e.reason}", file=sys.stderr)
        sys.exit(1)

    if "errors" in body:
        msgs = "; ".join(e.get("message", str(e)) for e in body["errors"])
        print(f"Error: GraphQL error: {msgs}", file=sys.stderr)
        sys.exit(1)

    return body.get("data", {})


# --- Shared fields fragment ---

ISSUE_FIELDS = """
    id
    identifier
    title
    priority
    estimate
    labels { nodes { name } }
    cycle { number }
    relations {
        nodes {
            type
            relatedIssue {
                identifier
                state { name type }
            }
        }
    }
"""


def parse_identifier(ident):
    """Parse 'MFC-21' into the numeric issue number."""
    ident = ident.strip().upper()
    if not ident.startswith("MFC-"):
        print(f"Error: Invalid identifier '{ident}'. Expected format: MFC-XX", file=sys.stderr)
        sys.exit(1)
    try:
        return int(ident.split("-", 1)[1])
    except ValueError:
        print(f"Error: Invalid identifier '{ident}'. Number part is not numeric.", file=sys.stderr)
        sys.exit(1)


def get_blockers(relations_nodes):
    """Extract active blockers from relation nodes.

    In Linear's relation model, a relation with type 'blocks' on an issue
    means the relatedIssue blocks that issue.
    """
    blockers = []
    for rel in relations_nodes:
        rel_type = rel.get("type", "")
        related = rel.get("relatedIssue", {})
        state = related.get("state", {})
        state_type = (state.get("type") or "").lower()

        # type 'blocks' means relatedIssue is blocking this issue
        if rel_type == "blocks" and state_type not in ("completed", "canceled"):
            status_name = state.get("name", "Unknown")
            blockers.append(f"{related['identifier']} ({status_name})")
    return blockers


def format_labels(label_nodes):
    return ", ".join(n["name"] for n in label_nodes) if label_nodes else ""


# --- Subcommands ---


def cmd_list_todo():
    query = """
    query ListTodo($teamId: ID!, $projectId: ID!) {
        issues(
            filter: {
                team: { id: { eq: $teamId } }
                project: { id: { eq: $projectId } }
                state: { name: { eq: "Todo" } }
            }
            orderBy: updatedAt
            first: 50
        ) {
            nodes {
                %s
            }
        }
    }
    """ % ISSUE_FIELDS

    data = graphql_request(query, {"teamId": TEAM_ID, "projectId": PROJECT_ID})
    issues = data.get("issues", {}).get("nodes", [])

    if not issues:
        print("No Todo issues found in CENIE Editorial Web project.")
        return

    # Sort: priority asc (1=urgent first), then estimate asc (nulls last)
    issues.sort(key=lambda i: (i.get("priority") or 99, i.get("estimate") or 99))

    # Table header
    print(f"| # | ID | Title | Pri | Est | Labels | Cycle | Blocked |")
    print(f"|---|-----|-------|-----|-----|--------|-------|---------|")

    for idx, issue in enumerate(issues, 1):
        ident = issue["identifier"]
        title = issue["title"]
        if len(title) > 50:
            title = title[:47] + "..."
        pri = PRIORITY.get(issue.get("priority"), "?")
        est = issue.get("estimate") or "-"
        labels = format_labels(issue.get("labels", {}).get("nodes", []))
        cycle = issue.get("cycle", {})
        cycle_num = cycle.get("number", "-") if cycle else "-"
        blockers = get_blockers(issue.get("relations", {}).get("nodes", []))
        blocked = ", ".join(blockers) if blockers else "-"

        print(f"| {idx} | {ident} | {title} | {pri} | {est} | {labels} | {cycle_num} | {blocked} |")


def cmd_get_issue(identifier):
    number = parse_identifier(identifier)

    query = """
    query GetIssue($teamId: ID!, $number: Float!) {
        issues(
            filter: {
                team: { id: { eq: $teamId } }
                number: { eq: $number }
            }
            first: 1
        ) {
            nodes {
                %s
                description
                state { name type }
            }
        }
    }
    """ % ISSUE_FIELDS

    data = graphql_request(query, {"teamId": TEAM_ID, "number": number})
    issues = data.get("issues", {}).get("nodes", [])

    if not issues:
        print(f"Error: Issue {identifier} not found.", file=sys.stderr)
        sys.exit(1)

    issue = issues[0]
    ident = issue["identifier"]
    title = issue["title"]
    state = issue.get("state", {}).get("name", "Unknown")
    pri = PRIORITY.get(issue.get("priority"), "?")
    est = issue.get("estimate") or "-"
    cycle = issue.get("cycle", {})
    cycle_num = cycle.get("number", "-") if cycle else "-"
    labels = format_labels(issue.get("labels", {}).get("nodes", []))
    blockers = get_blockers(issue.get("relations", {}).get("nodes", []))
    description = issue.get("description") or "(no description)"

    print(f"**{ident}**: {title}")
    print(f"**Status**: {state} | **Priority**: {pri} | **Estimate**: {est} | **Cycle**: {cycle_num}")
    if labels:
        print(f"**Labels**: {labels}")
    if blockers:
        print(f"**Blocked by**: {', '.join(blockers)}")
    print()
    print("---")
    print(description)


def cmd_get_issue_id(identifier):
    number = parse_identifier(identifier)

    query = """
    query GetIssueId($teamId: ID!, $number: Float!) {
        issues(
            filter: {
                team: { id: { eq: $teamId } }
                number: { eq: $number }
            }
            first: 1
        ) {
            nodes { id }
        }
    }
    """

    data = graphql_request(query, {"teamId": TEAM_ID, "number": number})
    issues = data.get("issues", {}).get("nodes", [])

    if not issues:
        print(f"Error: Issue {identifier} not found.", file=sys.stderr)
        sys.exit(1)

    print(issues[0]["id"])


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/linear.py <command> [args]", file=sys.stderr)
        print("Commands: list-todo, get-issue <MFC-XX>, get-issue-id <MFC-XX>", file=sys.stderr)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "list-todo":
        cmd_list_todo()
    elif cmd == "get-issue":
        if len(sys.argv) < 3:
            print("Error: get-issue requires an identifier (e.g., MFC-21)", file=sys.stderr)
            sys.exit(1)
        cmd_get_issue(sys.argv[2])
    elif cmd == "get-issue-id":
        if len(sys.argv) < 3:
            print("Error: get-issue-id requires an identifier (e.g., MFC-21)", file=sys.stderr)
            sys.exit(1)
        cmd_get_issue_id(sys.argv[2])
    else:
        print(f"Error: Unknown command '{cmd}'", file=sys.stderr)
        print("Commands: list-todo, get-issue <MFC-XX>, get-issue-id <MFC-XX>", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
