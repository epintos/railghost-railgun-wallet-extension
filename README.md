# RailGhost - Railgun wallet extension

<img src="public/railghost.png" alt="RailGhost Image" width="200" />

This is a project to explore the [Railgun Wallet SDK](https://github.com/Railgun-Community/wallet).

Currently, Railgun has desktop and mobile wallets, so I decided to create a browser extension wallet to test different flows of the Wallet SDK.

The React codebase is a quick prototype using Ethereum Sepolia and three tokens, which you can find [here](./src/contexts/WalletContext.tsx).

The wallet is not complete, as it is missing some basic flows, but it allows the user to:
- Create or import an existing wallet
- Display private and public funds
- Approve and shield an ERC-20 public token

# Screenshots

<div style="display: flex; gap: 10px;">
  <img src="./public/setup.png" alt="Setup" width="200" />
  <img src="./public/new.png" alt="New" width="200" />
  <img src="./public/import.png" alt="Import" width="200" />
  <img src="./public/private.png" alt="Private" width="200" />
  <img src="./public/public.png" alt="Public" width="200" />
  <img src="./public/approve.png" alt="Approve" width="200" />
  <img src="./public/not-approved.png" alt="NotApproved" width="200" />
</div>
