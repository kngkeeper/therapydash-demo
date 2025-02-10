@echo off
echo Installing dependencies...

REM Install backend dependencies
cd backend
call npm install
cd ..

REM Install frontend dependencies
call npm install

REM Start backend server in new window
start cmd /k "cd backend && node app.js"

REM Start frontend
ng serve

echo All components started.