# Royal Spin Casino - API Documentation

Complete API reference for the Royal Spin Casino platform.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

Get a token by logging in via the `/auth/login` endpoint.

## Response Format

All responses are JSON with the following structure:

Success:
```json
{
  "data": {},
  "message": "Success message"
}
```

Error:
```json
{
  "error": "Error message",
  "status": 400
}
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

**Status Codes:** 201 (Created), 400 (Bad Request), 409 (Conflict)

---

### Login User
**POST** `/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username"
  }
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized), 403 (Forbidden)

---

### Get Current User
**GET** `/auth/me`

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "first_name": "John",
  "last_name": "Doe",
  "kyc_status": "pending",
  "account_status": "active",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found)

---

### Update Profile
**PUT** `/auth/profile`

Update user profile information.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1990-01-15",
  "country": "United States",
  "phone": "+1-555-0123"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Smith"
  }
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized)

---

## Wallet Endpoints

### Get Wallet Balance
**GET** `/wallet/balance`

Get the user's current wallet balance and statistics.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "balance": 1500.50,
  "currency": "USD",
  "total_deposited": 5000.00,
  "total_withdrawn": 3000.00,
  "total_wagered": 2500.00,
  "total_won": 1000.50
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found)

---

### Create Deposit
**POST** `/wallet/deposit`

Create a Stripe payment intent for deposit.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "amount": 100.00,
  "currency": "USD"
}
```

**Response:**
```json
{
  "clientSecret": "pi_1234567890_secret_...",
  "paymentIntentId": "pi_1234567890",
  "depositId": "uuid"
}
```

**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized)

---

### Confirm Deposit
**POST** `/wallet/deposit/confirm`

Confirm a completed Stripe payment and credit the wallet.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "paymentIntentId": "pi_1234567890",
  "depositId": "uuid"
}
```

**Response:**
```json
{
  "message": "Deposit confirmed successfully",
  "transactionId": "uuid",
  "amount": 100.00,
  "newBalance": 1600.50
}
```

**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found)

---

### Request Withdrawal
**POST** `/wallet/withdrawal`

Request a withdrawal from the wallet.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "amount": 500.00,
  "paymentMethod": "bank_transfer"
}
```

**Response:**
```json
{
  "message": "Withdrawal request submitted",
  "withdrawalId": "uuid",
  "amount": 500.00,
  "status": "pending",
  "newBalance": 1100.50
}
```

**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found)

---

### Get Withdrawal Status
**GET** `/wallet/withdrawal/{withdrawalId}`

Check the status of a withdrawal request.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "id": "uuid",
  "amount": 500.00,
  "status": "processing",
  "payment_method": "bank_transfer",
  "created_at": "2024-01-15T10:00:00Z",
  "completed_at": null
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found)

---

### Get Transaction History
**GET** `/wallet/transactions?limit=50&offset=0`

Get user's transaction history.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 50)
- `offset` (optional): Number of transactions to skip (default: 0)

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "deposit",
      "amount": 100.00,
      "balance_before": 1500.50,
      "balance_after": 1600.50,
      "status": "completed",
      "payment_method": "stripe",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized)

---

## Games Endpoints

### List All Games
**GET** `/games`

Get all available slot machines.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Buffalo Gold",
    "theme": "buffalo_gold",
    "description": "Classic buffalo-themed slot with Hold & Spin bonus",
    "rtp": 0.94,
    "volatility": "high",
    "min_bet": 0.25,
    "max_bet": 100,
    "paylines": 40,
    "reels": 5
  }
]
```

**Status Codes:** 200 (OK)

---

### Get Game Details
**GET** `/games/{gameId}`

Get details for a specific game.

**Response:**
```json
{
  "id": "uuid",
  "name": "Buffalo Gold",
  "theme": "buffalo_gold",
  "description": "Classic buffalo-themed slot with Hold & Spin bonus",
  "rtp": 0.94,
  "volatility": "high",
  "min_bet": 0.25,
  "max_bet": 100,
  "paylines": 40,
  "reels": 5
}
```

**Status Codes:** 200 (OK), 404 (Not Found)

---

### Start Game Session
**POST** `/games/session/start`

Start a new gaming session.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "gameId": "uuid"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "gameId": "uuid",
  "minBet": 0.25,
  "maxBet": 100
}
```

**Status Codes:** 201 (Created), 401 (Unauthorized), 404 (Not Found)

---

### Execute Spin
**POST** `/games/spin`

Execute a spin on a slot machine.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "sessionId": "uuid",
  "gameId": "uuid",
  "betAmount": 10.00
}
```

**Response:**
```json
{
  "spinId": "uuid",
  "sessionId": "uuid",
  "betAmount": 10.00,
  "winAmount": 25.00,
  "isWin": true,
  "result": {
    "reels": [2, 1, 3],
    "symbols": "bell"
  },
  "balanceBefore": 1600.50,
  "balanceAfter": 1615.50,
  "rngSeed": "hash_for_verification"
}
```

**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized)

---

### End Game Session
**POST** `/games/session/end`

End a gaming session.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "message": "Session ended",
  "session": {
    "id": "uuid",
    "total_spins": 15,
    "total_bet": 150.00,
    "total_won": 200.00,
    "net_result": 50.00
  }
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found)

---

### Get Session History
**GET** `/games/sessions/history?limit=20&offset=0`

Get user's gaming session history.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `limit` (optional): Number of sessions to return (default: 20)
- `offset` (optional): Number of sessions to skip (default: 0)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Buffalo Gold",
    "theme": "buffalo_gold",
    "total_spins": 15,
    "total_bet": 150.00,
    "total_won": 200.00,
    "net_result": 50.00,
    "session_start": "2024-01-15T10:00:00Z",
    "session_end": "2024-01-15T10:15:00Z"
  }
]
```

**Status Codes:** 200 (OK), 401 (Unauthorized)

---

## Transactions Endpoints

### Get All Transactions
**GET** `/transactions?limit=50&offset=0&type=deposit`

Get user's transaction history with optional filtering.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `limit` (optional): Number of transactions (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by type (deposit, withdrawal, bet, win)

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "deposit",
      "amount": 100.00,
      "balance_before": 1500.50,
      "balance_after": 1600.50,
      "status": "completed",
      "payment_method": "stripe",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized)

---

### Get Transaction Details
**GET** `/transactions/{transactionId}`

Get details for a specific transaction.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "id": "uuid",
  "type": "deposit",
  "amount": 100.00,
  "balance_before": 1500.50,
  "balance_after": 1600.50,
  "status": "completed",
  "payment_method": "stripe",
  "reference_id": "pi_1234567890",
  "description": "Deposit via Stripe",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized), 404 (Not Found)

---

### Get Transaction Summary
**GET** `/transactions/summary/stats`

Get transaction statistics for the user.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "total_transactions": 45,
  "total_deposits": 5000.00,
  "total_withdrawals": 3000.00,
  "total_wagered": 2500.00,
  "total_won": 1000.50
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized)

---

## Admin Endpoints

### Get Compliance Logs
**GET** `/admin/compliance/logs?limit=100&offset=0&userId=uuid`

Get compliance logs (admin only).

**Headers:** `Authorization: Bearer {admin_token}`

**Query Parameters:**
- `limit` (optional): Number of logs (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `userId` (optional): Filter by user ID

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "event_type": "login",
      "description": "User logged in",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "limit": 100,
  "offset": 0
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized), 403 (Forbidden)

---

### Get Platform Analytics
**GET** `/admin/analytics/overview`

Get platform-wide analytics (admin only).

**Headers:** `Authorization: Bearer {admin_token}`

**Response:**
```json
{
  "totalUsers": 1250,
  "deposits": {
    "count": 3400,
    "total": 125000.00
  },
  "withdrawals": {
    "count": 2100,
    "total": 85000.00
  },
  "totalWagered": 450000.00,
  "totalWon": 425000.00,
  "activeSessions": 42
}
```

**Status Codes:** 200 (OK), 401 (Unauthorized), 403 (Forbidden)

---

### Verify KYC
**POST** `/admin/kyc/verify`

Verify or reject a user's KYC (admin only).

**Headers:** `Authorization: Bearer {admin_token}`

**Request Body:**
```json
{
  "userId": "uuid",
  "status": "verified"
}
```

**Response:**
```json
{
  "message": "KYC status updated to verified",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "kyc_status": "verified"
  }
}
```

**Status Codes:** 200 (OK), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden)

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

Currently not implemented but recommended for production:
- 100 requests per minute per user
- 1000 requests per minute per IP

---

## Webhooks

Stripe webhooks for payment events:
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Charge refunded

---

## Testing

Use the following test credentials:

**Test Card (Stripe):**
- Number: 4242 4242 4242 4242
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

**Test Account:**
- Email: test@example.com
- Password: TestPassword123

---

## Support

For API issues or questions, contact: api-support@royalspincasino.com
