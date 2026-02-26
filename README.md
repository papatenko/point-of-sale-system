# Point of Sale

# Frontend

## Views / Frontend Components

### Transactions Views
- **Staff Transactions** – For employees to process customer purchases.

### Product / Inventory Views
- **Products / Inventory** – Display all items with price, available quantity, tags, reviews, and images.

#### Store Items
| Field | Description |
|-------|-------------|
| ID | Unique item identifier |
| Name | Item name |
| Price | Item price |
| Reviews | Customer reviews |

- **Cart View** – Shows items added to the cart; accessible by both customers and staff.

### User / Account Views
- **Customers** – Customer account information:
  - Name
  - Phone Number
  - Address
  - Purchase History / Receipts
  - Payment History
  - Loyalty Points
  - Favorites

- **Shopping Cart / My Cart** – Customers can view, add, or remove items from their cart.

### Staff Views
- **Employees** – Employee management dashboard for:
  - Cashiers
  - Self-Transactions Staff
  - Managers
  - Inventory *(if a customer asks, they should be able to check if an item is in stock)*

- **Managers** – Full dashboard to manage:
  - Inventory (add more of an item or add a new item)
  - Employees
  - Customer Data

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
