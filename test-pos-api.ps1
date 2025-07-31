
# DEMO: Smart POS API & Security Automated Test Suite
# Shows all major security features in action for demo/presentation
# Run: .\test-pos-api.ps1

$baseUrl = "http://localhost:5000/api"

function Section($title) {
    Write-Host "\n===================="
    Write-Host $title
    Write-Host "===================="
}

function Test-Login-Success {
    Section "[1] LOGIN (SUCCESSFUL)"
    $json = '{"email":"admin@smartpos.com","password":"admin123"}'
    Set-Content -Path tmp.json -Value $json -Encoding UTF8
    $resp = curl.exe -s -X POST "$baseUrl/auth/login" -H "Content-Type: application/json" -d "@tmp.json"
    Write-Host "Login response: $resp"
}

function Test-Login-Fail-BruteForce {
    Section "[2] LOGIN (FAILED + BRUTE FORCE PROTECTION)"
    $json = '{"email":"wrong@example.com","password":"wrongpass"}'
    $lockout = $false
    for ($i=1; $i -le 10; $i++) {
        Set-Content -Path tmp.json -Value $json -Encoding UTF8
        $resp = curl.exe -s -X POST "$baseUrl/auth/login" -H "Content-Type: application/json" -d "@tmp.json"
        Write-Host "Attempt $i : $resp"
        if ($resp -match "locked|rate limit|too many|blocked") { $lockout = $true }
    }
    if ($lockout) {
        Write-Host "Brute force protection is ACTIVE (account locked or rate limited)."
    } else {
        Write-Host "Brute force protection NOT triggered (try more attempts or check backend config)."
    }
}

function Test-Register-Valid {
    Section "[3] REGISTRATION (VALID)"
    $email = "testuser$((Get-Random))@mail.com"
    $json = '{"email":"' + $email + '","password":"Test1234!","confirmPassword":"Test1234!","shopName":"Test Shop"}'
    Set-Content -Path tmp.json -Value $json -Encoding UTF8
    $resp = curl.exe -s -X POST "$baseUrl/auth/register" -H "Content-Type: application/json" -d "@tmp.json"
    Write-Host "Registration response: $resp"
}

function Test-Register-Invalid {
    Section "[4] REGISTRATION (INVALID/VALIDATION)"
    $json = '{"email":"bademail","password":"123","shopName":""}'
    Set-Content -Path tmp.json -Value $json -Encoding UTF8
    $resp = curl.exe -s -X POST "$baseUrl/auth/register" -H "Content-Type: application/json" -d "@tmp.json"
    Write-Host "Registration response: $resp"
}

function Test-Register-RateLimit {
    Section "[5] REGISTRATION (RATE LIMIT)"
    $email = "ratelimit$((Get-Random))@mail.com"
    $json = '{"email":"' + $email + '","password":"Test1234!","confirmPassword":"Test1234!","shopName":"Test Shop"}'
    for ($i=1; $i -le 5; $i++) {
        Set-Content -Path tmp.json -Value $json -Encoding UTF8
        $resp = curl.exe -s -X POST "$baseUrl/auth/register" -H "Content-Type: application/json" -d "@tmp.json"
        Write-Host "Attempt $i : $resp"
        if ($resp -match "rate limit|too many|blocked") {
            Write-Host "Rate limiting is ACTIVE."
            break
        }
    }
}

function Test-XSS-Validation {
    Section "[6] INPUT VALIDATION & XSS PROTECTION"
    $json = '{"email":"<script>alert(1)</script>","password":"<b>bad</b>","confirmPassword":"<b>bad</b>","shopName":"<img src=x onerror=alert(2)>"}'
    Set-Content -Path tmp.json -Value $json -Encoding UTF8
    $resp = curl.exe -s -X POST "$baseUrl/auth/register" -H "Content-Type: application/json" -d "@tmp.json"
    Write-Host "Validation/XSS response: $resp"
}

function Test-Protected-Endpoint {
    Section "[7] PROTECTED ENDPOINT (NO TOKEN)"
    $resp = curl.exe -s -X GET "$baseUrl/users/profile"
    Write-Host "Protected endpoint response: $resp"
}

Test-Login-Success
Test-Login-Fail-BruteForce
Test-Register-Valid
Test-Register-Invalid
Test-Register-RateLimit
Test-XSS-Validation
Test-Protected-Endpoint


