# Revalidation Webhook API

This API endpoint allows external services (like the dashboard app) to trigger cache revalidation for product data.

## Endpoint

**POST** `/api/revalidate/products`

## Authentication

The endpoint requires a Bearer token in the `Authorization` header:

```
Authorization: Bearer <REVALIDATE_SECRET_TOKEN>
```

## Environment Variables

### Required in Ecommerce App

- `REVALIDATE_SECRET_TOKEN` - Secret token used to authenticate webhook requests. Should be a strong, randomly generated string.

### Required in Dashboard App

- `NEXT_PUBLIC_ECOMMERCE_URL` - The base URL of the ecommerce app (e.g., `https://ecommerce.example.com` or `http://localhost:3000`)
- `REVALIDATE_SECRET_TOKEN` - Must match the same token configured in the ecommerce app.

## Usage Example

```bash
curl -X POST https://ecommerce.example.com/api/revalidate/products \
  -H "Authorization: Bearer your-secret-token-here" \
  -H "Content-Type: application/json"
```

## Response

**Success (200):**
```json
{
  "success": true,
  "message": "Products tag revalidated successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error (401):**
```json
{
  "error": "Missing or invalid authorization header"
}
```

**Error (403):**
```json
{
  "error": "Invalid authorization token"
}
```

## Security

- Always use HTTPS in production
- Use a strong, randomly generated secret token
- Never commit the secret token to version control
- Rotate the token periodically for enhanced security

## How It Works

1. When products are created, updated, deleted, or their status is toggled in the dashboard app, it calls this webhook
2. The webhook verifies the authorization token
3. If valid, it calls `revalidateTag("products", "max")` which invalidates all cached data tagged with "products"
4. The next request to any product-related endpoint will fetch fresh data from the database
