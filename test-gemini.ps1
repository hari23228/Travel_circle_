# Gemini API Test Script
# Run this in a NEW PowerShell terminal while backend server is running

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🧪 TESTING GEMINI API INTEGRATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    # Test 1: Simple Greeting
    Write-Host "`n[TEST 1] Testing with greeting..." -ForegroundColor Magenta
    $body1 = @{
        message = "Hi"
    } | ConvertTo-Json

    $response1 = Invoke-WebRequest `
        -Uri "http://localhost:5001/api/chatbot/message" `
        -Method POST `
        -Body $body1 `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction Stop

    $json1 = $response1.Content | ConvertFrom-Json

    Write-Host "✅ Test 1 PASSED" -ForegroundColor Green
    Write-Host "Status Code: $($response1.StatusCode)" -ForegroundColor White
    Write-Host "Success: $($json1.success)" -ForegroundColor White
    Write-Host "`n🤖 Gemini's Response:" -ForegroundColor Yellow
    Write-Host $json1.response.text -ForegroundColor White

    # Wait before next test
    Start-Sleep -Seconds 3

    # Test 2: Destination Query
    Write-Host "`n[TEST 2] Testing destination extraction (Goa)..." -ForegroundColor Magenta
    $body2 = @{
        message = "I want to visit Goa"
    } | ConvertTo-Json

    $response2 = Invoke-WebRequest `
        -Uri "http://localhost:5001/api/chatbot/message" `
        -Method POST `
        -Body $body2 `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction Stop

    $json2 = $response2.Content | ConvertFrom-Json

    Write-Host "✅ Test 2 PASSED" -ForegroundColor Green
    Write-Host "Status Code: $($response2.StatusCode)" -ForegroundColor White
    Write-Host "Success: $($json2.success)" -ForegroundColor White
    Write-Host "`n🤖 Gemini's Response:" -ForegroundColor Yellow
    Write-Host $json2.response.text -ForegroundColor White

    # Test 3: Weather Query
    Start-Sleep -Seconds 3
    Write-Host "`n[TEST 3] Testing weather query..." -ForegroundColor Magenta
    $body3 = @{
        message = "What's the weather like in Mumbai?"
    } | ConvertTo-Json

    $response3 = Invoke-WebRequest `
        -Uri "http://localhost:5001/api/chatbot/message" `
        -Method POST `
        -Body $body3 `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction Stop

    $json3 = $response3.Content | ConvertFrom-Json

    Write-Host "✅ Test 3 PASSED" -ForegroundColor Green
    Write-Host "Status Code: $($response3.StatusCode)" -ForegroundColor White
    Write-Host "Success: $($json3.success)" -ForegroundColor White
    Write-Host "`n🤖 Gemini's Response:" -ForegroundColor Yellow
    Write-Host $json3.response.text -ForegroundColor White

    # Summary
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  Gemini AI is working correctly" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green

} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  ❌ TEST FAILED!" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPossible issues:" -ForegroundColor Yellow
    Write-Host "  1. Backend server not running on port 5001" -ForegroundColor White
    Write-Host "  2. Gemini API key not configured" -ForegroundColor White
    Write-Host "  3. Network connectivity issues" -ForegroundColor White
    Write-Host "`nTo check backend status, run:" -ForegroundColor Yellow
    Write-Host "  curl http://localhost:5001/health" -ForegroundColor Cyan
}
