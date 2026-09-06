$base = "d:\Desktop\stitch_frozex_global_supply_erp"
Copy-Item "$base\_3\code.html" "$base\index.html" -Force
Copy-Item "$base\_1\code.html" "$base\create-shipment.html" -Force
Copy-Item "$base\_2\code.html" "$base\client-orders.html" -Force
Copy-Item "$base\_7\code.html" "$base\new-operation.html" -Force
Copy-Item "$base\_5\code.html" "$base\raw-materials.html" -Force
Copy-Item "$base\_6\code.html" "$base\suppliers.html" -Force
Copy-Item "$base\_8\code.html" "$base\treasury-payments.html" -Force
Copy-Item "$base\_4\code.html" "$base\stations-management.html" -Force
Copy-Item "$base\_9\code.html" "$base\exports-contractors.html" -Force

Write-Host "COPIED ALL HTML FILES SUCCESSFULLY!"
