@echo off
echo =============================
echo   DAIMUZ DELIVERY - Phase 1
echo =============================
echo.
echo  1. Start MySQL and create the database:
echo     mysql -u root -p ^< backend\db\schema.sql
echo.
echo  2. Configure backend\.env with your DB credentials
echo.
echo  3. Start backend (terminal 1):
echo     cd backend ^&^& npm run dev
echo.
echo  4. Start frontend (terminal 2):
echo     cd frontend ^&^& npm run dev
echo.
echo  Backend:  http://localhost:4000
echo  Frontend: http://localhost:3000
echo.
echo  Health check: http://localhost:4000/api/health
