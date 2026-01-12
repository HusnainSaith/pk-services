Write-Host "`n=== EMAIL TRACKING TEST ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1. Login..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"husnainramzan7194@gmail.com","password":"SecurePass123!"}'
$token = $loginResponse.data.accessToken
Write-Host "OK Logged in" -ForegroundColor Green

# Step 2: Create checkout
Write-Host "`n2. Create checkout..." -ForegroundColor Yellow
$checkoutResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/subscriptions/checkout" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"} -Body '{"planId":"premium"}'
$checkoutUrl = $checkoutResponse.data.checkoutUrl
Write-Host "OK Checkout created" -ForegroundColor Green
Write-Host "`nCheckout URL: $checkoutUrl" -ForegroundColor Cyan

# Step 3: Open Stripe checkout page
Write-Host "`n3. Opening Stripe checkout page in browser..." -ForegroundColor Yellow
Start-Process $checkoutUrl
Write-Host "OK Browser opened" -ForegroundColor Green

Write-Host "`n=== INSTRUCTIONS ===" -ForegroundColor Magenta
Write-Host "1. Complete payment with test card 4242424242424242" -ForegroundColor White
Write-Host "2. After payment check email at husnainramzan7194@gmail.com" -ForegroundColor White
Write-Host "3. OPEN THE EMAIL in Gmail" -ForegroundColor Yellow
Write-Host "4. Gmail will load the tracking pixel automatically" -ForegroundColor Yellow
Write-Host "5. Check server logs for tracking message" -ForegroundColor White
Write-Host ""

