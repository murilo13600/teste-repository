@echo off
cd /d "%~dp0"
echo.
echo   Criando atalho do Aurum na Area de Trabalho...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $d 'Aurum.lnk')); $s.TargetPath='%~dp0iniciar.bat'; $s.WorkingDirectory='%~dp0'; $s.IconLocation='%~dp0aurum.ico,0'; $s.WindowStyle=7; $s.Description='Aurum - financas pessoais'; $s.Save()"
if errorlevel 1 (
  echo   Nao consegui criar o atalho. Tente: botao direito em iniciar.bat, Enviar para, Area de trabalho.
) else (
  echo   Pronto! O atalho "Aurum" esta na sua Area de Trabalho.
)
echo.
pause
