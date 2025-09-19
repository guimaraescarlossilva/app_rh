#!/bin/bash
# Testes de sanity check e performance

echo "🧪 Executando testes de sanity check..."

# Teste 1 - Health check
echo "1. Health check:"
curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  "http://localhost:5000/health" | head -3

# Teste 2 - Permissions groups
echo -e "\n2. Permissions groups:"
curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  "http://localhost:5000/api/permissions/groups?limit=10" | head -3

# Teste 3 - Users
echo -e "\n3. Users:"
curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  "http://localhost:5000/api/users?limit=10" | head -3

# Teste 4 - Payroll
echo -e "\n4. Payroll:"
curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  "http://localhost:5000/api/payroll?limit=10" | head -3

# Teste 5 - Permissions catalog
echo -e "\n5. Permissions catalog:"
curl -s -w "\nStatus: %{http_code}\nTime: %{time_total}s\n" \
  "http://localhost:5000/api/permissions/catalog?limit=10" | head -3

echo -e "\n🚀 Executando testes de performance..."

# Teste 6 - Performance permissions groups
echo -e "\n6. Performance - Permissions groups:"
npx autocannon -d 15 -c 30 "http://localhost:5000/api/permissions/groups?limit=50"

# Teste 7 - Performance users
echo -e "\n7. Performance - Users:"
npx autocannon -d 15 -c 30 "http://localhost:5000/api/users?limit=50"

# Teste 8 - Performance payroll
echo -e "\n8. Performance - Payroll:"
npx autocannon -d 15 -c 30 "http://localhost:5000/api/payroll?limit=50"

echo -e "\n✅ Testes concluídos!"
