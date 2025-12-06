# OurDukan - Local Business Platform

A Next.js application for supporting local businesses by creating a platform where shopkeepers can list products and local users can search, order, and earn reward points.

## Features

### For Customers
- Search for products from local shops
- View product details and shop information
- Add products to cart and checkout
- Track orders
- Earn and redeem reward points

### For Shopkeepers
- Dashboard with business metrics
- Product management (add, edit, delete, stock management)
- Order management (view and update order status)
- AI-powered analytics and insights
- Reward points system

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **AI Analytics**: Google Gemini API
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or cloud)
- Google Gemini API key (for AI analytics) - Optional, defaults to provided key

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/ourdukan
NEXTAUTH_SECRET=your-secret-key-here-generate-a-random-string
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key-here
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Shopkeepers

1. Register an account with role "Shopkeeper"
2. Complete shop setup (name, address, location, reward rate)
3. Add products to your shop
4. View and manage orders
5. Check AI-powered analytics for insights

### For Customers

1. Register an account with role "Customer"
2. Search for products
3. Add products to cart
4. Complete checkout (mock payment)
5. Track orders and earn reward points
6. Redeem rewards

## Project Structure

```
app/
  (auth)/          # Authentication pages
  (customer)/      # Customer-facing pages
  (shopkeeper)/    # Shopkeeper dashboard pages
  api/             # API routes
components/        # Reusable components
lib/               # Utilities and models
  models/          # MongoDB models
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js (generate a random string)
- `NEXTAUTH_URL`: Base URL of your application
- `GEMINI_API_KEY`: Google Gemini API key for AI analytics (optional, defaults to provided key)

## Notes

- This is a prototype with mock payment and location services
- Reward points are automatically calculated based on shop's reward rate
- AI analytics use Google Gemini API (key is provided by default)
- Shopkeepers must complete shop setup before adding products

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Mongoose Documentation](https://mongoosejs.com)
