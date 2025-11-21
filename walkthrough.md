# Cloudflare Deployment Walkthrough

This guide explains how to deploy your Next.js application to Cloudflare Workers using OpenNext.

## Prerequisites

1.  **Cloudflare Account**: You need a Cloudflare account.
2.  **Wrangler**: The Cloudflare CLI tool is installed as a dev dependency, but you can also install it globally: `npm install -g wrangler`.
3.  **Database**: A PostgreSQL database accessible from Cloudflare Workers. We recommend **Cloudflare Hyperdrive** for connection pooling if using an external Postgres (like Neon, Supabase), or **Cloudflare D1** (requires code changes).

## Configuration

### 1. Environment Variables

Cloudflare Workers use `wrangler.json` for configuration. We have created a basic `wrangler.json` for you.

You need to set your secrets (like `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_...`) in Cloudflare.

**Do not commit `.env` files.**

To set secrets for your worker:

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put BETTER_AUTH_SECRET
# ... repeat for other secrets
```

For public environment variables (prefixed with `NEXT_PUBLIC_`), you can add them to `wrangler.json` under `vars`:

```json
"vars": {
  "NEXT_PUBLIC_BASE_URL": "https://your-domain.com",
  "NEXT_PUBLIC_MAIL_FROM_EMAIL": "support@your-domain.com"
}
```

### 2. Database (Hyperdrive)

If you are using an external PostgreSQL database, it is highly recommended to use [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/) to accelerate connections.

1.  Create a Hyperdrive configuration:
    ```bash
    npx wrangler hyperdrive create mksaas-hyperdrive --connection-string="postgres://user:pass@host:5432/db"
    ```
2.  Get the ID from the output and update `wrangler.json`:
    ```json
    "hyperdrive": [
      {
        "binding": "HYPERDRIVE",
        "id": "<YOUR_HYPERDRIVE_ID>"
      }
    ]
    ```
3.  Update your code to use the Hyperdrive connection string if needed (OpenNext often handles `DATABASE_URL` override automatically if you bind it correctly).

## Deployment

To deploy your application:

```bash
npm run deploy
```

This command runs `opennextjs-cloudflare build` and then `opennextjs-cloudflare deploy`.

## Troubleshooting

### Build Errors
If you encounter build errors related to environment variables, ensure you have provided necessary variables. The build process might require them to be present.

### Runtime Errors
Check the logs using:
```bash
npx wrangler tail
```

### Type Errors
We fixed some TypeScript errors in `src/credits` to ensure a smooth build. If you see more, please check the types.
