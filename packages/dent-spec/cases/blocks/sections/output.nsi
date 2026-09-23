Section "Main"
	SetOutPath $INSTDIR
	File "app.exe"
SectionEnd

Function .oninit
	StrCpy $0 "1"
FunctionEnd
