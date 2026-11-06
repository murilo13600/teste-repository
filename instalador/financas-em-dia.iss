; Instalador do Finanças em Dia para Windows (leva o Node junto).
; Para gerar: baixe o Node em instalador\node (node.exe e LICENSE) e rode
;   ISCC.exe instalador\financas-em-dia.iss
; Os arquivos são listados um a um de propósito: a pasta data\ (dados pessoais) nunca entra aqui.

#define AppNome "Finanças em Dia"
#define AppVersao "1.0.0"

[Setup]
AppId={{7C1E4B52-3A9D-4F6E-9B21-5D8A0C2F7E13}
AppName={#AppNome}
AppVersion={#AppVersao}
AppPublisher={#AppNome}
DefaultDirName={localappdata}\Programs\Financas em Dia
DefaultGroupName={#AppNome}
DisableProgramGroupPage=yes
DisableDirPage=yes
PrivilegesRequired=lowest
MinVersion=10.0
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\dist
OutputBaseFilename=FinancasEmDia-Instalador
SetupIconFile=..\financas-em-dia.ico
UninstallDisplayIcon={app}\financas-em-dia.ico
UninstallDisplayName={#AppNome}
Compression=lzma2/ultra
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "ptbr"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar ícone na área de trabalho"

[Files]
Source: "..\app.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\index.html"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\styles.css"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\server.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\financas-em-dia.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "iniciar.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "node\node.exe"; DestDir: "{app}\runtime"; Flags: ignoreversion
Source: "node\LICENSE"; DestDir: "{app}\runtime"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppNome}"; Filename: "{app}\iniciar.bat"; WorkingDir: "{app}"; IconFilename: "{app}\financas-em-dia.ico"; Flags: runminimized
Name: "{userdesktop}\{#AppNome}"; Filename: "{app}\iniciar.bat"; WorkingDir: "{app}"; IconFilename: "{app}\financas-em-dia.ico"; Flags: runminimized; Tasks: desktopicon

[Run]
Filename: "{app}\iniciar.bat"; WorkingDir: "{app}"; Description: "Abrir o {#AppNome} agora"; Flags: nowait postinstall skipifsilent runminimized

; Desinstalar não remove {app}\data: o Inno só apaga o que ele mesmo instalou.
