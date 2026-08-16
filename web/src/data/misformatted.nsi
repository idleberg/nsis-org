; The name of the installer
name 'Example1'

; The file to write
OUTFILE `example1.exe`

; Request application privileges for Windows Vista
requestExecutionLevel user

; Build Unicode installer
unicode TRUE

; The default installation directory
  InstallDIR $DESKTOP\Example1

!include "MUI2.nsh"
   !include LogicLib.nsh

!define APP_VERSION '1.0.0'


var /GLOBAL LogLine

!macro CheckDrive Drive
!ifdef DEBUG
detailprint "checking ${Drive}"
!else
# nothing to do
!endif
!macroend

;--------------------------------

 ; Pages
   Page directory
     Page instfiles

;--------------------------------

; The stuff to install
sectiongroup "Core"
Section "" ; No components page, name is not important

; Set output path to the installation directory.
setOutPath       $INSTDIR

; Put file there
      file example1.nsi

!insertmacro CheckDrive "C:"

${if} ${FileExists} "$INSTDIR\example1.ini"
detailprint 'keeping settings'
${elseif} $LogLine != ""
detailprint "$LogLine"
${else}
writeinistr "$INSTDIR\example1.ini" General Version "${APP_VERSION}"
${endif}

nsExec::ExecToLog '"$INSTDIR\example1.exe" /S'
pop $0

${switch} $0
${case} 0
detailprint "ok"
${break}
${default}
messagebox mb_iconstop|mb_ok "The installer could not complete because the helper process exited with code $0, please check the log in $INSTDIR."
${endswitch}

SectionEnd
sectiongroupend

function .onInit
strcpy $0 0
${for} $1 1 3
intop $0 $0 + $1
${Next}
${do}
intop $0 $0 - 1
${loopuntil} $0 <= 0
goto done
done: ; nothing left to do
functionend
