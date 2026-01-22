from anthropic import Anthropic
import os

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=2000,
    messages=[{"role": "user", "content": """
UrsaDeFi is a Next.js 15 app (TypeScript, App Router, Tailwind) for DeFi invoicing on XRPL. The hangup is Magic login (email magic links) not integrating with XRPL wallet for signing/minting MPT invoices. Likely issues: Magic SDK for EVM/Solana not native to XRPL, session vs. signature mismatches, errors like redirect loops or unsigned tx.

Repo structure (from ls): README.md, derive-address.js, eslint.config.mjs, next.config.mjs, next-env.d.ts, node_modules, package.json, package-lock.json, postcss.config.mjs, public, src, tsconfig.json, ursadefi-ai-charter.md.

Charter: Focus on MVP—fix login, MPT minting, UI polish, testnet deploy.

Task: 
- Analyze likely auth code in src/ (e.g., components or api/routes).
- Generate fixed code: Magic for email sessions + separate XRPL wallet connect (use xrpl.js, testnet seed or Xaman for signing).
- Output as full components/routes (e.g., MagicLogin.tsx, XRPLConnect.tsx, api/auth/login/route.ts).
- Include env vars (MAGIC_KEYS, XRPL_TESTNET).
- Testnet only, secure.

No mainnet. Provide step-by-step reasoning.
"""}]
)
print(response.content[0].text)
