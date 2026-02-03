# Credit Card Tracker MCP Server

An MCP (Model Context Protocol) server that exposes your credit card benefits to AI assistants. Query what credits you need to use this week, month, quarter, or year.

## Prerequisites

- Node.js 18+
- `firebaseKey.json` in the credit-card-tracker project root (same as the main app)

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Tool: `get_credits_to_use`

Returns credit card benefits that are **unused** for the current period.

| Period   | Benefits Included                                      |
|----------|--------------------------------------------------------|
| `week`   | Monthly benefits (use before end of month)             |
| `month`  | Monthly benefits                                       |
| `quarter`| Monthly + quarterly benefits                           |
| `year`   | All benefits (monthly, quarterly, semi-annually, yearly) |

## Adding to Cursor

1. Open **Cursor Settings** (Cmd+, on macOS or Ctrl+, on Windows)
2. Go to **Features** → **MCP** (or **Tools & Integrations** → **MCP Servers**)
3. Click **+ Add New MCP Server**
4. Configure:
   - **Name:** `credit-card-tracker`
   - **Transport:** stdio
   - **Command:** `node`
   - **Args:** `["/absolute/path/to/credit-card-tracker/mcp-server/dist/index.js"]`
   - **CWD (optional):** `/absolute/path/to/credit-card-tracker` (so `firebaseKey.json` is found)

### Example configuration (mcp.json)

If you configure via `~/.cursor/config/mcp.json`:

```json
{
  "mcpServers": {
    "credit-card-tracker": {
      "command": "node",
      "args": ["/Users/you/credit-card-tracker/mcp-server/dist/index.js"],
      "cwd": "/Users/you/credit-card-tracker"
    }
  }
}
```

Replace `/Users/you/credit-card-tracker` with your actual project path.

## Usage

Once configured, you can ask Cursor things like:

- "What credits do I need to use this month?"
- "Show me benefits I need to use this quarter"
- "What credit card benefits are expiring this year?"

The AI will call the `get_credits_to_use` tool with the appropriate period and summarize the results.

## Development

```bash
npm run dev   # Run with tsx (no build needed)
npm run build # Compile to dist/
npm start     # Run compiled output
```
