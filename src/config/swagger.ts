import config from './index';

const isProd = config.isProd;

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Interdiscount Clone API',
    version: '1.0.0',
    description: `
## Swiss Electronics Retailer API

Production-grade REST API powering the Interdiscount.ch clone — a Swiss electronics e-commerce platform with multi-store management, click & collect, and multilingual support.

### Demo Credentials

All demo accounts use password: **\`Password123!\`**

| Role | Email | Access |
|------|-------|--------|
| Super Admin | \`admin.de@interdiscount-clone.ch\` | Full platform access |
| Platform Admin | \`moderator.de@interdiscount-clone.ch\` | Platform management |
| Store Manager | \`manager.de@interdiscount-clone.ch\` | Store & inventory management |
| Warehouse Staff | \`staff.de@interdiscount-clone.ch\` | Inventory & pickup orders |
| Customer Support | \`support.de@interdiscount-clone.ch\` | Order & review management |
| Customer | \`customer.de@interdiscount-clone.ch\` | Shopping & orders |

### User Types & Access Levels

| Type | Admin Panel | Store Panel | Customer Portal | Public |
|------|:-----------:|:-----------:|:---------------:|:------:|
| super_admin | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| store_manager | ❌ | ✅ | ✅ | ✅ |
| warehouse_staff | ❌ | ✅ | ❌ | ✅ |
| customer_support | ✅ (limited) | ❌ | ❌ | ✅ |
| customer | ❌ | ❌ | ✅ | ✅ |

### Multilingual Support

All endpoints accept the \`Accept-Language\` header with values: **de**, **fr**, **it**, **en**.
Translatable content (product names, descriptions, categories) is returned in the requested language.

### Authentication Flow

1. **Login** → \`POST /api/v1/public/auth/login\` → returns \`accessToken\` + \`refreshToken\`
2. **Use token** → \`Authorization: Bearer {accessToken}\` header
3. **Refresh** → \`POST /api/v1/public/auth/refresh\` with refresh token
4. **Logout** → \`POST /api/v1/public/auth/logout\` (not yet implemented)
`,
  },
  servers: [
    ...(isProd
      ? [{ url: 'https://interdiscount-api.swiftapp.ch', description: 'Production' }]
      : []),
    { url: `http://localhost:${config.port}`, description: 'Development' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Login via `/api/v1/public/auth/login` to get a token',
      },
    },
    parameters: {
      AcceptLanguage: {
        name: 'Accept-Language',
        in: 'header',
        schema: { type: 'string', enum: ['de', 'fr', 'it', 'en'], default: 'de' },
        description: 'Response language',
      },
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'MongoDB ObjectId',
      },
      PageParam: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1, minimum: 1 },
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'integer' },
              message: { type: 'string' },
            },
          },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'array', items: { type: 'object' } },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
              hasNextPage: { type: 'boolean' },
              hasPrevPage: { type: 'boolean' },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin.de@interdiscount-clone.ch' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  user_type: { type: 'string' },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  access_token: { type: 'string' },
                  refresh_token: { type: 'string' },
                },
              },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'first_name', 'last_name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, description: 'Must have uppercase, lowercase, digit, and special character' },
          first_name: { type: 'string', maxLength: 100 },
          last_name: { type: 'string', maxLength: 100 },
          phone: { type: 'string' },
          preferred_language: { type: 'string', enum: ['de', 'fr', 'it', 'en'] },
        },
      },
      Canton: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          code: { type: 'string', example: 'ZH' },
          name: { type: 'object', properties: { de: { type: 'string' }, fr: { type: 'string' }, it: { type: 'string' }, en: { type: 'string' } } },
          capital: { type: 'string' },
          population: { type: 'integer' },
          area_km2: { type: 'number' },
        },
      },
      City: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          postal_code: { type: 'string' },
          canton_id: { type: 'string' },
          population: { type: 'integer' },
        },
      },
      Store: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          address: { type: 'string' },
          city_id: { type: 'string' },
          canton_id: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          is_active: { type: 'boolean' },
          opening_hours: { type: 'object' },
          coordinates: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } } },
        },
      },
      Category: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'object', properties: { de: { type: 'string' }, fr: { type: 'string' }, it: { type: 'string' }, en: { type: 'string' } } },
          slug: { type: 'string' },
          parent_id: { type: 'string' },
          icon: { type: 'string' },
          is_active: { type: 'boolean' },
        },
      },
      Brand: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          logo_url: { type: 'string' },
          is_active: { type: 'boolean' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'object', properties: { de: { type: 'string' }, fr: { type: 'string' }, it: { type: 'string' }, en: { type: 'string' } } },
          description: { type: 'object', properties: { de: { type: 'string' }, fr: { type: 'string' }, it: { type: 'string' }, en: { type: 'string' } } },
          slug: { type: 'string' },
          sku: { type: 'string' },
          price: { type: 'number' },
          sale_price: { type: 'number' },
          brand_id: { type: 'string' },
          category_id: { type: 'string' },
          images: { type: 'array', items: { type: 'object' } },
          specifications: { type: 'object' },
          stock: { type: 'integer' },
          is_active: { type: 'boolean' },
          rating_average: { type: 'number' },
          rating_count: { type: 'integer' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          email: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          phone: { type: 'string' },
          user_type: { type: 'string', enum: ['customer', 'store_manager', 'warehouse_staff', 'customer_support', 'admin', 'super_admin'] },
          status: { type: 'string', enum: ['active', 'pending', 'suspended', 'inactive'] },
          preferred_language: { type: 'string', enum: ['de', 'fr', 'it', 'en'] },
          store_id: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          order_number: { type: 'string' },
          user_id: { type: 'string' },
          items: { type: 'array', items: { type: 'object' } },
          total: { type: 'number' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] },
          delivery_type: { type: 'string', enum: ['home_delivery', 'store_pickup'] },
          shipping_address: { type: 'object' },
          store_id: { type: 'string' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  tags: [
    { name: 'Health', description: 'Health check endpoint' },
    { name: 'Auth', description: 'Authentication & registration' },
    { name: 'Cantons', description: 'Swiss cantons (public)' },
    { name: 'Cities', description: 'Swiss cities (public)' },
    { name: 'Stores', description: 'Store locations (public)' },
    { name: 'Categories', description: 'Product categories (public)' },
    { name: 'Brands', description: 'Product brands (public)' },
    { name: 'Products', description: 'Product listings (public)' },
    { name: 'Search', description: 'Product search & autocomplete (public)' },
    { name: 'Customer Profile', description: 'User profile management (auth)' },
    { name: 'Addresses', description: 'Customer address management (auth)' },
    { name: 'Wishlist', description: 'Customer wishlist (auth)' },
    { name: 'Reviews', description: 'Product reviews (auth)' },
    { name: 'Coupons', description: 'Coupon usage (auth)' },
    { name: 'Notifications', description: 'User notifications (auth)' },
    { name: 'Orders', description: 'Customer orders (auth)' },
    { name: 'Payments', description: 'Payment processing (auth)' },
    { name: 'Store Inventory', description: 'Store inventory management (store role)' },
    { name: 'Store Dashboard', description: 'Store dashboard & stats (store role)' },
    { name: 'Store Pickup', description: 'Store pickup orders (store role)' },
    { name: 'Store Transfers', description: 'Inventory transfers between stores (store role)' },
    { name: 'Store Promotions', description: 'Store promotions (store role)' },
    { name: 'Store Info', description: 'Store profile & settings (store role)' },
    { name: 'Store Analytics', description: 'Store-level analytics (store role)' },
    { name: 'Admin Dashboard', description: 'Platform dashboard (admin)' },
    { name: 'Admin Users', description: 'User management (admin)' },
    { name: 'Admin Products', description: 'Product management (admin)' },
    { name: 'Admin Categories', description: 'Category management (admin)' },
    { name: 'Admin Brands', description: 'Brand management (admin)' },
    { name: 'Admin Stores', description: 'Store management (admin)' },
    { name: 'Admin Transfers', description: 'Transfer management (admin)' },
    { name: 'Admin Orders', description: 'Order management (admin)' },
    { name: 'Admin Reviews', description: 'Review moderation (admin)' },
    { name: 'Admin Coupons', description: 'Coupon management (admin)' },
    { name: 'Admin Locations', description: 'Canton & city management (admin)' },
    { name: 'Admin RBAC', description: 'Roles & permissions management (admin)' },
    { name: 'Admin Analytics', description: 'Platform-wide analytics (admin)' },
  ],
  paths: {
    // ═══════════════════════════════════════════════════════════════
    // HEALTH
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { 200: { description: 'API is healthy', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/public/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
        responses: {
          201: { description: 'Registration successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/v1/public/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/public/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Send refresh_token in body to get new tokens',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refresh_token'], properties: { refresh_token: { type: 'string' } } } } } },
        responses: { 200: { description: 'New tokens issued' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },
    '/api/v1/public/auth/verify-email/{token}': {
      get: {
        tags: ['Auth'],
        summary: 'Verify email address',
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Email verified' } },
      },
    },
    '/api/v1/public/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: { 200: { description: 'Reset email sent (if account exists)' } },
      },
    },
    '/api/v1/public/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 8 } } } } } },
        responses: { 200: { description: 'Password reset successful' } },
      },
    },
    '/api/v1/public/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Resend verification email',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: { 200: { description: 'Verification email sent' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // CANTONS (PUBLIC)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/public/cantons': {
      get: {
        tags: ['Cantons'],
        summary: 'Get all cantons',
        parameters: [{ $ref: '#/components/parameters/AcceptLanguage' }, { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
        responses: { 200: { description: 'List of cantons', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
      },
    },
    '/api/v1/public/cantons/{id}': {
      get: {
        tags: ['Cantons'],
        summary: 'Get canton by ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }, { $ref: '#/components/parameters/AcceptLanguage' }],
        responses: { 200: { description: 'Canton details' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // CITIES (PUBLIC)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/public/cities': {
      get: {
        tags: ['Cities'],
        summary: 'Get all cities',
        parameters: [{ $ref: '#/components/parameters/AcceptLanguage' }, { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
        responses: { 200: { description: 'List of cities' } },
      },
    },
    '/api/v1/public/cities/{id}': {
      get: {
        tags: ['Cities'],
        summary: 'Get city by ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }, { $ref: '#/components/parameters/AcceptLanguage' }],
        responses: { 200: { description: 'City details' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // STORES (PUBLIC)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/public/stores': {
      get: {
        tags: ['Stores'],
        summary: 'Get all stores',
        parameters: [{ $ref: '#/components/parameters/AcceptLanguage' }, { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }, { name: 'canton_id', in: 'query', schema: { type: 'string' } }, { name: 'city_id', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'List of stores' } },
      },
    },
    '/api/v1/public/stores/{id}': {
      get: {
        tags: ['Stores'],
        summary: 'Get store by ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Store details' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/api/v1/public/stores/nearby': {
      get: {
        tags: ['Stores'],
        summary: 'Find nearby stores',
        parameters: [{ name: 'lat', in: 'query', required: true, schema: { type: 'number' } }, { name: 'lng', in: 'query', required: true, schema: { type: 'number' } }, { name: 'radius', in: 'query', schema: { type: 'number', default: 10 } }],
        responses: { 200: { description: 'Nearby stores' } },
      },
    },
    '/api/v1/public/stores/{id}/availability': {
      get: {
        tags: ['Stores'],
        summary: 'Check product availability at store',
        parameters: [{ $ref: '#/components/parameters/IdParam' }, { name: 'product_id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Availability status' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // CATEGORIES (PUBLIC)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/public/categories': {
      get: {
        tags: ['Categories'],
        summary: 'Get all categories',
        parameters: [{ $ref: '#/components/parameters/AcceptLanguage' }],
        responses: { 200: { description: 'Category tree' } },
      },
    },
    '/api/v1/public/categories/{id}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category by ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }, { $ref: '#/components/parameters/AcceptLanguage' }],
        responses: { 200: { description: 'Category details' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // BRANDS (PUBLIC)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/public/brands': {
      get: {
        tags: ['Brands'],
        summary: 'Get all brands',
        parameters: [{ $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
        responses: { 200: { description: 'List of brands' } },
      },
    },
    '/api/v1/public/brands/{id}': {
      get: {
        tags: ['Brands'],
        summary: 'Get brand by ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Brand details' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // PRODUCTS (PUBLIC)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/public/products': {
      get: {
        tags: ['Products'],
        summary: 'Get all products',
        parameters: [
          { $ref: '#/components/parameters/AcceptLanguage' },
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/LimitParam' },
          { name: 'category_id', in: 'query', schema: { type: 'string' } },
          { name: 'brand_id', in: 'query', schema: { type: 'string' } },
          { name: 'min_price', in: 'query', schema: { type: 'number' } },
          { name: 'max_price', in: 'query', schema: { type: 'number' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'newest', 'rating', 'popular'] } },
        ],
        responses: { 200: { description: 'Paginated product list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
      },
    },
    '/api/v1/public/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by ID',
        parameters: [{ $ref: '#/components/parameters/IdParam' }, { $ref: '#/components/parameters/AcceptLanguage' }],
        responses: { 200: { description: 'Product details' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/api/v1/public/products/slug/{slug}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }, { $ref: '#/components/parameters/AcceptLanguage' }],
        responses: { 200: { description: 'Product details' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/api/v1/public/products/{id}/reviews': {
      get: {
        tags: ['Products'],
        summary: 'Get product reviews',
        parameters: [{ $ref: '#/components/parameters/IdParam' }, { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
        responses: { 200: { description: 'Product reviews' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // SEARCH (PUBLIC)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/public/search': {
      get: {
        tags: ['Search'],
        summary: 'Search products',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }, { $ref: '#/components/parameters/AcceptLanguage' }, { $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
        responses: { 200: { description: 'Search results' } },
      },
    },
    '/api/v1/public/search/autocomplete': {
      get: {
        tags: ['Search'],
        summary: 'Autocomplete suggestions',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }, { $ref: '#/components/parameters/AcceptLanguage' }],
        responses: { 200: { description: 'Autocomplete suggestions' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // CUSTOMER PROFILE (AUTH)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/customer/profile': {
      get: {
        tags: ['Customer Profile'],
        summary: 'Get profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User profile' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
      put: {
        tags: ['Customer Profile'],
        summary: 'Update profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profile updated' }, 401: { $ref: '#/components/responses/Unauthorized' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADDRESSES (AUTH)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/customer/addresses': {
      get: {
        tags: ['Addresses'],
        summary: 'List addresses',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User addresses' } },
      },
      post: {
        tags: ['Addresses'],
        summary: 'Add address',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Address created' } },
      },
    },
    '/api/v1/customer/addresses/{id}': {
      put: {
        tags: ['Addresses'],
        summary: 'Update address',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Address updated' } },
      },
      delete: {
        tags: ['Addresses'],
        summary: 'Delete address',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Address deleted' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // WISHLIST (AUTH)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/customer/wishlist': {
      get: {
        tags: ['Wishlist'],
        summary: 'Get wishlist',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Wishlist items' } },
      },
      post: {
        tags: ['Wishlist'],
        summary: 'Add to wishlist',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['product_id'], properties: { product_id: { type: 'string' } } } } } },
        responses: { 201: { description: 'Added to wishlist' } },
      },
    },
    '/api/v1/customer/wishlist/{id}': {
      delete: {
        tags: ['Wishlist'],
        summary: 'Remove from wishlist',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Removed from wishlist' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // REVIEWS (AUTH)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/customer/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'Get user reviews',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User reviews' } },
      },
      post: {
        tags: ['Reviews'],
        summary: 'Create review',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Review created' } },
      },
    },
    '/api/v1/customer/reviews/{id}': {
      put: {
        tags: ['Reviews'],
        summary: 'Update review',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Review updated' } },
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Delete review',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Review deleted' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // COUPONS (AUTH)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/customer/coupons/validate': {
      post: {
        tags: ['Coupons'],
        summary: 'Validate coupon code',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code'], properties: { code: { type: 'string' } } } } } },
        responses: { 200: { description: 'Coupon validation result' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // NOTIFICATIONS (AUTH)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/customer/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get notifications',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User notifications' } },
      },
    },
    '/api/v1/customer/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Marked as read' } },
      },
    },
    '/api/v1/customer/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'All marked as read' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ORDERS (AUTH)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/customer/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Get customer orders',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
        responses: { 200: { description: 'Order list' } },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create order',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Order created' } },
      },
    },
    '/api/v1/customer/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order details',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Order details' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/api/v1/customer/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Cancel order',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Order cancelled' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // PAYMENTS (AUTH)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/customer/payments/create-intent': {
      post: {
        tags: ['Payments'],
        summary: 'Create Stripe payment intent',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Payment intent created' } },
      },
    },
    '/api/v1/customer/payments/{id}/confirm': {
      post: {
        tags: ['Payments'],
        summary: 'Confirm payment',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Payment confirmed' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // WEBHOOKS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/webhooks/stripe': {
      post: {
        tags: ['Payments'],
        summary: 'Stripe webhook',
        description: 'Receives Stripe payment events (verified by signature)',
        responses: { 200: { description: 'Webhook processed' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // STORE INVENTORY (STORE ROLE)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/store/inventory': {
      get: {
        tags: ['Store Inventory'],
        summary: 'Get store inventory',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
        responses: { 200: { description: 'Inventory items' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' } },
      },
    },
    '/api/v1/store/inventory/{id}': {
      put: {
        tags: ['Store Inventory'],
        summary: 'Update inventory item',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Inventory updated' } },
      },
    },
    '/api/v1/store/inventory/bulk': {
      put: {
        tags: ['Store Inventory'],
        summary: 'Bulk update inventory',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Bulk update result' } },
      },
    },
    '/api/v1/store/inventory/low-stock': {
      get: {
        tags: ['Store Inventory'],
        summary: 'Get low stock items',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Low stock items' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // STORE DASHBOARD (STORE ROLE)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/store/dashboard/stats': {
      get: {
        tags: ['Store Dashboard'],
        summary: 'Get store dashboard stats',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard stats' } },
      },
    },
    '/api/v1/store/dashboard/recent-orders': {
      get: {
        tags: ['Store Dashboard'],
        summary: 'Recent orders for store',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Recent orders' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // STORE PICKUP ORDERS (STORE ROLE)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/store/pickup-orders': {
      get: {
        tags: ['Store Pickup'],
        summary: 'Get pickup orders',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Pickup orders' } },
      },
    },
    '/api/v1/store/pickup-orders/{id}/status': {
      patch: {
        tags: ['Store Pickup'],
        summary: 'Update pickup order status',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Status updated' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // STORE TRANSFERS (STORE ROLE)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/store/transfers': {
      get: {
        tags: ['Store Transfers'],
        summary: 'Get store transfers',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Transfer list' } },
      },
      post: {
        tags: ['Store Transfers'],
        summary: 'Request inventory transfer',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Transfer requested' } },
      },
    },
    '/api/v1/store/transfers/{id}': {
      get: {
        tags: ['Store Transfers'],
        summary: 'Get transfer details',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Transfer details' } },
      },
    },
    '/api/v1/store/transfers/{id}/status': {
      patch: {
        tags: ['Store Transfers'],
        summary: 'Update transfer status',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Status updated' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // STORE PROMOTIONS (STORE ROLE)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/store/promotions': {
      get: {
        tags: ['Store Promotions'],
        summary: 'Get store promotions',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Promotion list' } },
      },
      post: {
        tags: ['Store Promotions'],
        summary: 'Create promotion',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Promotion created' } },
      },
    },
    '/api/v1/store/promotions/{id}': {
      put: {
        tags: ['Store Promotions'],
        summary: 'Update promotion',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Promotion updated' } },
      },
      delete: {
        tags: ['Store Promotions'],
        summary: 'Delete promotion',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Promotion deleted' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // STORE INFO (STORE ROLE)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/store/info': {
      get: {
        tags: ['Store Info'],
        summary: 'Get store profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Store profile' } },
      },
      put: {
        tags: ['Store Info'],
        summary: 'Update store profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Store updated' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // STORE ANALYTICS (STORE ROLE)
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/store/analytics/sales': {
      get: {
        tags: ['Store Analytics'],
        summary: 'Store sales analytics',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Sales data' } },
      },
    },
    '/api/v1/store/analytics/products': {
      get: {
        tags: ['Store Analytics'],
        summary: 'Store product performance',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Product analytics' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN DASHBOARD
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/dashboard/stats': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'Platform stats overview',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard stats' }, 401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' } },
      },
    },
    '/api/v1/admin/dashboard/recent-activity': {
      get: {
        tags: ['Admin Dashboard'],
        summary: 'Recent platform activity',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Recent activity' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN USERS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/users': {
      get: {
        tags: ['Admin Users'],
        summary: 'List all users',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }, { name: 'user_type', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'User list' } },
      },
      post: {
        tags: ['Admin Users'],
        summary: 'Create user',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'User created' } },
      },
    },
    '/api/v1/admin/users/{id}': {
      get: {
        tags: ['Admin Users'],
        summary: 'Get user details',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'User details' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
      put: {
        tags: ['Admin Users'],
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'User updated' } },
      },
    },
    '/api/v1/admin/users/{id}/status': {
      patch: {
        tags: ['Admin Users'],
        summary: 'Change user status',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Status updated' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN PRODUCTS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/products': {
      get: {
        tags: ['Admin Products'],
        summary: 'List all products (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }],
        responses: { 200: { description: 'Product list' } },
      },
      post: {
        tags: ['Admin Products'],
        summary: 'Create product',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Product created' } },
      },
    },
    '/api/v1/admin/products/{id}': {
      get: {
        tags: ['Admin Products'],
        summary: 'Get product details (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Product details' } },
      },
      put: {
        tags: ['Admin Products'],
        summary: 'Update product',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Product updated' } },
      },
      delete: {
        tags: ['Admin Products'],
        summary: 'Delete product',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Product deleted' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN CATEGORIES
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/categories': {
      get: {
        tags: ['Admin Categories'],
        summary: 'List categories (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Category list' } },
      },
      post: {
        tags: ['Admin Categories'],
        summary: 'Create category',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Category created' } },
      },
    },
    '/api/v1/admin/categories/{id}': {
      put: {
        tags: ['Admin Categories'],
        summary: 'Update category',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Category updated' } },
      },
      delete: {
        tags: ['Admin Categories'],
        summary: 'Delete category',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Category deleted' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN BRANDS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/brands': {
      get: {
        tags: ['Admin Brands'],
        summary: 'List brands (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Brand list' } },
      },
      post: {
        tags: ['Admin Brands'],
        summary: 'Create brand',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Brand created' } },
      },
    },
    '/api/v1/admin/brands/{id}': {
      put: {
        tags: ['Admin Brands'],
        summary: 'Update brand',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Brand updated' } },
      },
      delete: {
        tags: ['Admin Brands'],
        summary: 'Delete brand',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Brand deleted' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN STORES
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/stores': {
      get: {
        tags: ['Admin Stores'],
        summary: 'List stores (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Store list' } },
      },
      post: {
        tags: ['Admin Stores'],
        summary: 'Create store',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Store created' } },
      },
    },
    '/api/v1/admin/stores/{id}': {
      get: {
        tags: ['Admin Stores'],
        summary: 'Get store details (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Store details' } },
      },
      put: {
        tags: ['Admin Stores'],
        summary: 'Update store',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Store updated' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN TRANSFERS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/transfers': {
      get: {
        tags: ['Admin Transfers'],
        summary: 'List all transfers',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Transfer list' } },
      },
    },
    '/api/v1/admin/transfers/{id}': {
      get: {
        tags: ['Admin Transfers'],
        summary: 'Get transfer details',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Transfer details' } },
      },
    },
    '/api/v1/admin/transfers/{id}/approve': {
      patch: {
        tags: ['Admin Transfers'],
        summary: 'Approve transfer',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Transfer approved' } },
      },
    },
    '/api/v1/admin/transfers/{id}/reject': {
      patch: {
        tags: ['Admin Transfers'],
        summary: 'Reject transfer',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Transfer rejected' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN ORDERS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/orders': {
      get: {
        tags: ['Admin Orders'],
        summary: 'List all orders (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/PageParam' }, { $ref: '#/components/parameters/LimitParam' }, { name: 'status', in: 'query', schema: { type: 'string' } }],
        responses: { 200: { description: 'Order list' } },
      },
    },
    '/api/v1/admin/orders/{id}': {
      get: {
        tags: ['Admin Orders'],
        summary: 'Get order details (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Order details' } },
      },
    },
    '/api/v1/admin/orders/{id}/status': {
      patch: {
        tags: ['Admin Orders'],
        summary: 'Update order status',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Status updated' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN REVIEWS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/reviews': {
      get: {
        tags: ['Admin Reviews'],
        summary: 'List all reviews (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Review list' } },
      },
    },
    '/api/v1/admin/reviews/{id}': {
      delete: {
        tags: ['Admin Reviews'],
        summary: 'Delete review',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Review deleted' } },
      },
    },
    '/api/v1/admin/reviews/{id}/status': {
      patch: {
        tags: ['Admin Reviews'],
        summary: 'Update review status (approve/reject)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Status updated' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN COUPONS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/coupons': {
      get: {
        tags: ['Admin Coupons'],
        summary: 'List coupons',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Coupon list' } },
      },
      post: {
        tags: ['Admin Coupons'],
        summary: 'Create coupon',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Coupon created' } },
      },
    },
    '/api/v1/admin/coupons/{id}': {
      get: {
        tags: ['Admin Coupons'],
        summary: 'Get coupon details',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Coupon details' } },
      },
      put: {
        tags: ['Admin Coupons'],
        summary: 'Update coupon',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Coupon updated' } },
      },
      delete: {
        tags: ['Admin Coupons'],
        summary: 'Delete coupon',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Coupon deleted' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN LOCATIONS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/locations/cantons': {
      get: {
        tags: ['Admin Locations'],
        summary: 'List cantons (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Canton list' } },
      },
      post: {
        tags: ['Admin Locations'],
        summary: 'Create canton',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Canton created' } },
      },
    },
    '/api/v1/admin/locations/cantons/{id}': {
      put: {
        tags: ['Admin Locations'],
        summary: 'Update canton',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Canton updated' } },
      },
    },
    '/api/v1/admin/locations/cities': {
      get: {
        tags: ['Admin Locations'],
        summary: 'List cities (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'City list' } },
      },
      post: {
        tags: ['Admin Locations'],
        summary: 'Create city',
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'City created' } },
      },
    },
    '/api/v1/admin/locations/cities/{id}': {
      put: {
        tags: ['Admin Locations'],
        summary: 'Update city',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'City updated' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN RBAC
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/rbac/roles': {
      get: {
        tags: ['Admin RBAC'],
        summary: 'List roles',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Role list' } },
      },
    },
    '/api/v1/admin/rbac/permissions': {
      get: {
        tags: ['Admin RBAC'],
        summary: 'List permissions',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Permission list' } },
      },
    },
    '/api/v1/admin/rbac/roles/{id}/permissions': {
      get: {
        tags: ['Admin RBAC'],
        summary: 'Get role permissions',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Role permissions' } },
      },
      put: {
        tags: ['Admin RBAC'],
        summary: 'Update role permissions',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { 200: { description: 'Permissions updated' } },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // ADMIN ANALYTICS
    // ═══════════════════════════════════════════════════════════════
    '/api/v1/admin/analytics/platform/stats': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Platform-wide stats',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Platform statistics' } },
      },
    },
    '/api/v1/admin/analytics/revenue': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Revenue time series',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Revenue data' } },
      },
    },
    '/api/v1/admin/analytics/top-products': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Top selling products',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Top products' } },
      },
    },
    '/api/v1/admin/analytics/top-stores': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Top performing stores',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Top stores' } },
      },
    },
    '/api/v1/admin/analytics/top-categories': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Top categories by sales',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Top categories' } },
      },
    },
    '/api/v1/admin/analytics/user-growth': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'User growth over time',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User growth data' } },
      },
    },
    '/api/v1/admin/analytics/recent-orders': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Recent orders platform-wide',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Recent orders' } },
      },
    },
  },
};
