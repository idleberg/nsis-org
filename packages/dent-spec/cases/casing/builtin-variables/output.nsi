; Built-in variable, define and language string casing

!addincludedir "${NSISDIR}\Include"

Name "Ardent"
OutFile "variables.exe"
InstallDir "$PROGRAMFILES\Ardent"

Var CustomVar

Section "Main"
	SetOutPath $INSTDIR
	StrCpy $R0 "$INSTDIR\bin"
	StrCpy $CustomVar "$INSTDIR$TEMP"
	StrCpy $1 "${NSISDIR}"
	DetailPrint "$EXEDIR\$EXEFILE"
	DetailPrint "$APPDATA|$LOCALAPPDATA"
	DetailPrint "$%windir%\system32"
	DetailPrint "${MyOwnDefine}"
	DetailPrint "$myOwnVariable"
	DetailPrint "$(^Completed) $(^Name)"
	DetailPrint "$(MyOwnLangString)"
	DetailPrint "$$instdir is escaped"
	IntOp $R1 $R1 + 1
	WriteRegStr HKLM "Software\Ardent" "Path" "$INSTDIR"
	CreateShortcut "$SMPROGRAMS\Ardent.lnk" "$INSTDIR\ardent.exe"
SectionEnd
