@echo off
chcp 65001 >nul
title Mascote R
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale a versao LTS em https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando o mascote pela primeira vez, pode demorar uns minutos...
  call npm install
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
  )
  call npx --no install-electron
)

echo O mascote esta solto na sua tela!
echo Pra fechar: feche esta janela, ou clique com o botao direito no
echo iconezinho dele perto do relogio e escolha "Sair".
call npx electron .
